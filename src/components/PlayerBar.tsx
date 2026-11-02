import React from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Repeat1,
  Shuffle,
  Volume2,
  VolumeX,
  Sliders,
  Maximize2,
  Sparkles,
  Music2,
  Radio
} from 'lucide-react';
import { SongItem, formatTime, RepeatMode } from '../utils/playlistRules';

interface PlayerBarProps {
  currentSong: SongItem | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  repeatMode: RepeatMode;
  shuffle: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onSeek: (seconds: number) => void;
  onVolumeChange: (val: number) => void;
  onToggleRepeat: () => void;
  onToggleShuffle: () => void;
  onOpenEqualizer: () => void;
  onOpenFullScreen: () => void;
  onOpenAiDj: () => void;
  themeColor: string;
}

export const PlayerBar: React.FC<PlayerBarProps> = ({
  currentSong,
  isPlaying,
  currentTime,
  duration,
  volume,
  repeatMode,
  shuffle,
  onPlayPause,
  onNext,
  onPrevious,
  onSeek,
  onVolumeChange,
  onToggleRepeat,
  onToggleShuffle,
  onOpenEqualizer,
  onOpenFullScreen,
  onOpenAiDj,
  themeColor
}) => {
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/85 backdrop-blur-2xl border-t border-white/10 shadow-[0_-10px_35px_rgba(0,0,0,0.7)]">
      {/* Top Progress Bar Scrubber */}
      <div className="relative group w-full h-2 cursor-pointer bg-white/5" onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const pct = Math.max(0, Math.min(1, clickX / rect.width));
        onSeek(pct * (duration || 0));
      }}>
        <div
          className="h-full bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 transition-all duration-100 relative"
          style={{ width: `${progressPercent}%` }}
        >
          <span className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-[0_0_10px_rgba(0,240,255,0.8)] opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex flex-col justify-between">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* Left: Song Artwork & Details */}
          <div className="flex items-center gap-3 min-w-0 max-w-[30%] sm:max-w-[28%]">
            <button
              onClick={onOpenFullScreen}
              className="relative group w-11 h-11 sm:w-13 sm:h-13 rounded-xl overflow-hidden shrink-0 border border-white/20 shadow-md bg-black/60 focus:outline-none"
              title="Click to view 3D Liquid Player"
            >
              {currentSong?.coverUrl ? (
                <img
                  src={currentSong.coverUrl}
                  alt={currentSong.title}
                  className={`w-full h-full object-cover transition-transform duration-500 ${
                    isPlaying ? 'scale-105' : 'scale-100'
                  }`}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-cyan-400 bg-cyan-950/30">
                  <Music2 className="w-5 h-5" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                <Maximize2 className="w-4 h-4" />
              </div>
            </button>

            <div className="min-w-0 truncate">
              <button
                onClick={onOpenFullScreen}
                className="text-left font-bold text-xs sm:text-sm text-white hover:text-cyan-300 transition-colors truncate block"
              >
                {currentSong ? currentSong.title : 'No Track Selected'}
              </button>
              <p className="text-[11px] text-slate-400 truncate">
                {currentSong ? currentSong.artist : 'Select a track from library'}
              </p>
            </div>
          </div>

          {/* Center: Playback Controls & Time */}
          <div className="flex flex-col items-center gap-1 flex-1 max-w-md">
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Shuffle */}
              <button
                onClick={onToggleShuffle}
                className={`p-1.5 sm:p-2 rounded-full transition-all ${
                  shuffle
                    ? 'text-cyan-400 bg-cyan-500/20 shadow-[0_0_10px_rgba(0,240,255,0.3)]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Shuffle"
                aria-label="Toggle Shuffle"
              >
                <Shuffle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>

              {/* Previous */}
              <button
                onClick={onPrevious}
                className="p-1.5 sm:p-2 rounded-full text-slate-200 hover:text-white hover:bg-white/10 transition-all active:scale-95"
                title="Previous Track"
                aria-label="Previous Track"
              >
                <SkipBack className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
              </button>

              {/* Play / Pause Primary Button */}
              <button
                onClick={onPlayPause}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 text-slate-950 flex items-center justify-center shadow-[0_0_20px_rgba(0,240,255,0.5)] hover:scale-105 active:scale-95 transition-all"
                title={isPlaying ? 'Pause' : 'Play'}
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 fill-current" />
                ) : (
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                )}
              </button>

              {/* Next */}
              <button
                onClick={onNext}
                className="p-1.5 sm:p-2 rounded-full text-slate-200 hover:text-white hover:bg-white/10 transition-all active:scale-95"
                title="Next Track"
                aria-label="Next Track"
              >
                <SkipForward className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
              </button>

              {/* Repeat */}
              <button
                onClick={onToggleRepeat}
                className={`p-1.5 sm:p-2 rounded-full transition-all ${
                  repeatMode !== 'off'
                    ? 'text-cyan-400 bg-cyan-500/20 shadow-[0_0_10px_rgba(0,240,255,0.3)]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title={`Repeat: ${repeatMode}`}
                aria-label="Toggle Repeat"
              >
                {repeatMode === 'one' ? (
                  <Repeat1 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                ) : (
                  <Repeat className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                )}
              </button>
            </div>

            {/* Timestamps */}
            <div className="flex items-center gap-2 text-[10px] sm:text-[11px] font-mono text-slate-400">
              <span>{formatTime(currentTime)}</span>
              <span>/</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Right: Sound Enhancers, Equalizer, Volume, Fullscreen */}
          <div className="flex items-center justify-end gap-2 sm:gap-3 min-w-0 max-w-[30%] sm:max-w-[28%]">
            <button
              onClick={onOpenAiDj}
              className="p-1.5 sm:p-2 rounded-full text-purple-300 hover:bg-purple-500/20 transition-all hidden md:flex"
              title="AI Vibe Studio"
              aria-label="AI Vibe Studio"
            >
              <Sparkles className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenEqualizer}
              className="p-1.5 sm:p-2 rounded-full text-slate-300 hover:text-cyan-300 hover:bg-white/10 transition-all"
              title="10-Band Equalizer"
              aria-label="Open Equalizer"
            >
              <Sliders className="w-4 h-4" />
            </button>

            {/* Volume Slider */}
            <div className="hidden sm:flex items-center gap-2">
              <button
                onClick={() => onVolumeChange(volume > 0 ? 0 : 0.8)}
                className="text-slate-400 hover:text-white"
                title={volume === 0 ? 'Unmute' : 'Mute'}
                aria-label="Volume Mute Toggle"
              >
                {volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-rose-400" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                className="w-16 lg:w-24 accent-cyan-400 cursor-pointer"
                aria-label="Volume Slider"
              />
            </div>

            {/* Fullscreen Expand */}
            <button
              onClick={onOpenFullScreen}
              className="p-1.5 sm:p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-all"
              title="Full 3D Liquid Player"
              aria-label="Full Screen View"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Small Developer Attribution as requested */}
        <div className="mt-1 pt-1 border-t border-white/5 flex items-center justify-between text-[10px] font-mono tracking-widest text-slate-500">
          <span className="flex items-center gap-1 text-cyan-500/70">
            <Radio className="w-3 h-3 animate-pulse" />
            LINAX 3D SOUND ENGINE
          </span>
          <span className="text-slate-400 font-semibold tracking-wider">
            DEVELOPER: ABDULLAH AL SALEM
          </span>
        </div>
      </div>
    </footer>
  );
};
