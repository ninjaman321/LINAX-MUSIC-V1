import React, { useState } from 'react';
import {
  X,
  Wifi,
  Share2,
  Copy,
  Check,
  Smartphone,
  Radio,
  Volume2,
  Users,
  Info,
  QrCode
} from 'lucide-react';
import { SoundLinkState, soundLinkClient } from '../utils/partyClient';
import { generateRoomCode } from '../utils/playlistRules';

interface SoundLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  soundLinkState: SoundLinkState;
  currentTrackTitle?: string;
}

export const SoundLinkModal: React.FC<SoundLinkModalProps> = ({
  isOpen,
  onClose,
  soundLinkState,
  currentTrackTitle
}) => {
  const [activeTab, setActiveTab] = useState<'host' | 'join'>('host');
  const [joinCode, setJoinCode] = useState('');
  const [deviceName, setDeviceName] = useState(() => {
    return /iPhone|iPad|iPod/.test(navigator.userAgent)
      ? 'iPhone Speaker'
      : /Android/.test(navigator.userAgent)
      ? 'Android Speaker'
      : 'Device Speaker';
  });
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  if (!isOpen) return null;

  const handleCreateHost = async () => {
    const code = generateRoomCode();
    await soundLinkClient.createRoom(code);
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) return;
    await soundLinkClient.joinRoom(joinCode.trim().toUpperCase(), deviceName);
  };

  const handleLeave = () => {
    soundLinkClient.leave();
  };

  const handleCopyLink = () => {
    if (!soundLinkState.roomId) return;
    const shareUrl = `${window.location.origin}?party=${soundLinkState.roomId}`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Generate dynamic SVG QR code for the room link
  const renderQrSvg = (code: string) => {
    return (
      <svg className="w-36 h-36 bg-white p-2 rounded-xl mx-auto shadow-lg" viewBox="0 0 100 100">
        <rect x="5" y="5" width="25" height="25" fill="#000" />
        <rect x="8" y="8" width="19" height="19" fill="#fff" />
        <rect x="11" y="11" width="13" height="13" fill="#000" />

        <rect x="70" y="5" width="25" height="25" fill="#000" />
        <rect x="73" y="8" width="19" height="19" fill="#fff" />
        <rect x="76" y="11" width="13" height="13" fill="#000" />

        <rect x="5" y="70" width="25" height="25" fill="#000" />
        <rect x="8" y="73" width="19" height="19" fill="#fff" />
        <rect x="11" y="76" width="13" height="13" fill="#000" />

        {/* Pseudo matrix blocks representing room code */}
        {code.split('').map((char, idx) => (
          <rect
            key={idx}
            x={35 + (idx % 4) * 8}
            y={35 + Math.floor(idx / 4) * 8}
            width="6"
            height="6"
            fill="#000"
          />
        ))}
        <rect x="42" y="15" width="6" height="18" fill="#000" />
        <rect x="52" y="20" width="8" height="6" fill="#000" />
        <rect x="15" y="45" width="12" height="6" fill="#000" />
        <rect x="72" y="48" width="16" height="8" fill="#000" />
        <rect x="45" y="72" width="18" height="12" fill="#000" />
      </svg>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xl animate-fadeIn">
      <div className="relative w-full max-w-xl rounded-3xl border border-cyan-400/25 bg-slate-900/95 backdrop-blur-2xl p-5 sm:p-7 shadow-[0_0_60px_rgba(0,240,255,0.25)] overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute -top-20 -right-20 w-52 h-52 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-52 h-52 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.3)]">
              <Wifi className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold font-['Syne',sans-serif] text-white">
                  LINAX SoundLink Party Cast
                </h2>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  LIVE SYNC
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Multi-Phone Synchronized Speaker Broadcast
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-all"
            aria-label="Close SoundLink Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Connected Banner if in active room */}
        {soundLinkState.roomId ? (
          <div className="my-5 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-400/30 relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <span className="font-mono font-bold text-sm text-emerald-300">
                  {soundLinkState.isHost ? 'HOSTING BROADCAST' : 'LISTENER SYNCHRONIZED'}
                </span>
              </div>

              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-xs font-mono text-emerald-200">
                <Users className="w-3.5 h-3.5" />
                <span>{soundLinkState.deviceCount} Devices Connected</span>
              </div>
            </div>

            <div className="flex items-center justify-between bg-black/40 p-3 rounded-xl border border-white/10 font-mono mb-3">
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-widest block">Room Code</span>
                <span className="text-xl font-black text-cyan-300 tracking-widest">{soundLinkState.roomId}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowQr(!showQr)}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 transition-all text-xs flex items-center gap-1"
                  title="Toggle QR Code"
                >
                  <QrCode className="w-4 h-4 text-cyan-300" />
                  <span className="text-xs font-mono">QR</span>
                </button>
                <button
                  onClick={handleCopyLink}
                  className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/40 transition-all text-xs flex items-center gap-1.5"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied' : 'Share Link'}</span>
                </button>
              </div>
            </div>

            {showQr && (
              <div className="p-4 bg-black/60 rounded-xl border border-cyan-500/30 text-center mb-3">
                <p className="text-xs text-slate-300 font-mono mb-2">Scan with other phones to join immediately</p>
                {renderQrSvg(soundLinkState.roomId)}
              </div>
            )}

            <div className="text-xs font-mono text-slate-300 mb-3 flex items-center gap-2">
              <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span>Streaming Track: <strong className="text-white">{currentTrackTitle || 'Syncing...'}</strong></span>
            </div>

            <button
              onClick={handleLeave}
              className="w-full py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-mono text-xs font-bold transition-all"
            >
              {soundLinkState.isHost ? 'End Host Party Broadcast' : 'Leave Party Sync'}
            </button>
          </div>
        ) : (
          /* Host or Join Tabs */
          <div className="my-5 relative z-10">
            <div className="flex rounded-xl bg-black/40 p-1 border border-white/10 mb-4">
              <button
                onClick={() => setActiveTab('host')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold font-mono transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'host'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Radio className="w-4 h-4" />
                <span>Host Party (This Phone)</span>
              </button>
              <button
                onClick={() => setActiveTab('join')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold font-mono transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'join'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>Join Party (As Speaker)</span>
              </button>
            </div>

            {activeTab === 'host' ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <h3 className="text-sm font-bold text-white mb-1.5 flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-cyan-400" />
                    How Host Mode Works:
                  </h3>
                  <ul className="text-xs text-slate-300 font-mono space-y-1.5 leading-relaxed">
                    <li>• Your phone becomes the Master Host with your song library.</li>
                    <li>• Any number of friends' phones can connect via Wi-Fi, Mobile Hotspot, or Internet.</li>
                    <li>• When you play, pause, or seek, <strong>all connected phones play the exact same song synchronously through their phone speakers!</strong></li>
                    <li>• Listeners don't need the song file; your host device automatically streams the high-quality audio to them.</li>
                  </ul>
                </div>

                <button
                  onClick={handleCreateHost}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-400 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold font-['Syne',sans-serif] tracking-wider text-sm shadow-[0_0_25px_rgba(0,240,255,0.4)] transition-all transform active:scale-98"
                >
                  START HOST BROADCAST
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                  <div>
                    <label className="text-xs font-mono text-slate-300 mb-1 block">
                      Enter 5-Character Room Code:
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. LX-78921"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-white/20 text-white font-mono text-lg tracking-widest uppercase focus:border-emerald-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-mono text-slate-300 mb-1 block">
                      Device / Speaker Label:
                    </label>
                    <input
                      type="text"
                      placeholder="Living Room Speaker"
                      value={deviceName}
                      onChange={(e) => setDeviceName(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl bg-black/60 border border-white/20 text-white text-xs font-mono focus:border-emerald-400 focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  onClick={handleJoin}
                  disabled={!joinCode.trim()}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 disabled:opacity-50 text-slate-950 font-bold font-['Syne',sans-serif] tracking-wider text-sm shadow-[0_0_25px_rgba(16,185,129,0.4)] transition-all transform active:scale-98"
                >
                  CONNECT SPEAKER TO HOST
                </button>
              </div>
            )}
          </div>
        )}

        {/* Network & Hotspot Tip */}
        <div className="pt-2 border-t border-white/10 flex items-start gap-2 text-[11px] text-slate-400 font-mono relative z-10">
          <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <span>
            Works best on shared Wi-Fi or when host turns on Mobile Hotspot for friends. Can also connect across the internet!
          </span>
        </div>
      </div>
    </div>
  );
};
