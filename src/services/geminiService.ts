import { GoogleGenAI, Type } from "@google/genai";

const reportSchema = {
  type: Type.OBJECT,
  properties: {
    meetingType: { type: Type.STRING, description: "The type of meeting (e.g., Investor Meeting, Strategy Sync)" },
    confidence: { type: Type.NUMBER, description: "Confidence score of the analysis (0-100)" },
    sentiment: { type: Type.STRING, description: "Overall detected sentiment (e.g., Highly Optimistic)" },
    focusArea: { type: Type.STRING, description: "Primary focus area (e.g., Revenue Growth)" },
    summary: {
      type: Type.OBJECT,
      properties: {
        overview: { type: Type.STRING },
        objective: { type: Type.STRING },
        strategicImportance: { type: Type.STRING },
        criticalDecision: { type: Type.STRING }
      },
      required: ["overview", "objective", "strategicImportance", "criticalDecision"]
    },
    strategicIntelligence: {
      type: Type.OBJECT,
      properties: {
        stakeholders: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              role: { type: Type.STRING },
              sentiment: { type: Type.STRING, description: "e.g., Supportive, Neutral, Champion" }
            }
          }
        },
        powerDynamics: { type: Type.STRING },
        incentiveAnalysis: { type: Type.STRING }
      }
    },
    riskIdentification: {
      type: Type.OBJECT,
      properties: {
        risks: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING, description: "e.g., Strategic, Political, Execution" },
              title: { type: Type.STRING },
              description: { type: Type.STRING }
            }
          }
        },
        hiddenObjection: { type: Type.STRING }
      }
    },
    talkingPoints: {
      type: Type.OBJECT,
      properties: {
        points: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING }
            }
          }
        },
        framingStrategy: { type: Type.STRING }
      }
    },
    objections: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING },
          response: { type: Type.STRING }
        }
      }
    },
    nextSteps: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          action: { type: Type.STRING },
          ownership: { type: Type.STRING },
          timeline: { type: Type.STRING },
          status: { type: Type.STRING, description: "e.g., PENDING, QUEUED" }
        }
      }
    },
    executiveBrief: { type: Type.STRING, description: "A 60-second verbal script for the executive" },
    coverImagePrompt: { type: Type.STRING, description: "A detailed prompt for generating a cover image" }
  },
  required: ["meetingType", "confidence", "sentiment", "focusArea", "summary", "strategicIntelligence", "riskIdentification", "talkingPoints", "objections", "nextSteps", "executiveBrief", "coverImagePrompt"]
};

export async function generateMeetingIntelligence(
  notes: string,
  slides: string,
  context: string,
  files: { data: string; mimeType: string }[] = []
) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  const model = "gemini-3.1-pro-preview";

  const parts: any[] = [
    { text: `Analyze the following meeting materials and provide structured intelligence.
    
    Notes: ${notes}
    Slides Content: ${slides}
    Additional Context: ${context}
    
    Return a detailed JSON report according to the schema.` }
  ];

  for (const file of files) {
    parts.push({
      inlineData: {
        data: file.data.split(',')[1] || file.data,
        mimeType: file.mimeType
      }
    });
  }

  const response = await ai.models.generateContent({
    model,
    contents: [{ parts }],
    config: {
      responseMimeType: "application/json",
      responseSchema: reportSchema,
    },
  });

  return JSON.parse(response.text || "{}");
}
