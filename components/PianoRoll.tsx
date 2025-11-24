
import React, { useState } from 'react';
import { MelodySettings } from '../types';
import { generateMelody } from '../services/geminiService';
import { useProject } from '../contexts/ProjectContext';

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const PianoRoll: React.FC = () => {
  const { melodyNotes, setMelodyNotes, drumNotes, genre, setGenre, musicalKey, setMusicalKey, bpm, setBpm } = useProject();
  const [loading, setLoading] = useState(false);
  const [gridSize] = useState(64); // 4 bars * 16 steps (This is the 'coordinate' size)

  const [settings, setSettings] = useState<MelodySettings>({
    complexity: 50,
    rhythmicity: 70,
    emotionality: 60,
    quantization: '1/16'
  });

  const handleGenerate = async () => {
    setLoading(true);
    const newNotes = await generateMelody(genre, musicalKey, bpm, settings, drumNotes);
    setMelodyNotes(newNotes);
    setLoading(false);
  };

  const getNoteName = (pitch: number) => {
    const noteIndex = pitch % 12;
    const octave = Math.floor(pitch / 12) - 1;
    return `${NOTES[noteIndex]}${octave}`;
  };

  // Helper to determine how many lines to draw based on quantization
  const getVisualGridLines = () => {
    // 64 total steps (16th notes)
    // 1/4 = every 4 steps
    // 1/8 = every 2 steps
    // 1/16 = every 1 step
    // 1/32 = every 0.5 steps
    switch(settings.quantization) {
        case '1/4': return 16; 
        case '1/8': return 32;
        case '1/16': return 64;
        case '1/32': return 128;
        default: return 64;
    }
  };

  const visualLines = getVisualGridLines();

  const minPitch = melodyNotes.length > 0 ? Math.min(...melodyNotes.map(n => n.pitch)) - 2 : 48;
  const maxPitch = melodyNotes.length > 0 ? Math.max(...melodyNotes.map(n => n.pitch)) + 2 : 72;
  const pitchRange = Array.from({ length: maxPitch - minPitch + 1 }, (_, i) => maxPitch - i);

  return (
    <div className="flex flex-col h-full bg-daw-900 text-white p-4 gap-4">
      {/* Top Bar Controls */}
      <div className="bg-daw-800 p-4 rounded-lg border border-daw-700 flex flex-wrap items-end gap-6">
        <div>
            <h2 className="text-xl font-bold text-daw-accent mb-2">Melody Lab</h2>
            <div className="flex gap-2">
                 <select 
                    value={genre} 
                    onChange={(e) => setGenre(e.target.value)}
                    className="bg-daw-900 border border-daw-600 rounded px-3 py-1 text-sm focus:border-daw-accent outline-none"
                >
                    {/* Simplified genre list for brevity in view */}
                    <option value="Hip-Hop/Trap">Hip-Hop</option>
                    <option value="Pop">Pop</option>
                    <option value="R&B">R&B</option>
                    <option value="Rock/Metal">Rock</option>
                    <option value="EDM/House">EDM</option>
                </select>
                <input 
                    type="text" 
                    value={musicalKey}
                    onChange={(e) => setMusicalKey(e.target.value)}
                    placeholder="Key"
                    className="bg-daw-900 border border-daw-600 rounded px-3 py-1 text-sm w-20 focus:border-daw-accent outline-none text-center"
                />
                 <input 
                    type="number" 
                    value={bpm}
                    onChange={(e) => setBpm(parseInt(e.target.value))}
                    placeholder="BPM"
                    className="bg-daw-900 border border-daw-600 rounded px-3 py-1 text-sm w-20 focus:border-daw-accent outline-none text-center"
                />
            </div>
        </div>

        {/* Granular Settings */}
        <div className="flex gap-4 flex-1 items-center">
            <div className="flex-1 max-w-[150px]">
                <label className="text-xs text-gray-400 block mb-1">Complexity</label>
                <input type="range" className="w-full h-1 bg-daw-600 rounded-lg appearance-none accent-daw-accent" value={settings.complexity} onChange={e => setSettings({...settings, complexity: parseInt(e.target.value)})} />
            </div>
            <div className="flex-1 max-w-[150px]">
                <label className="text-xs text-gray-400 block mb-1">Rhythm</label>
                <input type="range" className="w-full h-1 bg-daw-600 rounded-lg appearance-none accent-daw-accent" value={settings.rhythmicity} onChange={e => setSettings({...settings, rhythmicity: parseInt(e.target.value)})} />
            </div>
             <div className="flex-1 max-w-[150px]">
                <label className="text-xs text-gray-400 block mb-1">Emotion</label>
                <input type="range" className="w-full h-1 bg-daw-600 rounded-lg appearance-none accent-daw-accent" value={settings.emotionality} onChange={e => setSettings({...settings, emotionality: parseInt(e.target.value)})} />
            </div>
            
            {/* Grid Selector */}
            <div className="flex-col max-w-[100px]">
                <label className="text-xs text-gray-400 block mb-1">Grid / Quantize</label>
                <select 
                    value={settings.quantization} 
                    onChange={(e) => setSettings({...settings, quantization: e.target.value as any})}
                    className="w-full bg-daw-900 border border-daw-600 rounded px-2 py-1 text-xs focus:border-daw-accent outline-none"
                >
                    <option value="1/4">1/4</option>
                    <option value="1/8">1/8</option>
                    <option value="1/16">1/16</option>
                    <option value="1/32">1/32</option>
                </select>
            </div>
        </div>
        
        <div className="flex flex-col items-end">
            {drumNotes.length > 0 && <span className="text-xs text-green-400 mb-1">● Synced to Drums</span>}
            <button 
            onClick={handleGenerate} 
            disabled={loading}
            className={`px-6 py-2 rounded font-bold transition-colors shadow-md ${loading ? 'bg-daw-600 cursor-not-allowed' : 'bg-daw-accent hover:bg-daw-highlight'}`}
            >
            {loading ? 'Composing...' : 'Generate Melody'}
            </button>
        </div>
      </div>

      {/* Piano Roll Grid */}
      <div className="flex-1 overflow-auto bg-daw-800 rounded-lg border border-daw-700 relative flex shadow-inner custom-scrollbar">
        <div className="sticky left-0 z-10 w-12 bg-daw-900 border-r border-daw-700 flex flex-col">
            <div className="h-8 border-b border-daw-700"></div> 
            {pitchRange.map((pitch) => {
                const isBlackKey = [1, 3, 6, 8, 10].includes(pitch % 12);
                return (
                    <div key={pitch} className={`h-8 flex items-center justify-center text-[10px] border-b border-daw-700 ${isBlackKey ? 'bg-daw-900 text-gray-600' : 'bg-daw-800 text-gray-300'}`}>
                        {getNoteName(pitch)}
                    </div>
                );
            })}
        </div>

        <div className="flex-1 relative min-w-[800px]">
            {/* Dynamic Grid Lines based on selection */}
            <div className="absolute inset-0 flex">
                {Array.from({ length: visualLines }).map((_, i) => {
                    // Calculate visual style based on beat hierarchy
                    // Total length of grid is always 64 steps (16th notes)
                    // If visualLines is 128, 'i' goes up to 127.
                    
                    // Logic to determine if this line is a Bar, Beat, or Sub-beat
                    // 1 Bar = 16 sixteenths
                    // 1 Beat = 4 sixteenths
                    
                    const ratio = visualLines / 64; // e.g. 2 for 1/32, 1 for 1/16, 0.5 for 1/8
                    const stepIndex = i / ratio; // Convert back to 16th note index

                    const isBarStart = stepIndex % 16 === 0;
                    const isBeatStart = stepIndex % 4 === 0;
                    
                    return (
                        <div key={i} className={`flex-1 border-r ${isBarStart ? 'border-daw-500' : isBeatStart ? 'border-daw-600' : 'border-daw-700/30'}`}></div>
                    );
                })}
            </div>

             <div className="absolute inset-0 flex flex-col mt-8">
                {pitchRange.map((pitch) => (
                    <div key={pitch} className="h-8 border-b border-daw-700/30 w-full"></div>
                ))}
            </div>
            
            <div className="h-8 flex bg-daw-900 border-b border-daw-700 sticky top-0 z-10">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex-1 border-r border-daw-600 text-xs text-gray-500 pl-1 pt-1 font-bold">
                        Bar {i + 1}
                    </div>
                ))}
            </div>

            <div className="relative mt-0">
                {melodyNotes.map((note, idx) => {
                    const rowIndex = pitchRange.indexOf(note.pitch);
                    if (rowIndex === -1) return null;
                    const left = (note.start / gridSize) * 100; 
                    const width = (note.duration / gridSize) * 100;
                    const top = rowIndex * 32; 

                    return (
                        <div
                            key={idx}
                            className="absolute h-6 rounded-sm bg-daw-accent border border-indigo-300/50 shadow-md hover:brightness-110 cursor-pointer"
                            style={{ left: `${left}%`, width: `${width}%`, top: `${top + 1}px` }}
                            title={`Note: ${getNoteName(note.pitch)}, Start: ${note.start}, Dur: ${note.duration}`}
                        ></div>
                    );
                })}
            </div>
        </div>
      </div>
    </div>
  );
};

export default PianoRoll;
