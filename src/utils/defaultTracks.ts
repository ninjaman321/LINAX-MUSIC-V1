import { SongItem } from './playlistRules';

/**
 * Generates synthetic high-fidelity cyber audio tracks rendered into WAV Blobs
 * so LINAX is fully playable immediately upon first open, even with zero network or files!
 */

function createWavBlob(sampleRate: number, samples: Float32Array[]): Blob {
  const numChannels = samples.length;
  const numSamples = samples[0].length;
  const bytesPerSample = 2; // 16-bit PCM
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * blockAlign;

  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // RIFF identifier
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');

  // fmt sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 = PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true); // bits per sample

  // data sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // Write interleaved PCM samples
  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    for (let channel = 0; channel < numChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, samples[channel][i]));
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, intSample, true);
      offset += 2;
    }
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

/**
 * Synthesizes an ambient synthwave groove
 */
function synthesizeTrack(bpm: number, durationSeconds: number, style: 'cyberpunk' | 'liquid' | 'lofi'): Blob {
  const sampleRate = 44100;
  const totalSamples = Math.floor(sampleRate * durationSeconds);
  const left = new Float32Array(totalSamples);
  const right = new Float32Array(totalSamples);

  const beatDuration = 60 / bpm;
  const samplesPerBeat = Math.floor(sampleRate * beatDuration);

  // Chord frequencies based on style
  const chords = style === 'cyberpunk'
    ? [[130.81, 155.56, 196.00], [116.54, 146.83, 174.61], [98.00, 123.47, 146.83], [110.00, 130.81, 164.81]] // C min, Bb maj, G min, Ab maj
    : style === 'liquid'
    ? [[174.61, 220.00, 261.63, 329.63], [164.81, 207.65, 246.94, 311.13], [146.83, 174.61, 220.00, 261.63], [130.81, 164.81, 196.00, 246.94]]
    : [[130.81, 164.81, 196.00, 246.94], [146.83, 174.61, 220.00, 261.63], [110.00, 130.81, 164.81, 196.00], [98.00, 123.47, 146.83, 174.61]];

  let chordIndex = 0;

  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    const currentBeat = Math.floor(i / samplesPerBeat);
    const beatFraction = (i % samplesPerBeat) / samplesPerBeat;

    if (currentBeat % 4 === 0 && (i % (samplesPerBeat * 4) === 0)) {
      chordIndex = Math.floor(currentBeat / 4) % chords.length;
    }

    const currentChord = chords[chordIndex];

    // 1. Sub Bass
    const rootFreq = currentChord[0] / 2;
    const bassEnv = Math.exp(-beatFraction * 3.5);
    const bass = Math.sin(2 * Math.PI * rootFreq * t) * 0.45 * (currentBeat % 2 === 0 ? 1 : 0.7) * bassEnv;

    // 2. Chords / Pad with subtle chorusing
    let pad = 0;
    for (let c = 0; c < currentChord.length; c++) {
      const freq = currentChord[c];
      const detune = Math.sin(t * 1.5 + c) * 1.2;
      pad += (Math.sin(2 * Math.PI * (freq + detune) * t) + 0.3 * Math.sin(2 * Math.PI * (freq * 2) * t)) * 0.08;
    }

    // 3. Kick drum on 1 and 3
    let kick = 0;
    if (currentBeat % 2 === 0 && beatFraction < 0.25) {
      const kickEnv = Math.exp(-beatFraction * 20);
      const kickFreq = 140 * Math.exp(-beatFraction * 35) + 45;
      kick = Math.sin(2 * Math.PI * kickFreq * t) * kickEnv * 0.7;
    }

    // 4. Snare / Hi-hat
    let snare = 0;
    if (currentBeat % 2 === 1 && beatFraction < 0.2) {
      const noise = (Math.random() * 2 - 1) * Math.exp(-beatFraction * 25) * 0.35;
      const body = Math.sin(2 * Math.PI * 220 * t) * Math.exp(-beatFraction * 30) * 0.25;
      snare = noise + body;
    }

    let hihat = 0;
    const eighthFraction = (i % Math.floor(samplesPerBeat / 2)) / Math.floor(samplesPerBeat / 2);
    if (eighthFraction < 0.1) {
      hihat = (Math.random() * 2 - 1) * Math.exp(-eighthFraction * 40) * 0.15;
    }

    // Combine channels with stereo panning
    const mix = bass + pad + kick + snare + hihat;
    left[i] = mix + pad * 0.2 + (Math.sin(t * 0.5) * 0.05);
    right[i] = mix + pad * -0.2 - (Math.sin(t * 0.5) * 0.05);
  }

  return createWavBlob(sampleRate, [left, right]);
}

// Preset dynamic covers (SVG data URIs with futuristic glass aesthetics)
export const PRESET_COVERS = [
  `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500">
      <defs>
        <radialGradient id="g1" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stop-color="#00f0ff"/>
          <stop offset="50%" stop-color="#7000ff"/>
          <stop offset="100%" stop-color="#050515"/>
        </radialGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
          <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <rect width="500" height="500" fill="url(#g1)"/>
      <circle cx="250" cy="250" r="140" fill="none" stroke="#00f0ff" stroke-width="6" opacity="0.8" filter="url(#glow)"/>
      <polygon points="250,150 330,290 170,290" fill="none" stroke="#ff007f" stroke-width="8" filter="url(#glow)"/>
      <text x="250" y="440" font-family="sans-serif" font-weight="900" font-size="28" fill="#ffffff" text-anchor="middle" letter-spacing="6">CYBER PULSE</text>
    </svg>
  `)}`,
  `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500">
      <defs>
        <radialGradient id="g2" cx="70%" cy="20%" r="80%">
          <stop offset="0%" stop-color="#10b981"/>
          <stop offset="40%" stop-color="#0284c7"/>
          <stop offset="100%" stop-color="#030712"/>
        </radialGradient>
      </defs>
      <rect width="500" height="500" fill="url(#g2)"/>
      <circle cx="250" cy="250" r="120" fill="none" stroke="#10b981" stroke-width="12" stroke-dasharray="20 10"/>
      <path d="M 150 250 Q 250 150 350 250 T 450 250" fill="none" stroke="#38bdf8" stroke-width="6"/>
      <text x="250" y="440" font-family="sans-serif" font-weight="900" font-size="28" fill="#ffffff" text-anchor="middle" letter-spacing="6">LIQUID MATRIX</text>
    </svg>
  `)}`,
  `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500">
      <defs>
        <linearGradient id="g3" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#f43f5e"/>
          <stop offset="50%" stop-color="#8b5cf6"/>
          <stop offset="100%" stop-color="#090a15"/>
        </linearGradient>
      </defs>
      <rect width="500" height="500" fill="url(#g3)"/>
      <rect x="150" y="150" width="200" height="200" rx="30" fill="none" stroke="#f43f5e" stroke-width="8" transform="rotate(45 250 250)"/>
      <text x="250" y="440" font-family="sans-serif" font-weight="900" font-size="28" fill="#ffffff" text-anchor="middle" letter-spacing="6">NEON ODYSSEY</text>
    </svg>
  `)}`
];

export function getInitialDemoTracks(): SongItem[] {
  const blob1 = synthesizeTrack(128, 45, 'cyberpunk');
  const blob2 = synthesizeTrack(116, 42, 'liquid');
  const blob3 = synthesizeTrack(90, 48, 'lofi');

  return [
    {
      id: 'demo-1',
      title: 'Neon Cyber Horizon',
      artist: 'LINAX Acoustic Lab',
      album: 'Futuristic Studio Vol. 1',
      duration: 45,
      coverUrl: PRESET_COVERS[0],
      url: URL.createObjectURL(blob1),
      blob: blob1,
      fileSize: blob1.size,
      addedAt: Date.now() - 100000,
      favorite: true
    },
    {
      id: 'demo-2',
      title: 'Liquid Glass Matrix',
      artist: 'Abdullah Al Salem Sound',
      album: 'Pure Hologram Engine',
      duration: 42,
      coverUrl: PRESET_COVERS[1],
      url: URL.createObjectURL(blob2),
      blob: blob2,
      fileSize: blob2.size,
      addedAt: Date.now() - 80000,
      favorite: true
    },
    {
      id: 'demo-3',
      title: 'Deep Space Nebula',
      artist: 'LINAX Studio Beats',
      album: 'Spatial Infinity',
      duration: 48,
      coverUrl: PRESET_COVERS[2],
      url: URL.createObjectURL(blob3),
      blob: blob3,
      fileSize: blob3.size,
      addedAt: Date.now() - 60000,
      favorite: false
    }
  ];
}
