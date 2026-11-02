import React, { useState, useRef } from 'react';
import {
  Search,
  FolderOpen,
  Upload,
  Play,
  Heart,
  MoreVertical,
  ArrowUp,
  ArrowDown,
  ListMusic,
  Music2,
  Sparkles,
  Radio,
  Clock,
  HardDrive
} from 'lucide-react';
import { SongItem, formatTime, formatFileSize } from '../utils/playlistRules';
import { PlaylistRecord } from '../utils/db';
import { VisualizerCanvas } from './VisualizerCanvas';

interface LibraryViewProps {
  songs: SongItem[];
  currentSong: SongItem | null;
  isPlaying: boolean;
  onPlaySong: (song: SongItem, index: number) => void;
  onToggleFavorite: (id: string) => void;
  onOpenContextMenu: (song: SongItem, index: number, event: React.MouseEvent | React.TouchEvent) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onScanFolder: () => void;
  onUploadFiles: (e: React.ChangeEvent<HTMLInputElement>) => void;
  playlists: PlaylistRecord[];
  activePlaylistId: string | null;
  onSelectPlaylistTab: (playlistId: string | null) => void;
  onOpenPlaylistModal: () => void;
  themeColor: string;
  visualizerMode: 'wave' | 'ring' | 'bars' | 'vortex';
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  songs,
  currentSong,
  isPlaying,
  onPlaySong,
  onToggleFavorite,
  onOpenContextMenu,
  onMoveUp,
  onMoveDown,
  onScanFolder,
  onUploadFiles,
  playlists,
  activePlaylistId,
  onSelectPlaylistTab,
  onOpenPlaylistModal,
  themeColor,
  visualizerMode
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'favorites'>('all');
  const longPressTimerRef = useRef<number | null>(null);

  // Filter songs based on search, favorites, or selected playlist
  let filteredSongs = songs;

  if (activePlaylistId) {
    const pl = playlists.find((p) => p.id === activePlaylistId);
    if (pl) {
      filteredSongs = filteredSongs.filter((s) => pl.songIds.includes(s.id));
    }
  } else if (filterMode === 'favorites') {
    filteredSongs = filteredSongs.filter((s) => s.favorite);
  }

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filteredSongs = filteredSongs.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.artist.toLowerCase().includes(q) ||
        (s.album && s.album.toLowerCase().includes(q))
    );
  }

  // Handle touch long-press (500ms)
  const handleTouchStart = (song: SongItem, index: number, e: React.TouchEvent) => {
    longPressTimerRef.current = window.setTimeout(() => {
      onOpenContextMenu(song, index, e);
    }, 450);
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-5 pb-36">
      {/* Top Hero / Visualizer Banner */}
      <section className="relative rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-br from-slate-900/80 via-slate-950/80 to-black/90 backdrop-blur-2xl p-5 sm:p-7 mb-6 shadow-[0_10px_35px_rgba(0,0,0,0.5)]">
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <VisualizerCanvas
            mode={visualizerMode}
            themeColor={themeColor}
            isPlaying={isPlaying}
            compact={true}
          />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-mono tracking-widest uppercase px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold">
                HIGH RESOLUTION AUDIO STUDIO
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                10-Band EQ • Reorder Rows • SoundLink
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-['Syne',sans-serif] text-white">
              Device Audio Library
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 font-mono mt-1">
              Offline synchronized playback. Touch and hold any song for custom actions.
            </p>
          </div>

          {/* Quick Scan & Import Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onScanFolder}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/40 font-mono text-xs font-semibold shadow-[0_0_15px_rgba(0,240,255,0.2)] transition-all"
              title="Select folder from phone or PC"
            >
              <FolderOpen className="w-4 h-4" />
              <span>Scan Phone Folder</span>
            </button>

            <label className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 hover:border-white/20 font-mono text-xs font-semibold cursor-pointer transition-all">
              <Upload className="w-4 h-4 text-cyan-400" />
              <span>Select Audio Files</span>
              <input
                type="file"
                accept="audio/*"
                multiple
                onChange={onUploadFiles}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </section>

      {/* Playlist and Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-5">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
          <button
            onClick={() => {
              onSelectPlaylistTab(null);
              setFilterMode('all');
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-semibold transition-all shrink-0 ${
              !activePlaylistId && filterMode === 'all'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-[0_0_15px_rgba(0,240,255,0.3)]'
                : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
            }`}
          >
            All Tracks ({songs.length})
          </button>

          <button
            onClick={() => {
              onSelectPlaylistTab(null);
              setFilterMode('favorites');
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
              !activePlaylistId && filterMode === 'favorites'
                ? 'bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)]'
                : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
            }`}
          >
            <Heart className="w-3.5 h-3.5 fill-current" />
            <span>Favorites</span>
          </button>

          {/* User Playlists */}
          {playlists.map((pl) => (
            <button
              key={pl.id}
              onClick={() => onSelectPlaylistTab(pl.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
                activePlaylistId === pl.id
                  ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
              }`}
            >
              <ListMusic className="w-3.5 h-3.5" />
              <span>{pl.name}</span>
            </button>
          ))}

          {/* Manage Playlists Modal Trigger */}
          <button
            onClick={onOpenPlaylistModal}
            className="px-3 py-1.5 rounded-full text-xs font-mono font-semibold bg-white/5 hover:bg-white/10 text-cyan-300 border border-cyan-500/30 shrink-0"
          >
            + Playlists
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tracks, artists..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:bg-black/50 transition-all"
          />
        </div>
      </div>

      {/* Songs Table List */}
      <div className="space-y-2">
        {filteredSongs.length === 0 ? (
          <div className="py-16 text-center rounded-3xl bg-white/5 border border-white/10 p-6">
            <Music2 className="w-12 h-12 text-slate-500 mx-auto mb-3 opacity-60" />
            <h3 className="text-base font-bold font-mono text-white">No Tracks Found</h3>
            <p className="text-xs text-slate-400 font-mono mt-1 max-w-sm mx-auto">
              Scan your phone folder or upload audio files to start enjoying high-fidelity music with LINAX.
            </p>
          </div>
        ) : (
          filteredSongs.map((song, idx) => {
            const isCurrent = currentSong?.id === song.id;

            return (
              <div
                key={song.id}
                onContextMenu={(e) => {
                  e.preventDefault();
                  onOpenContextMenu(song, idx, e);
                }}
                onTouchStart={(e) => handleTouchStart(song, idx, e)}
                onTouchEnd={handleTouchEnd}
                className={`group relative rounded-2xl border transition-all duration-200 flex items-center justify-between gap-3 p-2.5 sm:p-3 select-none ${
                  isCurrent
                    ? 'bg-gradient-to-r from-cyan-500/15 via-blue-600/10 to-purple-600/10 border-cyan-400/50 shadow-[0_0_20px_rgba(0,240,255,0.15)]'
                    : 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/20'
                }`}
              >
                {/* Left: Serial Index, Cover Image, Title & Artist */}
                <div
                  onClick={() => onPlaySong(song, idx)}
                  className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                >
                  {/* Track Serial Order Index */}
                  <div className="w-6 text-center font-mono text-xs font-bold shrink-0">
                    {isCurrent && isPlaying ? (
                      <span className="flex items-center justify-center gap-0.5 h-4">
                        <span className="w-1 bg-cyan-400 h-3 animate-pulse" />
                        <span className="w-1 bg-cyan-400 h-4 animate-pulse" style={{ animationDelay: '0.2s' }} />
                        <span className="w-1 bg-cyan-400 h-2 animate-pulse" style={{ animationDelay: '0.4s' }} />
                      </span>
                    ) : (
                      <span className={isCurrent ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'}>
                        {idx + 1}
                      </span>
                    )}
                  </div>

                  {/* Album Cover Thumbnail */}
                  <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-xl overflow-hidden shrink-0 border border-white/15 bg-black/40 shadow-sm">
                    {song.coverUrl ? (
                      <img
                        src={song.coverUrl}
                        alt={song.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-cyan-400 bg-cyan-950/20">
                        <Music2 className="w-5 h-5" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    </div>
                  </div>

                  {/* Title & Artist */}
                  <div className="min-w-0 truncate">
                    <h3 className={`text-xs sm:text-sm font-bold font-mono truncate ${
                      isCurrent ? 'text-cyan-300' : 'text-white'
                    }`}>
                      {song.title}
                    </h3>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {song.artist} {song.album ? `• ${song.album}` : ''}
                    </p>
                  </div>
                </div>

                {/* Right Controls: Duration, Reorder Serial (Up/Down), Favorite, More Options */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Duration and Size */}
                  <div className="hidden sm:flex flex-col items-end text-[11px] font-mono text-slate-400 mr-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTime(song.duration)}
                    </span>
                    {song.fileSize && (
                      <span className="text-[10px] text-slate-500">
                        {formatFileSize(song.fileSize)}
                      </span>
                    )}
                  </div>

                  {/* Row Reorder Serial Buttons: Move Up & Move Down */}
                  <div className="flex items-center gap-0.5 bg-black/30 p-1 rounded-xl border border-white/5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onMoveUp(idx);
                      }}
                      disabled={idx === 0}
                      className="p-1 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-white/10 disabled:opacity-20 transition-all"
                      title="Move Up Serial Sequence"
                      aria-label="Move Up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onMoveDown(idx);
                      }}
                      disabled={idx === filteredSongs.length - 1}
                      className="p-1 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-white/10 disabled:opacity-20 transition-all"
                      title="Move Down Serial Sequence"
                      aria-label="Move Down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Favorite Toggle */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(song.id);
                    }}
                    className={`p-1.5 rounded-full transition-all ${
                      song.favorite
                        ? 'text-rose-400 hover:text-rose-300'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                    title="Toggle Favorite"
                  >
                    <Heart className={`w-4 h-4 ${song.favorite ? 'fill-current' : ''}`} />
                  </button>

                  {/* Context Menu Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenContextMenu(song, idx, e);
                    }}
                    className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                    title="Song Options"
                    aria-label="Song Menu"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </main>
  );
};
