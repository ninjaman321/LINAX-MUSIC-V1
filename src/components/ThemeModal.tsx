import React from 'react';
import { X, Palette, Sparkles, Sliders, Eye } from 'lucide-react';

interface ThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  themeColor: string;
  onThemeColorChange: (color: string) => void;
  visualizerMode: 'wave' | 'ring' | 'bars' | 'vortex';
  onVisualizerModeChange: (mode: 'wave' | 'ring' | 'bars' | 'vortex') => void;
  glassBlur: number;
  onGlassBlurChange: (blur: number) => void;
  glowIntensity: number;
  onGlowIntensityChange: (glow: number) => void;
}

const THEME_OPTIONS = [
  { id: 'cyan', name: 'Cyber Cyan', color: '#00f0ff', border: 'border-cyan-400' },
  { id: 'purple', name: 'Neon Violet', color: '#c084fc', border: 'border-purple-400' },
  { id: 'emerald', name: 'Matrix Emerald', color: '#10b981', border: 'border-emerald-400' },
  { id: 'crimson', name: 'Liquid Crimson', color: '#f43f5e', border: 'border-rose-400' },
  { id: 'solar', name: 'Solar Flare', color: '#fbbf24', border: 'border-amber-400' },
  { id: 'aurora', name: 'Deep Aurora', color: '#2dd4bf', border: 'border-teal-400' }
];

const VISUALIZER_MODES = [
  { id: 'wave', name: 'Liquid Wave', desc: 'Silky luminous waveform flow' },
  { id: 'ring', name: '3D Hologram Ring', desc: 'Pulsing circular cyber radar' },
  { id: 'bars', name: 'Spectrum Bars', desc: 'Precision frequency equalizer meters' },
  { id: 'vortex', name: 'Starfield Vortex', desc: 'Floating cosmic particles reacting to bass' }
] as const;

export const ThemeModal: React.FC<ThemeModalProps> = ({
  isOpen,
  onClose,
  themeColor,
  onThemeColorChange,
  visualizerMode,
  onVisualizerModeChange,
  glassBlur,
  onGlassBlurChange,
  glowIntensity,
  onGlowIntensityChange
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xl animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-3xl border border-white/15 bg-slate-900/95 backdrop-blur-2xl p-5 sm:p-7 shadow-[0_0_50px_rgba(0,240,255,0.2)] overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-300">
              <Palette className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold font-['Syne',sans-serif] text-white">
                Futuristic Theme & Glass Customizer
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Liquid glassmorphism aesthetic styling
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-all"
            aria-label="Close Theme Settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Color Palette Selector */}
        <div className="py-4 relative z-10">
          <label className="text-xs font-mono text-slate-300 block mb-2 uppercase tracking-wider">
            Neon Accent Palette
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            {THEME_OPTIONS.map((theme) => {
              const active = themeColor === theme.id;
              return (
                <button
                  key={theme.id}
                  onClick={() => onThemeColorChange(theme.id)}
                  className={`flex items-center gap-2.5 p-2.5 rounded-2xl border transition-all ${
                    active
                      ? `bg-white/15 ${theme.border} shadow-[0_0_20px_${theme.color}40] scale-102`
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <span
                    className="w-5 h-5 rounded-full shadow-md shrink-0 border border-white/40"
                    style={{ backgroundColor: theme.color }}
                  />
                  <span className="text-xs font-medium text-slate-200 truncate">
                    {theme.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Visualizer Mode Selection */}
        <div className="py-2 relative z-10">
          <label className="text-xs font-mono text-slate-300 block mb-2 uppercase tracking-wider flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-cyan-400" />
            Liquid 3D Visualizer Mode
          </label>
          <div className="grid grid-cols-2 gap-2">
            {VISUALIZER_MODES.map((v) => {
              const active = visualizerMode === v.id;
              return (
                <button
                  key={v.id}
                  onClick={() => onVisualizerModeChange(v.id)}
                  className={`p-3 rounded-2xl text-left border transition-all ${
                    active
                      ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-[0_0_15px_rgba(0,240,255,0.3)]'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <div className="text-xs font-bold text-white mb-0.5">{v.name}</div>
                  <div className="text-[10px] text-slate-400 leading-tight">{v.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Liquid Glass Sliders: Blur & Glow */}
        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10 relative z-10">
          {/* Glass Blur */}
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex justify-between items-center text-xs font-mono mb-2">
              <span className="text-slate-300">Frosted Blur</span>
              <span className="text-cyan-300 font-bold">{glassBlur}px</span>
            </div>
            <input
              type="range"
              min="8"
              max="40"
              value={glassBlur}
              onChange={(e) => onGlassBlurChange(parseInt(e.target.value, 10))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          {/* Neon Glow */}
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex justify-between items-center text-xs font-mono mb-2">
              <span className="text-slate-300">Glow Intensity</span>
              <span className="text-purple-300 font-bold">{glowIntensity}%</span>
            </div>
            <input
              type="range"
              min="20"
              max="100"
              value={glowIntensity}
              onChange={(e) => onGlowIntensityChange(parseInt(e.target.value, 10))}
              className="w-full accent-purple-400 cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
