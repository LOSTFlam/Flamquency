

import { useState, useRef, type FC } from 'react';
import { MelodySettings, QuantizationValue } from '../types';
import { generateMelody } from '../services/geminiService';
import { useProject } from '../contexts/ProjectContext';

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const PianoRoll: FC = () => {
  const { 
    melodyNotes, setMelodyNotes, drumNotes, 
    genre, setGenre, musicalKey, setMusicalKey, 
    bpm, setBpm, currentStep, seekToStep,
    loopRange, setLoopStart, setLoopEnd, isLooping
  } = useProject();

  const [loading, setLoading] = useState(false);
  const [gridSize] = useState(64); // 4 bars * 16 steps (Standard)
  const contentRef = useRef<HTMLDivElement>(null);

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

  const getVisualGridLines = () => {
    switch(settings.quantization) {
        case '1/4': return 16; 
        case '1/8': return 32;
        case '1/16': return 64;
        case '1/32': return 128;
        // Triplet Logic:
        // 1 Bar = 4 beats. 
        // 1/8T = 3 notes per beat * 4 beats * 4 bars = 48 lines.
        case '1/8T': return 48; 
        // 1/16T = 6 notes per beat * 4 beats * 4 bars = 96 lines.
        case '1/16T': return 96;
        // Dotted 8th (3/16ths) aligns with 1/16 grid usually, but effectively creates specific syncopation. 
        // We'll stick to 1/16 grid for dotted to allow seeing the "off" beats clearly against standard.
        case '1/8D': return 64; 
        default: return 64;
    }
  };

  const visualLines = getVisualGridLines();
  const minPitch = melodyNotes.length > 0 ? Math.min(...melodyNotes.map(n => n.pitch)) - 2 : 48;
  const maxPitch = melodyNotes.length > 0 ? Math.max(...melodyNotes.map(n => n.pitch)) + 2 : 72;
  const pitchRange = Array.from({ length: maxPitch - minPitch + 1 }, (_, i) => maxPitch - i);

  // Ruler Interaction
  const handleRulerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!contentRef.current) return;
    const rect = contentRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const clickStep = (x / rect.width) * 64;
    
    if (e.ctrlKey || e.metaKey) {
        setLoopStart(Math.floor(clickStep));
    } else if (e.altKey) {
        setLoopEnd(Math.ceil(clickStep));
    } else {
        seekToStep(clickStep);
    }
  };

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
            <div className="flex-col max-w-[100px]">
                <label className="text-xs text-gray-400 block mb-1">Quantize</label>
                <select 
                    value={settings.quantization} 
                    onChange={(e) => setSettings({...settings, quantization: e.target.value as QuantizationValue})}
                    className="w-full bg-daw-900 border border-daw-600 rounded px-2 py-1 text-xs focus:border-daw-accent outline-none"
                >
                    <option value="1/4">1/4 (Beat)</option>
                    <option value="1/8">1/8</option>
                    <option value="1/16">1/16</option>
                    <option value="1/32">1/32</option>
                    <option value="1/8T">1/8 Triplet</option>
                    <option value="1/16T">1/16 Triplet</option>
                    <option value="1/8D">1/8 Dotted</option>
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

      {/* Info Bar */}
      <div className="flex justify-between text-xs text-gray-400 bg-daw-800 px-4 py-2 rounded border border-daw-700">
         <span><strong className="text-white">Left Click Ruler:</strong> Seek</span>
         <span><strong className="text-white">Ctrl+Click Ruler:</strong> Set Loop Start</span>
         <span><strong className="text-white">Alt+Click Ruler:</strong> Set Loop End</span>
      </div>

      {/* Piano Roll Grid */}
      <div className="flex-1 overflow-auto bg-daw-800 rounded-lg border border-daw-700 relative flex shadow-inner custom-scrollbar">
        {/* Keys Column */}
        <div className="sticky left-0 z-20 w-12 bg-daw-900 border-r border-daw-700 flex flex-col pt-8">
            {pitchRange.map((pitch) => {
                const isBlackKey = [1, 3, 6, 8, 10].includes(pitch % 12);
                return (
                    <div key={pitch} className={`h-8 flex items-center justify-center text-[10px] border-b border-daw-700 ${isBlackKey ? 'bg-daw-900 text-gray-600' : 'bg-daw-800 text-gray-300'}`}>
                        {getNoteName(pitch)}
                    </div>
                );
            })}
        </div>

        {/* Content Area */}
        <div className="flex-1 relative min-w-[800px]" ref={contentRef}>
             {/* Ruler & Playhead Container (Z-Index Stack) */}
            
            {/* 1. Ruler (Top) */}
            <div 
                className="h-8 flex bg-daw-900 border-b border-daw-700 sticky top-0 z-30 cursor-pointer group select-none"
                onClick={handleRulerClick}
            >
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex-1 border-r border-daw-600 text-xs text-gray-500 pl-1 pt-1 font-bold group-hover:bg-daw-800/50">
                        Bar {i + 1}
                    </div>
                ))}
                
                {/* Loop Region Indicator in Ruler */}
                {isLooping && (
                    <>
                        {/* Shaded Area in Ruler */}
                        <div 
                            className="absolute top-0 h-full bg-cyan-900/40 pointer-events-none"
                            style={{
                                left: `${(loopRange[0] / 64) * 100}%`,
                                width: `${((loopRange[1] - loopRange[0]) / 64) * 100}%`
                            }}
                        />
                        {/* Start Marker (Flag) */}
                        <div 
                            className="absolute top-0 bottom-0 w-px bg-cyan-400 pointer-events-none z-50"
                            style={{ left: `${(loopRange[0] / 64) * 100}%` }}
                        >
                            <div className="absolute top-0 left-0 w-0 h-0 border-t-[8px] border-t-cyan-400 border-r-[8px] border-r-transparent drop-shadow-[0_0_2px_rgba(34,211,238,0.8)]"></div>
                        </div>
                        {/* End Marker (Flag) */}
                        <div 
                            className="absolute top-0 bottom-0 w-px bg-cyan-400 pointer-events-none z-50"
                            style={{ left: `${(loopRange[1] / 64) * 100}%` }}
                        >
                            <div className="absolute top-0 right-0 w-0 h-0 border-t-[8px] border-t-cyan-400 border-l-[8px] border-l-transparent drop-shadow-[0_0_2px_rgba(34,211,238,0.8)]"></div>
                        </div>
                    </>
                )}
            </div>

            {/* 2. Grid Background */}
            <div className="absolute top-8 bottom-0 left-0 right-0 flex z-0">
                {Array.from({ length: visualLines }).map((_, i) => {
                    const ratio = visualLines / 64; 
                    // Calculate if this line is a beat or bar start
                    // Bar = 16 steps. If ratio is 1 (1/16 grid), i%16.
                    // If triplet 1/8T (48 lines), 48/4 = 12 lines per bar. i%12.
                    const linesPerBar = visualLines / 4;
                    const linesPerBeat = visualLines / 16;
                    
                    const isBarStart = i % linesPerBar === 0;
                    const isBeatStart = i % linesPerBeat === 0;

                    return (
                        <div key={i} className={`flex-1 border-r ${isBarStart ? 'border-daw-500' : isBeatStart ? 'border-daw-600' : 'border-daw-700/30'}`}></div>
                    );
                })}
            </div>

            {/* 3. Horizontal Rows */}
             <div className="absolute top-8 left-0 right-0 flex flex-col z-0">
                {pitchRange.map((pitch) => (
                    <div key={pitch} className="h-8 border-b border-daw-700/30 w-full"></div>
                ))}
            </div>

            {/* 4. Notes */}
            <div className="relative z-10 top-8">
                {melodyNotes.map((note, idx) => {
                    const rowIndex = pitchRange.indexOf(note.pitch);
                    if (rowIndex === -1) return null;
                    const left = (note.start / gridSize) * 100; 
                    const width = (note.duration / gridSize) * 100;
                    const top = rowIndex * 32; 

                    // Highlight currently playing note
                    // Tolerance added for fractional triplet playback visual
                    const isPlaying = currentStep >= note.start && currentStep < (note.start + note.duration);

                    return (
                        <div
                            key={idx}
                            className={`absolute h-6 rounded-sm border shadow-md hover:brightness-110 cursor-pointer transition-colors ${isPlaying ? 'bg-white border-white' : 'bg-daw-accent border-indigo-300/50'}`}
                            style={{ left: `${left}%`, width: `${width}%`, top: `${top + 1}px` }}
                            title={`Note: ${getNoteName(note.pitch)}, Start: ${note.start.toFixed(2)}, Dur: ${note.duration}`}
                        ></div>
                    );
                })}
            </div>
            
            {/* 5. Loop Overlay (Main Grid) */}
            {isLooping && (
                <>
                    {/* Loop Region Tint */}
                    <div 
                        className="absolute top-8 bottom-0 bg-cyan-400/5 pointer-events-none z-20 mix-blend-screen"
                        style={{
                            left: `${(loopRange[0] / 64) * 100}%`,
                            width: `${((loopRange[1] - loopRange[0]) / 64) * 100}%`
                        }}
                    ></div>
                    {/* Start Line */}
                    <div 
                         className="absolute top-8 bottom-0 w-px bg-cyan-500/50 z-20 pointer-events-none"
                         style={{ left: `${(loopRange[0] / 64) * 100}%` }}
                    ></div>
                    {/* End Line */}
                    <div 
                         className="absolute top-8 bottom-0 w-px bg-cyan-500/50 z-20 pointer-events-none"
                         style={{ left: `${(loopRange[1] / 64) * 100}%` }}
                    ></div>
                </>
            )}

            {/* 6. Playhead Cursor */}
            <div 
                className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-40 pointer-events-none shadow-[0_0_10px_red] transition-all duration-75 ease-linear"
                style={{ left: `${(currentStep / 64) * 100}%` }}
            >
                <div className="w-3 h-3 bg-red-500 transform rotate-45 -ml-1.5 -mt-1.5"></div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default PianoRoll;