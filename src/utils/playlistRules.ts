export interface SongItem {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration: number; // in seconds
  coverUrl?: string;
  url?: string;
  blob?: Blob;
  fileSize?: number;
  addedAt: number;
  favorite?: boolean;
}

export type RepeatMode = 'off' | 'all' | 'one';

/**
 * Reorders a list of songs moving an item from startIndex to endIndex
 */
export function reorderSongs<T>(list: T[], startIndex: number, endIndex: number): T[] {
  if (startIndex < 0 || startIndex >= list.length || endIndex < 0 || endIndex >= list.length) {
    return [...list];
  }
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
}

/**
 * Calculates the next track index taking into account repeat and shuffle
 */
export function getNextTrackIndex(
  currentIndex: number,
  totalTracks: number,
  repeatMode: RepeatMode = 'off',
  shuffle = false,
  shuffledIndices: number[] = []
): number {
  if (totalTracks <= 0) return -1;
  if (totalTracks === 1) return 0;

  if (repeatMode === 'one') {
    return currentIndex;
  }

  if (shuffle && shuffledIndices.length === totalTracks) {
    const posInShuffled = shuffledIndices.indexOf(currentIndex);
    if (posInShuffled !== -1 && posInShuffled < shuffledIndices.length - 1) {
      return shuffledIndices[posInShuffled + 1];
    }
    return repeatMode === 'all' ? shuffledIndices[0] : -1;
  }

  if (currentIndex < totalTracks - 1) {
    return currentIndex + 1;
  } else if (repeatMode === 'all') {
    return 0;
  }
  return -1; // reached end without repeat
}

/**
 * Calculates previous track index
 */
export function getPreviousTrackIndex(
  currentIndex: number,
  totalTracks: number,
  repeatMode: RepeatMode = 'off',
  shuffle = false,
  shuffledIndices: number[] = []
): number {
  if (totalTracks <= 0) return -1;
  if (totalTracks === 1) return 0;

  if (repeatMode === 'one') {
    return currentIndex;
  }

  if (shuffle && shuffledIndices.length === totalTracks) {
    const posInShuffled = shuffledIndices.indexOf(currentIndex);
    if (posInShuffled > 0) {
      return shuffledIndices[posInShuffled - 1];
    }
    return shuffledIndices[shuffledIndices.length - 1];
  }

  if (currentIndex > 0) {
    return currentIndex - 1;
  } else if (repeatMode === 'all') {
    return totalTracks - 1;
  }
  return 0;
}

/**
 * Generates a clean random permutation of indices
 */
export function generateShuffledIndices(count: number, currentFirstIndex = -1): number[] {
  const indices = Array.from({ length: count }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  if (currentFirstIndex >= 0 && indices.includes(currentFirstIndex)) {
    const idx = indices.indexOf(currentFirstIndex);
    indices.splice(idx, 1);
    indices.unshift(currentFirstIndex);
  }
  return indices;
}

/**
 * Generates a stylish 5-character alphanumeric room code for SoundLink
 */
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `LX-${code}`;
}

/**
 * Formats time in seconds to mm:ss or hh:mm:ss
 */
export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const totalSecs = Math.floor(seconds);
  const hrs = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;

  const paddedSecs = secs.toString().padStart(2, '0');
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${paddedSecs}`;
  }
  return `${mins}:${paddedSecs}`;
}

/**
 * Formats file size in bytes to human-readable string
 */
export function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return '0 MB';
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}
