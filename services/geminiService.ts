

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
    ? `The drum pattern has hits at steps: ${contextDrums.filter(d => d.instrument === 'Kick' || d.instrument === 'Snare').map(d => d.step.toFixed(2)).join(', ')}. Sync the melody rhythmically to these accents.`
    : '';

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Create a melody for a ${genre} track in the key of ${key} at ${bpm} BPM.
                 
                 SETTINGS:
                 - Complexity: ${settings.complexity}%
                 - Rhythmicity: ${settings.rhythmicity}%
                 - Emotionality: ${settings.emotionality}%
                 - Quantization Grid: ${settings.quantization}
                 
                 QUANTIZATION RULES (Critical):
                 - 1/4, 1/8, 1/16, 1/32: Standard straight grid.
                 - 1/8T (Triplets): Use 1/8 note triplets. Grid steps: 0, 1.33, 2.66, 4.0, 5.33...
                 - 1/16T (Triplets): Use 1/16 note triplets. Grid steps: 0, 0.66, 1.33, 2.0...
                 - 1/8D (Dotted): Emphasize dotted 8th note intervals (every 3 16th steps: 0, 3, 6, 9...).
                 
                 CONTEXT:
                 ${drumContextStr}

                 Output format instructions:
                 - Return a JSON array of notes.
                 - 'pitch': MIDI note number (48-84).
                 - 'start': Start time in 16th note steps (0-63). Use decimals (e.g., 1.33) for triplets.
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
    ? `There is an existing melody with rhythm starts at steps: ${contextMelody.map(n => n.start.toFixed(2)).join(', ')}. Create a drum pattern that complements this rhythm.`
    : '';

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Create a drum pattern for a ${genre} track at ${bpm} BPM.
                 Settings:
                 - Groove/Swing: ${settings.groove}%
                 - Complexity: ${settings.complexity}%
                 - Intensity: ${settings.intensity}%
                 - Quantization: ${settings.quantization}
                 
                 QUANTIZATION RULES:
                 - If '1/8T' or '1/16T' (Triplets) is selected, use decimal step values corresponding to the triplet grid (e.g. 0, 1.33, 2.66...).
                 - If '1/8D', emphasize dotted 8th syncopation.
                 
                 ${melodyContextStr}

                 Instruments available: Kick, Snare, HiHatClosed, HiHatOpen, Clap, Perc.
                 Return JSON array for 4 bars (0-63 steps range).`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              instrument: { type: Type.STRING, enum: ['Kick', 'Snare', 'HiHatClosed', 'HiHatOpen', 'Clap', 'Perc'] },
              step: { type: Type.NUMBER },
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
      contents: `Act as a senior mix engineer. Create a comprehensive mixing console template for a ${genre} track.
                 
                 Requirements:
                 1. List 6-8 Individual 'Audio' tracks (e.g. Kick, Snare, Vocals, Bass, Lead).
                 2. Include 2 'Bus' tracks (e.g., 'Reverb', 'Delay', or 'Parallel Comp').
                 3. Include 1 'Master' track.
                 4. For EACH Audio track:
                    - Assign 3-4 specific VST plugins (EQ, Comp, Saturation, etc).
                    - Set realistic volume levels (-dB) and pan positions.
                    - Route signals to the Bus tracks using 'sends' (provide busId and amount in dB). 
                    - For EACH Plugin, define 3-4 key parameters (e.g., Threshold, Ratio, Drive, Freq) with their values, min, max, and units.
                 
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
                        active: { type: Type.BOOLEAN },
                        parameters: {
                          type: Type.ARRAY,
                          items: {
                             type: Type.OBJECT,
                             properties: {
                                name: { type: Type.STRING },
                                value: { type: Type.NUMBER },
                                min: { type: Type.NUMBER },
                                max: { type: Type.NUMBER },
                                unit: { type: Type.STRING }
                             }
                          }
                        }
                      }
                    }
                  },
                  sends: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                         busId: { type: Type.STRING },
                         amount: { type: Type.NUMBER }
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