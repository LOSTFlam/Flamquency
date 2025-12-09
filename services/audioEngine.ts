

// A lightweight synth engine using Web Audio API
// No external libraries to ensure standalone functionality

class AudioEngine {
  ctx: AudioContext;
  masterGain: GainNode;
  lookahead: number = 25.0; // ms
  scheduleAheadTime: number = 0.1; // s
  
  // Storage for uploaded samples
  buffers: Map<string, AudioBuffer> = new Map();

  constructor() {
    // Initialize audio context only on user interaction usually, but we prep it here
    const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
    this.ctx = new AudioContextClass();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.5;
    this.masterGain.connect(this.ctx.destination);
  }

  resume() {
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // --- SAMPLE MANAGEMENT ---

  async loadSample(id: string, file: File): Promise<AudioBuffer> {
    const arrayBuffer = await file.arrayBuffer();
    // Decode logic
    const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
    this.buffers.set(id, audioBuffer);
    
    // Return original array buffer if needed for saving, but here we assume caller handles file
    return audioBuffer;
  }

  // Used for re-hydrating from IndexedDB on page load
  async hydrateAudioBuffer(id: string, arrayBuffer: ArrayBuffer): Promise<void> {
    try {
        // We must copy the array buffer because decodeAudioData detaches it
        const bufferCopy = arrayBuffer.slice(0);
        const audioBuffer = await this.ctx.decodeAudioData(bufferCopy);
        this.buffers.set(id, audioBuffer);
    } catch (e) {
        console.error(`Failed to hydrate buffer ${id}`, e);
    }
  }

  getBufferDuration(id: string): number {
    const buffer = this.buffers.get(id);
    return buffer ? buffer.duration : 0;
  }

  playClip(
    bufferId: string, 
    startTime: number, 
    offsetSec: number, 
    durationSec: number, 
    volume: number,
    pan: number,
    fadeInSec: number = 0,
    fadeOutSec: number = 0
  ) {
    const buffer = this.buffers.get(bufferId);
    if (!buffer) return;

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    
    const gainNode = this.ctx.createGain();
    const panner = this.ctx.createStereoPanner();

    // Chain: Source -> Gain -> Panner -> Master
    source.connect(gainNode);
    gainNode.connect(panner);
    panner.connect(this.masterGain);

    // Pan
    panner.pan.setValueAtTime(pan, startTime);

    // Volume & Envelopes
    const startVolTime = startTime;
    const endVolTime = startTime + durationSec;
    
    // Initial State
    gainNode.gain.setValueAtTime(0, startVolTime);
    
    // Fade In
    if (fadeInSec > 0) {
        gainNode.gain.linearRampToValueAtTime(volume, startVolTime + fadeInSec);
    } else {
        gainNode.gain.setValueAtTime(volume, startVolTime);
    }

    // Fade Out
    if (fadeOutSec > 0 && durationSec > fadeOutSec) {
        gainNode.gain.setValueAtTime(volume, endVolTime - fadeOutSec);
        gainNode.gain.linearRampToValueAtTime(0, endVolTime);
    } else {
        gainNode.gain.setValueAtTime(volume, endVolTime);
        gainNode.gain.setValueAtTime(0, endVolTime + 0.01); // Avoid click at end
    }

    // Playback
    // buffer source start(when, offset, duration)
    // Note: If offset is beyond buffer length, it might throw or silence.
    try {
        source.start(startTime, offsetSec, durationSec);
    } catch (e) {
        console.warn("Failed to start clip", e);
    }
  }

  // --- SYNTHESIZERS ---

  playKick(time: number, velocity: number) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);
    
    gain.gain.setValueAtTime(velocity / 127, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);

    osc.start(time);
    osc.stop(time + 0.5);
  }

  playSnare(time: number, velocity: number) {
    // Noise buffer
    const bufferSize = this.ctx.sampleRate * 0.5; // 0.5s
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    
    // Filter
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1000;

    const gain = this.ctx.createGain();
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    gain.gain.setValueAtTime(velocity / 127, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);

    noise.start(time);
    noise.stop(time + 0.2);
    
    // Add a tonal "pop"
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    osc.frequency.value = 200;
    oscGain.gain.setValueAtTime((velocity/127) * 0.5, time);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
    osc.start(time);
    osc.stop(time + 0.1);
  }

  playHiHat(time: number, velocity: number, open: boolean) {
    const bufferSize = this.ctx.sampleRate * 0.5;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 5000;

    const gain = this.ctx.createGain();
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    const decay = open ? 0.3 : 0.05;

    gain.gain.setValueAtTime((velocity/127) * 0.6, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + decay);

    noise.start(time);
    noise.stop(time + decay);
  }

  playSynthNote(pitch: number, time: number, duration: number, velocity: number) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    // Standard Sawtooth synth sound
    osc.type = 'sawtooth';
    // MIDI to Freq conversion
    const freq = 440 * Math.pow(2, (pitch - 69) / 12);
    osc.frequency.setValueAtTime(freq, time);

    // Filter envelope
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(200, time);
    filter.frequency.exponentialRampToValueAtTime(2000, time + 0.05);
    filter.frequency.exponentialRampToValueAtTime(500, time + duration);

    // Amp Envelope
    const vel = velocity / 127;
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(vel, time + 0.01); // Attack
    gain.gain.exponentialRampToValueAtTime(vel * 0.7, time + 0.1); // Decay
    gain.gain.setValueAtTime(vel * 0.7, time + duration - 0.05); // Sustain
    gain.gain.linearRampToValueAtTime(0, time + duration); // Release

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + duration);
  }
}

export const audioEngine = new AudioEngine();