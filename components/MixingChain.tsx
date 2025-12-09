

import { useState, useEffect, type FC } from 'react';
import { Genre, MixSession, MixTrack, MixPlugin, MixPluginParameter } from '../types';
import { generateMixSession } from '../services/geminiService';
import { useProject } from '../contexts/ProjectContext';

const PLUGIN_PRESETS: Record<string, Partial<MixPlugin>> = {
    'EQ': {
        name: 'Pro EQ',
        type: 'Equalizer',
        parameters: [
             { name: 'Low Cut', value: 80, min: 20, max: 200, unit: 'Hz' },
             { name: 'Low Gain', value: 0, min: -12, max: 12, unit: 'dB' },
             { name: 'Mid Freq', value: 1000, min: 200, max: 5000, unit: 'Hz' },
             { name: 'Mid Gain', value: 0, min: -12, max: 12, unit: 'dB' },
             { name: 'High Gain', value: 0, min: -12, max: 12, unit: 'dB' }
        ]
    },
    'Compressor': {
        name: 'VCA Comp',
        type: 'Compressor',
        parameters: [
             { name: 'Threshold', value: -10, min: -60, max: 0, unit: 'dB' },
             { name: 'Ratio', value: 2, min: 1, max: 20, unit: ':1' },
             { name: 'Attack', value: 10, min: 0.1, max: 100, unit: 'ms' },
             { name: 'Release', value: 100, min: 10, max: 1000, unit: 'ms' },
             { name: 'Makeup', value: 0, min: 0, max: 24, unit: 'dB' }
        ]
    },
    'Saturation': {
        name: 'Warm Tube',
        type: 'Saturation',
        parameters: [
            { name: 'Drive', value: 20, min: 0, max: 100, unit: '%' },
            { name: 'Tone', value: 50, min: 0, max: 100, unit: '%' },
            { name: 'Mix', value: 100, min: 0, max: 100, unit: '%' }
        ]
    },
    'Delay': {
        name: 'Echo Tap',
        type: 'Delay',
        parameters: [
            { name: 'Time', value: 250, min: 10, max: 2000, unit: 'ms' },
            { name: 'Feedback', value: 30, min: 0, max: 100, unit: '%' },
            { name: 'Mix', value: 40, min: 0, max: 100, unit: '%' },
            { name: 'Filter', value: 2000, min: 500, max: 10000, unit: 'Hz' }
        ]
    },
    'Reverb': {
        name: 'Room Verb',
        type: 'Reverb',
        parameters: [
            { name: 'Decay', value: 1.5, min: 0.1, max: 10.0, unit: 's' },
            { name: 'Pre-Delay', value: 20, min: 0, max: 200, unit: 'ms' },
            { name: 'Size', value: 60, min: 0, max: 100, unit: '%' },
            { name: 'Mix', value: 30, min: 0, max: 100, unit: '%' }
        ]
    },
    'Limiter': {
        name: 'Brickwall',
        type: 'Limiter',
        parameters: [
            { name: 'Ceiling', value: -0.1, min: -1.0, max: 0, unit: 'dB' },
            { name: 'Threshold', value: 0, min: -20, max: 0, unit: 'dB' },
            { name: 'Release', value: 50, min: 1, max: 500, unit: 'ms' }
        ]
    },
    'Chorus': {
        name: 'Ensemble',
        type: 'Modulation',
        parameters: [
            { name: 'Rate', value: 1.2, min: 0.1, max: 10, unit: 'Hz' },
            { name: 'Depth', value: 50, min: 0, max: 100, unit: '%' },
            { name: 'Mix', value: 40, min: 0, max: 100, unit: '%' }
        ]
    }
};

const MixingChain: FC = () => {
  const { genre: projectGenre, mixSession, setMixSession } = useProject();
  const [loading, setLoading] = useState(false);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [newPluginType, setNewPluginType] = useState('EQ');

  // Initialize Default Session if empty (first time load only)
  useEffect(() => {
    if (!mixSession) {
        setMixSession({
            genre: projectGenre,
            tracks: [
                { id: '1', name: 'Kick', type: 'Audio', volume: -6.0, pan: 0, muted: false, soloed: false, color: '#ef4444', plugins: [], sends: [] },
                { id: '2', name: 'Snare', type: 'Audio', volume: -9.0, pan: 0, muted: false, soloed: false, color: '#f59e0b', plugins: [], sends: [{ busId: 'bus1', amount: -12 }] },
                { id: '3', name: 'Hi-Hats', type: 'Audio', volume: -12.0, pan: 15, muted: false, soloed: false, color: '#fbbf24', plugins: [], sends: [] },
                { id: '4', name: 'Bass', type: 'Audio', volume: -8.0, pan: 0, muted: false, soloed: false, color: '#3b82f6', plugins: [], sends: [] },
                { id: '5', name: 'Melody', type: 'Audio', volume: -10.0, pan: -20, muted: false, soloed: false, color: '#8b5cf6', plugins: [], sends: [{ busId: 'bus1', amount: -6 }] },
                { id: '6', name: 'Vocals', type: 'Audio', volume: -5.0, pan: 0, muted: false, soloed: false, color: '#ec4899', plugins: [], sends: [{ busId: 'bus1', amount: -3 }, { busId: 'bus2', amount: -10 }] },
                { id: 'bus1', name: 'Reverb', type: 'Bus', volume: -3.0, pan: 0, muted: false, soloed: false, color: '#14b8a6', plugins: [{
                    id: 'p1', name: 'Large Hall', type: 'Reverb', settings: '2.5s Decay', active: true,
                    parameters: [
                        { name: 'Decay', value: 2.5, min: 0.1, max: 10.0, unit: 's' },
                        { name: 'Pre-Delay', value: 20, min: 0, max: 200, unit: 'ms' },
                        { name: 'Size', value: 80, min: 0, max: 100, unit: '%' },
                        { name: 'Mix', value: 100, min: 0, max: 100, unit: '%' }
                    ]
                }], sends: [] },
                { id: 'bus2', name: 'Delay', type: 'Bus', volume: -3.0, pan: 0, muted: false, soloed: false, color: '#06b6d4', plugins: [], sends: [] },
                { id: 'master', name: 'Master', type: 'Master', volume: -0.1, pan: 0, muted: false, soloed: false, color: '#10b981', plugins: [], sends: [] },
            ]
        });
    }
  }, [mixSession, projectGenre, setMixSession]);

  const handleGenerateTemplate = async () => {
    setLoading(true);
    const result = await generateMixSession(projectGenre);
    if (result) {
        setMixSession(result);
        setSelectedTrackId(result.tracks[0].id);
    }
    setLoading(false);
  };

  const handleAddBus = () => {
      if (!mixSession) return;
      const newBusId = `bus-${Date.now()}`;
      const newBus: MixTrack = {
          id: newBusId,
          name: 'New Bus',
          type: 'Bus',
          volume: 0,
          pan: 0,
          muted: false,
          soloed: false,
          color: '#14b8a6',
          plugins: [],
          sends: []
      };
      // Insert before Master
      const tracks = [...mixSession.tracks];
      const masterIdx = tracks.findIndex(t => t.type === 'Master');
      if (masterIdx !== -1) {
          tracks.splice(masterIdx, 0, newBus);
      } else {
          tracks.push(newBus);
      }
      setMixSession({...mixSession, tracks});
  }

  // --- Plugin Management ---

  const handleAddPlugin = (trackId: string) => {
      if (!mixSession) return;
      const preset = PLUGIN_PRESETS[newPluginType];
      if (!preset) return;

      const newPlugin: MixPlugin = {
          id: `p-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: preset.name || newPluginType,
          type: preset.type || newPluginType,
          settings: 'Default',
          active: true,
          parameters: preset.parameters ? JSON.parse(JSON.stringify(preset.parameters)) : [] // Deep copy params
      };

      const updatedTracks = mixSession.tracks.map(t => {
          if (t.id !== trackId) return t;
          return { ...t, plugins: [...t.plugins, newPlugin] };
      });
      setMixSession({ ...mixSession, tracks: updatedTracks });
  };

  const handleRemovePlugin = (trackId: string, pluginId: string) => {
      if (!mixSession) return;
      const updatedTracks = mixSession.tracks.map(t => {
          if (t.id !== trackId) return t;
          return { ...t, plugins: t.plugins.filter(p => p.id !== pluginId) };
      });
      setMixSession({ ...mixSession, tracks: updatedTracks });
  };

  const handleMovePlugin = (trackId: string, pluginId: string, direction: 'up' | 'down') => {
      if (!mixSession) return;
      const track = mixSession.tracks.find(t => t.id === trackId);
      if (!track) return;
      
      const idx = track.plugins.findIndex(p => p.id === pluginId);
      if (idx === -1) return;
      if (direction === 'up' && idx === 0) return;
      if (direction === 'down' && idx === track.plugins.length - 1) return;

      const newPlugins = [...track.plugins];
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
      
      [newPlugins[idx], newPlugins[swapIdx]] = [newPlugins[swapIdx], newPlugins[idx]];

      const updatedTracks = mixSession.tracks.map(t => {
          if (t.id !== trackId) return t;
          return { ...t, plugins: newPlugins };
      });
      setMixSession({ ...mixSession, tracks: updatedTracks });
  };

  // --- Track Parameters ---

  const handleFaderChange = (trackId: string, newVal: number) => {
    if (!mixSession) return;
    const updatedTracks = mixSession.tracks.map(t => t.id === trackId ? { ...t, volume: newVal } : t);
    setMixSession({ ...mixSession, tracks: updatedTracks });
  };

  const handlePanChange = (trackId: string, newVal: number) => {
    if (!mixSession) return;
    const updatedTracks = mixSession.tracks.map(t => t.id === trackId ? { ...t, pan: newVal } : t);
    setMixSession({ ...mixSession, tracks: updatedTracks });
  };

  const toggleMute = (trackId: string) => {
      if (!mixSession) return;
      const updatedTracks = mixSession.tracks.map(t => t.id === trackId ? { ...t, muted: !t.muted } : t);
      setMixSession({ ...mixSession, tracks: updatedTracks });
  }

  const toggleSolo = (trackId: string) => {
      if (!mixSession) return;
      const updatedTracks = mixSession.tracks.map(t => t.id === trackId ? { ...t, soloed: !t.soloed } : t);
      setMixSession({ ...mixSession, tracks: updatedTracks });
  }

  const handlePluginParamChange = (trackId: string, pluginId: string, paramName: string, newValue: number) => {
      if (!mixSession) return;
      const updatedTracks = mixSession.tracks.map(t => {
          if (t.id !== trackId) return t;
          return {
              ...t,
              plugins: t.plugins.map(p => {
                  if (p.id !== pluginId) return p;
                  return {
                      ...p,
                      parameters: p.parameters?.map(param => 
                          param.name === paramName ? { ...param, value: newValue } : param
                      )
                  };
              })
          }
      });
      setMixSession({ ...mixSession, tracks: updatedTracks });
  }
  
  const togglePluginActive = (trackId: string, pluginId: string) => {
      if (!mixSession) return;
      const updatedTracks = mixSession.tracks.map(t => {
          if (t.id !== trackId) return t;
          return {
              ...t,
              plugins: t.plugins.map(p => {
                  if (p.id !== pluginId) return p;
                  return { ...p, active: !p.active };
              })
          }
      });
      setMixSession({ ...mixSession, tracks: updatedTracks });
  }

  const selectedTrack = mixSession?.tracks.find(t => t.id === selectedTrackId);
  const busTracks = mixSession?.tracks.filter(t => t.type === 'Bus') || [];

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
         <div className="flex gap-4">
             <button 
                onClick={handleAddBus}
                className="px-4 py-2 rounded font-bold text-sm bg-daw-700 hover:bg-daw-600 border border-daw-600 text-gray-200"
             >
                + Add Bus
             </button>
             <button 
                onClick={handleGenerateTemplate}
                disabled={loading}
                className={`px-4 py-2 rounded font-bold text-sm shadow-md transition-colors ${loading ? 'bg-gray-700 text-gray-400' : 'bg-daw-accent hover:bg-daw-highlight'}`}
             >
                {loading ? 'Routing & Mixing...' : 'Generate AI Mix Session'}
             </button>
         </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Mixer View (Scrollable) */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden bg-daw-900 flex p-6 gap-2 custom-scrollbar items-end">
            {mixSession?.tracks.map((track) => (
                <ChannelStrip 
                    key={track.id} 
                    track={track} 
                    allTracks={mixSession.tracks}
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
        <div className="w-[450px] bg-daw-800 border-l border-daw-700 flex flex-col shrink-0 z-10 shadow-xl">
            {selectedTrack ? (
                <div className="p-6 flex flex-col h-full overflow-y-auto custom-scrollbar">
                    <div className="flex items-center gap-3 mb-6 pb-6 border-b border-daw-700">
                        <div className="w-4 h-12 rounded" style={{ backgroundColor: selectedTrack.color || '#6366f1' }}></div>
                        <div>
                            <h3 className="text-2xl font-bold tracking-tight">{selectedTrack.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest bg-daw-900 px-2 py-0.5 rounded border border-daw-700">{selectedTrack.type} CHANNEL</span>
                                {selectedTrack.type === 'Bus' && <span className="text-[10px] bg-cyan-900/50 text-cyan-200 px-2 py-0.5 rounded border border-cyan-800">RETURN</span>}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6 flex-1 flex flex-col">
                        {/* Inserts & Parameters */}
                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                            <h4 className="text-sm font-bold text-gray-500 uppercase mb-4 flex items-center justify-between sticky top-0 bg-daw-800 z-10 py-2">
                                VST Rack
                                <span className="text-[10px] bg-daw-700 px-2 py-0.5 rounded text-gray-300 shadow-inner">{selectedTrack.plugins.length} Units</span>
                            </h4>
                            <div className="space-y-4 pb-4">
                                {selectedTrack.plugins.length === 0 && (
                                    <div className="p-8 border-2 border-dashed border-daw-700 rounded-lg text-center">
                                        <p className="text-gray-500 italic">No plugins loaded on this channel.</p>
                                    </div>
                                )}
                                {selectedTrack.plugins.map((plugin, idx) => (
                                    <div key={plugin.id} className={`rounded-lg overflow-hidden border shadow-lg transition-colors ${plugin.active ? 'border-gray-600 bg-gradient-to-b from-daw-700 to-daw-800' : 'border-daw-700 bg-daw-800/40 opacity-70'}`}>
                                        {/* Rack Header */}
                                        <div className="bg-black/30 px-3 py-2 flex justify-between items-center border-b border-white/5">
                                            <div className="flex items-center gap-2">
                                                 {/* Rack Screw Left */}
                                                 <div className="w-2.5 h-2.5 rounded-full bg-zinc-700 border border-zinc-900 shadow-inner flex items-center justify-center">
                                                     <div className="w-1.5 h-px bg-zinc-900 rotate-45"></div>
                                                 </div>
                                                 <div className="flex flex-col">
                                                     <span className={`font-bold text-sm leading-none ${plugin.active ? 'text-gray-200' : 'text-gray-500'}`}>{plugin.name}</span>
                                                     <span className="text-[9px] text-gray-500 uppercase tracking-wider">{plugin.type}</span>
                                                 </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {/* Reorder / Delete Controls */}
                                                <div className="flex items-center gap-1 mr-2 opacity-50 hover:opacity-100 transition-opacity">
                                                    <button 
                                                        onClick={() => handleMovePlugin(selectedTrack.id, plugin.id, 'up')}
                                                        disabled={idx === 0}
                                                        className="hover:text-daw-accent disabled:opacity-20 disabled:cursor-not-allowed"
                                                        title="Move Up"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                                                    </button>
                                                    <button 
                                                        onClick={() => handleMovePlugin(selectedTrack.id, plugin.id, 'down')}
                                                        disabled={idx === selectedTrack.plugins.length - 1}
                                                        className="hover:text-daw-accent disabled:opacity-20 disabled:cursor-not-allowed"
                                                        title="Move Down"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                                    </button>
                                                    <button 
                                                        onClick={() => handleRemovePlugin(selectedTrack.id, plugin.id)}
                                                        className="hover:text-red-500 ml-1"
                                                        title="Remove Plugin"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                    </button>
                                                </div>

                                                <button 
                                                    onClick={() => togglePluginActive(selectedTrack.id, plugin.id)}
                                                    className={`w-8 h-4 rounded-full flex items-center p-0.5 transition-colors ${plugin.active ? 'bg-green-900/50 border border-green-700 justify-end' : 'bg-red-900/30 border border-red-900 justify-start'}`}
                                                    title={plugin.active ? 'Bypass' : 'Activate'}
                                                >
                                                    <div className={`w-3 h-3 rounded-full shadow-md ${plugin.active ? 'bg-green-400 shadow-[0_0_5px_lime]' : 'bg-red-800'}`}></div>
                                                </button>
                                                 {/* Rack Screw Right */}
                                                 <div className="w-2.5 h-2.5 rounded-full bg-zinc-700 border border-zinc-900 shadow-inner flex items-center justify-center">
                                                     <div className="w-1.5 h-px bg-zinc-900 rotate-45"></div>
                                                 </div>
                                            </div>
                                        </div>
                                        
                                        {/* Parameters Faceplate */}
                                        <div className="p-4 relative">
                                            {/* Subtle Texture */}
                                            <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] pointer-events-none"></div>
                                            
                                            {plugin.parameters && plugin.parameters.length > 0 ? (
                                                <div className="flex flex-wrap gap-x-6 gap-y-4 justify-center relative z-10">
                                                    {plugin.parameters.map((param, pIdx) => (
                                                        <Knob 
                                                            key={pIdx}
                                                            label={param.name}
                                                            value={param.value}
                                                            min={param.min}
                                                            max={param.max}
                                                            unit={param.unit}
                                                            onChange={(val) => handlePluginParamChange(selectedTrack.id, plugin.id, param.name, val)}
                                                            active={plugin.active}
                                                        />
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-xs text-gray-400 font-mono text-center p-2 bg-black/20 rounded border border-white/5">
                                                    {plugin.settings}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {/* Add Plugin Button */}
                                <div className="p-4 border border-dashed border-daw-600 rounded-lg flex flex-col gap-2 items-center justify-center bg-daw-900/30">
                                    <span className="text-xs font-bold text-gray-500 uppercase">Add Insert Effect</span>
                                    <div className="flex gap-2 w-full max-w-[200px]">
                                        <select 
                                            value={newPluginType}
                                            onChange={(e) => setNewPluginType(e.target.value)}
                                            className="flex-1 bg-daw-800 border border-daw-600 rounded px-2 py-1 text-xs text-white outline-none focus:border-daw-accent"
                                        >
                                            {Object.keys(PLUGIN_PRESETS).map(type => (
                                                <option key={type} value={type}>{type}</option>
                                            ))}
                                        </select>
                                        <button 
                                            onClick={() => handleAddPlugin(selectedTrack.id)}
                                            className="bg-daw-600 hover:bg-daw-500 px-3 py-1 rounded text-xs font-bold transition-colors"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Routing Table */}
                        <div className="p-4 bg-daw-900/50 rounded-lg border border-daw-700 mt-4 shrink-0">
                             <h4 className="text-xs font-bold text-gray-500 uppercase mb-3 tracking-wider">Signal Routing</h4>
                             
                             <div className="space-y-2 text-sm">
                                 {/* Sends */}
                                 {selectedTrack.type === 'Audio' && (
                                     <div className="py-2 border-b border-daw-800">
                                        <span className="text-[10px] text-gray-500 block mb-2 uppercase">Sends</span>
                                        {busTracks.length === 0 && <span className="text-xs text-gray-600 italic">No buses created</span>}
                                        {busTracks.map(bus => {
                                            const send = selectedTrack.sends.find(s => s.busId === bus.id);
                                            return (
                                                <div key={bus.id} className="flex justify-between items-center mb-1 group">
                                                    <span className="text-xs text-cyan-500 font-bold">→ {bus.name}</span>
                                                    <span className={`font-mono text-xs ${send ? 'text-white' : 'text-gray-600'}`}>
                                                        {send ? `${send.amount} dB` : '-inf'}
                                                    </span>
                                                </div>
                                            )
                                        })}
                                     </div>
                                 )}

                                 {/* Output */}
                                 <div className="flex justify-between items-center pt-2">
                                    <span className="text-gray-400 text-xs">Output Dest</span>
                                    <span className="text-daw-accent font-bold text-xs bg-daw-800 px-2 py-1 rounded border border-daw-700">
                                        {selectedTrack.type === 'Master' ? 'Stereo Out (1-2)' : 'Master'}
                                    </span>
                                 </div>
                             </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 p-6 text-center">
                    <div className="w-16 h-16 rounded-full bg-daw-700/50 flex items-center justify-center mb-4">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                    </div>
                    <p className="text-lg font-bold text-gray-400">No Track Selected</p>
                    <p className="text-sm">Select a channel strip to view effects chain and routing.</p>
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
    allTracks: MixTrack[];
    isSelected: boolean;
    onSelect: () => void;
    onVolumeChange: (val: number) => void;
    onPanChange: (val: number) => void;
    onMute: () => void;
    onSolo: () => void;
}> = ({ track, allTracks, isSelected, onSelect, onVolumeChange, onPanChange, onMute, onSolo }) => {
    
    // Calculate meter height based on volume (fake visual)
    const meterHeight = Math.min(100, Math.max(0, (track.volume + 60) * 1.5));
    const busTracks = allTracks.filter(t => t.type === 'Bus');
    const isBus = track.type === 'Bus';
    const isMaster = track.type === 'Master';
    
    return (
        <div 
            onClick={onSelect}
            className={`w-28 border-r border-daw-700 flex flex-col shrink-0 transition-colors relative group select-none shadow-lg
                ${isSelected ? 'bg-daw-700 border-r-gray-500 z-10' : 'bg-daw-800'}
                ${isBus ? 'bg-gray-800/80' : ''}
                ${isMaster ? 'bg-black border-l-4 border-l-daw-700' : ''}
            `}
            style={{ height: '600px' }}
        >
            {/* Top Label for Track Type */}
            {isBus && <div className="absolute top-0 left-0 w-full text-[9px] text-center bg-cyan-900/50 text-cyan-200 py-0.5 font-bold tracking-wider">BUS</div>}
            {isMaster && <div className="absolute top-0 left-0 w-full text-[9px] text-center bg-daw-accent/20 text-daw-accent py-0.5 font-bold tracking-wider">MASTER</div>}

            {/* Section 1: Inserts (Mini View) */}
            <div className={`flex-1 p-1 flex flex-col gap-1 overflow-hidden border-b border-daw-700 ${isMaster ? 'pt-6' : 'pt-5'}`}>
                {Array.from({length: 4}).map((_, i) => {
                    const plugin = track.plugins[i];
                    return (
                        <div key={i} className={`h-5 rounded-sm text-[8px] flex items-center justify-center truncate px-1 border border-white/5 cursor-help transition-all ${plugin ? (plugin.active ? 'bg-daw-600 text-gray-200 shadow-sm' : 'bg-red-900/20 text-red-300/50 italic') : 'bg-daw-900/30 text-gray-700'}`} title={plugin?.name}>
                            {plugin ? plugin.name : ''}
                        </div>
                    )
                })}
            </div>

            {/* Section 2: Sends (Only for Audio Tracks) */}
            {!isMaster && !isBus && (
                <div className="h-auto py-2 bg-daw-900/20 border-b border-daw-700 flex flex-col gap-1 px-2">
                     <span className="text-[8px] text-gray-500 uppercase text-center mb-0.5 font-bold">Sends</span>
                     {busTracks.map(bus => {
                         const send = track.sends.find(s => s.busId === bus.id);
                         const sendLevel = send ? send.amount : -60;
                         const hasSend = sendLevel > -60;
                         
                         return (
                             <div key={bus.id} className="flex items-center gap-1 group/send">
                                 {/* Send Knob (Visual) */}
                                 <div className={`w-5 h-5 rounded-full border border-gray-600 relative ${hasSend ? 'bg-cyan-900/50 border-cyan-500' : 'bg-transparent'}`}>
                                     <div 
                                        className="absolute top-1/2 left-1/2 w-0.5 h-2 bg-gray-400 origin-top -translate-x-1/2 -translate-y-1/2"
                                        style={{ transform: `translate(-50%, -50%) rotate(${(sendLevel + 60) * 2.5}deg)` }}
                                     ></div>
                                 </div>
                                 <span className="text-[8px] text-gray-400 truncate w-full group-hover/send:text-cyan-300">{bus.name}</span>
                             </div>
                         )
                     })}
                     {busTracks.length === 0 && <div className="h-4"></div>}
                </div>
            )}

            {/* Section 3: Pan & Fader */}
            <div className="h-[320px] flex flex-col items-center py-2 gap-2 bg-daw-800/50 relative">
                {/* Pan Knob */}
                <div className="w-9 h-9 rounded-full border-2 border-daw-600 relative flex items-center justify-center mb-2 bg-daw-800 shadow-md hover:border-daw-accent cursor-ns-resize group/pan">
                    <input 
                        type="range" 
                        min="-50" max="50" 
                        value={track.pan} 
                        onChange={(e) => onPanChange(parseInt(e.target.value))}
                        className="opacity-0 absolute inset-0 w-full h-full cursor-ns-resize" 
                        title={`Pan: ${track.pan}`}
                    />
                    <div 
                        className="w-0.5 h-3 bg-white rounded-full absolute bottom-1/2 origin-bottom transition-transform pointer-events-none group-hover/pan:bg-daw-accent"
                        style={{ transform: `rotate(${track.pan * 1.5}deg)` }}
                    ></div>
                </div>

                {/* Fader Area */}
                <div className="flex-1 flex gap-2 w-full justify-center px-2 relative">
                    {/* Meter */}
                    <div className="w-2 bg-daw-900 rounded-sm overflow-hidden flex flex-col justify-end border border-daw-700 shadow-inner">
                        <div 
                            className={`w-full transition-all duration-75 ease-out ${track.volume > 0 ? 'bg-red-500' : 'bg-gradient-to-t from-green-500 via-yellow-400 to-orange-500'}`} 
                            style={{ height: `${meterHeight}%` }}
                        ></div>
                    </div>

                    {/* Fader Track */}
                    <div className="relative w-8 h-full bg-black/40 rounded-sm border border-daw-700/50 flex justify-center shadow-inner">
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
                                width: '240px', // Length of fader track visually
                                height: '32px', // Width of fader track
                                background: 'transparent',
                                transform: 'rotate(-90deg)',
                                transformOrigin: 'center',
                                position: 'absolute',
                                top: '45%', // Center vertically approx
                                cursor: 'ns-resize'
                            }}
                         />
                         {/* Visual Cap */}
                         <div 
                            className="absolute w-8 h-10 bg-gradient-to-b from-gray-600 to-gray-800 rounded shadow-[0_4px_6px_rgba(0,0,0,0.5)] border-t border-gray-500 pointer-events-none flex items-center justify-center"
                            style={{ 
                                bottom: `${((track.volume + 60) / 66) * 100}%`,
                                transform: 'translateY(50%)'
                            }}
                         >
                            <div className="w-full h-0.5 bg-black/50"></div>
                            <div className="absolute w-full h-px bg-white/20 top-1"></div>
                         </div>
                    </div>
                </div>
            </div>

            {/* Bottom: Controls & Name */}
            <div className="h-28 bg-daw-800 border-t border-daw-700 p-2 flex flex-col gap-2">
                 <div className="flex gap-1">
                    <button 
                        onClick={(e) => { e.stopPropagation(); onMute(); }}
                        className={`flex-1 py-1 text-[10px] font-bold rounded border shadow-sm transition-all ${track.muted ? 'bg-red-900 border-red-500 text-red-100 shadow-[0_0_8px_red]' : 'bg-daw-700 border-daw-600 text-gray-400 hover:text-white hover:bg-daw-600'}`}
                    >
                        M
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onSolo(); }}
                        className={`flex-1 py-1 text-[10px] font-bold rounded border shadow-sm transition-all ${track.soloed ? 'bg-yellow-600 border-yellow-400 text-white shadow-[0_0_8px_gold]' : 'bg-daw-700 border-daw-600 text-gray-400 hover:text-white hover:bg-daw-600'}`}
                    >
                        S
                    </button>
                 </div>
                 <div className="text-center font-mono text-[10px] text-daw-accent bg-black/40 rounded py-0.5 border border-white/5 shadow-inner">
                    {track.volume > -60 ? `${track.volume.toFixed(1)} dB` : '-inf'}
                 </div>
                 <div className={`mt-auto py-1 px-1 rounded text-center text-[10px] font-bold truncate border ${isSelected ? 'bg-gray-200 text-black border-white' : 'bg-black/40 text-gray-300 border-transparent'}`}>
                    {track.name}
                 </div>
                 <div className="h-1.5 w-full rounded-sm shadow-sm" style={{ backgroundColor: track.color }}></div>
            </div>
        </div>
    )
}

// Knob Component for VST Parameters
const Knob: React.FC<{
    label: string;
    value: number;
    min: number;
    max: number;
    unit: string;
    onChange: (val: number) => void;
    active: boolean;
}> = ({ label, value, min, max, unit, onChange, active }) => {
    
    const handleMouseDown = (e: React.MouseEvent) => {
        if (!active) return;
        e.preventDefault();
        
        const startY = e.clientY;
        const startVal = value;
        const range = max - min;
        const sensitivity = 150; // pixels for full range
        
        const onMouseMove = (moveEvent: MouseEvent) => {
            const deltaY = startY - moveEvent.clientY;
            const deltaVal = (deltaY / sensitivity) * range;
            let newVal = startVal + deltaVal;
            newVal = Math.max(min, Math.min(max, newVal));
            onChange(newVal);
        };
        
        const onMouseUp = () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
            document.body.style.cursor = 'default';
        };
    
        document.body.style.cursor = 'ns-resize';
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    };

    // Calculate rotation (-135 to +135 deg)
    const percentage = (value - min) / (max - min);
    const rotation = -135 + (percentage * 270);

    return (
        <div className={`flex flex-col items-center gap-1 w-14 select-none ${active ? 'opacity-100 cursor-ns-resize' : 'opacity-40 cursor-not-allowed'}`} onMouseDown={handleMouseDown}>
             {/* Knob Graphic */}
             <div className="relative w-10 h-10 rounded-full bg-gradient-to-b from-zinc-700 to-black border-2 border-zinc-600 shadow-md flex items-center justify-center group hover:border-gray-400 transition-colors">
                  {/* Indicator Line Wrapper */}
                  <div 
                    className="w-full h-full rounded-full"
                    style={{ transform: `rotate(${rotation}deg)` }}
                  >
                       {/* The Tick */}
                       <div className="absolute top-1 left-1/2 -translate-x-1/2 w-1 h-3 bg-white rounded-full shadow-[0_0_2px_rgba(255,255,255,0.8)]"></div>
                  </div>
             </div>
             
             {/* Label & Value */}
             <span className="text-[9px] font-bold text-gray-400 text-center leading-none h-3 overflow-hidden w-full truncate px-1" title={label}>
                 {label}
             </span>
             <div className="bg-black/40 rounded px-1 min-w-[32px] text-center border border-white/5">
                <span className="text-[8px] font-mono text-daw-highlight">
                    {value.toFixed(1)}{unit}
                </span>
             </div>
        </div>
    )
}

export default MixingChain;
