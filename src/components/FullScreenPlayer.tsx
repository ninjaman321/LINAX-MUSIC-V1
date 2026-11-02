import React, { useState, useRef } from 'react';
import {
  ChevronDown,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Sliders,
  Sparkles,
  Volume2,
  Radio,
  Share2
} from 'lucide-react';
import { SongItem, formatTime, RepeatMode } from '../utils/playlistRules';
import { VisualizerCanvas } from './VisualizerCanvas';

interface FullScreenPlayerProps {
  isOpen: boolean;
  onClose: () => void;
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
  onOpenAiDj: () => void;
  onOpenSoundLink: () => void;
  visualizerMode: 'wave' | 'ring' | 'bars' | 'vortex';
  themeColor: string;
}

export const FullScreenPlayer: React.FC<FullScreenPlayerProps> = ({
  isOpen,
  onClose,
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
  onOpenAiDj,
  onOpenSoundLink,
  visualizerMode,
  themeColor
}) => {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  if (!isOpen || !currentSong) return null;

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  // 3D Card mouse tilt interaction
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setTilt({
      x: -(y / (rect.height / 2)) * 14,
      y: (x / (rect.width / 2)) * 14
    });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-3xl flex flex-col justify-between p-4 sm:p-8 animate-fadeIn overflow-hidden">
      {/* Background Reactive Visualizer */}
      <div className="absolute inset-0 opacity-40 pointer-events-none">
        <VisualizerCanvas
          mode={visualizerMode}
          themeColor={themeColor}
          isPlaying={isPlaying}
          compact={false}
        />
      </div>

      {/* Ambient glowing radial orbs */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Navigation Bar */}
      <div className="relative z-10 max-w-4xl w-full mx-auto flex items-center justify-between">
        <button
          onClick={onClose}
          className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-all flex items-center gap-1.5"
          aria-label="Minimize Player"
        >
          <ChevronDown className="w-5 h-5" />
          <span className="text-xs font-mono hidden sm:inline">Minimize</span>
        </button>

        <div className="text-center font-mono">
          <span className="text-[10px] text-cyan-400 uppercase tracking-widest block font-bold">
            NOW PLAYING IN 3D
          </span>
          <span className="text-xs text-slate-400 truncate max-w-xs block">
            {currentSong.album || 'LINAX Studio Master'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenSoundLink}
            className="p-2.5 rounded-2xl bg-white/5 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-300 border border-white/10 transition-all"
            title="SoundLink Party Cast"
            aria-label="SoundLink"
          >
            <Radio className="w-4 h-4 text-emerald-400" />
          </button>
          <button
            onClick={onOpenEqualizer}
            className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-cyan-300 border border-white/10 transition-all"
            title="Equalizer"
            aria-label="Equalizer"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Center 3D Holographic Card & Album Art */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center my-4 sm:my-6 perspective-1000">
        <div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{
            transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
            transition: 'transform 0.15s ease-out'
          }}
          className="relative group w-64 h-64 sm:w-84 sm:h-84 md:w-96 md:h-96 rounded-3xl overflow-hidden p-3 border border-white/20 bg-white/5 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] cursor-pointer"
        >
          {/* Cover Art */}
          <div className="relative w-full h-full rounded-2xl overflow-hidden bg-black/50 shadow-inner">
            <img
              src={currentSong.coverUrl || ''}
              alt={currentSong.title}
              className={`w-full h-full object-cover transition-transform duration-700 ${
                isPlaying ? 'scale-105' : 'scale-100'
              }`}
            />
            {/* Holographic light sheen reflection */}
            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-400/10 via-transparent to-purple-400/20 pointer-events-none" />
          </div>
        </div>

        {/* Track Title and Artist */}
        <div className="text-center mt-6 max-w-lg px-4">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black font-['Syne',sans-serif] text-white tracking-wide truncate">
            {currentSong.title}
          </h2>
          <p className="text-sm sm:text-base text-cyan-300/80 font-mono mt-1 truncate">
            {currentSong.artist}
          </p>
        </div>
      </div>

      {/* Bottom Controls & Timeline */}
      <div className="relative z-10 max-w-2xl w-full mx-auto space-y-4">
        {/* Scrubber Slider */}
        <div className="space-y-1.5">
          <div
            className="relative group h-2.5 rounded-full bg-white/10 cursor-pointer overflow-hidden"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              const pct = Math.max(0, Math.min(1, clickX / rect.width));
              onSeek(pct * duration);
            }}
          >
            <div
              className="h-full bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 rounded-full relative"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex justify-between text-xs font-mono text-slate-400 px-0.5">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Main Controls Row */}
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={onToggleShuffle}
            className={`p-3 rounded-2xl transition-all ${
              shuffle
                ? 'text-cyan-400 bg-cyan-500/20 shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                : 'text-slate-400 hover:text-white bg-white/5'
            }`}
            title="Toggle Shuffle"
          >
            <Shuffle className="w-5 h-5" />
          </button>

          <button
            onClick={onPrevious}
            className="p-3 rounded-2xl text-slate-200 hover:text-white bg-white/5 hover:bg-white/10 transition-all active:scale-95"
            title="Previous Track"
          >
            <SkipBack className="w-6 h-6 fill-current" />
          </button>

          {/* Primary Play/Pause Button */}
          <button
            onClick={onPlayPause}
            className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-cyan-400 via-sky-300 to-indigo-400 text-slate-950 flex items-center justify-center shadow-[0_0_35px_rgba(0,240,255,0.6)] hover:scale-105 active:scale-95 transition-all"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-8 h-8 fill-current" />
            ) : (
              <Play className="w-8 h-8 fill-current ml-1" />
            )}
          </button>

          <button
            onClick={onNext}
            className="p-3 rounded-2xl text-slate-200 hover:text-white bg-white/5 hover:bg-white/10 transition-all active:scale-95"
            title="Next Track"
          >
            <SkipForward className="w-6 h-6 fill-current" />
          </button>

          <button
            onClick={onToggleRepeat}
            className={`p-3 rounded-2xl transition-all ${
              repeatMode !== 'off'
                ? 'text-cyan-400 bg-cyan-500/20 shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                : 'text-slate-400 hover:text-white bg-white/5'
            }`}
            title={`Repeat: ${repeatMode}`}
          >
            {repeatMode === 'one' ? <Repeat1 className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}
          </button>
        </div>

        {/* AI Vibe Studio Shortcut */}
        <div className="flex justify-center pt-2">
          <button
            onClick={onOpenAiDj}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 border border-purple-500/30 text-purple-200 text-xs font-mono font-semibold transition-all shadow-[0_0_20px_rgba(168,85,247,0.25)]"
          >
            <Sparkles className="w-3.5 h-3.5 text-pink-400 animate-spin" style={{ animationDuration: '6s' }} />
            <span>Launch AI Vibe Analysis (Gemini)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
