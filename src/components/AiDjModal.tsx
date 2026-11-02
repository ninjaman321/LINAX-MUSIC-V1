import React, { useState } from 'react';
import { X, Sparkles, Volume2, Check, Zap, Play } from 'lucide-react';
import { EQ_PRESETS, EQPreset, audioEngine } from '../utils/audioEngine';

interface AiDjModalProps {
  isOpen: boolean;
  onClose: () => void;
  trackTitle: string;
  trackArtist: string;
  onApplyThemeColor: (color: string) => void;
  onApplyEqPreset: (preset: EQPreset) => void;
  onApplyVisualizer: (mode: 'wave' | 'ring' | 'bars' | 'vortex') => void;
}

interface AiDjResult {
  djIntro: string;
  moodTag: string;
  colorHex: string;
  recommendedEq: string;
  recommendedVisualizer: 'wave' | 'ring' | 'bars' | 'vortex';
  acousticSummary: string;
}

export const AiDjModal: React.FC<AiDjModalProps> = ({
  isOpen,
  onClose,
  trackTitle,
  trackArtist,
  onApplyThemeColor,
  onApplyEqPreset,
  onApplyVisualizer
}) => {
  const [moodPrompt, setMoodPrompt] = useState('Cyberpunk High Fidelity Vibe');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AiDjResult | null>(null);
  const [speaking, setSpeaking] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async (presetPrompt?: string) => {
    const promptToSend = presetPrompt || moodPrompt;
    setLoading(true);

    try {
      const res = await fetch('/api/gemini/vibe-dj', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: trackTitle,
          artist: trackArtist,
          moodPrompt: promptToSend
        })
      });

      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.warn('AI DJ error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyAll = () => {
    if (!result) return;
    if (result.recommendedEq) {
      const eqPreset = EQ_PRESETS.find((p) => p.id === result.recommendedEq) || EQ_PRESETS[1];
      onApplyEqPreset(eqPreset);
      audioEngine.setPreset(eqPreset);
    }
    if (result.recommendedVisualizer) {
      onApplyVisualizer(result.recommendedVisualizer);
    }
    // Map hex to closest theme if possible
    if (result.colorHex) {
      const hex = result.colorHex.toLowerCase();
      if (hex.includes('00f0ff') || hex.includes('cyan') || hex.includes('0284c7')) {
        onApplyThemeColor('cyan');
      } else if (hex.includes('purple') || hex.includes('violet') || hex.includes('c084fc') || hex.includes('a855f7')) {
        onApplyThemeColor('purple');
      } else if (hex.includes('10b981') || hex.includes('emerald') || hex.includes('green')) {
        onApplyThemeColor('emerald');
      } else if (hex.includes('f43f5e') || hex.includes('red') || hex.includes('rose') || hex.includes('pink')) {
        onApplyThemeColor('crimson');
      } else if (hex.includes('fbbf24') || hex.includes('gold') || hex.includes('amber')) {
        onApplyThemeColor('solar');
      } else {
        onApplyThemeColor('aurora');
      }
    }
    onClose();
  };

  const handleSpeakDj = () => {
    if (!result?.djIntro || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(result.djIntro);
    utterance.pitch = 0.95;
    utterance.rate = 1.05;
    setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xl animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-3xl border border-purple-500/30 bg-slate-900/95 backdrop-blur-2xl p-5 sm:p-7 shadow-[0_0_60px_rgba(168,85,247,0.25)] overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute -top-24 -right-24 w-52 h-52 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-52 h-52 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500/30 to-pink-500/30 border border-purple-400/40 flex items-center justify-center text-pink-300 shadow-[0_0_15px_rgba(236,72,153,0.3)]">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold font-['Syne',sans-serif] text-white">
                  LINAX AI Vibe Studio
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Gemini 3.8
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Real-time acoustic analysis & holographic DJ intelligence
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-all"
            aria-label="Close AI Vibe Studio"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Target track display */}
        <div className="my-4 p-3 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between text-xs font-mono relative z-10">
          <div className="truncate mr-2">
            <span className="text-slate-400 block text-[10px] uppercase">Active Track</span>
            <span className="font-bold text-white truncate block">{trackTitle || 'Current Track'}</span>
            <span className="text-slate-400 text-[11px] truncate block">{trackArtist}</span>
          </div>
          <button
            onClick={() => handleGenerate()}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white font-bold font-mono text-xs shadow-[0_0_15px_rgba(168,85,247,0.4)] disabled:opacity-50 transition-all shrink-0 flex items-center gap-1.5"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>{loading ? 'Analyzing...' : 'Analyze Track'}</span>
          </button>
        </div>

        {/* Quick Vibe Mood Chips */}
        <div className="mb-4 relative z-10">
          <span className="text-[10px] font-mono text-slate-400 block mb-2 uppercase tracking-wider">
            Quick Atmosphere Vibes
          </span>
          <div className="flex flex-wrap gap-1.5">
            {[
              'Cyberpunk Bass Rush',
              'Midnight City Drive',
              'Chill Lo-Fi Coffee',
              'Euphoric Festival Drop',
              'Deep Focus Hologram'
            ].map((vibe) => (
              <button
                key={vibe}
                onClick={() => {
                  setMoodPrompt(vibe);
                  handleGenerate(vibe);
                }}
                className="px-2.5 py-1 rounded-lg text-xs font-mono bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 hover:border-purple-400/40 transition-all"
              >
                {vibe}
              </button>
            ))}
          </div>
        </div>

        {/* Analysis Results */}
        {result && (
          <div className="space-y-3 relative z-10 animate-fadeIn">
            {/* DJ Intro Speech */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-purple-900/40 to-slate-900/60 border border-purple-500/30">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono text-pink-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5" />
                  Holographic DJ Commentary
                </span>
                <button
                  onClick={handleSpeakDj}
                  className="px-2 py-0.5 rounded-md bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 border border-pink-400/40 text-[10px] font-mono flex items-center gap-1 transition-all"
                >
                  <Play className="w-2.5 h-2.5 fill-current" />
                  <span>{speaking ? 'Speaking...' : 'Play Voice'}</span>
                </button>
              </div>
              <p className="text-xs text-slate-200 italic leading-relaxed">
                "{result.djIntro}"
              </p>
            </div>

            {/* Mood Tag & Acoustic Breakdown */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2.5 rounded-xl bg-black/40 border border-white/10">
                <span className="text-[10px] text-slate-400 block uppercase">Aesthetic Mood</span>
                <span className="font-bold text-cyan-300 uppercase">{result.moodTag}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-black/40 border border-white/10">
                <span className="text-[10px] text-slate-400 block uppercase">Recommended EQ</span>
                <span className="font-bold text-purple-300 uppercase">{result.recommendedEq} mode</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-300 font-mono leading-normal bg-white/5 p-2.5 rounded-xl border border-white/10">
              {result.acousticSummary}
            </p>

            <button
              onClick={handleApplyAll}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white font-bold font-mono text-xs tracking-wider shadow-[0_0_20px_rgba(168,85,247,0.35)] transition-all flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Apply AI Acoustic Calibration & Theme</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
