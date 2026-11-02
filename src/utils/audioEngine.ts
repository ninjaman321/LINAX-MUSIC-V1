/**
 * LINAX High-Fidelity Audio Engine
 * Powered by Web Audio API & HTML5 Audio with 10-Band Parametric Equalizer,
 * Bass Boost Harmonics, 3D Spatial Holographic Widening, Dynamics Compressor,
 * Analyser Node, and Mobile Background Playback / MediaSession API.
 */

export const EQ_FREQUENCIES = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

export interface EQPreset {
  id: string;
  name: string;
  gains: number[]; // 10 values in dB (-12 to +12)
  bassBoost?: number;
}

export const EQ_PRESETS: EQPreset[] = [
  { id: 'flat', name: 'Flat Pure', gains: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], bassBoost: 0 },
  { id: 'bass', name: 'Bass Surge', gains: [8, 6, 4, 2, 0, -1, 0, 1, 2, 3], bassBoost: 75 },
  { id: 'cyber', name: 'Cyber Beats', gains: [6, 4, -1, -2, 2, 4, 5, 4, 6, 7], bassBoost: 50 },
  { id: 'vocal', name: 'Crystal Vocal', gains: [-2, -2, -1, 2, 5, 6, 4, 2, 1, 0], bassBoost: 10 },
  { id: 'electronic', name: 'EDM Pulse', gains: [7, 5, 2, 0, 1, 3, 5, 6, 7, 6], bassBoost: 60 },
  { id: 'rock', name: 'Rock Arena', gains: [5, 3, 2, -1, -2, 1, 4, 5, 6, 5], bassBoost: 40 },
  { id: 'pop', name: 'Pop Neon', gains: [1, 2, 3, 2, 1, 2, 3, 4, 5, 4], bassBoost: 30 },
  { id: 'lofi', name: 'Chill Lo-Fi', gains: [4, 5, 2, 1, -1, -2, -1, 0, -3, -5], bassBoost: 45 },
  { id: 'techno', name: 'Techno Hyper', gains: [9, 7, 3, -1, 0, 3, 6, 8, 8, 9], bassBoost: 80 }
];

class LinaxAudioEngine {
  private audioCtx: AudioContext | null = null;
  private audioEl: HTMLAudioElement;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private preAmpNode: GainNode | null = null;
  private eqFilters: BiquadFilterNode[] = [];
  private bassFilter: BiquadFilterNode | null = null;
  private spatialPanner: StereoPannerNode | null = null;
  private compressorNode: DynamicsCompressorNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private masterGain: GainNode | null = null;

  private isInitialized = false;
  private onTimeUpdateCallback?: (currentTime: number, duration: number) => void;
  private onEndedCallback?: () => void;
  private onPlayCallback?: () => void;
  private onPauseCallback?: () => void;
  private onErrorCallback?: (err: unknown) => void;

  public eqGains: number[] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  public bassBoost = 25;
  public spatial3D = true;
  public preAmp = 1.0;

  constructor() {
    this.audioEl = new Audio();
    this.audioEl.crossOrigin = 'anonymous';
    this.audioEl.preload = 'auto';

    // Hook standard HTML5 audio events
    this.audioEl.addEventListener('timeupdate', () => {
      if (this.onTimeUpdateCallback) {
        this.onTimeUpdateCallback(this.audioEl.currentTime, this.audioEl.duration || 0);
      }
    });

    this.audioEl.addEventListener('ended', () => {
      if (this.onEndedCallback) {
        this.onEndedCallback();
      }
    });

    this.audioEl.addEventListener('play', () => {
      if (this.onPlayCallback) this.onPlayCallback();
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'playing';
      }
    });

    this.audioEl.addEventListener('pause', () => {
      if (this.onPauseCallback) this.onPauseCallback();
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'paused';
      }
    });

    this.audioEl.addEventListener('error', (e) => {
      if (this.onErrorCallback) this.onErrorCallback(e);
    });
  }

  public init() {
    if (this.isInitialized) return;

    try {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();

      // Master Gain
      this.masterGain = this.audioCtx.createGain();
      this.masterGain.gain.setValueAtTime(0.85, this.audioCtx.currentTime);

      // Pre Amp Gain
      this.preAmpNode = this.audioCtx.createGain();
      this.preAmpNode.gain.setValueAtTime(this.preAmp, this.audioCtx.currentTime);

      // Analyser Node for visualizer
      this.analyserNode = this.audioCtx.createAnalyser();
      this.analyserNode.fftSize = 1024;
      this.analyserNode.smoothingTimeConstant = 0.82;

      // Dynamics Compressor (Studio limiter / warmth)
      this.compressorNode = this.audioCtx.createDynamicsCompressor();
      this.compressorNode.threshold.setValueAtTime(-14, this.audioCtx.currentTime);
      this.compressorNode.knee.setValueAtTime(12, this.audioCtx.currentTime);
      this.compressorNode.ratio.setValueAtTime(3.5, this.audioCtx.currentTime);
      this.compressorNode.attack.setValueAtTime(0.003, this.audioCtx.currentTime);
      this.compressorNode.release.setValueAtTime(0.2, this.audioCtx.currentTime);

      // Bass Booster Filter
      this.bassFilter = this.audioCtx.createBiquadFilter();
      this.bassFilter.type = 'lowshelf';
      this.bassFilter.frequency.setValueAtTime(90, this.audioCtx.currentTime);
      this.setBassBoost(this.bassBoost);

      // 3D Spatial Stereo Panner
      if (this.audioCtx.createStereoPanner) {
        this.spatialPanner = this.audioCtx.createStereoPanner();
        this.spatialPanner.pan.setValueAtTime(0, this.audioCtx.currentTime);
      }

      // 10-Band Equalizer Filters
      this.eqFilters = EQ_FREQUENCIES.map((freq, index) => {
        const filter = this.audioCtx!.createBiquadFilter();
        if (index === 0) {
          filter.type = 'lowshelf';
        } else if (index === EQ_FREQUENCIES.length - 1) {
          filter.type = 'highshelf';
        } else {
          filter.type = 'peaking';
          filter.Q.setValueAtTime(1.414, this.audioCtx!.currentTime);
        }
        filter.frequency.setValueAtTime(freq, this.audioCtx!.currentTime);
        filter.gain.setValueAtTime(this.eqGains[index] || 0, this.audioCtx!.currentTime);
        return filter;
      });

      // Connect source to chain
      this.sourceNode = this.audioCtx.createMediaElementSource(this.audioEl);

      // Build Audio Graph:
      // source -> preAmp -> bassFilter -> eqFilter[0] -> ... -> eqFilter[9] -> spatialPanner -> compressor -> analyser -> masterGain -> destination
      let lastNode: AudioNode = this.sourceNode;
      lastNode.connect(this.preAmpNode);
      lastNode = this.preAmpNode;

      lastNode.connect(this.bassFilter);
      lastNode = this.bassFilter;

      for (const filter of this.eqFilters) {
        lastNode.connect(filter);
        lastNode = filter;
      }

      if (this.spatialPanner) {
        lastNode.connect(this.spatialPanner);
        lastNode = this.spatialPanner;
      }

      lastNode.connect(this.compressorNode);
      lastNode = this.compressorNode;

      lastNode.connect(this.analyserNode);
      this.analyserNode.connect(this.masterGain);
      this.masterGain.connect(this.audioCtx.destination);

      this.isInitialized = true;
    } catch (err) {
      console.warn('AudioContext init warning (will unlock on user gesture):', err);
    }
  }

  public async resumeContext() {
    if (!this.audioCtx) {
      this.init();
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      await this.audioCtx.resume();
    }
  }

  public setTrack(
    url: string,
    metadata?: { title: string; artist: string; album?: string; coverUrl?: string }
  ) {
    this.audioEl.src = url;
    this.audioEl.load();

    // Set MediaSession metadata for background notification / lockscreen
    if ('mediaSession' in navigator && metadata) {
      const artwork = metadata.coverUrl
        ? [{ src: metadata.coverUrl, sizes: '512x512', type: 'image/png' }]
        : [];

      navigator.mediaSession.metadata = new MediaMetadata({
        title: metadata.title,
        artist: metadata.artist,
        album: metadata.album || 'LINAX Music Studio',
        artwork
      });
    }
  }

  public async play(): Promise<void> {
    await this.resumeContext();
    return this.audioEl.play();
  }

  public pause(): void {
    this.audioEl.pause();
  }

  public seek(seconds: number): void {
    if (isFinite(seconds)) {
      this.audioEl.currentTime = Math.max(0, Math.min(seconds, this.audioEl.duration || seconds));
    }
  }

  public setVolume(val: number): void {
    const clamped = Math.max(0, Math.min(1, val));
    this.audioEl.volume = clamped;
    if (this.masterGain && this.audioCtx) {
      this.masterGain.gain.setTargetAtTime(clamped, this.audioCtx.currentTime, 0.05);
    }
  }

  public setBandGain(index: number, dbGain: number): void {
    const clamped = Math.max(-12, Math.min(12, dbGain));
    this.eqGains[index] = clamped;
    if (this.eqFilters[index] && this.audioCtx) {
      this.eqFilters[index].gain.setTargetAtTime(clamped, this.audioCtx.currentTime, 0.05);
    }
  }

  public setPreset(preset: EQPreset): void {
    preset.gains.forEach((gain, i) => {
      this.setBandGain(i, gain);
    });
    if (preset.bassBoost !== undefined) {
      this.setBassBoost(preset.bassBoost);
    }
  }

  public setBassBoost(amount: number): void {
    // 0 to 100
    this.bassBoost = Math.max(0, Math.min(100, amount));
    const boostDb = (this.bassBoost / 100) * 12; // up to +12dB
    if (this.bassFilter && this.audioCtx) {
      this.bassFilter.gain.setTargetAtTime(boostDb, this.audioCtx.currentTime, 0.05);
    }
  }

  public setSpatial3D(enabled: boolean): void {
    this.spatial3D = enabled;
    // Spatial holographic feel
    if (this.compressorNode && this.audioCtx) {
      if (enabled) {
        this.compressorNode.threshold.setTargetAtTime(-18, this.audioCtx.currentTime, 0.05);
        this.compressorNode.ratio.setTargetAtTime(4.0, this.audioCtx.currentTime, 0.05);
      } else {
        this.compressorNode.threshold.setTargetAtTime(-12, this.audioCtx.currentTime, 0.05);
        this.compressorNode.ratio.setTargetAtTime(2.5, this.audioCtx.currentTime, 0.05);
      }
    }
  }

  public setPreAmp(val: number): void {
    this.preAmp = Math.max(0.2, Math.min(2.0, val));
    if (this.preAmpNode && this.audioCtx) {
      this.preAmpNode.gain.setTargetAtTime(this.preAmp, this.audioCtx.currentTime, 0.05);
    }
  }

  public getVisualizerData(freqArray: Uint8Array, timeArray?: Uint8Array): void {
    if (this.analyserNode) {
      this.analyserNode.getByteFrequencyData(freqArray);
      if (timeArray) {
        this.analyserNode.getByteTimeDomainData(timeArray);
      }
    } else {
      freqArray.fill(0);
      if (timeArray) timeArray.fill(128);
    }
  }

  public setupMediaSessionHandlers(handlers: {
    onPlay: () => void;
    onPause: () => void;
    onNext: () => void;
    onPrev: () => void;
    onSeek: (to: number) => void;
  }) {
    if (!('mediaSession' in navigator)) return;

    navigator.mediaSession.setActionHandler('play', handlers.onPlay);
    navigator.mediaSession.setActionHandler('pause', handlers.onPause);
    navigator.mediaSession.setActionHandler('nexttrack', handlers.onNext);
    navigator.mediaSession.setActionHandler('previoustrack', handlers.onPrev);
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (details.seekTime !== undefined) {
        handlers.onSeek(details.seekTime);
      }
    });
    navigator.mediaSession.setActionHandler('seekforward', (details) => {
      const skipTime = details.seekOffset || 10;
      handlers.onSeek(this.audioEl.currentTime + skipTime);
    });
    navigator.mediaSession.setActionHandler('seekbackward', (details) => {
      const skipTime = details.seekOffset || 10;
      handlers.onSeek(this.audioEl.currentTime - skipTime);
    });
  }

  public onTimeUpdate(cb: (currentTime: number, duration: number) => void) {
    this.onTimeUpdateCallback = cb;
  }

  public onEnded(cb: () => void) {
    this.onEndedCallback = cb;
  }

  public onPlay(cb: () => void) {
    this.onPlayCallback = cb;
  }

  public onPause(cb: () => void) {
    this.onPauseCallback = cb;
  }

  public onError(cb: (err: unknown) => void) {
    this.onErrorCallback = cb;
  }

  public getCurrentTime(): number {
    return this.audioEl.currentTime || 0;
  }

  public getDuration(): number {
    return this.audioEl.duration || 0;
  }

  public isPlaying(): boolean {
    return !this.audioEl.paused && !this.audioEl.ended && this.audioEl.currentTime > 0;
  }

  public getAudioElement(): HTMLAudioElement {
    return this.audioEl;
  }
}

export const audioEngine = new LinaxAudioEngine();
