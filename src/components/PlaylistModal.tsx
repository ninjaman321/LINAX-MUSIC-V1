import React, { useState } from 'react';
import { X, Plus, ListMusic, Trash2, Play, Music } from 'lucide-react';
import { PlaylistRecord } from '../utils/db';
import { SongItem } from '../utils/playlistRules';

interface PlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  playlists: PlaylistRecord[];
  allSongs: SongItem[];
  onCreatePlaylist: (name: string, description?: string) => void;
  onDeletePlaylist: (id: string) => void;
  onSelectPlaylist: (playlist: PlaylistRecord) => void;
  selectedPlaylistId: string | null;
}

export const PlaylistModal: React.FC<PlaylistModalProps> = ({
  isOpen,
  onClose,
  playlists,
  allSongs,
  onCreatePlaylist,
  onDeletePlaylist,
  onSelectPlaylist,
  selectedPlaylistId
}) => {
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onCreatePlaylist(newTitle.trim(), newDesc.trim() || undefined);
    setNewTitle('');
    setNewDesc('');
    setIsCreating(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xl animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-3xl border border-white/15 bg-slate-900/95 backdrop-blur-2xl p-5 sm:p-7 shadow-[0_0_50px_rgba(0,240,255,0.2)] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
              <ListMusic className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-['Syne',sans-serif] text-white">
                Personal Playlists
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Organize your custom song collections
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white transition-all"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Create Playlist Form or Trigger */}
        <div className="my-4">
          {isCreating ? (
            <form onSubmit={handleCreate} className="p-3.5 rounded-2xl bg-black/50 border border-cyan-500/30 space-y-3">
              <div className="text-xs font-mono font-bold text-cyan-300">New Playlist</div>
              <input
                type="text"
                placeholder="Playlist Title (e.g., Midnight Vibes)"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                autoFocus
                required
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-white text-xs font-mono focus:border-cyan-400 focus:outline-none"
              />
              <input
                type="text"
                placeholder="Description (Optional)"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-white text-xs font-mono focus:border-cyan-400 focus:outline-none"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-3 py-1.5 rounded-xl text-xs font-mono text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-mono text-xs shadow-md"
                >
                  Create
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setIsCreating(true)}
              className="w-full py-2.5 rounded-2xl border border-dashed border-cyan-400/40 hover:border-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 font-mono text-xs font-bold transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Playlist</span>
            </button>
          )}
        </div>

        {/* Playlists List */}
        <div className="max-h-72 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {playlists.length === 0 ? (
            <div className="py-8 text-center text-xs font-mono text-slate-500">
              No custom playlists created yet. Click above to create your first personal playlist!
            </div>
          ) : (
            playlists.map((pl) => {
              const count = pl.songIds.length;
              const isSelected = selectedPlaylistId === pl.id;

              return (
                <div
                  key={pl.id}
                  className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-cyan-500/20 border-cyan-400/60 shadow-[0_0_15px_rgba(0,240,255,0.2)]'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <button
                    onClick={() => {
                      onSelectPlaylist(pl);
                      onClose();
                    }}
                    className="flex items-center gap-3 text-left flex-1 min-w-0"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/30 to-purple-500/30 border border-white/20 flex items-center justify-center text-cyan-300 shrink-0">
                      <Music className="w-5 h-5" />
                    </div>
                    <div className="truncate">
                      <h3 className="text-xs font-bold text-white font-mono truncate">{pl.name}</h3>
                      <p className="text-[11px] text-slate-400 font-mono truncate">
                        {count} {count === 1 ? 'song' : 'songs'} {pl.description ? `• ${pl.description}` : ''}
                      </p>
                    </div>
                  </button>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => {
                        onSelectPlaylist(pl);
                        onClose();
                      }}
                      className="p-2 rounded-xl bg-white/10 hover:bg-cyan-500 hover:text-slate-950 text-slate-300 transition-all"
                      title="Open Playlist"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                    </button>
                    <button
                      onClick={() => onDeletePlaylist(pl.id)}
                      className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 transition-all"
                      title="Delete Playlist"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
