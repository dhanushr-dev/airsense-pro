import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateChatResponse = async (
  message: string, 
  contextData?: string
): Promise<string> => {
  try {
    const model = 'gemini-2.5-flash';
    
    const systemPrompt = `
      You are AirSense Bot, an expert environmental AI assistant. 
      You help users understand air quality data, health risks, and weather patterns.
      Keep answers concise, friendly, and scientifically accurate.
      If context data is provided below, strictly use it to answer questions about the current location.
      
      CONTEXT DATA:
      ${contextData || 'No specific location data provided yet.'}
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: message,
      config: {
        systemInstruction: systemPrompt,
      }
    });

    return response.text || "I couldn't generate a response at the moment.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I'm having trouble connecting to my AI brain right now. Please check your API key or connection.";
  }
};