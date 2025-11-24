import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Note, DrumNote, Genre } from '../types';

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
}

const ProjectContext = createContext<ProjectState | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [melodyNotes, setMelodyNotes] = useState<Note[]>([]);
  const [drumNotes, setDrumNotes] = useState<DrumNote[]>([]);
  const [lyrics, setLyrics] = useState<string>('');
  const [genre, setGenre] = useState<string>(Genre.HIPHOP);
  const [bpm, setBpm] = useState<number>(140);
  const [musicalKey, setMusicalKey] = useState<string>('C Minor');

  return (
    <ProjectContext.Provider value={{
      melodyNotes,
      setMelodyNotes,
      drumNotes,
      setDrumNotes,
      lyrics,
      setLyrics,
      genre,
      setGenre,
      bpm,
      setBpm,
      musicalKey,
      setMusicalKey
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