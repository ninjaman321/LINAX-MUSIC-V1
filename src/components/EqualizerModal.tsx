import React from 'react';
import { X, RotateCcw, Volume2, Sparkles, Waves } from 'lucide-react';
import { EQ_FREQUENCIES, EQ_PRESETS, EQPreset, audioEngine } from '../utils/audioEngine';

interface EqualizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  eqGains: number[];
  onGainChange: (index: number, val: number) => void;
  bassBoost: number;
  onBassBoostChange: (val: number) => void;
  spatial3D: boolean;
  onSpatial3DChange: (enabled: boolean) => void;
  preAmp: number;
  onPreAmpChange: (val: number) => void;
  activePresetId: string;
  onSelectPreset: (preset: EQPreset) => void;
  themeColor: string;
}

export const EqualizerModal: React.FC<EqualizerModalProps> = ({
  isOpen,
  onClose,
  eqGains,
  onGainChange,
  bassBoost,
  onBassBoostChange,
  spatial3D,
  onSpatial3DChange,
  preAmp,
  onPreAmpChange,
  activePresetId,
  onSelectPreset
}) => {
  if (!isOpen) return null;

  const handleReset = () => {
    const flat = EQ_PRESETS.find((p) => p.id === 'flat') || EQ_PRESETS[0];
    onSelectPreset(flat);
    onBassBoostChange(0);
    onPreAmpChange(1.0);
    audioEngine.setPreset(flat);
  };

  const formatFreq = (freq: number) => {
    return freq >= 1000 ? `${freq / 1000}k` : `${freq}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xl animate-fadeIn">
      <div className="relative w-full max-w-2xl rounded-3xl border border-white/15 bg-slate-900/90 backdrop-blur-2xl p-5 sm:p-7 shadow-[0_0_50px_rgba(0,240,255,0.2)] overflow-hidden">
        {/* Glow backdrop decorative accent */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
              <Waves className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold font-['Syne',sans-serif] text-white tracking-wide">
                10-Band Parametric Equalizer
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Lossless 32-bit floating point audio chain
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="px-3 py-1.5 rounded-full text-xs font-mono text-slate-300 bg-white/5 hover:bg-white/10 border border-white/10 transition-all flex items-center gap-1.5"
              title="Reset to Flat"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-all"
              aria-label="Close Equalizer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Preset Chips */}
        <div className="py-4 relative z-10">
          <p className="text-xs font-mono text-slate-400 mb-2 uppercase tracking-wider">Acoustic Presets</p>
          <div className="flex flex-wrap gap-2">
            {EQ_PRESETS.map((preset) => {
              const isSelected = activePresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => onSelectPreset(preset)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold shadow-[0_0_15px_rgba(0,240,255,0.4)] scale-105'
                      : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 hover:border-cyan-400/40'
                  }`}
                >
                  {preset.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* 10-Band Graphical Frequency Sliders */}
        <div className="my-3 p-4 rounded-2xl bg-black/40 border border-white/10 relative z-10">
          <div className="grid grid-cols-10 gap-1.5 sm:gap-2.5 h-48 sm:h-56 items-end pb-2">
            {EQ_FREQUENCIES.map((freq, idx) => {
              const gain = eqGains[idx] || 0;
              const fillPercentage = ((gain + 12) / 24) * 100;

              return (
                <div key={freq} className="flex flex-col items-center h-full justify-between">
                  {/* Gain readout */}
                  <span className="text-[10px] font-mono text-cyan-300 font-semibold mb-1">
                    {gain > 0 ? `+${gain.toFixed(0)}` : gain.toFixed(0)}
                  </span>

                  {/* Vertical Slider Track */}
                  <div className="relative w-full flex-1 flex items-center justify-center">
                    <input
                      type="range"
                      min="-12"
                      max="12"
                      step="0.5"
                      value={gain}
                      onChange={(e) => onGainChange(idx, parseFloat(e.target.value))}
                      className="w-32 sm:w-40 -rotate-90 absolute cursor-pointer accent-cyan-400"
                      aria-label={`Gain for ${formatFreq(freq)} Hz`}
                    />
                  </div>

                  {/* Frequency label */}
                  <span className="text-[10px] sm:text-[11px] font-mono text-slate-400 mt-1">
                    {formatFreq(freq)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sound Enhancement Sliders: Bass Boost, 3D Spatial Audio, Pre-Amp */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 relative z-10">
          {/* Bass Boost */}
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-mono mb-2">
              <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                Bass Booster
              </span>
              <span className="text-cyan-300 font-bold">{bassBoost}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={bassBoost}
              onChange={(e) => onBassBoostChange(parseInt(e.target.value, 10))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          {/* 3D Spatial Holographic Surround */}
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-mono mb-2">
              <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                3D Spatial Sound
              </span>
              <span className={spatial3D ? 'text-purple-300 font-bold' : 'text-slate-500'}>
                {spatial3D ? 'ACTIVE' : 'OFF'}
              </span>
            </div>
            <button
              onClick={() => onSpatial3DChange(!spatial3D)}
              className={`w-full py-1.5 rounded-xl text-xs font-semibold font-mono transition-all border ${
                spatial3D
                  ? 'bg-purple-500/20 border-purple-400/50 text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                  : 'bg-white/5 border-white/10 text-slate-400'
              }`}
            >
              {spatial3D ? '3D Hologram Enabled' : 'Enable 3D Surround'}
            </button>
          </div>

          {/* Pre-Amp Gain */}
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-mono mb-2">
              <span className="text-slate-300 font-semibold">Pre-Amp Master</span>
              <span className="text-cyan-300 font-bold">{preAmp.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={preAmp}
              onChange={(e) => onPreAmpChange(parseFloat(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
