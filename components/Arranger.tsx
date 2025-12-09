

import { useRef, useEffect, useState, type FC } from 'react';
import { useProject } from '../contexts/ProjectContext';
import { AppMode, AudioClip } from '../types';

interface ArrangerProps {
    onChangeMode: (mode: AppMode) => void;
}

const Arranger: FC<ArrangerProps> = ({ onChangeMode }) => {
  const { 
    melodyNotes, drumNotes, audioTracks,
    currentStep, isPlaying, 
    seekToStep, isLooping, 
    loopRange, setLoopStart, setLoopEnd,
    addAudioTrack, importAudioSample, updateClip,
    defaultFadeIn, setDefaultFadeIn, defaultFadeOut, setDefaultFadeOut,
    undo, redo, canUndo, canRedo, snapshotHistory
  } = useProject();
  
  const timelineRef = useRef<HTMLDivElement>(null);
  const rulerRef = useRef<HTMLDivElement>(null);
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const [selectedClip, setSelectedClip] = useState<{trackId: string, clip: AudioClip} | null>(null);

  // Resize State
  const [resizeState, setResizeState] = useState<{
    type: 'left' | 'right';
    trackId: string;
    clipId: string;
    initialStart: number;
    initialDuration: number;
    initialOffset: number;
    startX: number;
  } | null>(null);

  const TRACK_HEIGHT = 80;
  const STEP_WIDTH = 20; // px per 16th note

  // Keyboard Shortcuts for Undo/Redo
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
              if (e.shiftKey) {
                  redo();
              } else {
                  undo();
              }
              e.preventDefault();
          }
          if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
              redo();
              e.preventDefault();
          }
      };
      
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  // Auto scroll timeline if playing
  useEffect(() => {
    if (isPlaying && timelineRef.current) {
        const pxPerStep = STEP_WIDTH;
        const cursorX = currentStep * pxPerStep;
        if (cursorX > 400) {
            timelineRef.current.scrollLeft = cursorX - 400;
        } else {
             timelineRef.current.scrollLeft = 0;
        }
    }
  }, [currentStep, isPlaying]);

  // Handle Resizing (Trimming)
  useEffect(() => {
    if (!resizeState) return;

    const handleMouseMove = (e: MouseEvent) => {
        const deltaPx = e.clientX - resizeState.startX;
        const deltaSteps = deltaPx / STEP_WIDTH;

        if (resizeState.type === 'right') {
            // Trim End: Simply change duration
            const minDuration = 0.25; // Minimum 1/64th note
            const newDuration = Math.max(minDuration, resizeState.initialDuration + deltaSteps);
            updateClip(resizeState.trackId, resizeState.clipId, { duration: newDuration });
        } else {
            // Trim Start: Move start point AND offset
            // Limit left drag: Cannot offset < 0
            // Limit right drag: Duration > minDuration
            let effectiveDelta = deltaSteps;
            
            // Constraint 1: Offset cannot go negative
            effectiveDelta = Math.max(effectiveDelta, -resizeState.initialOffset);
            
            // Constraint 2: Duration must be at least minDuration
            const minDuration = 0.25;
            effectiveDelta = Math.min(effectiveDelta, resizeState.initialDuration - minDuration);

            updateClip(resizeState.trackId, resizeState.clipId, {
                start: resizeState.initialStart + effectiveDelta,
                duration: resizeState.initialDuration - effectiveDelta,
                offset: resizeState.initialOffset + effectiveDelta
            });
        }
    };

    const handleMouseUp = () => {
        setResizeState(null);
        // Save state to history after resize interaction finishes
        snapshotHistory();
    };

    // Attach global listeners for smooth dragging outside the div
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    
    // Add visual cursor style to body while dragging
    document.body.style.cursor = 'ew-resize';

    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = 'default';
    };
  }, [resizeState, updateClip, snapshotHistory]);


  // Group Melody notes into a "Clip" visually
  const melodyClipStart = melodyNotes.length > 0 ? Math.min(...melodyNotes.map(n => n.start)) : 0;
  const melodyClipEnd = melodyNotes.length > 0 ? Math.max(...melodyNotes.map(n => n.start + n.duration)) : 64;
  const melodyClipWidth = (melodyClipEnd - melodyClipStart) * STEP_WIDTH;

  const handleRulerClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!rulerRef.current) return;
      const rect = rulerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left + (timelineRef.current?.scrollLeft || 0);
      const step = x / STEP_WIDTH;

      if (e.ctrlKey || e.metaKey) {
          setLoopStart(Math.floor(step));
      } else if (e.altKey) {
          setLoopEnd(Math.ceil(step));
      } else {
          seekToStep(step);
      }
  }

  const handleFileUpload = (trackId: string, e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          // Default to start at cursor or 0
          importAudioSample(trackId, file, Math.floor(currentStep));
      }
      // Reset input
      e.target.value = '';
  }

  const triggerFileUpload = (trackId: string) => {
      fileInputRefs.current[trackId]?.click();
  }

  return (
    <div className="flex flex-col h-full bg-daw-800 text-white overflow-hidden">
      {/* Arranger Toolbar */}
      <div className="h-10 bg-daw-700 border-b border-daw-600 flex items-center px-2 gap-2 justify-between">
         <div className="flex items-center gap-2">
            {/* Undo / Redo */}
            <div className="flex bg-daw-900 rounded p-0.5 border border-daw-600">
                <button 
                    onClick={undo}
                    disabled={!canUndo}
                    className={`px-3 py-1 text-xs rounded font-bold flex items-center gap-1 ${canUndo ? 'text-gray-200 hover:bg-daw-600' : 'text-gray-600 cursor-not-allowed'}`}
                    title="Undo (Ctrl+Z)"
                >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                    Undo
                </button>
                <div className="w-px bg-daw-700 my-0.5"></div>
                <button 
                    onClick={redo}
                    disabled={!canRedo}
                    className={`px-3 py-1 text-xs rounded font-bold flex items-center gap-1 ${canRedo ? 'text-gray-200 hover:bg-daw-600' : 'text-gray-600 cursor-not-allowed'}`}
                    title="Redo (Ctrl+Y)"
                >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" /></svg>
                    Redo
                </button>
            </div>

            <div className="w-px h-6 bg-daw-600 mx-2"></div>

            <div className="flex bg-daw-900 rounded p-0.5">
                <button className="px-3 py-1 text-xs hover:bg-daw-600 rounded text-daw-accent font-bold">Grid</button>
                <button className="px-3 py-1 text-xs hover:bg-daw-600 rounded text-gray-400">Snap</button>
            </div>
            
            <div className="w-px h-6 bg-daw-600 mx-2"></div>
            
            {/* Default Fade Settings */}
            <div className="flex items-center gap-1 bg-daw-900 rounded p-0.5 border border-daw-600 px-2">
                <span className="text-[9px] text-gray-400 uppercase font-bold mr-1">Auto Fade</span>
                <input 
                    type="number" 
                    value={defaultFadeIn} 
                    onChange={(e) => setDefaultFadeIn(Math.max(0, parseFloat(e.target.value)))}
                    className="w-8 bg-daw-800 border border-daw-700 rounded text-center text-xs outline-none focus:border-daw-accent" 
                    step="0.1"
                />
                <span className="text-[9px] text-gray-500">In</span>
                <input 
                    type="number" 
                    value={defaultFadeOut} 
                    onChange={(e) => setDefaultFadeOut(Math.max(0, parseFloat(e.target.value)))}
                    className="w-8 bg-daw-800 border border-daw-700 rounded text-center text-xs outline-none focus:border-daw-accent" 
                    step="0.1"
                />
                 <span className="text-[9px] text-gray-500">Out</span>
            </div>

            <div className="w-px h-6 bg-daw-600 mx-2"></div>

            <button 
                onClick={() => addAudioTrack(`Audio ${audioTracks.length + 1}`)}
                className="px-3 py-1 bg-daw-600 hover:bg-daw-500 rounded text-xs font-bold border border-daw-500"
            >
                + Add Audio Track
            </button>
         </div>
         <div className="text-[10px] text-gray-400">
             Shift+Drag edges to Trim
         </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Track Headers (Left) */}
        <div className="w-48 bg-daw-800 border-r border-daw-600 z-10 shadow-lg flex-shrink-0">
             {/* Ruler placeholder */}
             <div className="h-8 bg-daw-900 border-b border-daw-700"></div>

             {/* Track 1: Melody */}
             <div className="border-b border-daw-700 bg-daw-800 relative group" style={{ height: TRACK_HEIGHT }}>
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-purple-500"></div>
                <div className="p-2 pl-4">
                    <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-sm cursor-pointer hover:text-purple-400" onClick={() => onChangeMode(AppMode.PIANO_ROLL)}>Melody Synth</span>
                        <div className="flex gap-1">
                            <span className="text-[9px] bg-gray-700 px-1 rounded cursor-pointer">M</span>
                            <span className="text-[9px] bg-gray-700 px-1 rounded cursor-pointer">S</span>
                        </div>
                    </div>
                     <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] text-gray-500">VOL</span>
                        <div className="flex-1 h-1 bg-daw-900 rounded-full overflow-hidden">
                            <div className="w-3/4 h-full bg-purple-500"></div>
                        </div>
                    </div>
                </div>
             </div>

             {/* Track 2: Drums */}
             <div className="border-b border-daw-700 bg-daw-800 relative group" style={{ height: TRACK_HEIGHT }}>
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-orange-500"></div>
                <div className="p-2 pl-4">
                    <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-sm cursor-pointer hover:text-orange-400" onClick={() => onChangeMode(AppMode.DRUM_SEQUENCER)}>Drum Rack</span>
                        <div className="flex gap-1">
                            <span className="text-[9px] bg-gray-700 px-1 rounded cursor-pointer">M</span>
                            <span className="text-[9px] bg-gray-700 px-1 rounded cursor-pointer">S</span>
                        </div>
                    </div>
                     <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] text-gray-500">VOL</span>
                        <div className="flex-1 h-1 bg-daw-900 rounded-full overflow-hidden">
                            <div className="w-3/4 h-full bg-orange-500"></div>
                        </div>
                    </div>
                </div>
             </div>

             {/* Audio Tracks */}
             {audioTracks.map(track => (
                 <div key={track.id} className="border-b border-daw-700 bg-daw-800 relative group" style={{ height: TRACK_HEIGHT }}>
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-500"></div>
                    <div className="p-2 pl-4">
                        <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-sm text-gray-300 truncate w-20">{track.name}</span>
                            <div className="flex gap-1">
                                <span className="text-[9px] bg-gray-700 px-1 rounded cursor-pointer">M</span>
                                <span className="text-[9px] bg-gray-700 px-1 rounded cursor-pointer">S</span>
                            </div>
                        </div>
                        <div className="mt-2">
                             <input 
                                type="file" 
                                className="hidden" 
                                ref={(el) => { fileInputRefs.current[track.id] = el; }}
                                onChange={(e) => handleFileUpload(track.id, e)}
                                accept="audio/*"
                             />
                             <button 
                                onClick={() => triggerFileUpload(track.id)}
                                className="w-full text-[10px] bg-daw-700 hover:bg-daw-600 py-1 rounded text-gray-300 flex items-center justify-center gap-1"
                             >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                Upload Clip
                             </button>
                        </div>
                    </div>
                 </div>
             ))}
        </div>

        {/* Timeline Content */}
        <div className="flex-1 overflow-auto bg-daw-900 relative custom-scrollbar pb-32" ref={timelineRef} onClick={() => setSelectedClip(null)}>
             {/* Ruler */}
             <div 
                className="h-8 bg-daw-900 border-b border-daw-700 sticky top-0 z-20 flex cursor-pointer" 
                style={{ width: `${64 * STEP_WIDTH + 1000}px` }}
                onClick={handleRulerClick}
                ref={rulerRef}
             >
                {Array.from({ length: 64 + 32 }).map((_, i) => {
                    const isBar = i % 16 === 0;
                    return (
                        <div key={i} className={`flex-shrink-0 h-full flex flex-col justify-end pb-1 text-[10px] text-gray-500 border-l ${isBar ? 'border-gray-500 w-[20px] pl-1 font-bold text-gray-300' : 'border-gray-800 w-[20px]'}`}>
                            {isBar ? (i/16)+1 : ''}
                        </div>
                    )
                })}
                {/* Loop Region in Ruler */}
                {isLooping && (
                    <div 
                        className="absolute top-0 h-full bg-blue-500/20 border-l border-r border-blue-400 pointer-events-none"
                        style={{
                            left: `${loopRange[0] * STEP_WIDTH}px`,
                            width: `${(loopRange[1] - loopRange[0]) * STEP_WIDTH}px`
                        }}
                    ></div>
                )}
             </div>

             {/* Loop Region in Background */}
             {isLooping && (
                <div 
                    className="absolute top-8 bottom-0 bg-blue-500/5 border-l border-r border-blue-400/30 pointer-events-none z-0"
                    style={{
                        left: `${loopRange[0] * STEP_WIDTH}px`,
                        width: `${(loopRange[1] - loopRange[0]) * STEP_WIDTH}px`
                    }}
                ></div>
            )}

             {/* Grid Background */}
             <div className="absolute top-8 bottom-0 w-full pointer-events-none z-0 flex">
                 {Array.from({ length: 64 + 32 }).map((_, i) => (
                    <div key={i} className={`h-full w-[20px] flex-shrink-0 border-r ${i % 16 === 15 ? 'border-daw-600' : 'border-daw-800/50'}`}></div>
                 ))}
             </div>

             {/* Playhead Cursor */}
             <div 
                className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-30 transition-all duration-75 ease-linear pointer-events-none"
                style={{ left: `${currentStep * STEP_WIDTH}px` }}
             >
                <div className="w-3 h-3 -ml-1.5 bg-red-500 transform rotate-45 -mt-1.5"></div>
             </div>

             {/* Track 1 Content (Melody) */}
             <div className="border-b border-daw-700/30 relative" style={{ height: TRACK_HEIGHT }}>
                {melodyNotes.length > 0 && (
                    <div 
                        className="absolute h-full bg-purple-900/40 border border-purple-500/50 rounded overflow-hidden cursor-pointer hover:brightness-110"
                        style={{ 
                            left: `${melodyClipStart * STEP_WIDTH}px`, 
                            width: `${Math.max(melodyClipWidth, 100)}px`,
                            top: 1,
                            bottom: 1
                        }}
                        onClick={(e) => { e.stopPropagation(); onChangeMode(AppMode.PIANO_ROLL); }}
                    >
                        <div className="bg-purple-600 text-white text-[10px] px-2 py-0.5 font-bold truncate">Melody Generator Pattern</div>
                        <div className="relative w-full h-full opacity-50">
                            {melodyNotes.map((n, i) => (
                                <div 
                                    key={i} 
                                    className="absolute bg-purple-300 h-1" 
                                    style={{ 
                                        left: `${(n.start - melodyClipStart) * STEP_WIDTH}px`, 
                                        width: `${n.duration * STEP_WIDTH}px`,
                                        top: `${(84 - n.pitch) * 2}px` // rough pitch viz
                                    }} 
                                />
                            ))}
                        </div>
                    </div>
                )}
             </div>

             {/* Track 2 Content (Drums) */}
             <div className="border-b border-daw-700/30 relative" style={{ height: TRACK_HEIGHT }}>
                {drumNotes.length > 0 && (
                     <div 
                        className="absolute h-full bg-orange-900/40 border border-orange-500/50 rounded overflow-hidden cursor-pointer hover:brightness-110"
                        style={{ 
                            left: 0, 
                            width: `${64 * STEP_WIDTH}px`, // Drums are usually full loop in this app context
                            top: 1,
                            bottom: 1
                        }}
                        onClick={(e) => { e.stopPropagation(); onChangeMode(AppMode.DRUM_SEQUENCER); }}
                    >
                        <div className="bg-orange-600 text-white text-[10px] px-2 py-0.5 font-bold truncate">Drum Sequence</div>
                         <div className="relative w-full h-full opacity-50 p-1">
                            {drumNotes.map((n, i) => (
                                <div 
                                    key={i} 
                                    className="absolute bg-orange-300 w-1 h-1 rounded-full" 
                                    style={{ 
                                        left: `${n.step * STEP_WIDTH}px`, 
                                        top: `${(n.instrument.length * 5) % 60}px` 
                                    }} 
                                />
                            ))}
                        </div>
                    </div>
                )}
             </div>

             {/* Audio Tracks Content */}
             {audioTracks.map(track => (
                 <div key={track.id} className="border-b border-daw-700/30 relative" style={{ height: TRACK_HEIGHT }}>
                     {track.clips.map(clip => {
                         const isSelected = selectedClip?.clip.id === clip.id;
                         return (
                            <div 
                                key={clip.id}
                                className={`absolute h-full rounded overflow-hidden cursor-pointer group/clip border ${isSelected ? 'border-white bg-blue-600/60 z-10' : 'border-blue-400/50 bg-blue-900/40'}`}
                                style={{
                                    left: `${clip.start * STEP_WIDTH}px`,
                                    width: `${clip.duration * STEP_WIDTH}px`,
                                    top: 1,
                                    bottom: 1
                                }}
                                onClick={(e) => { e.stopPropagation(); setSelectedClip({ trackId: track.id, clip }); }}
                            >
                                <div className={`text-[10px] px-2 py-0.5 font-bold truncate ${isSelected ? 'bg-white text-blue-900' : 'bg-blue-600 text-white'}`}>
                                    {clip.name}
                                </div>
                                <div className="relative w-full h-full opacity-50 flex items-center justify-center">
                                     {/* Fake waveform */}
                                     <div className="w-full h-1/2 bg-blue-300 opacity-30 clip-path-polygon"></div>
                                </div>

                                {/* Drag Handles - Visible on Hover or Select */}
                                <div className="absolute left-0 top-0 bottom-0 w-3 cursor-ew-resize bg-black/10 hover:bg-white/30 z-20 flex items-center justify-center opacity-0 group-hover/clip:opacity-100 transition-opacity"
                                     onMouseDown={(e) => {
                                         e.stopPropagation();
                                         setResizeState({
                                             type: 'left',
                                             trackId: track.id,
                                             clipId: clip.id,
                                             initialStart: clip.start,
                                             initialDuration: clip.duration,
                                             initialOffset: clip.offset,
                                             startX: e.clientX
                                         });
                                     }}
                                     title="Trim Start"
                                >
                                     <div className="w-1 h-4 bg-white/50 rounded-full"></div>
                                </div>
                                <div className="absolute right-0 top-0 bottom-0 w-3 cursor-ew-resize bg-black/10 hover:bg-white/30 z-20 flex items-center justify-center opacity-0 group-hover/clip:opacity-100 transition-opacity"
                                     onMouseDown={(e) => {
                                         e.stopPropagation();
                                         setResizeState({
                                             type: 'right',
                                             trackId: track.id,
                                             clipId: clip.id,
                                             initialStart: clip.start,
                                             initialDuration: clip.duration,
                                             initialOffset: clip.offset,
                                             startX: e.clientX
                                         });
                                     }}
                                     title="Trim End"
                                >
                                     <div className="w-1 h-4 bg-white/50 rounded-full"></div>
                                </div>
                            </div>
                         )
                     })}
                 </div>
             ))}
             
             {/* Empty Space filler */}
             <div style={{ width: `${64 * STEP_WIDTH + 500}px` }}></div>
        </div>

        {/* Clip Inspector Panel (Slide Up) */}
        {selectedClip && (
            <div className="absolute bottom-0 left-0 right-0 bg-daw-800 border-t border-daw-600 shadow-[0_-5px_20px_rgba(0,0,0,0.5)] p-4 flex gap-6 z-40 animate-slide-up h-40">
                {/* Header Section */}
                <div className="flex flex-col justify-center min-w-[150px] border-r border-daw-700 pr-4">
                    <h4 className="font-bold text-white text-lg truncate mb-1" title={selectedClip.clip.name}>{selectedClip.clip.name}</h4>
                    <span className="text-xs text-daw-accent font-mono mb-2">{selectedClip.clip.id.split('-')[1]}</span>
                    <button 
                        className="text-xs text-red-400 hover:text-red-300 text-left flex items-center gap-1 group"
                        onClick={() => setSelectedClip(null)}
                    >
                        <svg className="w-3 h-3 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        Close Inspector
                    </button>
                </div>

                {/* Properties Grid */}
                <div className="flex-1 flex gap-8 overflow-x-auto custom-scrollbar items-center">
                    
                    {/* Timing Group */}
                    <div className="flex flex-col gap-3 min-w-[180px]">
                        <h5 className="text-[9px] uppercase font-bold text-gray-500 tracking-wider mb-1 border-b border-daw-700 pb-1">Timing & Trim</h5>
                        <div className="grid grid-cols-2 gap-2">
                             <div className="flex flex-col gap-0.5">
                                <label className="text-[9px] text-gray-400">Start Position</label>
                                <input 
                                    type="number" 
                                    step="0.25"
                                    className="bg-daw-900 border border-daw-600 rounded px-1.5 py-0.5 text-xs text-white font-mono"
                                    value={selectedClip.clip.start}
                                    onChange={(e) => updateClip(selectedClip.trackId, selectedClip.clip.id, { start: parseFloat(e.target.value) })}
                                    onBlur={snapshotHistory}
                                />
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <label className="text-[9px] text-gray-400">Duration</label>
                                 <input 
                                    type="number" 
                                    step="1"
                                    className="bg-daw-900 border border-daw-600 rounded px-1.5 py-0.5 text-xs text-white font-mono"
                                    value={selectedClip.clip.duration}
                                    onChange={(e) => updateClip(selectedClip.trackId, selectedClip.clip.id, { duration: parseFloat(e.target.value) })}
                                    onBlur={snapshotHistory}
                                />
                            </div>
                             <div className="flex flex-col gap-0.5 col-span-2">
                                <label className="text-[9px] text-gray-400">Sample Offset</label>
                                 <input 
                                    type="number" 
                                    step="0.5"
                                    className="bg-daw-900 border border-daw-600 rounded px-1.5 py-0.5 text-xs text-white font-mono"
                                    value={selectedClip.clip.offset}
                                    onChange={(e) => updateClip(selectedClip.trackId, selectedClip.clip.id, { offset: parseFloat(e.target.value) })}
                                    onBlur={snapshotHistory}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="w-px h-24 bg-daw-700"></div>

                    {/* Fades Group */}
                    <div className="flex flex-col gap-3 min-w-[150px]">
                         <h5 className="text-[9px] uppercase font-bold text-gray-500 tracking-wider mb-1 border-b border-daw-700 pb-1">Envelopes</h5>
                         <div className="flex flex-col gap-2">
                             <div className="flex flex-col gap-0.5">
                                <div className="flex justify-between">
                                    <label className="text-[9px] text-gray-400">Fade In</label>
                                    <span className="text-[9px] font-mono text-gray-500">{selectedClip.clip.fadeIn}s</span>
                                </div>
                                 <input 
                                    type="range"
                                    min="0" max="16" step="0.5"
                                    className="h-1.5 bg-daw-600 rounded appearance-none accent-daw-accent cursor-pointer"
                                    value={selectedClip.clip.fadeIn}
                                    onChange={(e) => updateClip(selectedClip.trackId, selectedClip.clip.id, { fadeIn: parseFloat(e.target.value) })}
                                    onMouseUp={snapshotHistory}
                                />
                            </div>
                             <div className="flex flex-col gap-0.5">
                                <div className="flex justify-between">
                                    <label className="text-[9px] text-gray-400">Fade Out</label>
                                    <span className="text-[9px] font-mono text-gray-500">{selectedClip.clip.fadeOut}s</span>
                                </div>
                                 <input 
                                    type="range"
                                    min="0" max="16" step="0.5"
                                    className="h-1.5 bg-daw-600 rounded appearance-none accent-daw-accent cursor-pointer"
                                    value={selectedClip.clip.fadeOut}
                                    onChange={(e) => updateClip(selectedClip.trackId, selectedClip.clip.id, { fadeOut: parseFloat(e.target.value) })}
                                    onMouseUp={snapshotHistory}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="w-px h-24 bg-daw-700"></div>

                    {/* Mix Group */}
                    <div className="flex flex-col gap-3 min-w-[200px]">
                        <h5 className="text-[9px] uppercase font-bold text-gray-500 tracking-wider mb-1 border-b border-daw-700 pb-1">Mix Properties</h5>
                        <div className="flex gap-4">
                            {/* Gain */}
                            <div className="flex flex-col items-center gap-1 flex-1">
                                <label className="text-[9px] text-gray-400">Gain</label>
                                <div className="relative w-full">
                                    <input 
                                        type="range"
                                        min="0" max="2" step="0.01"
                                        className="w-full h-1.5 bg-daw-600 rounded appearance-none accent-green-500 cursor-pointer"
                                        value={selectedClip.clip.gain ?? 1.0}
                                        onChange={(e) => updateClip(selectedClip.trackId, selectedClip.clip.id, { gain: parseFloat(e.target.value) })}
                                        onMouseUp={snapshotHistory}
                                    />
                                    {/* Center mark */}
                                    <div className="absolute top-0 left-1/2 w-px h-full bg-white/20 pointer-events-none"></div>
                                </div>
                                <span className="text-[9px] font-mono text-green-400 font-bold">
                                    {((selectedClip.clip.gain ?? 1.0) === 0) ? '-inf' : `${(20 * Math.log10(selectedClip.clip.gain ?? 1.0)).toFixed(1)} dB`}
                                </span>
                            </div>

                            {/* Pan */}
                             <div className="flex flex-col items-center gap-1 flex-1">
                                <label className="text-[9px] text-gray-400">Pan</label>
                                <div className="relative w-full">
                                    <input 
                                        type="range"
                                        min="-1" max="1" step="0.05"
                                        className="w-full h-1.5 bg-daw-600 rounded appearance-none accent-yellow-500 cursor-pointer"
                                        value={selectedClip.clip.pan ?? 0}
                                        onChange={(e) => updateClip(selectedClip.trackId, selectedClip.clip.id, { pan: parseFloat(e.target.value) })}
                                        onMouseUp={snapshotHistory}
                                    />
                                     <div className="absolute top-0 left-1/2 w-px h-full bg-white/20 pointer-events-none"></div>
                                </div>
                                <span className="text-[9px] font-mono text-yellow-400 font-bold">
                                    {(selectedClip.clip.pan ?? 0) === 0 ? 'C' : (selectedClip.clip.pan ?? 0) < 0 ? `${Math.abs((selectedClip.clip.pan ?? 0) * 100).toFixed(0)}% L` : `${Math.abs((selectedClip.clip.pan ?? 0) * 100).toFixed(0)}% R`}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default Arranger;