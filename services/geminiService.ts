
import { GoogleGenAI, Type } from "@google/genai";
import { Note, IdeaResponse, MixingAdvice, DrumNote, LyricsSettings, MelodySettings, DrumSettings, MixSession, MixTrack } from "../types";

const apiKey = process.env.API_KEY || '';

const ai = new GoogleGenAI({ apiKey });

export const generateMusicIdea = async (genre: string, mood: string): Promise<IdeaResponse | null> => {
  if (!apiKey) return null;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate a unique song idea for a ${mood} ${genre} track.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            genre: { type: Type.STRING },
            bpm: { type: Type.NUMBER },
            key: { type: Type.STRING },
            description: { type: Type.STRING },
            instruments: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    });

    return JSON.parse(response.text || '{}') as IdeaResponse;
  } catch (error) {
    console.error("Error generating idea:", error);
    return null;
  }
};

export const generateMelody = async (
  genre: string, 
  key: string, 
  bpm: number,
  settings: MelodySettings,
  contextDrums: DrumNote[] // Context awareness
): Promise<Note[]> => {
  if (!apiKey) return [];

  const drumContextStr = contextDrums.length > 0 
    ? `The drum pattern has hits at steps: ${contextDrums.filter(d => d.instrument === 'Kick' || d.instrument === 'Snare').map(d => d.step).join(', ')}. Sync the melody rhythmically to these accents.`
    : '';

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Create a melody for a ${genre} track in the key of ${key} at ${bpm} BPM.
                 
                 SETTINGS:
                 - Complexity: ${settings.complexity}%
                 - Rhythmicity: ${settings.rhythmicity}%
                 - Emotionality: ${settings.emotionality}%
                 - Quantization Grid: ${settings.quantization} (CRITICAL: Rhythms must adhere to this grid resolution. If 1/32, allow fast runs/rolls. If 1/4, keep it spacious/blocky).
                 
                 CONTEXT:
                 ${drumContextStr}

                 Output format instructions:
                 - Return a JSON array of notes.
                 - 'pitch': MIDI note number (48-84).
                 - 'start': Start time in 16th note steps (0-63). Use decimals (e.g., 0.5, 1.5) ONLY if 1/32 quantization is selected.
                 - 'duration': Duration in 16th note steps.
                 - 'velocity': 0-127.
                 - Length: 4 Bars (64 16th-note steps total).`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              pitch: { type: Type.NUMBER },
              start: { type: Type.NUMBER },
              duration: { type: Type.NUMBER },
              velocity: { type: Type.INTEGER }
            }
          }
        }
      }
    });

    return JSON.parse(response.text || '[]') as Note[];
  } catch (error) {
    console.error("Error generating melody:", error);
    return [];
  }
};

export const generateDrumPattern = async (
  genre: string,
  bpm: number,
  settings: DrumSettings,
  contextMelody: Note[] // Context awareness
): Promise<DrumNote[]> => {
  if (!apiKey) return [];

  const melodyContextStr = contextMelody.length > 0
    ? `There is an existing melody with rhythm starts at steps: ${contextMelody.map(n => n.start).join(', ')}. Create a drum pattern that complements this rhythm.`
    : '';

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Create a drum pattern for a ${genre} track at ${bpm} BPM.
                 Settings:
                 - Groove/Swing: ${settings.groove}%
                 - Complexity: ${settings.complexity}%
                 - Intensity: ${settings.intensity}%
                 
                 ${melodyContextStr}

                 Instruments available: Kick, Snare, HiHatClosed, HiHatOpen, Clap, Perc.
                 Return JSON array for 4 bars (0-63 steps).`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              instrument: { type: Type.STRING, enum: ['Kick', 'Snare', 'HiHatClosed', 'HiHatOpen', 'Clap', 'Perc'] },
              step: { type: Type.INTEGER },
              velocity: { type: Type.INTEGER }
            }
          }
        }
      }
    });

    return JSON.parse(response.text || '[]') as DrumNote[];
  } catch (error) {
    console.error("Error generating drums:", error);
    return [];
  }
};

export const analyzeAudioFile = async (base64Audio: string, mimeType: string, prompt: string): Promise<string> => {
  if (!apiKey) return "API Key missing.";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Audio
            }
          },
          {
            text: `Act as a professional mix engineer. Listen to this audio. ${prompt}`
          }
        ]
      }
    });
    return response.text || "No analysis generated.";
  } catch (error) {
    console.error("Error analyzing audio:", error);
    return "Error analyzing audio.";
  }
};

export const generateLyrics = async (
  topic: string, 
  mood: string, 
  structure: string, 
  genre: string, 
  language: string,
  artistStyle: string,
  settings: LyricsSettings,
  contextData: { melody?: Note[], drums?: DrumNote[], bpm?: number, key?: string }
): Promise<string> => {
  if (!apiKey) return "API Key missing.";

  try {
    // Construct context description
    let songContext = `Project Settings: BPM ${contextData.bpm || 'N/A'}, Key ${contextData.key || 'N/A'}. `;
    if (contextData.melody && contextData.melody.length > 0) {
      songContext += `The track has a melody with ${contextData.melody.length} notes, implying a specific rhythm. `;
    }
    if (contextData.drums && contextData.drums.length > 0) {
      songContext += `The beat is ${genre} style with a specific groove. `;
    }

    const prompt = `
      Act as a world-class professional songwriter and lyricist.
      Write lyrics for a song with the following specifications:
      
      Topic: ${topic}
      Mood: ${mood}
      Structure: ${structure}
      Genre: ${genre}
      Language: ${language}
      Artist Influence (Style Reference): ${artistStyle || "Original Style"}
      
      CONTEXT: ${songContext}

      ADVANCED SETTINGS (0-100 scale impact):
      1. Rhyme Density / Complexity: ${settings.rhymeDensity}/100 
         (If high: Use multisyllabic rhymes, internal rhymes, complex schemes. If low: Simple end rhymes.)
      2. Structure / Rhythm Strictness: ${settings.structureStrictness}/100
         (If high: Perfectly on-grid, consistent syllable count per bar. If low: Loose, conversational flow.)
      3. Style Execution: ${settings.styleExecution}/100
         (How strictly to adhere to ${genre} tropes and slang.)
      4. Individuality / Charisma: ${settings.charisma}/100
         (If high: Unique voice, unexpected word choices, strong personality. If low: Standard radio-friendly.)
      5. Atmosphere / Vibe: ${settings.atmosphere}/100
         (Intensity of the mood.)

      Instructions:
      1. Write the lyrics strictly in ${language}.
      2. Label all sections clearly.
      3. ${settings.rhymeDensity > 70 ? "Include heavy punchlines, wordplay, and double entendres." : "Focus on clear storytelling."}
      4. ${artistStyle ? `CRITICAL: Mimic the style of ${artistStyle} closely. Use their signature flow patterns, vocabulary, ad-libs, and lyrical themes.` : ""}
      
      At the end, provide a "Performance Guide" based on the Charisma setting.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });
    return response.text || "";
  } catch (error) {
    console.error("Error generating lyrics:", error);
    return "Error generating lyrics.";
  }
};

export const generateMixSession = async (genre: string): Promise<MixSession | null> => {
  if (!apiKey) return null;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Act as a senior mix engineer. Create a mixing console template for a ${genre} track.
                 1. List 6-8 individual audio tracks (e.g. Kick, Snare, Vocals, Bass) and 1 Master channel.
                 2. For EACH track, assign 3-4 specific VST plugins (EQ, Comp, Saturation, etc).
                 3. Provide specific, professional setting values for each plugin.
                 4. Set realistic volume levels (-dB) and pan positions.
                 
                 Return a JSON object matching the Schema.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            genre: { type: Type.STRING },
            tracks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ['Audio', 'Bus', 'Master'] },
                  volume: { type: Type.NUMBER },
                  pan: { type: Type.NUMBER },
                  muted: { type: Type.BOOLEAN },
                  soloed: { type: Type.BOOLEAN },
                  color: { type: Type.STRING },
                  plugins: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        name: { type: Type.STRING },
                        type: { type: Type.STRING },
                        settings: { type: Type.STRING },
                        active: { type: Type.BOOLEAN }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    return JSON.parse(response.text || '{}') as MixSession;
  } catch (error) {
    console.error("Error generating mix session:", error);
    return null;
  }
}

export const getMixingAdvice = async (genre: string, instrument: string): Promise<MixingAdvice | null> => {
  if (!apiKey) return null;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Suggest a VST plugin chain for ${instrument} in a ${genre} track.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            trackType: { type: Type.STRING },
            chain: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  pluginType: { type: Type.STRING },
                  pluginNameSuggestion: { type: Type.STRING },
                  settings: { type: Type.STRING },
                  reason: { type: Type.STRING }
                }
              }
            },
            busProcessing: { type: Type.STRING }
          }
        }
      }
    });

    return JSON.parse(response.text || '{}') as MixingAdvice;
  } catch (error) {
    console.error("Error generating mixing advice:", error);
    return null;
  }
};
