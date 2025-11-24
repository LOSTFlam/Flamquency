
export enum AppMode {
  DASHBOARD = 'DASHBOARD',
  PIANO_ROLL = 'PIANO_ROLL',
  DRUM_SEQUENCER = 'DRUM_SEQUENCER',
  AUDIO_ANALYSIS = 'AUDIO_ANALYSIS',
  LYRICS_VOCALS = 'LYRICS_VOCALS',
  MIXING_ENGINEER = 'MIXING_ENGINEER'
}

export interface Note {
  pitch: number; // MIDI pitch (e.g., 60 is Middle C)
  start: number; // Start time in 16th notes (steps). Can be decimal for 1/32 (e.g., 0.5)
  duration: number; // Duration in 16th notes
  velocity: number; // 0-127
}

export interface DrumNote {
  instrument: 'Kick' | 'Snare' | 'HiHatClosed' | 'HiHatOpen' | 'Clap' | 'Perc';
  step: number; // 0-63 (assuming 4 bars of 16 steps)
  velocity: number;
}

export interface IdeaResponse {
  title: string;
  genre: string;
  bpm: number;
  key: string;
  description: string;
  instruments: string[];
}

export interface MixPlugin {
  id: string;
  name: string;
  type: string; // EQ, Compressor, Reverb, etc.
  settings: string; // Text description of settings
  active: boolean;
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

export interface MelodySettings {
  complexity: number;
  rhythmicity: number;
  emotionality: number;
  quantization: '1/4' | '1/8' | '1/16' | '1/32';
}

export interface DrumSettings {
  groove: number;
  complexity: number;
  intensity: number;
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
