import React, { useState, useEffect } from 'react';
import { Genre, MixSession, MixTrack, MixPlugin } from '../types';
import { generateMixSession } from '../services/geminiService';
import { useProject } from '../contexts/ProjectContext';

const MixingChain: React.FC = () => {
  const { genre: projectGenre } = useProject();
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<MixSession | null>(null);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);

  // Default initial state if nothing generated yet
  useEffect(() => {
    if (!session) {
        setSession({
            genre: projectGenre,
            tracks: [
                { id: '1', name: 'Kick', type: 'Audio', volume: -6.0, pan: 0, muted: false, soloed: false, color: '#ef4444', plugins: [] },
                { id: '2', name: 'Snare', type: 'Audio', volume: -9.0, pan: 0, muted: false, soloed: false, color: '#f59e0b', plugins: [] },
                { id: '3', name: 'Hi-Hats', type: 'Audio', volume: -12.0, pan: 15, muted: false, soloed: false, color: '#fbbf24', plugins: [] },
                { id: '4', name: 'Bass', type: 'Audio', volume: -8.0, pan: 0, muted: false, soloed: false, color: '#3b82f6', plugins: [] },
                { id: '5', name: 'Melody', type: 'Audio', volume: -10.0, pan: -20, muted: false, soloed: false, color: '#8b5cf6', plugins: [] },
                { id: '6', name: 'Vocals', type: 'Audio', volume: -5.0, pan: 0, muted: false, soloed: false, color: '#ec4899', plugins: [] },
                { id: 'master', name: 'Master', type: 'Master', volume: -0.1, pan: 0, muted: false, soloed: false, color: '#10b981', plugins: [] },
            ]
        })
    }
  }, []);

  const handleGenerateTemplate = async () => {
    setLoading(true);
    const result = await generateMixSession(projectGenre);
    if (result) {
        setSession(result);
        setSelectedTrackId(result.tracks[0].id);
    }
    setLoading(false);
  };

  const handleFaderChange = (trackId: string, newVal: number) => {
    if (!session) return;
    const updatedTracks = session.tracks.map(t => t.id === trackId ? { ...t, volume: newVal } : t);
    setSession({ ...session, tracks: updatedTracks });
  };

  const handlePanChange = (trackId: string, newVal: number) => {
    if (!session) return;
    const updatedTracks = session.tracks.map(t => t.id === trackId ? { ...t, pan: newVal } : t);
    setSession({ ...session, tracks: updatedTracks });
  };

  const toggleMute = (trackId: string) => {
      if (!session) return;
      const updatedTracks = session.tracks.map(t => t.id === trackId ? { ...t, muted: !t.muted } : t);
      setSession({ ...session, tracks: updatedTracks });
  }

  const toggleSolo = (trackId: string) => {
      if (!session) return;
      const updatedTracks = session.tracks.map(t => t.id === trackId ? { ...t, soloed: !t.soloed } : t);
      setSession({ ...session, tracks: updatedTracks });
  }

  const selectedTrack = session?.tracks.find(t => t.id === selectedTrackId);

  return (
    <div className="h-full flex flex-col bg-daw-900 text-white overflow-hidden">
      {/* Top Bar */}
      <div className="h-16 bg-daw-800 border-b border-daw-700 flex items-center justify-between px-6 shrink-0">
         <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-daw-accent">Mix Console</h2>
            <div className="text-xs text-gray-500 bg-daw-900 px-3 py-1 rounded border border-daw-700">
                GENRE: <span className="text-white font-bold uppercase">{projectGenre}</span>
            </div>
         </div>
         <button 
            onClick={handleGenerateTemplate}
            disabled={loading}
            className={`px-4 py-2 rounded font-bold text-sm shadow-md transition-colors ${loading ? 'bg-gray-700 text-gray-400' : 'bg-daw-accent hover:bg-daw-highlight'}`}
         >
            {loading ? 'Analyzing & Routing...' : 'Generate AI Mix Template'}
         </button>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Mixer View (Scrollable) */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden bg-daw-900 flex p-6 gap-2 custom-scrollbar items-end">
            {session?.tracks.map((track) => (
                <ChannelStrip 
                    key={track.id} 
                    track={track} 
                    isSelected={selectedTrackId === track.id}
                    onSelect={() => setSelectedTrackId(track.id)}
                    onVolumeChange={(val) => handleFaderChange(track.id, val)}
                    onPanChange={(val) => handlePanChange(track.id, val)}
                    onMute={() => toggleMute(track.id)}
                    onSolo={() => toggleSolo(track.id)}
                />
            ))}
        </div>

        {/* Inspector Panel (Right Side) */}
        <div className="w-80 bg-daw-800 border-l border-daw-700 flex flex-col shrink-0 z-10 shadow-xl">
            {selectedTrack ? (
                <div className="p-6 flex flex-col h-full overflow-y-auto">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-4 h-12 rounded" style={{ backgroundColor: selectedTrack.color || '#6366f1' }}></div>
                        <div>
                            <h3 className="text-2xl font-bold">{selectedTrack.name}</h3>
                            <p className="text-xs text-gray-400 uppercase tracking-widest">{selectedTrack.type} CHANNEL</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <h4 className="text-sm font-bold text-gray-500 uppercase mb-3 flex items-center justify-between">
                                Insert Chain
                                <span className="text-[10px] bg-daw-700 px-2 py-0.5 rounded text-gray-300">{selectedTrack.plugins.length} Slots</span>
                            </h4>
                            <div className="space-y-3">
                                {selectedTrack.plugins.length === 0 && (
                                    <p className="text-sm text-gray-500 italic">No plugins loaded. Generate a template to see AI suggestions.</p>
                                )}
                                {selectedTrack.plugins.map((plugin, idx) => (
                                    <div key={idx} className="bg-daw-900 border border-daw-600 rounded p-3 group hover:border-daw-accent transition-colors">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="font-bold text-daw-highlight text-sm">{plugin.name}</span>
                                            <span className={`w-2 h-2 rounded-full ${plugin.active ? 'bg-green-500 shadow-[0_0_5px_lime]' : 'bg-gray-600'}`}></span>
                                        </div>
                                        <div className="text-xs text-gray-300 font-mono bg-black/30 p-2 rounded border border-white/5">
                                            {plugin.settings}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="p-4 bg-daw-900 rounded border border-daw-700">
                             <h4 className="text-sm font-bold text-gray-500 uppercase mb-2">Routing</h4>
                             <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Input</span>
                                <span>In 1-2</span>
                             </div>
                             <div className="flex justify-between text-sm mt-1">
                                <span className="text-gray-400">Output</span>
                                <span className="text-daw-accent">Master</span>
                             </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex items-center justify-center h-full text-gray-500 p-6 text-center">
                    Select a track to view AI processing chain.
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

// Sub-component for individual Channel Strip
const ChannelStrip: React.FC<{
    track: MixTrack;
    isSelected: boolean;
    onSelect: () => void;
    onVolumeChange: (val: number) => void;
    onPanChange: (val: number) => void;
    onMute: () => void;
    onSolo: () => void;
}> = ({ track, isSelected, onSelect, onVolumeChange, onPanChange, onMute, onSolo }) => {
    
    // Calculate meter height based on volume (fake visual)
    const meterHeight = Math.min(100, Math.max(0, (track.volume + 60) * 1.5));
    
    return (
        <div 
            onClick={onSelect}
            className={`w-24 bg-daw-800 border-r border-daw-700 flex flex-col shrink-0 transition-colors relative group select-none ${isSelected ? 'bg-daw-700' : ''}`}
            style={{ height: '500px' }}
        >
            {/* Top: Inserts (Mini View) */}
            <div className="flex-1 bg-daw-900/50 p-1 flex flex-col gap-1 overflow-hidden border-b border-daw-700">
                {Array.from({length: 4}).map((_, i) => {
                    const plugin = track.plugins[i];
                    return (
                        <div key={i} className={`h-6 rounded-sm text-[9px] flex items-center justify-center truncate px-1 border border-white/5 ${plugin ? 'bg-daw-600 text-gray-200' : 'bg-daw-900/30 text-gray-700'}`}>
                            {plugin ? plugin.name : ''}
                        </div>
                    )
                })}
            </div>

            {/* Middle: Pan & Fader */}
            <div className="h-[300px] flex flex-col items-center py-2 gap-2 bg-daw-800 relative">
                {/* Pan Knob */}
                <div className="w-10 h-10 rounded-full border-2 border-daw-600 relative flex items-center justify-center mb-2">
                    <input 
                        type="range" 
                        min="-50" max="50" 
                        value={track.pan} 
                        onChange={(e) => onPanChange(parseInt(e.target.value))}
                        className="opacity-0 absolute inset-0 w-full h-full cursor-ns-resize" 
                        title={`Pan: ${track.pan}`}
                    />
                    <div 
                        className="w-1 h-4 bg-daw-accent rounded-full absolute bottom-1/2 origin-bottom transition-transform pointer-events-none"
                        style={{ transform: `rotate(${track.pan * 2.5}deg)` }}
                    ></div>
                </div>

                {/* Fader Area */}
                <div className="flex-1 flex gap-2 w-full justify-center px-2 relative">
                    {/* Meter */}
                    <div className="w-2 bg-daw-900 rounded-full overflow-hidden flex flex-col justify-end border border-daw-700">
                        <div 
                            className={`w-full transition-all duration-100 ${track.volume > 0 ? 'bg-red-500' : 'bg-green-500'}`} 
                            style={{ height: `${meterHeight}%` }}
                        ></div>
                    </div>

                    {/* Fader Track */}
                    <div className="relative w-8 h-full bg-black/20 rounded-lg border border-daw-700 flex justify-center">
                         {/* Fader Cap - using range input rotated */}
                         <input 
                            type="range"
                            min="-60"
                            max="6"
                            step="0.1"
                            value={track.volume}
                            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                            className="mixer-fader"
                            style={{
                                appearance: 'none',
                                width: '220px', // Length of fader track visually
                                height: '32px', // Width of fader track
                                background: 'transparent',
                                transform: 'rotate(-90deg)',
                                transformOrigin: 'center',
                                position: 'absolute',
                                top: '45%', // Center vertically approx
                                cursor: 'pointer'
                            }}
                         />
                         {/* Visual Cap */}
                         <div 
                            className="absolute w-8 h-12 bg-gray-300 rounded shadow-lg border-b-4 border-gray-400 pointer-events-none"
                            style={{ 
                                bottom: `${((track.volume + 60) / 66) * 100}%`,
                                transform: 'translateY(50%)'
                            }}
                         >
                            <div className="w-full h-0.5 bg-black mt-5"></div>
                         </div>
                    </div>
                </div>
            </div>

            {/* Bottom: Controls & Name */}
            <div className="h-28 bg-daw-800 border-t border-daw-700 p-2 flex flex-col gap-2">
                 <div className="flex gap-1">
                    <button 
                        onClick={(e) => { e.stopPropagation(); onMute(); }}
                        className={`flex-1 py-1 text-[10px] font-bold rounded border ${track.muted ? 'bg-red-900 border-red-500 text-red-100' : 'bg-daw-700 border-daw-600 text-gray-400 hover:text-white'}`}
                    >
                        M
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onSolo(); }}
                        className={`flex-1 py-1 text-[10px] font-bold rounded border ${track.soloed ? 'bg-yellow-600 border-yellow-400 text-white' : 'bg-daw-700 border-daw-600 text-gray-400 hover:text-white'}`}
                    >
                        S
                    </button>
                 </div>
                 <div className="text-center font-mono text-xs text-daw-accent">
                    {track.volume > -60 ? `${track.volume.toFixed(1)}` : '-inf'}
                 </div>
                 <div className={`mt-auto py-1 px-2 rounded text-center text-xs font-bold truncate ${isSelected ? 'bg-gray-200 text-black' : 'bg-black/40 text-gray-300'}`}>
                    {track.name}
                 </div>
                 <div className="h-1 w-full rounded-full" style={{ backgroundColor: track.color }}></div>
            </div>
        </div>
    )
}

export default MixingChain;