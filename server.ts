import express, { Request, Response } from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProduction = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

const app = express();
app.use(express.json({ limit: '60mb' }));
app.use(express.raw({ type: 'audio/*', limit: '60mb' }));

// Initialize Gemini SDK
const apiKey = process.env.GEMINI_API_KEY || '';
let aiClient: GoogleGenAI | null = null;
if (apiKey) {
  try {
    aiClient = new GoogleGenAI({ apiKey });
  } catch (err) {
    console.warn('Gemini client init warning:', err);
  }
}

// In-Memory SoundLink Multi-Device Party Rooms
interface PartyRoom {
  id: string;
  hostWs: WebSocket | null;
  listeners: Map<WebSocket, { deviceName: string; joinedAt: number }>;
  currentTrack: {
    id: string;
    title: string;
    artist: string;
    album?: string;
    duration: number;
    coverUrl?: string;
  } | null;
  audioBuffer: Buffer | null;
  audioMimeType: string;
  isPlaying: boolean;
  currentTime: number;
  serverTimestamp: number;
}

const rooms = new Map<string, PartyRoom>();

// Endpoint to upload song audio for a party room
app.post('/api/party/upload/:roomId', (req: Request, res: Response) => {
  const { roomId } = req.params;
  const room = rooms.get(roomId);
  if (!room) {
    res.status(404).json({ error: 'Room not found' });
    return;
  }

  const contentType = req.headers['content-type'] || 'audio/mpeg';
  room.audioBuffer = req.body as Buffer;
  room.audioMimeType = contentType;

  // Broadcast to all listeners that new audio is ready to stream
  broadcastToRoom(room, {
    type: 'AUDIO_READY',
    roomId,
    streamUrl: `/api/party/stream/${roomId}?t=${Date.now()}`
  });

  res.json({ success: true, size: room.audioBuffer?.length || 0 });
});

// Endpoint to stream song audio to listener phones
app.get('/api/party/stream/:roomId', (req: Request, res: Response) => {
  const { roomId } = req.params;
  const room = rooms.get(roomId);

  if (!room || !room.audioBuffer) {
    res.status(404).send('Audio not found or not yet broadcasted');
    return;
  }

  const buffer = room.audioBuffer;
  const total = buffer.length;
  const range = req.headers.range;

  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Content-Type', room.audioMimeType || 'audio/mpeg');

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const partialStart = parts[0];
    const partialEnd = parts[1];

    const start = parseInt(partialStart, 10);
    const end = partialEnd ? parseInt(partialEnd, 10) : total - 1;
    const chunksize = end - start + 1;

    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${total}`,
      'Content-Length': chunksize,
      'Content-Type': room.audioMimeType || 'audio/mpeg'
    });
    res.end(buffer.subarray(start, end + 1));
  } else {
    res.writeHead(200, {
      'Content-Length': total,
      'Content-Type': room.audioMimeType || 'audio/mpeg'
    });
    res.end(buffer);
  }
});

// Gemini AI Vibe Studio & Track Analysis endpoint
app.post('/api/gemini/vibe-dj', async (req: Request, res: Response) => {
  try {
    const { title, artist, moodPrompt } = req.body;

    if (!apiKey) {
      // Fallback mock analysis if no key configured
      res.json({
        djIntro: `Welcome to LINAX High-Fidelity Studio! Spinning "${title || 'Track'}" by ${artist || 'Unknown'}. Calibrating 3D holographic frequencies for maximum acoustic punch!`,
        moodTag: 'CYBERPUNK NEON PULSE',
        colorHex: '#00f0ff',
        recommendedEq: 'cyber',
        recommendedVisualizer: 'ring',
        acousticSummary: 'Dynamic electro-frequency balance with prominent sub-bass harmonics and crisp stereo treble response.'
      });
      return;
    }

    const ai = aiClient || new GoogleGenAI({ apiKey });
    const prompt = `You are the futuristic AI Sound Engineer & Holographic DJ of LINAX Music Studio.
Track Title: "${title || 'Unknown Track'}"
Artist: "${artist || 'Unknown Artist'}"
User Vibe/Request: "${moodPrompt || 'Full immersion'}"

Generate a creative, futuristic analysis of this track in JSON format.
Include:
1. "djIntro": A sleek, high-energy, futuristic 1-2 sentence DJ intro speech introducing the song.
2. "moodTag": A 2-4 word cyberpunk/futuristic aesthetic mood tag (e.g., "NEON MATRIX PULSE", "HOLOGRAPHIC CHILLWAVE").
3. "colorHex": A vibrant neon hex color code matching this music vibe (e.g., "#00f0ff", "#a855f7", "#10b981", "#f43f5e", "#f59e0b").
4. "recommendedEq": One of: "flat", "bass", "cyber", "vocal", "electronic", "rock", "pop", "lofi", "techno".
5. "recommendedVisualizer": One of: "wave", "ring", "bars", "vortex".
6. "acousticSummary": A 1-2 sentence high-fidelity acoustic description of how this track sounds with 10-band spatial audio.

Respond with ONLY valid JSON:
{
  "djIntro": "...",
  "moodTag": "...",
  "colorHex": "...",
  "recommendedEq": "...",
  "recommendedVisualizer": "...",
  "acousticSummary": "..."
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text || '{}';
    const parsed = JSON.parse(text);
    res.json(parsed);
  } catch (error) {
    console.error('Gemini Vibe DJ error:', error);
    res.json({
      djIntro: 'LINAX Acoustic Core synchronized. Engaging dynamic spatial acoustics!',
      moodTag: 'NEON MATRIX IMMERSION',
      colorHex: '#00f0ff',
      recommendedEq: 'cyber',
      recommendedVisualizer: 'ring',
      acousticSummary: 'Enhanced multi-frequency headroom and spatial holographic soundstage.'
    });
  }
});

// Create HTTP and WebSocket servers
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws/party' });

function broadcastToRoom(room: PartyRoom, msg: object, excludeWs?: WebSocket) {
  const json = JSON.stringify(msg);
  if (room.hostWs && room.hostWs !== excludeWs && room.hostWs.readyState === WebSocket.OPEN) {
    room.hostWs.send(json);
  }
  for (const [listenerWs] of room.listeners.entries()) {
    if (listenerWs !== excludeWs && listenerWs.readyState === WebSocket.OPEN) {
      listenerWs.send(json);
    }
  }
}

function getRoomDeviceCount(room: PartyRoom): number {
  return (room.hostWs ? 1 : 0) + room.listeners.size;
}

wss.on('connection', (ws: WebSocket) => {
  let joinedRoomId: string | null = null;
  let isHost = false;

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());

      switch (message.type) {
        case 'PING': {
          ws.send(JSON.stringify({
            type: 'PONG',
            clientTimestamp: message.timestamp,
            serverTimestamp: Date.now()
          }));
          break;
        }

        case 'CREATE_ROOM': {
          const roomId = message.roomId || `LX-${Math.floor(10000 + Math.random() * 90000)}`;
          const room: PartyRoom = {
            id: roomId,
            hostWs: ws,
            listeners: new Map(),
            currentTrack: null,
            audioBuffer: null,
            audioMimeType: 'audio/mpeg',
            isPlaying: false,
            currentTime: 0,
            serverTimestamp: Date.now()
          };
          rooms.set(roomId, room);
          joinedRoomId = roomId;
          isHost = true;

          ws.send(JSON.stringify({
            type: 'ROOM_CREATED',
            roomId,
            deviceCount: 1
          }));
          break;
        }

        case 'JOIN_ROOM': {
          const roomId = message.roomId?.trim().toUpperCase();
          const room = rooms.get(roomId);
          if (!room) {
            ws.send(JSON.stringify({
              type: 'ERROR',
              message: `Room "${roomId}" not found. Verify room code or ensure host has started.`
            }));
            return;
          }

          joinedRoomId = roomId;
          isHost = false;
          room.listeners.set(ws, {
            deviceName: message.deviceName || 'Listener Device',
            joinedAt: Date.now()
          });

          // Send current room state to newly joined phone
          ws.send(JSON.stringify({
            type: 'JOINED_SUCCESS',
            roomId,
            currentTrack: room.currentTrack,
            isPlaying: room.isPlaying,
            currentTime: room.currentTime,
            serverTimestamp: Date.now(),
            hasAudioStream: !!room.audioBuffer,
            streamUrl: room.audioBuffer ? `/api/party/stream/${roomId}?t=${Date.now()}` : null,
            deviceCount: getRoomDeviceCount(room)
          }));

          // Notify host and all listeners about device count update
          broadcastToRoom(room, {
            type: 'DEVICE_JOINED',
            roomId,
            deviceName: message.deviceName || 'New Phone',
            deviceCount: getRoomDeviceCount(room)
          });
          break;
        }

        case 'HOST_SET_TRACK': {
          if (!joinedRoomId || !isHost) return;
          const room = rooms.get(joinedRoomId);
          if (!room) return;

          room.currentTrack = message.track;
          room.currentTime = 0;
          room.isPlaying = message.isPlaying || false;
          room.serverTimestamp = Date.now();

          broadcastToRoom(room, {
            type: 'TRACK_CHANGED',
            roomId: room.id,
            track: room.currentTrack,
            isPlaying: room.isPlaying,
            currentTime: 0,
            serverTimestamp: Date.now(),
            streamUrl: room.audioBuffer ? `/api/party/stream/${room.id}?t=${Date.now()}` : null
          }, ws);
          break;
        }

        case 'HOST_SYNC_STATE': {
          if (!joinedRoomId || !isHost) return;
          const room = rooms.get(joinedRoomId);
          if (!room) return;

          room.isPlaying = message.isPlaying;
          room.currentTime = message.currentTime;
          room.serverTimestamp = Date.now();

          // Relay state with exact timestamp for microsecond audio alignment
          broadcastToRoom(room, {
            type: 'PLAYBACK_SYNC',
            roomId: room.id,
            isPlaying: room.isPlaying,
            currentTime: room.currentTime,
            serverTimestamp: Date.now()
          }, ws);
          break;
        }

        case 'LEAVE_ROOM': {
          cleanupConnection();
          break;
        }
      }
    } catch (err) {
      console.warn('WS Message error:', err);
    }
  });

  function cleanupConnection() {
    if (joinedRoomId) {
      const room = rooms.get(joinedRoomId);
      if (room) {
        if (isHost && room.hostWs === ws) {
          // Host left
          broadcastToRoom(room, {
            type: 'HOST_DISCONNECTED',
            message: 'Host has ended the SoundLink party session.'
          }, ws);
          rooms.delete(joinedRoomId);
        } else {
          room.listeners.delete(ws);
          broadcastToRoom(room, {
            type: 'DEVICE_LEFT',
            deviceCount: getRoomDeviceCount(room)
          });
        }
      }
    }
    joinedRoomId = null;
  }

  ws.on('close', cleanupConnection);
  ws.on('error', cleanupConnection);
});

// Vite Middleware integration for development
async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true }
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`LINAX Music Studio running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
