import React from 'react';
import {
  Radio,
  Sliders,
  Palette,
  Sparkles,
  FolderPlus,
  Wifi,
  Music2
} from 'lucide-react';
import { SoundLinkState } from '../utils/partyClient';

interface HeaderProps {
  onOpenEqualizer: () => void;
  onOpenSoundLink: () => void;
  onOpenTheme: () => void;
  onOpenAiDj: () => void;
  onScanFiles: () => void;
  soundLinkState: SoundLinkState;
  isPlaying: boolean;
  songCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenEqualizer,
  onOpenSoundLink,
  onOpenTheme,
  onOpenAiDj,
  onScanFiles,
  soundLinkState,
  isPlaying,
  songCount
}) => {
  return (
    <header className="relative z-30 px-4 sm:px-6 py-3.5 border-b border-white/10 bg-slate-950/60 backdrop-blur-2xl">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Top Left: LINAX App Name & Branding */}
        <div className="flex items-center gap-3">
          <div className="relative group flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 via-blue-600/30 to-purple-600/20 border border-cyan-400/40 shadow-[0_0_20px_rgba(0,240,255,0.25)]">
            <Radio className="w-5 h-5 text-cyan-300 animate-pulse" />
            {isPlaying && (
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-400"></span>
              </span>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-wider bg-gradient-to-r from-cyan-300 via-sky-200 to-indigo-300 bg-clip-text text-transparent font-['Syne',sans-serif]">
                LINAX
              </h1>
              <span className="text-[10px] font-mono tracking-widest px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                PRO 3D
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
              <span>{songCount} {songCount === 1 ? 'Track' : 'Tracks'}</span>
              <span>•</span>
              <span className="text-cyan-400/90 font-medium">32-Bit Hi-Fi Engine</span>
            </p>
          </div>
        </div>

        {/* Action Controls & Multi-Device Sync Pill */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* SoundLink Party Button */}
          <button
            onClick={onOpenSoundLink}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-300 border ${
              soundLinkState.roomId
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50 shadow-[0_0_15px_rgba(16,185,129,0.3)] animate-pulse'
                : 'bg-white/5 hover:bg-white/10 text-slate-200 border-white/10 hover:border-cyan-500/40'
            }`}
            title="LINAX SoundLink Multi-Device Speaker Sync"
            aria-label="SoundLink Multi-Device Sync"
          >
            <Wifi className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">
              {soundLinkState.roomId
                ? `${soundLinkState.isHost ? 'Host' : 'Sync'}: ${soundLinkState.roomId} (${soundLinkState.deviceCount}📱)`
                : 'SoundLink Sync'}
            </span>
            <span className="sm:hidden font-mono text-[10px]">
              {soundLinkState.roomId ? `${soundLinkState.deviceCount}📱` : 'Sync'}
            </span>
          </button>

          {/* AI Vibe DJ Button */}
          <button
            onClick={onOpenAiDj}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 text-purple-200 border border-purple-500/30 transition-all shadow-[0_0_15px_rgba(168,85,247,0.2)]"
            title="Gemini AI Vibe Studio & Track Analysis"
            aria-label="AI Vibe Studio"
          >
            <Sparkles className="w-3.5 h-3.5 text-pink-400 animate-spin" style={{ animationDuration: '6s' }} />
            <span className="hidden md:inline font-semibold">AI Vibe Studio</span>
          </button>

          {/* Equalizer Button */}
          <button
            onClick={onOpenEqualizer}
            className="p-2 sm:px-3 sm:py-1.5 rounded-full text-xs font-medium bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 hover:border-cyan-400/40 transition-all flex items-center gap-1.5"
            title="10-Band Equalizer & Bass Boost"
            aria-label="Equalizer"
          >
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span className="hidden lg:inline">Equalizer</span>
          </button>

          {/* Theme Customize Button */}
          <button
            onClick={onOpenTheme}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 hover:border-cyan-400/40 transition-all"
            title="Theme & Glass Customization"
            aria-label="Theme Settings"
          >
            <Palette className="w-4 h-4 text-cyan-300" />
          </button>

          {/* Scan Files Button */}
          <button
            onClick={onScanFiles}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-[0_0_20px_rgba(0,240,255,0.35)] transition-all transform active:scale-95"
            title="Scan Audio Files from Device"
            aria-label="Scan Device Files"
          >
            <FolderPlus className="w-4 h-4 text-slate-950" />
            <span className="hidden sm:inline">Scan Files</span>
          </button>
        </div>
      </div>
    </header>
  );
};
