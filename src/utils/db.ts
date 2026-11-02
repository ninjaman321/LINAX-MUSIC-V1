/**
 * IndexedDB storage engine for LINAX Music Player.
 * Persists audio Blobs, cover art, track metadata, playlists, and audio settings offline.
 */

import { SongItem } from './playlistRules';

export interface PlaylistRecord {
  id: string;
  name: string;
  description?: string;
  coverUrl?: string;
  songIds: string[];
  createdAt: number;
  updatedAt: number;
}

export interface UserSettings {
  themeColor: string; // 'cyan' | 'purple' | 'emerald' | 'crimson' | 'solar' | 'aurora'
  glassBlur: number; // 0 to 40
  glowIntensity: number; // 0 to 100
  visualizerMode: 'wave' | 'ring' | 'bars' | 'vortex';
  eqGains: number[]; // 10 bands
  bassBoost: number; // 0 to 100
  spatial3D: boolean;
  preAmpGain: number; // 0 to 2
  volume: number;
  repeatMode: 'off' | 'all' | 'one';
  shuffle: boolean;
}

const DB_NAME = 'linax_music_studio_db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('songs')) {
        db.createObjectStore('songs', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('playlists')) {
        db.createObjectStore('playlists', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return dbPromise;
}

export async function getAllSongsFromDB(): Promise<SongItem[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('songs', 'readonly');
    const store = tx.objectStore('songs');
    const req = store.getAll();

    req.onsuccess = () => {
      const rawSongs = (req.result || []) as (SongItem & { fileBlob?: Blob; customCoverBlob?: Blob })[];
      const songs: SongItem[] = rawSongs.map((s) => {
        let url = s.url;
        if (s.fileBlob) {
          try {
            url = URL.createObjectURL(s.fileBlob);
          } catch {
            // keep existing url
          }
        }
        let coverUrl = s.coverUrl;
        if (s.customCoverBlob) {
          try {
            coverUrl = URL.createObjectURL(s.customCoverBlob);
          } catch {
            // keep existing cover
          }
        }
        return {
          ...s,
          url,
          coverUrl,
          blob: s.fileBlob
        };
      });
      resolve(songs);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function saveSongToDB(song: SongItem, fileBlob?: Blob, customCoverBlob?: Blob): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('songs', 'readwrite');
    const store = tx.objectStore('songs');
    const record = {
      ...song,
      fileBlob: fileBlob || song.blob,
      customCoverBlob
    };
    const req = store.put(record);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function deleteSongFromDB(id: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['songs', 'playlists'], 'readwrite');
    const songStore = tx.objectStore('songs');
    songStore.delete(id);

    // Also remove from all playlists
    const playlistStore = tx.objectStore('playlists');
    const req = playlistStore.getAll();
    req.onsuccess = () => {
      const playlists = (req.result || []) as PlaylistRecord[];
      for (const p of playlists) {
        if (p.songIds.includes(id)) {
          p.songIds = p.songIds.filter((sid) => sid !== id);
          playlistStore.put(p);
        }
      }
    };

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getAllPlaylistsFromDB(): Promise<PlaylistRecord[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('playlists', 'readonly');
    const store = tx.objectStore('playlists');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function savePlaylistToDB(playlist: PlaylistRecord): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('playlists', 'readwrite');
    const store = tx.objectStore('playlists');
    const req = store.put(playlist);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function deletePlaylistFromDB(id: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('playlists', 'readwrite');
    const store = tx.objectStore('playlists');
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getSettingFromDB<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const tx = db.transaction('settings', 'readonly');
      const store = tx.objectStore('settings');
      const req = store.get(key);
      req.onsuccess = () => {
        if (req.result && req.result.value !== undefined) {
          resolve(req.result.value as T);
        } else {
          resolve(defaultValue);
        }
      };
      req.onerror = () => resolve(defaultValue);
    });
  } catch {
    return defaultValue;
  }
}

export async function saveSettingToDB(key: string, value: unknown): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const tx = db.transaction('settings', 'readwrite');
      const store = tx.objectStore('settings');
      store.put({ key, value });
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    // fallback safe
  }
}
