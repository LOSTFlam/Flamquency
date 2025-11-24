import React, { useState } from 'react';
import { DrumSettings, DrumNote } from '../types';
import { generateDrumPattern } from '../services/geminiService';
import { useProject } from '../contexts/ProjectContext';

const INSTRUMENTS = ['Kick', 'Snare', 'Clap', 'HiHatClosed', 'HiHatOpen', 'Perc'];
const STEPS = 32; // 2 bars for visual simplicity, though API supports more

const DrumSequencer: React.FC = () => {
  const { drumNotes, setDrumNotes, melodyNotes, genre, bpm, setBpm } = useProject();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<DrumSettings>({
    groove: 50,
    complexity: 50,
    intensity: 75
  });

  const handleGenerate = async () => {
    setLoading(true);
    const newDrums = await generateDrumPattern(genre, bpm, settings, melodyNotes);
    setDrumNotes(newDrums);
    setLoading(false);
  };

  const toggleStep = (inst: any, step: number) => {
    const existingIndex = drumNotes.findIndex(n => n.instrument === inst && n.step === step);
    if (existingIndex > -1) {
        setDrumNotes(drumNotes.filter((_, i) => i !== existingIndex));
    } else {
        setDrumNotes([...drumNotes, { instrument: inst, step, velocity: 100 }]);
    }
  };

  const isStepActive = (inst: string, step: number) => {
    return drumNotes.some(n => n.instrument === inst && n.step === step);
  };

  return (
    <div className="flex flex-col h-full bg-daw-900 text-white p-4 gap-4">
      {/* Header & Controls */}
      <div className="bg-daw-800 p-4 rounded-lg border border-daw-700 flex flex-wrap justify-between items-center gap-4">
        <div className="flex flex-col gap-2">
            <div>
                <h2 className="text-xl font-bold text-daw-accent">Rhythm Section</h2>
                <p className="text-xs text-gray-400">
                     {melodyNotes.length > 0 ? "Linked to Melody" : "Independent"}
                </p>
            </div>
            <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-gray-500">BPM:</label>
                <input 
                    type="number" 
                    value={bpm}
                    onChange={(e) => setBpm(parseInt(e.target.value))}
                    className="w-16 bg-daw-900 border border-daw-600 rounded px-2 py-1 text-xs focus:border-daw-accent outline-none text-center font-mono text-daw-highlight"
                />
            </div>
        </div>

        <div className="flex gap-6 items-center flex-1 justify-center">
             <div className="w-32">
                <label className="text-[10px] uppercase font-bold text-gray-500">Groove / Swing</label>
                <input type="range" className="w-full h-1 bg-daw-600 rounded accent-daw-accent" value={settings.groove} onChange={e => setSettings({...settings, groove: parseInt(e.target.value)})} />
            </div>
             <div className="w-32">
                <label className="text-[10px] uppercase font-bold text-gray-500">Complexity</label>
                <input type="range" className="w-full h-1 bg-daw-600 rounded accent-daw-accent" value={settings.complexity} onChange={e => setSettings({...settings, complexity: parseInt(e.target.value)})} />
            </div>
             <div className="w-32">
                <label className="text-[10px] uppercase font-bold text-gray-500">Intensity</label>
                <input type="range" className="w-full h-1 bg-daw-600 rounded accent-daw-accent" value={settings.intensity} onChange={e => setSettings({...settings, intensity: parseInt(e.target.value)})} />
            </div>
        </div>

        <button 
            onClick={handleGenerate}
            disabled={loading}
            className={`px-6 py-2 rounded font-bold shadow-md ${loading ? 'bg-gray-600' : 'bg-daw-accent hover:bg-daw-highlight'}`}
        >
            {loading ? 'Programing Beat...' : 'Generate Drums'}
        </button>
      </div>

      {/* Sequencer Grid */}
      <div className="flex-1 bg-daw-800 rounded-lg border border-daw-700 p-6 overflow-auto custom-scrollbar">
        <div className="min-w-[800px]">
            {/* Timeline Header */}
            <div className="flex mb-2 ml-24">
                {Array.from({ length: STEPS }).map((_, i) => (
                    <div key={i} className={`flex-1 text-center text-[10px] ${i % 4 === 0 ? 'text-gray-300 font-bold' : 'text-daw-700'}`}>
                        {i % 4 === 0 ? (i/4)+1 : '.'}
                    </div>
                ))}
            </div>

            {/* Instrument Rows */}
            <div className="space-y-2">
                {INSTRUMENTS.map(inst => (
                    <div key={inst} className="flex items-center gap-2">
                        <div className="w-24 text-sm font-bold text-gray-400 text-right pr-4">{inst}</div>
                        <div className="flex-1 flex bg-daw-900 rounded border border-daw-700 h-10 relative">
                            {/* Grid Lines */}
                            <div className="absolute inset-0 flex pointer-events-none">
                                {Array.from({ length: STEPS }).map((_, i) => (
                                    <div key={i} className={`flex-1 border-r ${i % 4 === 0 ? 'border-daw-600' : 'border-daw-800'}`}></div>
                                ))}
                            </div>
                            
                            {/* Steps */}
                            {Array.from({ length: STEPS }).map((_, i) => {
                                const active = isStepActive(inst, i);
                                return (
                                    <div 
                                        key={i} 
                                        onClick={() => toggleStep(inst, i)}
                                        className="flex-1 z-10 cursor-pointer flex items-center justify-center group"
                                    >
                                        <div className={`w-3/4 h-3/4 rounded-sm transition-all duration-100 ${active ? 'bg-daw-success shadow-[0_0_10px_rgba(16,185,129,0.6)] scale-100' : 'bg-transparent hover:bg-daw-700 scale-90'}`}></div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default DrumSequencer;