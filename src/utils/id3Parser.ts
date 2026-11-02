/**
 * Lightweight ID3v2.3 / ID3v2.4 and basic metadata parser for browser audio files.
 * Extracts title, artist, album, genre, and embedded APIC cover art images.
 */

export interface ParsedMetadata {
  title?: string;
  artist?: string;
  album?: string;
  genre?: string;
  year?: string;
  coverUrl?: string;
  duration?: number;
}

export async function parseAudioMetadata(file: File): Promise<ParsedMetadata> {
  const result: ParsedMetadata = {};

  try {
    // Read the first 256KB to find ID3 header and APIC cover art
    const sliceSize = Math.min(file.size, 512 * 1024);
    const buffer = await file.slice(0, sliceSize).arrayBuffer();
    const view = new DataView(buffer);

    // Check for ID3v2 signature: "ID3"
    if (buffer.byteLength >= 10 &&
        view.getUint8(0) === 0x49 && // 'I'
        view.getUint8(1) === 0x44 && // 'D'
        view.getUint8(2) === 0x33) { // '3'
      
      const majorVersion = view.getUint8(3); // 3 for ID3v2.3, 4 for ID3v2.4
      let tagSize = (
        ((view.getUint8(6) & 0x7f) << 21) |
        ((view.getUint8(7) & 0x7f) << 14) |
        ((view.getUint8(8) & 0x7f) << 7) |
        (view.getUint8(9) & 0x7f)
      );

      tagSize = Math.min(tagSize, buffer.byteLength - 10);
      let offset = 10;

      while (offset < tagSize - 10) {
        // Read 4-character Frame ID
        const frameId = String.fromCharCode(
          view.getUint8(offset),
          view.getUint8(offset + 1),
          view.getUint8(offset + 2),
          view.getUint8(offset + 3)
        );

        if (!frameId || frameId[0] < 'A' || frameId[0] > 'Z') {
          break; // padding or end of frames
        }

        let frameSize = 0;
        if (majorVersion === 4) {
          // ID3v2.4 uses syncsafe integer for frame size
          frameSize = (
            ((view.getUint8(offset + 4) & 0x7f) << 21) |
            ((view.getUint8(offset + 5) & 0x7f) << 14) |
            ((view.getUint8(offset + 6) & 0x7f) << 7) |
            (view.getUint8(offset + 7) & 0x7f)
          );
        } else {
          // ID3v2.3 uses regular 32-bit int
          frameSize = view.getUint32(offset + 4, false);
        }

        offset += 10; // skip header
        if (offset + frameSize > buffer.byteLength) {
          break;
        }

        if (frameSize > 0) {
          const frameData = new Uint8Array(buffer, offset, frameSize);

          if (frameId === 'TIT2') {
            result.title = decodeTextFrame(frameData);
          } else if (frameId === 'TPE1') {
            result.artist = decodeTextFrame(frameData);
          } else if (frameId === 'TALB') {
            result.album = decodeTextFrame(frameData);
          } else if (frameId === 'TCON') {
            result.genre = decodeTextFrame(frameData);
          } else if (frameId === 'TYER' || frameId === 'TDRC') {
            result.year = decodeTextFrame(frameData);
          } else if (frameId === 'APIC' && !result.coverUrl) {
            // Attached picture frame
            try {
              const cover = extractApicPicture(frameData);
              if (cover) {
                result.coverUrl = cover;
              }
            } catch (err) {
              console.warn('Could not extract APIC cover', err);
            }
          }
        }

        offset += frameSize;
      }
    }
  } catch (err) {
    console.warn('ID3 parse error:', err);
  }

  // Fallback to filename parsing if title or artist is empty
  const filename = file.name.replace(/\.[^/.]+$/, '');
  if (!result.title) {
    if (filename.includes(' - ')) {
      const parts = filename.split(' - ');
      result.artist = result.artist || parts[0].trim();
      result.title = parts.slice(1).join(' - ').trim();
    } else {
      result.title = filename.replace(/^[0-9]+[.\s_-]+/, '').trim() || filename;
    }
  }
  if (!result.artist) {
    result.artist = 'Unknown Artist';
  }

  return result;
}

function decodeTextFrame(data: Uint8Array): string {
  if (data.length < 2) return '';
  const encoding = data[0];
  const textBytes = data.subarray(1);

  try {
    if (encoding === 0) {
      // ISO-8859-1
      return new TextDecoder('latin1').decode(textBytes).replace(/\0+$/, '').trim();
    } else if (encoding === 1) {
      // UTF-16 with BOM
      return new TextDecoder('utf-16').decode(textBytes).replace(/\0+$/, '').trim();
    } else if (encoding === 2) {
      // UTF-16BE
      return new TextDecoder('utf-16be').decode(textBytes).replace(/\0+$/, '').trim();
    } else {
      // UTF-8
      return new TextDecoder('utf-8').decode(textBytes).replace(/\0+$/, '').trim();
    }
  } catch {
    return '';
  }
}

function extractApicPicture(data: Uint8Array): string | null {
  if (data.length < 10) return null;
  const encoding = data[0];
  let offset = 1;

  // Find null-terminated MIME type string
  let mimeEnd = offset;
  while (mimeEnd < data.length && data[mimeEnd] !== 0) {
    mimeEnd++;
  }
  const mimeType = new TextDecoder('latin1').decode(data.subarray(offset, mimeEnd)) || 'image/jpeg';
  offset = mimeEnd + 1;

  if (offset >= data.length) return null;
  // Picture type (1 byte, e.g., 0x03 for front cover)
  const _pictureType = data[offset++];

  // Skip description string
  if (encoding === 0 || encoding === 3) {
    // 1-byte null terminator
    while (offset < data.length && data[offset] !== 0) {
      offset++;
    }
    offset++;
  } else {
    // 2-byte null terminator for UTF-16
    while (offset < data.length - 1 && !(data[offset] === 0 && data[offset + 1] === 0)) {
      offset += 2;
    }
    offset += 2;
  }

  if (offset >= data.length) return null;

  const imageBytes = data.subarray(offset);
  const blob = new Blob([imageBytes], { type: mimeType });
  return URL.createObjectURL(blob);
}
