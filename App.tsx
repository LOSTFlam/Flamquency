import React, { useState } from 'react';
import { AppMode } from './types';
import PianoRoll from './components/PianoRoll';
import DrumSequencer from './components/DrumSequencer';
import AudioAnalyzer from './components/AudioAnalyzer';
import LyricsAndVocals from './components/LyricsAndVocals';
import MixingChain from './components/MixingChain';
import { ProjectProvider, useProject } from './contexts/ProjectContext';

const AppContent: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.DASHBOARD);
  const { bpm, setBpm, musicalKey, setMusicalKey } = useProject();

  const renderContent = () => {
    switch (mode) {
      case AppMode.PIANO_ROLL:
        return <PianoRoll />;
      case AppMode.DRUM_SEQUENCER:
        return <DrumSequencer />;
      case AppMode.AUDIO_ANALYSIS:
        return <AudioAnalyzer />;
      case AppMode.LYRICS_VOCALS:
        return <LyricsAndVocals />;
      case AppMode.MIXING_ENGINEER:
        return <MixingChain />;
      default:
        return <Dashboard onSelect={setMode} />;
    }
  };

  return (
    <div className="flex h-screen w-screen bg-daw-900 text-gray-200 overflow-hidden font-sans selection:bg-daw-accent selection:text-white">
      {/* Sidebar Navigation */}
      <aside className="w-20 md:w-64 bg-daw-900 border-r border-daw-800 flex flex-col shrink-0 z-20 shadow-xl">
        <div className="h-16 flex items-center justify-center md:justify-start md:px-6 border-b border-daw-800 bg-daw-900">
          <div className="h-8 w-8 bg-gradient-to-tr from-daw-accent to-purple-500 rounded-md flex items-center justify-center shadow-lg shadow-indigo-500/20">
             <span className="font-bold text-white text-lg">F</span>
          </div>
          <span className="ml-3 font-bold text-xl tracking-tight hidden md:block text-gray-100">Flamquency</span>
        </div>

        {/* Global Project Settings */}
        <div className="p-4 bg-daw-800/50 border-b border-daw-800 hidden md:block">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Global Project</h3>
            <div className="flex gap-2 mb-3">
                <div className="flex-1">
                    <label className="text-[10px] text-gray-400 block mb-1">BPM</label>
                    <input 
                        type="number" 
                        value={bpm}
                        onChange={(e) => setBpm(Math.max(1, Math.min(300, parseInt(e.target.value) || 120)))}
                        className="w-full bg-daw-900 border border-daw-700 rounded px-2 py-1 text-sm text-daw-accent font-mono focus:border-daw-accent outline-none text-center"
                    />
                </div>
                <div className="flex-1">
                    <label className="text-[10px] text-gray-400 block mb-1">KEY</label>
                    <input 
                        type="text" 
                        value={musicalKey}
                        onChange={(e) => setMusicalKey(e.target.value)}
                        className="w-full bg-daw-900 border border-daw-700 rounded px-2 py-1 text-sm text-daw-accent font-mono focus:border-daw-accent outline-none text-center"
                    />
                </div>
            </div>
        </div>

        <nav className="flex-1 py-6 space-y-2 px-2 overflow-y-auto">
            <NavItem 
                active={mode === AppMode.DASHBOARD} 
                onClick={() => setMode(AppMode.DASHBOARD)} 
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>}
                label="Studio Home"
            />
            <NavItem 
                active={mode === AppMode.PIANO_ROLL} 
                onClick={() => setMode(AppMode.PIANO_ROLL)} 
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>}
                label="Melody Composer"
            />
             <NavItem 
                active={mode === AppMode.DRUM_SEQUENCER} 
                onClick={() => setMode(AppMode.DRUM_SEQUENCER)} 
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>}
                label="Drum Sequencer"
            />
            <NavItem 
                active={mode === AppMode.AUDIO_ANALYSIS} 
                onClick={() => setMode(AppMode.AUDIO_ANALYSIS)} 
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>}
                label="The Ear (Analysis)"
            />
            <NavItem 
                active={mode === AppMode.LYRICS_VOCALS} 
                onClick={() => setMode(AppMode.LYRICS_VOCALS)} 
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>}
                label="Lyrics & Vocals"
            />
            <NavItem 
                active={mode === AppMode.MIXING_ENGINEER} 
                onClick={() => setMode(AppMode.MIXING_ENGINEER)} 
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>}
                label="Mix Engineer"
            />
        </nav>

        <div className="p-4 border-t border-daw-800">
             <div className="text-xs text-gray-500 text-center md:text-left">
                Powered by LOSTFlam (Alexander Avdeev)
             </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 bg-daw-900 overflow-hidden relative">
        {renderContent()}
      </main>
    </div>
  );
};

const App: React.FC = () => {
    return (
        <ProjectProvider>
            <AppContent />
        </ProjectProvider>
    )
}

const NavItem: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
    <button 
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${active ? 'bg-daw-accent/10 text-daw-accent' : 'text-gray-400 hover:bg-daw-800 hover:text-white'}`}
    >
        <div className={`transition-transform duration-200 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>
            {icon}
        </div>
        <span className="font-medium hidden md:block text-sm">{label}</span>
        {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-daw-accent hidden md:block shadow-[0_0_8px_rgba(99,102,241,0.8)]"></div>}
    </button>
);

const Dashboard: React.FC<{ onSelect: (mode: AppMode) => void }> = ({ onSelect }) => {
    return (
        <div className="h-full overflow-y-auto p-8 custom-scrollbar">
            <header className="mb-12">
                <h1 className="text-4xl font-bold text-white mb-2">Welcome to Flamquency</h1>
                <p className="text-xl text-gray-400">Your AI-powered production partner. What are we creating today?</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl">
                <DashboardCard 
                    title="Compose a Melody" 
                    desc="Generate MIDI ideas in a piano roll. Now with granular emotion controls."
                    color="bg-purple-600"
                    onClick={() => onSelect(AppMode.PIANO_ROLL)}
                />
                 <DashboardCard 
                    title="Drum Sequencer" 
                    desc="Program beats that lock into your melody automatically."
                    color="bg-orange-600"
                    onClick={() => onSelect(AppMode.DRUM_SEQUENCER)}
                />
                 <DashboardCard 
                    title="Write Lyrics" 
                    desc="Advanced lyrical engine with controls for rhyme density and charisma."
                    color="bg-pink-600"
                    onClick={() => onSelect(AppMode.LYRICS_VOCALS)}
                />
                 <DashboardCard 
                    title="Mix Like a Pro" 
                    desc="Get tailored VST chains and processing settings."
                    color="bg-emerald-600"
                    onClick={() => onSelect(AppMode.MIXING_ENGINEER)}
                />
                 <DashboardCard 
                    title="Analyze Audio" 
                    desc="Get professional feedback on your mix, arrangement, or vocals."
                    color="bg-blue-600"
                    onClick={() => onSelect(AppMode.AUDIO_ANALYSIS)}
                />
            </div>
        </div>
    )
}

const DashboardCard: React.FC<{ title: string; desc: string; color: string; onClick: () => void }> = ({ title, desc, color, onClick }) => (
    <div 
        onClick={onClick}
        className="bg-daw-800 border border-daw-700 p-6 rounded-xl hover:bg-daw-700 hover:border-gray-500 cursor-pointer transition-all group relative overflow-hidden"
    >
        <div className={`absolute top-0 left-0 w-1 h-full ${color}`}></div>
        <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-daw-highlight transition-colors">{title}</h3>
        <p className="text-gray-400">{desc}</p>
        <div className="mt-4 flex items-center text-sm font-bold text-gray-500 group-hover:text-white transition-colors">
            OPEN TOOL <span className="ml-2">→</span>
        </div>
    </div>
)

export default App;