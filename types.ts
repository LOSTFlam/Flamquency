

export enum AppMode {
  DASHBOARD = 'DASHBOARD',
  ARRANGER = 'ARRANGER',
  PIANO_ROLL = 'PIANO_ROLL',
  DRUM_SEQUENCER = 'DRUM_SEQUENCER',
  AUDIO_ANALYSIS = 'AUDIO_ANALYSIS',
  LYRICS_VOCALS = 'LYRICS_VOCALS',
  MIXING_ENGINEER = 'MIXING_ENGINEER'
}

export interface Note {
  pitch: number; // MIDI pitch (e.g., 60 is Middle C)
  start: number; // Start time in 16th notes (steps). Can be decimal for 1/32 or triplets (e.g., 1.33)
  duration: number; // Duration in 16th notes
  velocity: number; // 0-127
}

export interface DrumNote {
  instrument: 'Kick' | 'Snare' | 'HiHatClosed' | 'HiHatOpen' | 'Clap' | 'Perc';
  step: number; // 0-63. Can be decimal for triplets.
  velocity: number;
}

export interface AudioClip {
  id: string;
  name: string;
  bufferId: string; // Reference to AudioEngine buffer map
  start: number; // Start step
  duration: number; // Length in steps
  offset: number; // Start offset into the sample (in steps)
  fadeIn: number; // Fade in duration (in steps)
  fadeOut: number; // Fade out duration (in steps)
  gain: number; // Linear gain (1.0 = 0dB)
  pan: number; // -1.0 (Left) to 1.0 (Right)
}

export interface AudioTrack {
  id: string;
  name: string;
  clips: AudioClip[];
  volume: number; // 0-1 (gain)
  muted: boolean;
  soloed: boolean;
}

export interface IdeaResponse {
  title: string;
  genre: string;
  bpm: number;
  key: string;
  description: string;
  instruments: string[];
}

export interface MixPluginParameter {
  name: string;
  value: number;
  min: number;
  max: number;
  unit: string;
}

export interface MixPlugin {
  id: string;
  name: string;
  type: string; // EQ, Compressor, Reverb, etc.
  settings: string; // Text description of settings
  active: boolean;
  parameters?: MixPluginParameter[];
}

export interface MixSend {
  busId: string;
  amount: number; // -60 to 0 dB typically
}

export interface MixTrack {
  id: string;
  name: string;
  type: 'Audio' | 'Bus' | 'Master';
  volume: number; // -60 to +6
  pan: number; // -50 to +50
  muted: boolean;
  soloed: boolean;
  color: string;
  plugins: MixPlugin[];
  sends: MixSend[];
}

export interface MixSession {
  genre: string;
  tracks: MixTrack[];
}

export interface VSTChainStep {
  pluginType: string;
  pluginNameSuggestion: string;
  settings: string;
  reason: string;
}

export interface MixingAdvice {
  trackType: string;
  chain: VSTChainStep[];
  busProcessing: string;
}

export interface LyricsSettings {
  rhymeDensity: number; // 0-100
  structureStrictness: number; // 0-100
  styleExecution: number; // 0-100
  charisma: number; // 0-100
  atmosphere: number; // 0-100
}

export type QuantizationValue = '1/4' | '1/8' | '1/16' | '1/32' | '1/8T' | '1/16T' | '1/8D';

export interface MelodySettings {
  complexity: number;
  rhythmicity: number;
  emotionality: number;
  quantization: QuantizationValue;
}

export interface DrumSettings {
  groove: number;
  complexity: number;
  intensity: number;
  quantization: QuantizationValue;
}

export enum Genre {
  HIPHOP = 'Hip-Hop/Trap',
  POP = 'Pop',
  EDM = 'EDM/House',
  ROCK = 'Rock/Metal',
  RNB = 'R&B',
  LOFI = 'Lo-Fi',
  JAZZ = 'Jazz',
  CINEMATIC = 'Cinematic',
  DRILL = 'UK Drill',
  AFROBEATS = 'Afrobeats'
}