import { useState, type FC } from 'react';
import { analyzeAudioFile } from '../services/geminiService';

const AudioAnalyzer: FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [promptMode, setPromptMode] = useState('mix');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setAnalysis('');
    }
  };

  const getPrompt = () => {
    switch(promptMode) {
        case 'mix': return "Analyze the mix balance. Are the drums too loud? Is the bass muddy? How is the stereo width?";
        case 'arrangement': return "Analyze the arrangement. Is the structure compelling? Are the transitions smooth? Suggest changes to the intro or chorus.";
        case 'vocal': return "Analyze the vocal performance. Is it on pitch? How is the timbre? Suggest EQ or compression settings specific to this vocal.";
        default: return "Give me general feedback.";
    }
  }

  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
        const base64Data = reader.result as string;
        // Remove the "data:audio/wav;base64," prefix
        const base64Content = base64Data.split(',')[1];
        const mimeType = file.type || 'audio/wav';

        const result = await analyzeAudioFile(base64Content, mimeType, getPrompt());
        setAnalysis(result);
        setLoading(false);
    };
    reader.onerror = () => {
        console.error("Error reading file");
        setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col gap-6 p-6 bg-daw-900 text-white overflow-y-auto">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-daw-accent tracking-tight">The Ear</h2>
        <p className="text-gray-400">Upload your track, stems, or recording for AI-powered feedback.</p>
      </div>

      <div className="max-w-2xl mx-auto w-full space-y-6">
        <div className="bg-daw-800 p-8 rounded-xl border border-dashed border-daw-600 hover:border-daw-accent transition-colors text-center relative">
             <input 
                type="file" 
                accept="audio/*" 
                onChange={handleFileChange} 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            {file ? (
                <div className="flex flex-col items-center">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-daw-success mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                    <span className="font-semibold text-lg">{file.name}</span>
                    <span className="text-sm text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                </div>
            ) : (
                <div className="flex flex-col items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span className="text-gray-400">Click to upload or drag and drop audio file</span>
                </div>
            )}
        </div>

        <div className="flex flex-col md:flex-row gap-4">
            <select 
                value={promptMode}
                onChange={(e) => setPromptMode(e.target.value)}
                className="bg-daw-800 border border-daw-600 rounded-lg p-3 text-white flex-1 focus:ring-2 focus:ring-daw-accent outline-none"
            >
                <option value="mix">Mix Review (Balance, EQ, Dynamics)</option>
                <option value="arrangement">Arrangement & Structure</option>
                <option value="vocal">Vocal Production & Performance</option>
            </select>
            <button 
                onClick={handleAnalyze}
                disabled={!file || loading}
                className={`px-6 py-3 rounded-lg font-bold text-lg shadow-lg transition-transform active:scale-95 ${!file || loading ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-daw-accent hover:bg-daw-highlight text-white'}`}
            >
                {loading ? (
                    <span className="flex items-center gap-2">
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Analyzing...
                    </span>
                ) : 'Analyze Audio'}
            </button>
        </div>

        {analysis && (
            <div className="bg-daw-800 rounded-xl p-6 border border-daw-700 shadow-xl animate-fade-in">
                <h3 className="text-xl font-bold text-daw-highlight mb-4 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                    Feedback Report
                </h3>
                <div className="prose prose-invert max-w-none text-gray-300 whitespace-pre-line leading-relaxed">
                    {analysis}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default AudioAnalyzer;