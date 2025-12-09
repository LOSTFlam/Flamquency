
import { type FC } from 'react';
import { useProject } from '../contexts/ProjectContext';

const Transport: FC = () => {
  const { isPlaying, togglePlayback, bpm, musicalKey, currentStep, isLooping, toggleLoop } = useProject();

  // Calculate generic time 1:1:1
  const bar = Math.floor(currentStep / 16) + 1;
  const beat = Math.floor((currentStep % 16) / 4) + 1;
  const sixteenth = (currentStep % 4) + 1;

  return (
    <div className="h-14 bg-daw-800 border-t border-daw-700 flex items-center px-4 justify-between shadow-[0_-5px_15px_rgba(0,0,0,0.3)] z-50">
      
      {/* Left: Playback Controls */}
      <div className="flex items-center gap-4">
        <div className="flex bg-daw-900 rounded-md p-1 border border-daw-700 shadow-inner">
            <button 
                onClick={togglePlayback}
                className={`w-10 h-8 rounded flex items-center justify-center transition-colors ${isPlaying ? 'bg-green-500 text-white shadow-[0_0_10px_lime]' : 'text-gray-400 hover:text-white hover:bg-daw-700'}`}
            >
                {isPlaying ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                )}
            </button>
            <button className="w-10 h-8 rounded flex items-center justify-center text-gray-400 hover:text-white hover:bg-daw-700 ml-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" /></svg>
            </button>
             <button className="w-10 h-8 rounded flex items-center justify-center text-red-500 hover:text-red-400 hover:bg-daw-700 ml-1">
                <div className="w-3 h-3 rounded-full bg-current"></div>
            </button>
        </div>
        
        {/* Loop Toggle */}
        <button 
            onClick={toggleLoop}
            className={`p-2 rounded border transition-colors ${isLooping ? 'bg-daw-accent text-white border-daw-accent shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-daw-900/50 text-gray-400 border-daw-700 hover:text-white hover:bg-daw-700'}`}
            title="Toggle Loop Mode"
        >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
        </button>
      </div>

      {/* Center: LCD Display */}
      <div className="bg-black/80 border border-gray-700 rounded px-6 py-1 font-mono text-daw-accent flex gap-6 items-center shadow-inner">
         <div className="flex flex-col items-center leading-none w-16">
            <span className="text-[10px] text-gray-500">BARS</span>
            <span className="text-xl tracking-widest text-white">{bar}.{beat}.{sixteenth}</span>
         </div>
         <div className="w-px h-8 bg-gray-700"></div>
         <div className="flex flex-col items-center leading-none">
            <span className="text-[10px] text-gray-500">BPM</span>
            <span className="text-lg text-white">{bpm}</span>
         </div>
         <div className="w-px h-8 bg-gray-700"></div>
          <div className="flex flex-col items-center leading-none">
            <span className="text-[10px] text-gray-500">KEY</span>
            <span className="text-lg text-white">{musicalKey}</span>
         </div>
      </div>

      {/* Right: Master Vol & CPU */}
      <div className="flex items-center gap-4 w-48">
         <div className="flex-1">
            <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                <span>L</span>
                <span>R</span>
            </div>
            <div className="space-y-0.5">
                <div className="h-1.5 bg-daw-900 rounded-full overflow-hidden">
                     <div className="h-full bg-gradient-to-r from-green-500 to-red-500 w-3/4"></div>
                </div>
                 <div className="h-1.5 bg-daw-900 rounded-full overflow-hidden">
                     <div className="h-full bg-gradient-to-r from-green-500 to-red-500 w-3/4"></div>
                </div>
            </div>
         </div>
         <div className="text-[10px] font-mono text-gray-500 border border-daw-600 rounded px-1">
             CPU 4%
         </div>
      </div>
    </div>
  );
};

export default Transport;
