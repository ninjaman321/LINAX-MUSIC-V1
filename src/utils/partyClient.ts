/**
 * LINAX SoundLink Multi-Device Client
 * Manages WebSocket synchronization between Host phone and Listener phones,
 * computing network round-trip time and clock offset for tight multi-speaker playback sync.
 */

export interface SoundLinkState {
  isConnected: boolean;
  isHost: boolean;
  roomId: string | null;
  deviceCount: number;
  clockOffset: number; // local - server time in ms
  statusMessage: string;
}

export type PartyEventListener = (event: {
  type: string;
  data?: unknown;
}) => void;

class SoundLinkClient {
  private ws: WebSocket | null = null;
  private listeners: Set<PartyEventListener> = new Set();
  public state: SoundLinkState = {
    isConnected: false,
    isHost: false,
    roomId: null,
    deviceCount: 0,
    clockOffset: 0,
    statusMessage: 'Ready to Connect'
  };

  private pingInterval: number | null = null;

  public subscribe(listener: PartyEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(type: string, data?: unknown) {
    for (const listener of this.listeners) {
      listener({ type, data });
    }
  }

  public connect(): Promise<boolean> {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return Promise.resolve(true);
    }

    return new Promise((resolve) => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/party`;

      try {
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          this.state.isConnected = true;
          this.startClockSync();
          this.notify('CONNECTED');
          resolve(true);
        };

        this.ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            this.handleMessage(msg);
          } catch (e) {
            console.warn('SoundLink parse error', e);
          }
        };

        this.ws.onclose = () => {
          this.state.isConnected = false;
          this.state.roomId = null;
          this.state.deviceCount = 0;
          this.stopClockSync();
          this.notify('DISCONNECTED');
        };

        this.ws.onerror = () => {
          resolve(false);
        };
      } catch {
        resolve(false);
      }
    });
  }

  private startClockSync() {
    this.stopClockSync();
    // Measure round trip every 5 seconds
    const ping = () => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({
          type: 'PING',
          timestamp: Date.now()
        }));
      }
    };
    ping();
    this.pingInterval = window.setInterval(ping, 6000);
  }

  private stopClockSync() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private handleMessage(msg: {
    type: string;
    roomId?: string;
    clientTimestamp?: number;
    serverTimestamp?: number;
    deviceCount?: number;
    track?: unknown;
    isPlaying?: boolean;
    currentTime?: number;
    streamUrl?: string;
    message?: string;
  }) {
    switch (msg.type) {
      case 'PONG': {
        if (msg.clientTimestamp && msg.serverTimestamp) {
          const now = Date.now();
          const roundTrip = now - msg.clientTimestamp;
          const estimatedServerNow = msg.serverTimestamp + roundTrip / 2;
          this.state.clockOffset = now - estimatedServerNow;
        }
        break;
      }

      case 'ROOM_CREATED': {
        this.state.isHost = true;
        this.state.roomId = msg.roomId || null;
        this.state.deviceCount = msg.deviceCount || 1;
        this.state.statusMessage = `Hosting Party: ${msg.roomId}`;
        this.notify('ROOM_CREATED', msg);
        break;
      }

      case 'JOINED_SUCCESS': {
        this.state.isHost = false;
        this.state.roomId = msg.roomId || null;
        this.state.deviceCount = msg.deviceCount || 1;
        this.state.statusMessage = `Connected to Room: ${msg.roomId}`;
        this.notify('JOINED_SUCCESS', msg);
        break;
      }

      case 'DEVICE_JOINED':
      case 'DEVICE_LEFT': {
        if (msg.deviceCount !== undefined) {
          this.state.deviceCount = msg.deviceCount;
        }
        this.notify(msg.type, msg);
        break;
      }

      case 'TRACK_CHANGED':
      case 'PLAYBACK_SYNC':
      case 'AUDIO_READY':
      case 'HOST_DISCONNECTED':
      case 'ERROR': {
        this.notify(msg.type, msg);
        break;
      }
    }
  }

  public async createRoom(roomId: string): Promise<void> {
    await this.connect();
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'CREATE_ROOM',
        roomId
      }));
    }
  }

  public async joinRoom(roomId: string, deviceName = 'Listener Phone'): Promise<void> {
    await this.connect();
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'JOIN_ROOM',
        roomId,
        deviceName
      }));
    }
  }

  public broadcastTrack(track: unknown, isPlaying = false) {
    if (!this.state.isHost || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({
      type: 'HOST_SET_TRACK',
      track,
      isPlaying
    }));
  }

  public syncPlayback(isPlaying: boolean, currentTime: number) {
    if (!this.state.isHost || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({
      type: 'HOST_SYNC_STATE',
      isPlaying,
      currentTime
    }));
  }

  public async uploadTrackAudio(roomId: string, blob: Blob): Promise<boolean> {
    try {
      const res = await fetch(`/api/party/upload/${roomId}`, {
        method: 'POST',
        headers: {
          'Content-Type': blob.type || 'audio/mpeg'
        },
        body: blob
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  public leave() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'LEAVE_ROOM' }));
    }
    this.state.isHost = false;
    this.state.roomId = null;
    this.state.deviceCount = 0;
    this.state.statusMessage = 'Disconnected';
    this.notify('LEAVE_ROOM');
  }
}

export const soundLinkClient = new SoundLinkClient();
