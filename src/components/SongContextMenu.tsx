import React, { useRef, useEffect } from 'react';
import {
  Play,
  ListPlus,
  Radio,
  Sparkles,
  Edit3,
  Trash2,
  FolderPlus,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { SongItem } from '../utils/playlistRules';
import { PlaylistRecord } from '../utils/db';

interface SongContextMenuProps {
  isOpen: boolean;
  onClose: () => void;
  position: { x: number; y: number } | null;
  song: SongItem | null;
  index: number;
  totalSongs: number;
  playlists: PlaylistRecord[];
  onPlayNow: (song: SongItem) => void;
  onPlayNext: (song: SongItem) => void;
  onAddToQueue: (song: SongItem) => void;
  onAddToPlaylist: (playlistId: string, songId: string) => void;
  onOpenEdit: (song: SongItem) => void;
  onOpenAiDj: (song: SongItem) => void;
  onBroadcastSoundLink: (song: SongItem) => void;
  onDeleteSong: (id: string) => void;
  onMoveUp?: (index: number) => void;
  onMoveDown?: (index: number) => void;
}

export const SongContextMenu: React.FC<SongContextMenuProps> = ({
  isOpen,
  onClose,
  position,
  song,
  index,
  totalSongs,
  playlists,
  onPlayNow,
  onPlayNext,
  onAddToQueue,
  onAddToPlaylist,
  onOpenEdit,
  onOpenAiDj,
  onBroadcastSoundLink,
  onDeleteSong,
  onMoveUp,
  onMoveDown
}) => {
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !song) return null;

  // Position calculation with viewport boundaries
  const style: React.CSSProperties = {};
  if (position) {
    const menuWidth = 240;
    const menuHeight = 360;
    const x = Math.min(position.x, window.innerWidth - menuWidth - 10);
    const y = Math.min(position.y, window.innerHeight - menuHeight - 10);
    style.left = `${Math.max(10, x)}px`;
    style.top = `${Math.max(10, y)}px`;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 sm:bg-transparent" onClick={onClose}>
      <div
        ref={menuRef}
        style={style}
        onClick={(e) => e.stopPropagation()}
        className="fixed bottom-4 left-4 right-4 sm:bottom-auto sm:left-auto sm:right-auto sm:w-64 rounded-2xl border border-white/20 bg-slate-900/95 backdrop-blur-2xl p-2 shadow-[0_10px_40px_rgba(0,0,0,0.8)] z-50 animate-scaleUp text-xs font-mono"
      >
        <div className="px-3 py-2 border-b border-white/10 mb-1">
          <p className="font-bold text-white truncate">{song.title}</p>
          <p className="text-[10px] text-slate-400 truncate">{song.artist}</p>
        </div>

        <div className="space-y-0.5">
          <button
            onClick={() => {
              onPlayNow(song);
              onClose();
            }}
            className="w-full px-3 py-2 rounded-xl text-left hover:bg-cyan-500/20 hover:text-cyan-300 text-slate-200 flex items-center gap-2.5 transition-colors"
          >
            <Play className="w-4 h-4 text-cyan-400" />
            <span>Play Now</span>
          </button>

          <button
            onClick={() => {
              onPlayNext(song);
              onClose();
            }}
            className="w-full px-3 py-2 rounded-xl text-left hover:bg-white/10 text-slate-200 flex items-center gap-2.5 transition-colors"
          >
            <ListPlus className="w-4 h-4 text-sky-400" />
            <span>Play Next</span>
          </button>

          <button
            onClick={() => {
              onAddToQueue(song);
              onClose();
            }}
            className="w-full px-3 py-2 rounded-xl text-left hover:bg-white/10 text-slate-200 flex items-center gap-2.5 transition-colors"
          >
            <ListPlus className="w-4 h-4 text-indigo-400" />
            <span>Add to Queue</span>
          </button>

          {/* Move Up / Down Row Serial Order */}
          <div className="grid grid-cols-2 gap-1 py-1 px-1">
            <button
              onClick={() => {
                if (onMoveUp) onMoveUp(index);
                onClose();
              }}
              disabled={index <= 0}
              className="px-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 text-slate-300 flex items-center justify-center gap-1 text-[11px]"
            >
              <ArrowUp className="w-3.5 h-3.5 text-cyan-400" />
              <span>Move Up</span>
            </button>
            <button
              onClick={() => {
                if (onMoveDown) onMoveDown(index);
                onClose();
              }}
              disabled={index >= totalSongs - 1}
              className="px-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 text-slate-300 flex items-center justify-center gap-1 text-[11px]"
            >
              <ArrowDown className="w-3.5 h-3.5 text-cyan-400" />
              <span>Move Down</span>
            </button>
          </div>

          {/* Add to Playlist sub-options */}
          {playlists.length > 0 && (
            <div className="py-1 border-t border-white/10">
              <span className="px-3 text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                Add to Playlist:
              </span>
              <div className="max-h-24 overflow-y-auto space-y-0.5">
                {playlists.map((pl) => (
                  <button
                    key={pl.id}
                    onClick={() => {
                      onAddToPlaylist(pl.id, song.id);
                      onClose();
                    }}
                    className="w-full px-3 py-1.5 rounded-lg text-left text-[11px] text-slate-300 hover:bg-white/10 flex items-center gap-2"
                  >
                    <FolderPlus className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate">{pl.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="pt-1 border-t border-white/10">
            <button
              onClick={() => {
                onOpenEdit(song);
                onClose();
              }}
              className="w-full px-3 py-2 rounded-xl text-left hover:bg-white/10 text-slate-200 flex items-center gap-2.5 transition-colors"
            >
              <Edit3 className="w-4 h-4 text-amber-400" />
              <span>Customize Picture & Tags</span>
            </button>

            <button
              onClick={() => {
                onOpenAiDj(song);
                onClose();
              }}
              className="w-full px-3 py-2 rounded-xl text-left hover:bg-purple-500/20 text-purple-300 flex items-center gap-2.5 transition-colors"
            >
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>AI Vibe Studio (Gemini)</span>
            </button>

            <button
              onClick={() => {
                onBroadcastSoundLink(song);
                onClose();
              }}
              className="w-full px-3 py-2 rounded-xl text-left hover:bg-emerald-500/20 text-emerald-300 flex items-center gap-2.5 transition-colors"
            >
              <Radio className="w-4 h-4 text-emerald-400" />
              <span>Broadcast to SoundLink</span>
            </button>

            <button
              onClick={() => {
                onDeleteSong(song.id);
                onClose();
              }}
              className="w-full px-3 py-2 rounded-xl text-left hover:bg-rose-500/20 text-rose-300 flex items-center gap-2.5 transition-colors"
            >
              <Trash2 className="w-4 h-4 text-rose-400" />
              <span>Delete from Library</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
