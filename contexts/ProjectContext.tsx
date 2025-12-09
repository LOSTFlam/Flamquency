

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  type ReactNode
} from 'react';
import { Note, DrumNote, Genre, AudioTrack, AudioClip, MixSession } from '../types';
import { audioEngine } from '../services/audioEngine';
import { saveAudioFileToDB, getAllAudioFilesFromDB, saveProjectData, loadProjectData } from '../services/storageService';

interface ProjectState {
  melodyNotes: Note[];
  setMelodyNotes: (notes: Note[]) => void;
  drumNotes: DrumNote[];
  setDrumNotes: (notes: DrumNote[]) => void;
  lyrics: string;
  setLyrics: (lyrics: string) => void;
  genre: string;
  setGenre: (genre: string) => void;
  bpm: number;
  setBpm: (bpm: number) => void;
  musicalKey: string;
  setMusicalKey: (key: string) => void;
  
  // Mixing
  mixSession: MixSession | null;
  setMixSession: (session: MixSession) => void;

  // Audio Tracks
  audioTracks: AudioTrack[];
  addAudioTrack: (name: string) => void;
  importAudioSample: (trackId: string, file: File, step: number) => Promise<void>;
  updateClip: (trackId: string, clipId: string, updates: Partial<AudioClip>) => void;
  
  // Undo / Redo
  undo: () => void;
  redo: () => void;
  snapshotHistory: () => void;
  canUndo: boolean;
  canRedo: boolean;

  // Transport
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  currentStep: number; // 16th note step (0-63)
  togglePlayback: () => void;
  
  // Navigation & Looping
  seekToStep: (step: number) => void;
  isLooping: boolean;
  toggleLoop: () => void;
  loopRange: [number, number]; // [startStep, endStep]
  setLoopStart: (step: number) => void;
  setLoopEnd: (step: number) => void;

  // Defaults
  defaultFadeIn: number;
  setDefaultFadeIn: (val: number) => void;
  defaultFadeOut: number;
  setDefaultFadeOut: (val: number) => void;
}

const ProjectContext = createContext<ProjectState | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [melodyNotes, setMelodyNotes] = useState<Note[]>([]);
  const [drumNotes, setDrumNotes] = useState<DrumNote[]>([]);
  const [audioTracks, setAudioTracks] = useState<AudioTrack[]>([]);
  const [lyrics, setLyrics] = useState<string>('');
  const [genre, setGenre] = useState<string>(Genre.HIPHOP);
  const [bpm, setBpm] = useState<number>(140);
  const [musicalKey, setMusicalKey] = useState<string>('C Minor');
  const [mixSession, setMixSession] = useState<MixSession | null>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  
  // Looping State
  const [isLooping, setIsLooping] = useState(false);
  const [loopRange, setLoopRange] = useState<[number, number]>([0, 64]);

  // Default Fades
  const [defaultFadeIn, setDefaultFadeIn] = useState<number>(0.5); // Default 0.5 steps
  const [defaultFadeOut, setDefaultFadeOut] = useState<number>(0.5);

  // Undo/Redo State
  const [history, setHistory] = useState<AudioTrack[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const [isLoaded, setIsLoaded] = useState(false);

  // Scheduler Refs
  const nextNoteTimeRef = useRef(0);
  const currentStepRef = useRef(0);
  const timerIDRef = useRef<number | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 1. Load Data on Startup
  useEffect(() => {
    const init = async () => {
        // Load JSON
        const data = loadProjectData();
        let initialTracks: AudioTrack[] = [];

        if (data) {
            setMelodyNotes(data.melodyNotes);
            setDrumNotes(data.drumNotes);
            setLyrics(data.lyrics);
            setGenre(data.genre);
            setBpm(data.bpm);
            setMusicalKey(data.musicalKey);
            setMixSession(data.mixSession);
            setAudioTracks(data.audioTracks);
            setDefaultFadeIn(data.defaultFadeIn || 0.5);
            setDefaultFadeOut(data.defaultFadeOut || 0.5);
            initialTracks = data.audioTracks;
        }

        // Initialize History
        setHistory([initialTracks]);
        setHistoryIndex(0);

        // Load Audio Files
        try {
            const files = await getAllAudioFilesFromDB();
            files.forEach((buffer, id) => {
                audioEngine.hydrateAudioBuffer(id, buffer);
            });
            console.log('Audio files hydrated:', files.size);
        } catch (e) {
            console.error("Failed to load audio files", e);
        }
        
        setIsLoaded(true);
    };

    init();
  }, []);

  // 2. Auto-Save Logic (Debounced)
  useEffect(() => {
    if (!isLoaded) return; // Don't save before initial load

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(() => {
        saveProjectData({
            melodyNotes,
            drumNotes,
            lyrics,
            genre,
            bpm,
            musicalKey,
            mixSession,
            audioTracks,
            defaultFadeIn,
            defaultFadeOut
        });
    }, 2000); // Save after 2 seconds of inactivity

  }, [melodyNotes, drumNotes, lyrics, genre, bpm, musicalKey, mixSession, audioTracks, defaultFadeIn, defaultFadeOut, isLoaded]);

  // --- UNDO / REDO LOGIC ---

  const snapshotHistory = useCallback(() => {
    setHistory(prev => {
        // Deep copy current tracks to avoid reference issues
        const currentSnapshot = JSON.parse(JSON.stringify(audioTracks));
        // Remove any future history (redo stack) if we are making a new change
        const newHistory = prev.slice(0, historyIndex + 1);
        return [...newHistory, currentSnapshot];
    });
    setHistoryIndex(prev => prev + 1);
  }, [audioTracks, historyIndex]);

  const undo = useCallback(() => {
      if (historyIndex > 0) {
          const newIndex = historyIndex - 1;
          const previousState = history[newIndex];
          setAudioTracks(JSON.parse(JSON.stringify(previousState)));
          setHistoryIndex(newIndex);
      }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
      if (historyIndex < history.length - 1) {
          const newIndex = historyIndex + 1;
          const nextState = history[newIndex];
          setAudioTracks(JSON.parse(JSON.stringify(nextState)));
          setHistoryIndex(newIndex);
      }
  }, [history, historyIndex]);

  const togglePlayback = () => {
    if (isPlaying) {
      setIsPlaying(false);
      // Do not reset current step on pause, allows resume
      if (timerIDRef.current) window.cancelAnimationFrame(timerIDRef.current);
    } else {
      audioEngine.resume();
      // Resume from current step
      nextNoteTimeRef.current = audioEngine.ctx.currentTime + 0.05;
      currentStepRef.current = currentStep; 
      setIsPlaying(true);
      scheduler();
    }
  };

  const toggleLoop = () => setIsLooping(!isLooping);

  const setLoopStart = (step: number) => {
      const safeStep = Math.max(0, Math.min(loopRange[1] - 1, step));
      setLoopRange([safeStep, loopRange[1]]);
  };

  const setLoopEnd = (step: number) => {
      const safeStep = Math.min(64, Math.max(loopRange[0] + 1, step));
      setLoopRange([loopRange[0], safeStep]);
  };

  const seekToStep = (step: number) => {
    const safeStep = Math.max(0, Math.min(63, Math.floor(step)));
    setCurrentStep(safeStep);
    currentStepRef.current = safeStep;
    // Reset timing to "now" so it picks up immediately
    nextNoteTimeRef.current = audioEngine.ctx.currentTime + 0.05;
  };

  const addAudioTrack = (name: string) => {
    const newTrack: AudioTrack = {
      id: `track-${Date.now()}`,
      name,
      clips: [],
      volume: 1.0,
      muted: false,
      soloed: false
    };

    setAudioTracks(prev => {
        const next = [...prev, newTrack];
        // Manually update history since we are inside state setter
        setHistory(h => [...h.slice(0, historyIndex + 1), JSON.parse(JSON.stringify(next))]);
        setHistoryIndex(i => i + 1);
        return next;
    });
  };

  const importAudioSample = async (trackId: string, file: File, step: number) => {
     const bufferId = `buf-${Date.now()}`;
     
     // 1. Load into Engine (decodes and prepares for playback)
     const audioBuffer = await audioEngine.loadSample(bufferId, file);
     
     // 2. Save raw bytes to IndexedDB for persistence
     const arrayBuffer = await file.arrayBuffer();
     await saveAudioFileToDB(bufferId, arrayBuffer);
     
     const durationSec = audioBuffer.duration;
     
     // Convert duration to steps (1 step = 16th note)
     const secondsPer16th = (60 / bpm) / 4;
     const durationSteps = durationSec / secondsPer16th;

     const newClip: AudioClip = {
         id: `clip-${Date.now()}`,
         name: file.name,
         bufferId,
         start: step,
         duration: durationSteps,
         offset: 0,
         fadeIn: defaultFadeIn,
         fadeOut: defaultFadeOut,
         gain: 1.0, // Default 0dB
         pan: 0.0 // Center
     };

     setAudioTracks(prev => {
         const next = prev.map(t => 
             t.id === trackId ? { ...t, clips: [...t.clips, newClip] } : t
         );
         // Update history
         setHistory(h => [...h.slice(0, historyIndex + 1), JSON.parse(JSON.stringify(next))]);
         setHistoryIndex(i => i + 1);
         return next;
     });
  };

  const updateClip = (trackId: string, clipId: string, updates: Partial<AudioClip>) => {
      setAudioTracks(prev => prev.map(track => {
          if (track.id !== trackId) return track;
          return {
              ...track,
              clips: track.clips.map(clip => clip.id === clipId ? { ...clip, ...updates } : clip)
          };
      }));
  };

  const scheduleNote = (step: number, time: number) => {
    // Sync React State for visuals
    requestAnimationFrame(() => {
        setCurrentStep(step);
    });
    
    // Seconds per step for audio clip conversion
    const secondsPer16th = (60 / bpm) / 4;

    // 1. Schedule Drums
    // Support fractional steps (triplets/humanization). Filter notes where the integer part matches current step.
    const drumsAtStep = drumNotes.filter(d => Math.floor(d.step) === step);
    drumsAtStep.forEach(d => {
        // Calculate offset if the note is a triplet/fractional step (e.g. 1.33)
        const microOffset = (d.step - step) * secondsPer16th;
        const noteTime = time + microOffset;

        if (d.instrument === 'Kick') audioEngine.playKick(noteTime, d.velocity);
        if (d.instrument === 'Snare') audioEngine.playSnare(noteTime, d.velocity);
        if (d.instrument === 'Clap') audioEngine.playSnare(noteTime, d.velocity); 
        if (d.instrument === 'HiHatClosed') audioEngine.playHiHat(noteTime, d.velocity, false);
        if (d.instrument === 'HiHatOpen') audioEngine.playHiHat(noteTime, d.velocity, true);
        if (d.instrument === 'Perc') audioEngine.playHiHat(noteTime, d.velocity, false); 
    });

    // 2. Schedule Melody
    const notesStarting = melodyNotes.filter(n => Math.floor(n.start) === step);
    notesStarting.forEach(n => {
        const microOffset = (n.start - step) * secondsPer16th; 
        const durationSec = n.duration * secondsPer16th;
        audioEngine.playSynthNote(n.pitch, time + microOffset, durationSec, n.velocity);
    });

    // 3. Schedule Audio Clips
    // Check if any clip starts at this approximate step (handling float starts)
    audioTracks.forEach(track => {
        if (track.muted) return;
        track.clips.forEach(clip => {
            if (Math.abs(clip.start - step) < 0.1) {
                // Calc times
                const offsetSec = clip.offset * secondsPer16th;
                const durationSec = clip.duration * secondsPer16th;
                const fadeInSec = clip.fadeIn * secondsPer16th;
                const fadeOutSec = clip.fadeOut * secondsPer16th;
                
                audioEngine.playClip(
                    clip.bufferId,
                    time,
                    offsetSec,
                    durationSec,
                    track.volume * (clip.gain ?? 1.0), // Apply track vol * clip gain
                    clip.pan ?? 0, // Apply clip pan
                    fadeInSec,
                    fadeOutSec
                );
            }
        });
    });
  };

  const scheduler = () => {
    while (nextNoteTimeRef.current < audioEngine.ctx.currentTime + audioEngine.scheduleAheadTime) {
        scheduleNote(currentStepRef.current, nextNoteTimeRef.current);
        next();
    }
    timerIDRef.current = requestAnimationFrame(scheduler);
  };

  const next = () => {
    const secondsPerBeat = 60.0 / bpm;
    const secondsPer16th = secondsPerBeat / 4; 
    nextNoteTimeRef.current += secondsPer16th;
    
    let nextStep = currentStepRef.current + 1;
    
    // Handle Looping
    if (isLooping) {
        if (nextStep >= loopRange[1]) {
            nextStep = loopRange[0];
        }
    } else {
        if (nextStep >= 64) {
            nextStep = 0;
        }
    }
    
    currentStepRef.current = nextStep;
  };

  useEffect(() => {
    if (!isPlaying) {
         if (timerIDRef.current) window.cancelAnimationFrame(timerIDRef.current);
    }
  }, [isPlaying]);

  return (
    <ProjectContext.Provider value={{
      melodyNotes,
      setMelodyNotes,
      drumNotes,
      setDrumNotes,
      audioTracks,
      addAudioTrack,
      importAudioSample,
      updateClip,
      lyrics,
      setLyrics,
      genre,
      setGenre,
      bpm,
      setBpm,
      musicalKey,
      setMusicalKey,
      mixSession,
      setMixSession,
      isPlaying,
      setIsPlaying,
      currentStep,
      togglePlayback,
      seekToStep,
      isLooping,
      toggleLoop,
      loopRange,
      setLoopStart,
      setLoopEnd,
      defaultFadeIn,
      setDefaultFadeIn,
      defaultFadeOut,
      setDefaultFadeOut,
      undo,
      redo,
      canUndo: historyIndex > 0,
      canRedo: historyIndex < history.length - 1,
      snapshotHistory
    }}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};