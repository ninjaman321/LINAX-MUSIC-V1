import test from 'node:test';
import assert from 'node:assert/strict';
import {
  reorderSongs,
  getNextTrackIndex,
  getPreviousTrackIndex,
  generateShuffledIndices,
  generateRoomCode,
  formatTime,
  formatFileSize
} from './playlistRules.ts';

test('reorderSongs moves item correctly', () => {
  const songs = ['songA', 'songB', 'songC', 'songD'];
  const reordered = reorderSongs(songs, 0, 2);
  assert.deepEqual(reordered, ['songB', 'songC', 'songA', 'songD']);

  const movedUp = reorderSongs(reordered, 3, 1);
  assert.deepEqual(movedUp, ['songB', 'songD', 'songC', 'songA']);
});

test('reorderSongs handles out of bounds gracefully', () => {
  const songs = ['a', 'b'];
  const res = reorderSongs(songs, -1, 5);
  assert.deepEqual(res, ['a', 'b']);
});

test('getNextTrackIndex handles repeat modes and end of queue', () => {
  // normal progression
  assert.equal(getNextTrackIndex(0, 3, 'off'), 1);
  assert.equal(getNextTrackIndex(1, 3, 'off'), 2);
  assert.equal(getNextTrackIndex(2, 3, 'off'), -1);

  // repeat all
  assert.equal(getNextTrackIndex(2, 3, 'all'), 0);

  // repeat one
  assert.equal(getNextTrackIndex(1, 3, 'one'), 1);
});

test('getPreviousTrackIndex handles queue boundaries', () => {
  assert.equal(getPreviousTrackIndex(2, 3, 'off'), 1);
  assert.equal(getPreviousTrackIndex(0, 3, 'off'), 0);
  assert.equal(getPreviousTrackIndex(0, 3, 'all'), 2);
  assert.equal(getPreviousTrackIndex(1, 3, 'one'), 1);
});

test('generateShuffledIndices preserves all unique elements and places current first', () => {
  const shuffled = generateShuffledIndices(5, 3);
  assert.equal(shuffled.length, 5);
  assert.equal(shuffled[0], 3);
  const set = new Set(shuffled);
  assert.equal(set.size, 5);
});

test('generateRoomCode produces valid LX- prefixed code', () => {
  const code = generateRoomCode();
  assert.match(code, /^LX-[A-Z0-9]{5}$/);
});

test('formatTime formats seconds properly', () => {
  assert.equal(formatTime(0), '0:00');
  assert.equal(formatTime(65), '1:05');
  assert.equal(formatTime(3665), '1:01:05');
});

test('formatFileSize formats megabytes correctly', () => {
  assert.equal(formatFileSize(1024 * 1024 * 5.2), '5.2 MB');
  assert.equal(formatFileSize(0), '0 MB');
});
