import { GoogleGenAI, Type } from "@google/genai";

const getAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured. Please add it in the Secrets panel.");
  }
  return new GoogleGenAI({ apiKey });
};

export interface UserProfile {
  age: number;
  weight: number;
  height: number;
  goals: string[];
  dietType: string[];
  activityLevel: 'sedentary' | 'lightly-active' | 'moderately-active' | 'very-active';
  healthFocus: string[];
  affordability: {
    item: string;
    frequency: 'daily' | 'weekly' | 'rarely' | 'never';
  }[];
  region: string; // Default to Tamil Nadu
  duration: '7-day' | '30-day';
}

export async function generateTamilMealPlan(profile: UserProfile) {
  const ai = getAI();
  const daysToGenerate = profile.duration === '30-day' ? 30 : 7;
  const prompt = `
    STRICT RULE: Return ONLY a raw JSON object. 
    Do not include any greetings, introductory text, or "வணக்கம்".
    Everything must be inside the JSON structure.

    Generate a highly personalized ${daysToGenerate}-day meal plan for a person in Tamil Nadu, India.
    
    User Profile:
    - Age: ${profile.age}
    - Weight: ${profile.weight}kg
    - Height: ${profile.height}cm
    - Goals: ${profile.goals.join(', ')}
    - Activity Level: ${profile.activityLevel}
    - Health Focus/Preferences: ${profile.healthFocus.join(', ')}
    - Diet Types: ${profile.dietType.join(', ')}
    - Affordability Constraints (What they can afford/have):
      ${profile.affordability.map(a => `- ${a.item}: ${a.frequency}`).join('\n')}
    
    Guidelines:
    1. Use authentic Tamil names for dishes (e.g., Sambar, Rasam, Kootu, Poriyal, Idli, Dosai, Pongal, Ragi Koozh).
    2. Format ALL text (meals, grocery list, tips, AI suggestions, cultural context) in a bilingual format: "Tamil Text (English Translation)". 
       Example: "சாம்பார் சாதம் (Sambar Rice)", "வெண்டைக்காய் (Lady's Finger)".
    3. Respect the affordability constraints strictly.
    4. Focus on local seasonal produce common in Tamil Nadu.
    5. Provide calorie estimates for each day based on their activity level and goals.
    6. Include a "Grocery List" section optimized for a middle-class Tamil household budget.
    7. Include "Tips" and "AI Suggestions" in both Tamil and English.
    8. CRITICAL: For a 30-day plan, you MUST generate exactly 30 unique daily entries in the "days" array. Each entry must represent one specific day (Day 1, Day 2, ..., Day 30). Do NOT group days (e.g., "Day 8-30"). Each day must have its own specific meal plan to provide variety. If you fail to provide 30 unique days, the plan is invalid.
    9. For the 30-day plan, ensure the meals are varied across weeks to prevent boredom.
    10. All content MUST be bilingual: "Tamil (English)".
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            planName: { type: Type.STRING },
            days: {
              type: Type.ARRAY,
              description: "Exactly 30 unique daily entries for a 30-day plan, or 7 for a 7-day plan. Each entry MUST be for a single day. DO NOT group days like 'Day 8-30'.",
              items: {
                type: Type.OBJECT,
                properties: {
                  day: { type: Type.STRING },
                  totalCalories: { type: Type.NUMBER },
                  meals: {
                    type: Type.OBJECT,
                    properties: {
                      breakfast: { type: Type.STRING },
                      midMorning: { type: Type.STRING },
                      lunch: { type: Type.STRING },
                      eveningSnack: { type: Type.STRING },
                      dinner: { type: Type.STRING }
                    },
                    required: ["breakfast", "midMorning", "lunch", "eveningSnack", "dinner"]
                  },
                  macros: {
                    type: Type.OBJECT,
                    properties: {
                      protein: { type: Type.STRING, description: "Protein in grams" },
                      carbs: { type: Type.STRING, description: "Carbs in grams" },
                      fats: { type: Type.STRING, description: "Fats in grams" }
                    },
                    required: ["protein", "carbs", "fats"]
                  },
                  culturalContext: { 
                    type: Type.STRING, 
                    description: "A brief cultural or traditional fact about today's meals or ingredients in Tamil" 
                  }
                },
                required: ["day", "meals", "macros", "culturalContext"]
              }
            },
            groceryList: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            tips: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Health tips in Tamil with English subtitles"
            },
            aiSuggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Additional AI-generated suggestions for lifestyle, exercise, or habits in Tamil with English subtitles"
            }
          },
          required: ["planName", "days", "groceryList", "tips", "aiSuggestions"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from AI");

    // This finds the very first { and the very last } 
    // It ignores any "வணக்கம்" or "Here is your plan" text outside the brackets
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}') + 1;
    
    if (jsonStart === -1 || jsonEnd === 0) {
      console.error("Raw AI Response that failed:", text);
      throw new Error("AI did not return a valid JSON object. Please try again.");
    }

    const cleanedText = text.substring(jsonStart, jsonEnd);
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error("Gemini Service Error:", error);
    throw error;
  }
}
