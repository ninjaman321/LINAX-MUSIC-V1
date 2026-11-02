/**
 * LINAX - Futuristic Liquid Glass Music Studio & SoundLink Multi-Device Synchronizer
 * Developer: ABDULLAH AL SALEM
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { LibraryView } from './components/LibraryView';
import { PlayerBar } from './components/PlayerBar';
import { FullScreenPlayer } from './components/FullScreenPlayer';
import { EqualizerModal } from './components/EqualizerModal';
import { SoundLinkModal } from './components/SoundLinkModal';
import { ThemeModal } from './components/ThemeModal';
import { AiDjModal } from './components/AiDjModal';
import { SongEditModal } from './components/SongEditModal';
import { PlaylistModal } from './components/PlaylistModal';
import { SongContextMenu } from './components/SongContextMenu';

import {
  SongItem,
  RepeatMode,
  getNextTrackIndex,
  getPreviousTrackIndex,
  generateShuffledIndices,
  reorderSongs
} from './utils/playlistRules';
import {
  getAllSongsFromDB,
  saveSongToDB,
  saveSongsToDB,
  deleteSongFromDB,
  getAllPlaylistsFromDB,
  savePlaylistToDB,
  deletePlaylistFromDB,
  PlaylistRecord,
  getSettingFromDB,
  saveSettingToDB
} from './utils/db';
import { audioEngine, EQ_PRESETS, EQPreset } from './utils/audioEngine';
import { parseAudioMetadata } from './utils/id3Parser';
import { getInitialDemoTracks } from './utils/defaultTracks';
import { soundLinkClient, SoundLinkState } from './utils/partyClient';

export default function App() {
  // Songs & Playlists State
  const [songs, setSongs] = useState<SongItem[]>([]);
  const [currentSong, setCurrentSong] = useState<SongItem | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [playlists, setPlaylists] = useState<PlaylistRecord[]>([]);
  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(null);

  // Playback State
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0.85);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');
  const [shuffle, setShuffle] = useState<boolean>(false);
  const [shuffledIndices, setShuffledIndices] = useState<number[]>([]);

  // SoundLink Multi-Device State
  const [soundLinkState, setSoundLinkState] = useState<SoundLinkState>(soundLinkClient.state);

  // Audio Engine Settings
  const [eqGains, setEqGains] = useState<number[]>([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  const [bassBoost, setBassBoost] = useState<number>(30);
  const [spatial3D, setSpatial3D] = useState<boolean>(true);
  const [preAmp, setPreAmp] = useState<number>(1.0);
  const [activePresetId, setActivePresetId] = useState<string>('flat');

  // Theme & Liquid Glass Settings
  const [themeColor, setThemeColor] = useState<string>('cyan');
  const [visualizerMode, setVisualizerMode] = useState<'wave' | 'ring' | 'bars' | 'vortex'>('wave');
  const [glassBlur, setGlassBlur] = useState<number>(24);
  const [glowIntensity, setGlowIntensity] = useState<number>(70);

  // Modals Visibility
  const [isEqOpen, setIsEqOpen] = useState(false);
  const [isSoundLinkOpen, setIsSoundLinkOpen] = useState(false);
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const [isAiDjOpen, setIsAiDjOpen] = useState(false);
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  const [isFullScreenOpen, setIsFullScreenOpen] = useState(false);

  // Context Menu & Song Edit
  const [contextMenuSong, setContextMenuSong] = useState<SongItem | null>(null);
  const [contextMenuIndex, setContextMenuIndex] = useState<number>(-1);
  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [editingSong, setEditingSong] = useState<SongItem | null>(null);

  // Hidden File input ref
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);

  // 1. Initial Load: Load Songs, Playlists, and Audio Settings from IndexedDB
  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        const storedSongs = await getAllSongsFromDB();
        const storedPlaylists = await getAllPlaylistsFromDB();

        if (!mounted) return;

        if (storedSongs.length > 0) {
          setSongs(storedSongs);
          setCurrentSong(storedSongs[0]);
          setCurrentIndex(0);
          audioEngine.setTrack(storedSongs[0].url || '', storedSongs[0]);
        } else {
          // Populate with initial high-res synth tracks
          const defaultTracks = getInitialDemoTracks();
          setSongs(defaultTracks);
          setCurrentSong(defaultTracks[0]);
          setCurrentIndex(0);
          audioEngine.setTrack(defaultTracks[0].url || '', defaultTracks[0]);

          for (const track of defaultTracks) {
            await saveSongToDB(track, track.blob);
          }
        }

        setPlaylists(storedPlaylists);

        // Load user theme preferences
        const savedTheme = await getSettingFromDB('themeColor', 'cyan');
        const savedVis = await getSettingFromDB('visualizerMode', 'wave');
        setThemeColor(savedTheme);
        setVisualizerMode(savedVis);
      } catch (err) {
        console.warn('DB load warning:', err);
      }
    }

    loadData();

    // Setup Audio Engine Event Listeners
    audioEngine.onTimeUpdate((curr, dur) => {
      setCurrentTime(curr);
      setDuration(dur);
    });

    audioEngine.onPlay(() => setIsPlaying(true));
    audioEngine.onPause(() => setIsPlaying(false));
    audioEngine.onEnded(() => {
      handleNextTrack();
    });

    // SoundLink WebSocket Event Subscription
    const unsub = soundLinkClient.subscribe((event) => {
      setSoundLinkState({ ...soundLinkClient.state });

      // Handle Listener Synchronization
      if (!soundLinkClient.state.isHost) {
        if (event.type === 'TRACK_CHANGED' || event.type === 'AUDIO_READY') {
          const data = event.data as { track?: SongItem; streamUrl?: string; isPlaying?: boolean; currentTime?: number };
          if (data.streamUrl) {
            audioEngine.setTrack(data.streamUrl, data.track);
            if (data.isPlaying) {
              audioEngine.play().catch(console.warn);
            }
          }
        } else if (event.type === 'PLAYBACK_SYNC') {
          const syncData = event.data as { isPlaying: boolean; currentTime: number };
          if (syncData.isPlaying && !audioEngine.isPlaying()) {
            audioEngine.seek(syncData.currentTime);
            audioEngine.play().catch(console.warn);
          } else if (!syncData.isPlaying && audioEngine.isPlaying()) {
            audioEngine.pause();
          } else if (Math.abs(audioEngine.getCurrentTime() - syncData.currentTime) > 0.4) {
            audioEngine.seek(syncData.currentTime);
          }
        }
      }
    });

    return () => {
      mounted = false;
      unsub();
    };
  }, []);

  // Update MediaSession Action Handlers
  useEffect(() => {
    audioEngine.setupMediaSessionHandlers({
      onPlay: () => handlePlayPause(),
      onPause: () => handlePlayPause(),
      onNext: () => handleNextTrack(),
      onPrev: () => handlePreviousTrack(),
      onSeek: (to) => handleSeek(to)
    });
  }, [currentIndex, songs, repeatMode, shuffle, shuffledIndices]);

  // Handle Play Song
  const handlePlaySong = useCallback((song: SongItem, index: number) => {
    setCurrentSong(song);
    setCurrentIndex(index);
    audioEngine.setTrack(song.url || '', song);
    audioEngine.play().catch((err) => console.warn('Audio play error:', err));

    // SoundLink sync
    if (soundLinkState.isHost && soundLinkState.roomId) {
      soundLinkClient.broadcastTrack(song, true);
      if (song.blob) {
        soundLinkClient.uploadTrackAudio(soundLinkState.roomId, song.blob);
      }
    }
  }, [soundLinkState.isHost, soundLinkState.roomId]);

  // Handle Play/Pause
  const handlePlayPause = useCallback(() => {
    if (!currentSong && songs.length > 0) {
      handlePlaySong(songs[0], 0);
      return;
    }

    if (isPlaying) {
      audioEngine.pause();
      if (soundLinkState.isHost) {
        soundLinkClient.syncPlayback(false, audioEngine.getCurrentTime());
      }
    } else {
      audioEngine.play().catch((err) => console.warn('Play error:', err));
      if (soundLinkState.isHost) {
        soundLinkClient.syncPlayback(true, audioEngine.getCurrentTime());
      }
    }
  }, [currentSong, isPlaying, songs, handlePlaySong, soundLinkState.isHost]);

  // Handle Next Track
  const handleNextTrack = useCallback(() => {
    if (songs.length === 0) return;
    const nextIdx = getNextTrackIndex(currentIndex, songs.length, repeatMode, shuffle, shuffledIndices);
    if (nextIdx !== -1 && songs[nextIdx]) {
      handlePlaySong(songs[nextIdx], nextIdx);
    }
  }, [currentIndex, songs, repeatMode, shuffle, shuffledIndices, handlePlaySong]);

  // Handle Previous Track
  const handlePreviousTrack = useCallback(() => {
    if (songs.length === 0) return;
    if (currentTime > 3) {
      audioEngine.seek(0);
      return;
    }
    const prevIdx = getPreviousTrackIndex(currentIndex, songs.length, repeatMode, shuffle, shuffledIndices);
    if (prevIdx !== -1 && songs[prevIdx]) {
      handlePlaySong(songs[prevIdx], prevIdx);
    }
  }, [currentIndex, songs, currentTime, repeatMode, shuffle, shuffledIndices, handlePlaySong]);

  // Handle Seek
  const handleSeek = (seconds: number) => {
    audioEngine.seek(seconds);
    setCurrentTime(seconds);
    if (soundLinkState.isHost) {
      soundLinkClient.syncPlayback(isPlaying, seconds);
    }
  };

  // Handle Volume Change
  const handleVolumeChange = (val: number) => {
    setVolume(val);
    audioEngine.setVolume(val);
  };

  // Handle Repeat Toggle
  const handleToggleRepeat = () => {
    const nextMode: RepeatMode = repeatMode === 'off' ? 'all' : repeatMode === 'all' ? 'one' : 'off';
    setRepeatMode(nextMode);
  };

  // Handle Shuffle Toggle
  const handleToggleShuffle = () => {
    const nextShuffle = !shuffle;
    setShuffle(nextShuffle);
    if (nextShuffle) {
      setShuffledIndices(generateShuffledIndices(songs.length, currentIndex));
    }
  };

  // Reorder Songs (Move Up / Down row sequence)
  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const reordered = reorderSongs(songs, index, index - 1);
    setSongs(reordered);
    if (currentIndex === index) setCurrentIndex(index - 1);
    else if (currentIndex === index - 1) setCurrentIndex(index);
  };

  const handleMoveDown = (index: number) => {
    if (index >= songs.length - 1) return;
    const reordered = reorderSongs(songs, index, index + 1);
    setSongs(reordered);
    if (currentIndex === index) setCurrentIndex(index + 1);
    else if (currentIndex === index + 1) setCurrentIndex(index);
  };

  // Favorite toggle
  const handleToggleFavorite = async (id: string) => {
    const updated = songs.map((s) => (s.id === id ? { ...s, favorite: !s.favorite } : s));
    setSongs(updated);
    const target = updated.find((s) => s.id === id);
    if (target) {
      await saveSongToDB(target);
    }
  };

  // Delete Song
  const handleDeleteSong = async (id: string) => {
    await deleteSongFromDB(id);
    const updated = songs.filter((s) => s.id !== id);
    setSongs(updated);
    if (currentSong?.id === id) {
      if (updated.length > 0) {
        handlePlaySong(updated[0], 0);
      } else {
        audioEngine.pause();
        setCurrentSong(null);
        setCurrentIndex(-1);
      }
    }
  };

  // Edit Song Tags & Artwork
  const handleSaveSongEdit = async (id: string, updates: Partial<SongItem>, customCoverBlob?: Blob) => {
    const updated = songs.map((s) => (s.id === id ? { ...s, ...updates } : s));
    setSongs(updated);
    const target = updated.find((s) => s.id === id);
    if (target) {
      await saveSongToDB(target, target.blob, customCoverBlob);
      if (currentSong?.id === id) {
        setCurrentSong(target);
      }
    }
  };

  // Scan Folder via File System Access API or input
  const handleScanFolder = async () => {
    // If showDirectoryPicker is supported in modern Chrome / Android
    if ('showDirectoryPicker' in window) {
      try {
        const dirHandle = await (window as unknown as { showDirectoryPicker: () => Promise<FileSystemDirectoryHandle> }).showDirectoryPicker();
        const scannedFiles: File[] = [];

        async function readDirectory(handle: FileSystemDirectoryHandle) {
          for await (const entry of (handle as unknown as AsyncIterable<FileSystemHandle>)) {
            if (entry.kind === 'file') {
              const fileHandle = entry as unknown as FileSystemFileHandle;
              const file = await fileHandle.getFile();
              if (file.type.startsWith('audio/') || /\.(mp3|flac|wav|ogg|m4a|aac)$/i.test(file.name)) {
                scannedFiles.push(file);
              }
            } else if (entry.kind === 'directory') {
              await readDirectory(entry as unknown as FileSystemDirectoryHandle);
            }
          }
        }

        await readDirectory(dirHandle);
        await processUploadedFiles(scannedFiles);
        return;
      } catch (err: unknown) {
        if ((err as Error).name !== 'AbortError') {
          console.warn('Directory Picker fallback:', err);
        } else {
          return; // user cancelled picker
        }
      }
    }

    // Fallback: Trigger folder input
    if (folderInputRef.current) {
      folderInputRef.current.click();
    } else if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      await processUploadedFiles(files);
      e.target.value = '';
    }
  };

  const processUploadedFiles = async (files: File[]) => {
    const newItems: SongItem[] = [];

    for (const file of files) {
      try {
        const meta = await parseAudioMetadata(file);
        const item: SongItem = {
          id: `song-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          title: meta.title || file.name.replace(/\.[^/.]+$/, ''),
          artist: meta.artist || 'Unknown Artist',
          album: meta.album || 'Local Music',
          duration: meta.duration || 0,
          coverUrl: meta.coverUrl,
          url: URL.createObjectURL(file),
          blob: file,
          fileSize: file.size,
          addedAt: Date.now()
        };
        newItems.push(item);
        await saveSongToDB(item, file);
      } catch (err) {
        console.warn('Failed to parse file', file.name, err);
      }
    }

    if (newItems.length > 0) {
      setSongs((prev) => [...prev, ...newItems]);
      if (!currentSong) {
        handlePlaySong(newItems[0], songs.length);
      }
    }
  };

  // Playlists
  const handleCreatePlaylist = async (name: string, description?: string) => {
    const newPl: PlaylistRecord = {
      id: `pl-${Date.now()}`,
      name,
      description,
      songIds: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    await savePlaylistToDB(newPl);
    setPlaylists((prev) => [...prev, newPl]);
  };

  const handleDeletePlaylist = async (id: string) => {
    await deletePlaylistFromDB(id);
    setPlaylists((prev) => prev.filter((p) => p.id !== id));
    if (activePlaylistId === id) setActivePlaylistId(null);
  };

  const handleAddSongToPlaylist = async (playlistId: string, songId: string) => {
    const pl = playlists.find((p) => p.id === playlistId);
    if (!pl) return;
    if (!pl.songIds.includes(songId)) {
      const updated: PlaylistRecord = {
        ...pl,
        songIds: [...pl.songIds, songId],
        updatedAt: Date.now()
      };
      await savePlaylistToDB(updated);
      setPlaylists((prev) => prev.map((p) => (p.id === playlistId ? updated : p)));
    }
  };

  // Equalizer adjustments
  const handleEqGainChange = (index: number, val: number) => {
    const updated = [...eqGains];
    updated[index] = val;
    setEqGains(updated);
    audioEngine.setBandGain(index, val);
  };

  const handleSelectPreset = (preset: EQPreset) => {
    setActivePresetId(preset.id);
    setEqGains([...preset.gains]);
    if (preset.bassBoost !== undefined) {
      setBassBoost(preset.bassBoost);
    }
    audioEngine.setPreset(preset);
  };

  const handleBassBoostChange = (val: number) => {
    setBassBoost(val);
    audioEngine.setBassBoost(val);
  };

  const handleSpatial3DChange = (enabled: boolean) => {
    setSpatial3D(enabled);
    audioEngine.setSpatial3D(enabled);
  };

  const handlePreAmpChange = (val: number) => {
    setPreAmp(val);
    audioEngine.setPreAmp(val);
  };

  // Theme settings
  const handleThemeColorChange = async (color: string) => {
    setThemeColor(color);
    await saveSettingToDB('themeColor', color);
  };

  const handleVisualizerModeChange = async (mode: 'wave' | 'ring' | 'bars' | 'vortex') => {
    setVisualizerMode(mode);
    await saveSettingToDB('visualizerMode', mode);
  };

  return (
    <div
      className="min-h-screen text-slate-100 flex flex-col justify-between selection:bg-cyan-500/30 selection:text-cyan-200"
      style={{
        backdropFilter: `blur(${glassBlur}px)`
      }}
    >
      {/* Hidden Folder & Multi-File Inputs for Device Synchronization */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        multiple
        onChange={handleFileInputChange}
        className="hidden"
      />
      <input
        ref={folderInputRef}
        type="file"
        multiple
        // @ts-expect-error webkitdirectory is standard for folder picking
        webkitdirectory="true"
        directory="true"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Futuristic Header */}
      <Header
        onOpenEqualizer={() => setIsEqOpen(true)}
        onOpenSoundLink={() => setIsSoundLinkOpen(true)}
        onOpenTheme={() => setIsThemeOpen(true)}
        onOpenAiDj={() => setIsAiDjOpen(true)}
        onScanFiles={handleScanFolder}
        soundLinkState={soundLinkState}
        isPlaying={isPlaying}
        songCount={songs.length}
      />

      {/* Main Music Library View */}
      <LibraryView
        songs={songs}
        currentSong={currentSong}
        isPlaying={isPlaying}
        onPlaySong={handlePlaySong}
        onToggleFavorite={handleToggleFavorite}
        onOpenContextMenu={(song, index, e) => {
          setContextMenuSong(song);
          setContextMenuIndex(index);
          const clientX = 'clientX' in e ? e.clientX : e.touches[0].clientX;
          const clientY = 'clientY' in e ? e.clientY : e.touches[0].clientY;
          setContextMenuPos({ x: clientX, y: clientY });
        }}
        onMoveUp={handleMoveUp}
        onMoveDown={handleMoveDown}
        onScanFolder={handleScanFolder}
        onUploadFiles={handleFileInputChange}
        playlists={playlists}
        activePlaylistId={activePlaylistId}
        onSelectPlaylistTab={setActivePlaylistId}
        onOpenPlaylistModal={() => setIsPlaylistModalOpen(true)}
        themeColor={themeColor}
        visualizerMode={visualizerMode}
      />

      {/* Persistent Bottom Liquid Glass Player Bar */}
      <PlayerBar
        currentSong={currentSong}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        volume={volume}
        repeatMode={repeatMode}
        shuffle={shuffle}
        onPlayPause={handlePlayPause}
        onNext={handleNextTrack}
        onPrevious={handlePreviousTrack}
        onSeek={handleSeek}
        onVolumeChange={handleVolumeChange}
        onToggleRepeat={handleToggleRepeat}
        onToggleShuffle={handleToggleShuffle}
        onOpenEqualizer={() => setIsEqOpen(true)}
        onOpenFullScreen={() => setIsFullScreenOpen(true)}
        onOpenAiDj={() => setIsAiDjOpen(true)}
        themeColor={themeColor}
      />

      {/* 3D Liquid Full Screen Player */}
      <FullScreenPlayer
        isOpen={isFullScreenOpen}
        onClose={() => setIsFullScreenOpen(false)}
        currentSong={currentSong}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        volume={volume}
        repeatMode={repeatMode}
        shuffle={shuffle}
        onPlayPause={handlePlayPause}
        onNext={handleNextTrack}
        onPrevious={handlePreviousTrack}
        onSeek={handleSeek}
        onVolumeChange={handleVolumeChange}
        onToggleRepeat={handleToggleRepeat}
        onToggleShuffle={handleToggleShuffle}
        onOpenEqualizer={() => setIsEqOpen(true)}
        onOpenAiDj={() => setIsAiDjOpen(true)}
        onOpenSoundLink={() => setIsSoundLinkOpen(true)}
        visualizerMode={visualizerMode}
        themeColor={themeColor}
      />

      {/* 10-Band Parametric Equalizer Modal */}
      <EqualizerModal
        isOpen={isEqOpen}
        onClose={() => setIsEqOpen(false)}
        eqGains={eqGains}
        onGainChange={handleEqGainChange}
        bassBoost={bassBoost}
        onBassBoostChange={handleBassBoostChange}
        spatial3D={spatial3D}
        onSpatial3DChange={handleSpatial3DChange}
        preAmp={preAmp}
        onPreAmpChange={handlePreAmpChange}
        activePresetId={activePresetId}
        onSelectPreset={handleSelectPreset}
        themeColor={themeColor}
      />

      {/* SoundLink Multi-Device Speaker Sync Modal */}
      <SoundLinkModal
        isOpen={isSoundLinkOpen}
        onClose={() => setIsSoundLinkOpen(false)}
        soundLinkState={soundLinkState}
        currentTrackTitle={currentSong?.title}
      />

      {/* Theme & Liquid Glass Modal */}
      <ThemeModal
        isOpen={isThemeOpen}
        onClose={() => setIsThemeOpen(false)}
        themeColor={themeColor}
        onThemeColorChange={handleThemeColorChange}
        visualizerMode={visualizerMode}
        onVisualizerModeChange={handleVisualizerModeChange}
        glassBlur={glassBlur}
        onGlassBlurChange={setGlassBlur}
        glowIntensity={glowIntensity}
        onGlowIntensityChange={setGlowIntensity}
      />

      {/* Gemini AI Vibe Studio Modal */}
      <AiDjModal
        isOpen={isAiDjOpen}
        onClose={() => setIsAiDjOpen(false)}
        trackTitle={currentSong?.title || ''}
        trackArtist={currentSong?.artist || ''}
        onApplyThemeColor={handleThemeColorChange}
        onApplyEqPreset={handleSelectPreset}
        onApplyVisualizer={handleVisualizerModeChange}
      />

      {/* Song Edit Tags & Artwork Modal */}
      <SongEditModal
        isOpen={!!editingSong}
        onClose={() => setEditingSong(null)}
        song={editingSong}
        onSave={handleSaveSongEdit}
      />

      {/* Playlists Management Modal */}
      <PlaylistModal
        isOpen={isPlaylistModalOpen}
        onClose={() => setIsPlaylistModalOpen(false)}
        playlists={playlists}
        allSongs={songs}
        onCreatePlaylist={handleCreatePlaylist}
        onDeletePlaylist={handleDeletePlaylist}
        onSelectPlaylist={(pl) => setActivePlaylistId(pl.id)}
        selectedPlaylistId={activePlaylistId}
      />

      {/* Song Context Menu (Long-press & Three-Dots) */}
      <SongContextMenu
        isOpen={!!contextMenuSong}
        onClose={() => setContextMenuSong(null)}
        position={contextMenuPos}
        song={contextMenuSong}
        index={contextMenuIndex}
        totalSongs={songs.length}
        playlists={playlists}
        onPlayNow={(s) => handlePlaySong(s, contextMenuIndex)}
        onPlayNext={(s) => {
          // Inserts track next in queue
          const filtered = songs.filter((item) => item.id !== s.id);
          filtered.splice(currentIndex + 1, 0, s);
          setSongs(filtered);
        }}
        onAddToQueue={(s) => {
          setSongs((prev) => [...prev, s]);
        }}
        onAddToPlaylist={handleAddSongToPlaylist}
        onOpenEdit={(s) => setEditingSong(s)}
        onOpenAiDj={(s) => {
          setCurrentSong(s);
          setIsAiDjOpen(true);
        }}
        onBroadcastSoundLink={(s) => {
          if (soundLinkState.isHost && soundLinkState.roomId) {
            handlePlaySong(s, contextMenuIndex);
          } else {
            setIsSoundLinkOpen(true);
          }
        }}
        onDeleteSong={handleDeleteSong}
        onMoveUp={handleMoveUp}
        onMoveDown={handleMoveDown}
      />
    </div>
  );
}
