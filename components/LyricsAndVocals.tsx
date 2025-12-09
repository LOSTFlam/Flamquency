import { useState, type FC } from 'react';
import { generateLyrics } from '../services/geminiService';
import { Genre, LyricsSettings } from '../types';
import { useProject } from '../contexts/ProjectContext';

const ARTIST_PRESETS: Record<string, string[]> = {
  [Genre.HIPHOP]: ['Drake', 'Travis Scott', 'Kendrick Lamar', 'Eminem', 'Future', 'Playboi Carti', 'Oxxxymiron (RU)', 'Morgenshtern (RU)', 'Scriptonite (RU)', 'Miyagi (RU)'],
  [Genre.POP]: ['The Weeknd', 'Taylor Swift', 'Dua Lipa', 'Justin Bieber', 'Ariana Grande'],
  [Genre.EDM]: ['Avicii', 'Calvin Harris', 'David Guetta', 'Skrillex'],
  [Genre.ROCK]: ['Linkin Park', 'Nirvana', 'Metallica', 'Radiohead', 'Maneskin', 'Korol i Shut (RU)'],
  [Genre.RNB]: ['SZA', 'Frank Ocean', 'Chris Brown', 'Beyonce'],
  [Genre.DRILL]: ['Pop Smoke', 'Central Cee', 'Chief Keef', 'OG Buda (RU)'],
  [Genre.AFROBEATS]: ['Burna Boy', 'Wizkid', 'Rema'],
  [Genre.LOFI]: ['Joji', 'Nujabes'],
  [Genre.JAZZ]: ['Frank Sinatra', 'Amy Winehouse']
};

const STRUCTURE_PRESETS = [
    "Verse - Chorus - Verse - Chorus - Bridge - Outro",
    "Intro - Verse - Chorus - Verse - Chorus - Outro",
    "AABA (Verse - Verse - Bridge - Verse)",
    "Verse - Chorus",
    "Intro - Verse - Pre-Chorus - Chorus - Verse - Pre-Chorus - Chorus - Bridge - Chorus - Outro",
    "AAA (Strophic)",
    "Verse - Chorus - Verse - Chorus - Solo - Chorus - Outro"
];

const LyricsAndVocals: FC = () => {
  const { melodyNotes, drumNotes, lyrics: savedLyrics, setLyrics: saveLyrics, genre: projectGenre, setGenre: setProjectGenre, bpm, musicalKey } = useProject();
  
  const [topic, setTopic] = useState('');
  const [mood, setMood] = useState('Emotional');
  const [structure, setStructure] = useState('Verse - Chorus - Verse - Chorus - Bridge - Outro');
  const [language, setLanguage] = useState('Russian');
  const [artistStyle, setArtistStyle] = useState('');
  const [loading, setLoading] = useState(false);

  // New Granular Settings
  const [settings, setSettings] = useState<LyricsSettings>({
    rhymeDensity: 75,
    structureStrictness: 80,
    styleExecution: 85,
    charisma: 60,
    atmosphere: 50
  });

  const handleWrite = async () => {
    if(!topic) return;
    setLoading(true);
    // Pass context (melody/drums) to the AI
    const result = await generateLyrics(
        topic, 
        mood, 
        structure, 
        projectGenre, 
        language, 
        artistStyle,
        settings, 
        { melody: melodyNotes, drums: drumNotes, bpm, key: musicalKey }
    );
    saveLyrics(result);
    setLoading(false);
  };

  const updateSetting = (key: keyof LyricsSettings, value: number) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const renderSlider = (label: string, key: keyof LyricsSettings, desc: string) => (
    <div className="mb-4">
        <div className="flex justify-between mb-1">
            <label className="text-sm font-semibold text-gray-300">{label}</label>
            <span className="text-xs text-daw-accent font-mono">{settings[key]}%</span>
        </div>
        <input 
            type="range" 
            min="0" 
            max="100" 
            value={settings[key]} 
            onChange={(e) => updateSetting(key, parseInt(e.target.value))}
            className="w-full h-2 bg-daw-700 rounded-lg appearance-none cursor-pointer accent-daw-accent hover:accent-daw-highlight"
        />
        <p className="text-[10px] text-gray-500 mt-1">{desc}</p>
    </div>
  );

  return (
    <div className="h-full grid grid-cols-1 md:grid-cols-3 gap-0 bg-daw-900 text-white divide-y md:divide-y-0 md:divide-x divide-daw-700">
      
      {/* Controls */}
      <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
        <div>
            <h2 className="text-2xl font-bold text-daw-accent mb-1">Flamquency</h2>
            <p className="text-xs text-gray-400">
                {melodyNotes.length > 0 ? "🎵 Melody Detected" : "⚪ No Melody Context"} | 
                {drumNotes.length > 0 ? " 🥁 Drums Detected" : " ⚪ No Drum Context"} | 
                <span className="text-daw-highlight font-mono ml-1">{bpm} BPM {musicalKey}</span>
            </p>
        </div>

        <div className="space-y-4">
            <div className="flex gap-4">
                <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Language</label>
                    <select 
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="w-full bg-daw-800 border border-daw-600 rounded p-2 text-sm focus:border-daw-accent outline-none"
                    >
                        <option value="Russian">Russian</option>
                        <option value="English">English</option>
                        <option value="Spanish">Spanish</option>
                        <option value="German">German</option>
                    </select>
                </div>
                <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Genre</label>
                    <select 
                        value={projectGenre} 
                        onChange={(e) => setProjectGenre(e.target.value)}
                        className="w-full bg-daw-800 border border-daw-600 rounded p-2 text-sm focus:border-daw-accent outline-none"
                    >
                        {Object.values(Genre).map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                </div>
            </div>

            {/* Artist Influence Selector */}
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Artist Influence</label>
                <div className="relative">
                    <input 
                        list="artist-presets"
                        value={artistStyle}
                        onChange={(e) => setArtistStyle(e.target.value)}
                        placeholder="e.g. Drake, Eminem, Morgenshtern..."
                        className="w-full bg-daw-800 border border-daw-600 rounded p-2 text-sm focus:border-daw-accent outline-none"
                    />
                    <datalist id="artist-presets">
                        {(ARTIST_PRESETS[projectGenre] || []).map(artist => (
                            <option key={artist} value={artist} />
                        ))}
                    </datalist>
                </div>
                <p className="text-[10px] text-gray-500 mt-1">Leave empty for original style or type any name.</p>
            </div>

            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Topic</label>
                <textarea 
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="What is this song about?"
                    className="w-full bg-daw-800 border border-daw-600 rounded p-3 text-sm focus:border-daw-accent outline-none h-20 resize-none"
                />
            </div>
            
             <div>
                <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Structure</label>
                    <span className="text-[10px] text-gray-600">Preset or Custom</span>
                </div>
                <div className="space-y-2">
                     <select 
                        onChange={(e) => setStructure(e.target.value)}
                        className="w-full bg-daw-800 border border-daw-600 rounded p-2 text-sm focus:border-daw-accent outline-none text-gray-300"
                        defaultValue=""
                    >
                        <option value="" disabled>Load a preset structure...</option>
                        {STRUCTURE_PRESETS.map((s) => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                    <input 
                        type="text"
                        value={structure}
                        onChange={(e) => setStructure(e.target.value)}
                        placeholder="Custom structure (e.g. Intro - Verse - Drop...)"
                        className="w-full bg-daw-900 border border-daw-700 rounded p-2 text-sm focus:border-daw-accent outline-none font-mono text-daw-highlight"
                    />
                </div>
            </div>

            {/* Granular Sliders */}
            <div className="bg-daw-800/50 p-4 rounded-lg border border-daw-700">
                <h3 className="text-xs font-bold text-daw-highlight uppercase tracking-wider mb-3">AI Personality</h3>
                {renderSlider("Rhymes / Punchlines", "rhymeDensity", "Complexity of rhymes and wordplay")}
                {renderSlider("Structure / Rhythm", "structureStrictness", "Adherence to beat and meter")}
                {renderSlider("Style Execution", "styleExecution", "Genre authenticity (slang, tropes)")}
                {renderSlider("Individuality / Charisma", "charisma", "Uniqueness of voice")}
                {renderSlider("Atmosphere / Vibe", "atmosphere", "Mood intensity")}
            </div>

            <button 
                onClick={handleWrite}
                disabled={loading || !topic}
                className="w-full bg-gradient-to-r from-daw-accent to-purple-600 hover:from-daw-highlight hover:to-purple-500 py-3 rounded font-bold shadow-lg transition-all active:scale-95 disabled:opacity-50"
            >
                {loading ? 'Analyzing & Writing...' : 'Generate Lyrics'}
            </button>
        </div>
      </div>

      {/* Output Display */}
      <div className="col-span-1 md:col-span-2 p-8 bg-daw-800 overflow-y-auto h-full relative custom-scrollbar">
        {savedLyrics ? (
            <div className="max-w-2xl mx-auto animate-fade-in">
                <div className="prose prose-invert prose-lg whitespace-pre-wrap font-serif text-gray-200 leading-relaxed">
                    {savedLyrics}
                </div>
            </div>
        ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600 opacity-50 pointer-events-none">
                <p className="text-xl">Your lyrics pad is empty.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default LyricsAndVocals;