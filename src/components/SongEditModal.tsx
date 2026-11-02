import React, { useState } from 'react';
import { X, Image as ImageIcon, Upload, Check, Music } from 'lucide-react';
import { SongItem } from '../utils/playlistRules';
import { PRESET_COVERS } from '../utils/defaultTracks';

interface SongEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  song: SongItem | null;
  onSave: (id: string, updates: Partial<SongItem>, customCoverBlob?: Blob) => void;
}

export const SongEditModal: React.FC<SongEditModalProps> = ({
  isOpen,
  onClose,
  song,
  onSave
}) => {
  if (!isOpen || !song) return null;

  const [title, setTitle] = useState(song.title);
  const [artist, setArtist] = useState(song.artist);
  const [album, setAlbum] = useState(song.album || '');
  const [previewCover, setPreviewCover] = useState(song.coverUrl || '');
  const [coverBlob, setCoverBlob] = useState<Blob | undefined>();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverBlob(file);
      const url = URL.createObjectURL(file);
      setPreviewCover(url);
    }
  };

  const handleSelectPreset = async (svgDataUrl: string) => {
    setPreviewCover(svgDataUrl);
    try {
      const res = await fetch(svgDataUrl);
      const blob = await res.blob();
      setCoverBlob(blob);
    } catch {
      // fallback
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(
      song.id,
      {
        title: title.trim() || song.title,
        artist: artist.trim() || song.artist,
        album: album.trim() || undefined,
        coverUrl: previewCover
      },
      coverBlob
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xl animate-fadeIn">
      <div className="relative w-full max-w-md rounded-3xl border border-white/15 bg-slate-900/95 backdrop-blur-2xl p-5 sm:p-6 shadow-[0_0_50px_rgba(0,240,255,0.2)] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
              <Music className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-['Syne',sans-serif] text-white">
                Customize Track & Artwork
              </h2>
              <p className="text-[11px] text-slate-400 font-mono">
                Update audio tags and cover picture
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

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Cover Art Preview & Upload */}
          <div className="flex items-center gap-4">
            <div className="relative group w-24 h-24 rounded-2xl overflow-hidden border border-cyan-500/30 bg-black/50 shrink-0 shadow-lg">
              {previewCover ? (
                <img
                  src={previewCover}
                  alt="Track Cover Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-500">
                  <ImageIcon className="w-8 h-8" />
                </div>
              )}
              <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-opacity text-cyan-300 text-[10px] font-mono">
                <Upload className="w-5 h-5 mb-1" />
                <span>Change</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div className="flex-1 space-y-1.5">
              <span className="text-[11px] font-mono text-slate-300 block">Choose Artwork:</span>
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/30 text-xs font-mono cursor-pointer transition-all">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>

              <div className="flex items-center gap-2 pt-1">
                {PRESET_COVERS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className="w-8 h-8 rounded-lg overflow-hidden border border-white/20 hover:border-cyan-400 transition-all shrink-0 hover:scale-105"
                  >
                    <img src={preset} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Title Input */}
          <div>
            <label className="text-xs font-mono text-slate-300 block mb-1">Track Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/15 text-white text-xs font-mono focus:border-cyan-400 focus:outline-none"
            />
          </div>

          {/* Artist Input */}
          <div>
            <label className="text-xs font-mono text-slate-300 block mb-1">Artist Name</label>
            <input
              type="text"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              required
              className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/15 text-white text-xs font-mono focus:border-cyan-400 focus:outline-none"
            />
          </div>

          {/* Album Input */}
          <div>
            <label className="text-xs font-mono text-slate-300 block mb-1">Album (Optional)</label>
            <input
              type="text"
              value={album}
              onChange={(e) => setAlbum(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/15 text-white text-xs font-mono focus:border-cyan-400 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-mono text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold font-mono text-xs shadow-[0_0_15px_rgba(0,240,255,0.4)] flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
