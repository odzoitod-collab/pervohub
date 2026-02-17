import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const improveText = async (text: string, context: 'polite' | 'startup'): Promise<string> => {
  if (!apiKey) {
    console.warn("API Key is missing");
    return "API Key is missing. Cannot generate text.";
  }

  try {
    const model = context === 'startup' ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
    
    let systemInstruction = "";
    if (context === 'polite') {
      systemInstruction = "You are an empathetic school counselor helper. Rewrite the user's input to be constructive, polite, and clear, while maintaining the core message. Keep it in Ukrainian.";
    } else {
      systemInstruction = "You are a startup mentor. Rewrite the following startup pitch to be catchy, professional, and inspiring for a school environment. Keep it short (under 50 words) and in Ukrainian.";
    }

    const response = await ai.models.generateContent({
      model: model,
      contents: text,
      config: {
        systemInstruction: systemInstruction,
      }
    });

    return response.text || "Не вдалося згенерувати відповідь.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Помилка при з'єднанні з AI.";
  }
};