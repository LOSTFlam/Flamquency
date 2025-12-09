

import { useState, type FC } from 'react';
import { DrumSettings, DrumNote, QuantizationValue } from '../types';
import { generateDrumPattern } from '../services/geminiService';
import { useProject } from '../contexts/ProjectContext';

const INSTRUMENTS = ['Kick', 'Snare', 'Clap', 'HiHatClosed', 'HiHatOpen', 'Perc'];

const DrumSequencer: FC = () => {
  const { drumNotes, setDrumNotes, melodyNotes, genre, bpm, setBpm } = useProject();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<DrumSettings>({
    groove: 50,
    complexity: 50,
    intensity: 75,
    quantization: '1/16'
  });

  const handleGenerate = async () => {
    setLoading(true);
    const newDrums = await generateDrumPattern(genre, bpm, settings, melodyNotes);
    setDrumNotes(newDrums);
    setLoading(false);
  };

  // Calculate visual grid steps based on quantization
  // 2 Bars view
  const getStepsPerBar = (q: QuantizationValue) => {
      switch(q) {
          case '1/4': return 4;
          case '1/8': return 8;
          case '1/16': return 16;
          case '1/32': return 32;
          case '1/8T': return 12; // 3 per beat
          case '1/16T': return 24; // 6 per beat
          case '1/8D': return 16; // Use 16 grid for dotted visual simplicity
          default: return 16;
      }
  };

  const stepsPerBar = getStepsPerBar(settings.quantization);
  const totalGridSteps = stepsPerBar * 2; // 2 bars

  // Helper to map grid index to 16th-note based step time
  const gridIndexToStepTime = (index: number) => {
      // 1 bar = 16 16th notes
      // If 1/8T, 1 bar = 12 grid steps.
      // So 1 grid step = 16 / 12 = 1.3333 16th notes
      const stepSize = 16 / stepsPerBar;
      return index * stepSize;
  };

  const toggleStep = (inst: any, gridIndex: number) => {
    const stepTime = gridIndexToStepTime(gridIndex);
    
    // Check if a note exists near this time (fuzzy match for float precision)
    const existingIndex = drumNotes.findIndex(n => 
        n.instrument === inst && Math.abs(n.step - stepTime) < 0.1
    );

    if (existingIndex > -1) {
        setDrumNotes(drumNotes.filter((_, i) => i !== existingIndex));
    } else {
        setDrumNotes([...drumNotes, { instrument: inst, step: stepTime, velocity: 100 }]);
    }
  };

  const isStepActive = (inst: string, gridIndex: number) => {
    const stepTime = gridIndexToStepTime(gridIndex);
    return drumNotes.some(n => n.instrument === inst && Math.abs(n.step - stepTime) < 0.1);
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

        <div className="flex gap-4 items-center flex-1 justify-center flex-wrap">
             <div className="w-32">
                <label className="text-[10px] uppercase font-bold text-gray-500">Groove</label>
                <input type="range" className="w-full h-1 bg-daw-600 rounded accent-daw-accent" value={settings.groove} onChange={e => setSettings({...settings, groove: parseInt(e.target.value)})} />
            </div>
             <div className="w-32">
                <label className="text-[10px] uppercase font-bold text-gray-500">Complexity</label>
                <input type="range" className="w-full h-1 bg-daw-600 rounded accent-daw-accent" value={settings.complexity} onChange={e => setSettings({...settings, complexity: parseInt(e.target.value)})} />
            </div>
             <div className="w-24">
                <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">Grid</label>
                <select 
                    value={settings.quantization} 
                    onChange={(e) => setSettings({...settings, quantization: e.target.value as QuantizationValue})}
                    className="w-full bg-daw-900 border border-daw-600 rounded px-2 py-1 text-xs focus:border-daw-accent outline-none"
                >
                    <option value="1/16">1/16</option>
                    <option value="1/32">1/32</option>
                    <option value="1/8T">1/8 Triplet</option>
                    <option value="1/16T">1/16 Triplet</option>
                    <option value="1/8D">1/8 Dotted</option>
                </select>
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
                {Array.from({ length: totalGridSteps }).map((_, i) => {
                    const stepsPerBeat = stepsPerBar / 4;
                    const isBeat = i % stepsPerBeat === 0;
                    return (
                        <div key={i} className={`flex-1 text-center text-[10px] ${isBeat ? 'text-gray-300 font-bold' : 'text-daw-700'}`}>
                            {isBeat ? Math.floor(i/stepsPerBeat)+1 : '.'}
                        </div>
                    )
                })}
            </div>

            {/* Instrument Rows */}
            <div className="space-y-2">
                {INSTRUMENTS.map(inst => (
                    <div key={inst} className="flex items-center gap-2">
                        <div className="w-24 text-sm font-bold text-gray-400 text-right pr-4">{inst}</div>
                        <div className="flex-1 flex bg-daw-900 rounded border border-daw-700 h-10 relative">
                            {/* Grid Lines */}
                            <div className="absolute inset-0 flex pointer-events-none">
                                {Array.from({ length: totalGridSteps }).map((_, i) => {
                                    const stepsPerBeat = stepsPerBar / 4;
                                    const isBeat = i % stepsPerBeat === 0;
                                    return (
                                        <div key={i} className={`flex-1 border-r ${isBeat ? 'border-daw-600' : 'border-daw-800'}`}></div>
                                    )
                                })}
                            </div>
                            
                            {/* Steps */}
                            {Array.from({ length: totalGridSteps }).map((_, i) => {
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