
import { MixSession, Note, DrumNote, AudioTrack, AudioClip, LyricsSettings, MelodySettings, DrumSettings } from '../types';

const DB_NAME = 'FlamquencyDB';
const AUDIO_STORE = 'audio_files';
const DB_VERSION = 1;

// --- IndexedDB Helpers for Audio Files ---

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(AUDIO_STORE)) {
        db.createObjectStore(AUDIO_STORE); // Key is the bufferId
      }
    };
  });
};

export const saveAudioFileToDB = async (bufferId: string, arrayBuffer: ArrayBuffer): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(AUDIO_STORE, 'readwrite');
    const store = transaction.objectStore(AUDIO_STORE);
    const request = store.put(arrayBuffer, bufferId);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const getAllAudioFilesFromDB = async (): Promise<Map<string, ArrayBuffer>> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(AUDIO_STORE, 'readonly');
    const store = transaction.objectStore(AUDIO_STORE);
    const request = store.openCursor();
    const results = new Map<string, ArrayBuffer>();

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        results.set(cursor.key as string, cursor.value as ArrayBuffer);
        cursor.continue();
      } else {
        resolve(results);
      }
    };
    request.onerror = () => reject(request.error);
  });
};

// --- LocalStorage for JSON Data ---

export interface PersistentData {
  melodyNotes: Note[];
  drumNotes: DrumNote[];
  lyrics: string;
  genre: string;
  bpm: number;
  musicalKey: string;
  mixSession: MixSession | null;
  audioTracks: AudioTrack[];
  // Settings
  defaultFadeIn: number;
  defaultFadeOut: number;
}

const STORAGE_KEY = 'flamquency_project_v1';

export const saveProjectData = (data: PersistentData) => {
  try {
    const json = JSON.stringify(data);
    localStorage.setItem(STORAGE_KEY, json);
    console.log('Project saved.');
  } catch (e) {
    console.warn('Failed to save project data to LocalStorage', e);
  }
};

export const loadProjectData = (): PersistentData | null => {
  try {
    const json = localStorage.getItem(STORAGE_KEY);
    if (!json) return null;
    return JSON.parse(json) as PersistentData;
  } catch (e) {
    console.warn('Failed to load project data', e);
    return null;
  }
};
