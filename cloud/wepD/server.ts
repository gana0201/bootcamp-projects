import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Lazy initialization of Gemini API client
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "15mb" }));
  app.use(express.urlencoded({ extended: true, limit: "15mb" }));

  // API Route: AI virtual fitting analysis
  app.post("/api/fit-analysis", async (req, res) => {
    try {
      const { userProfile, clothingItem, bodyPhotoBase64, clothingPhotoBase64 } = req.body;

      if (!userProfile || !clothingItem) {
        return res.status(400).json({ error: "Missing required profile or clothing data." });
      }

      const client = getAiClient();

      // Formulate parts for Gemini API
      const parts: any[] = [];

      // Describe the profile
      const profileDescription = `
        User Body Profile:
        - Gender: ${userProfile.gender}
        - Height: ${userProfile.height} cm
        - Weight: ${userProfile.weight} kg
        - Body Shape/Type: ${userProfile.bodyShape}
        
        Clothing Item Info:
        - Name: ${clothingItem.name}
        - Category: ${clothingItem.category}
        - Garment Measurements:
          * Total Length (총장): ${clothingItem.length || 'Not provided'} cm
          * Shoulder Width (어깨너비): ${clothingItem.shoulder || 'Not provided'} cm
          * Chest/Waist Width (가슴단면/허리단면): ${clothingItem.chest || 'Not provided'} cm
      `;
      parts.push({ text: profileDescription });

      // Add clothing image if base64 is available
      if (clothingPhotoBase64) {
        // base64 format is "data:image/png;base64,..."
        const match = clothingPhotoBase64.match(/^data:(image\/\w+);base64,(.+)$/);
        if (match) {
          parts.push({
            inlineData: {
              mimeType: match[1],
              data: match[2]
            }
          });
        }
      }

      // Add user full body pose image if custom base64 is available
      if (bodyPhotoBase64) {
        const match = bodyPhotoBase64.match(/^data:(image\/\w+);base64,(.+)$/);
        if (match) {
          parts.push({
            inlineData: {
              mimeType: match[1],
              data: match[2]
            }
          });
        }
      }

      const systemInstruction = `
        You are a highly precise Virtual Fitting Room AI Stylist and Coordinate Estimator.
        Your task is to analyze the user's body profile, clothing item actual measurements, and provided images to return visual and styling recommendations.
        
        Important Numeric Fit Analysis Rules:
        Compare the Garment Measurements (총장, 어깨너비, 가슴단면) with the User's Height, Weight, and Body Shape:
        - For Tops & Outers:
          * If User Height is 175-180cm, a Total Length (총장) of 68-72cm is standard, <65cm is short/cropped, and >75cm is long/oversized.
          * If User Weight is 70-75kg, a Chest Width (가슴단면) of 52-55cm is standard, <50cm is tight, and >58cm is loose/oversized.
          * Shoulder Width (어깨너비) of 46-48cm is standard, <44cm is tight.
        - For Bottoms:
          * If User Height is 175-180cm, a Total Length (총장) of 98-102cm is perfect standard full length.
          * Waist (허리단면 - labeled as chest for bottoms) of 38-40cm is standard for size 30-31 inches.
        
        In 'analysisText', provide a clear, logical, and natural Korean evaluation comparing these specific numbers (e.g. "총장 70cm는 고객님의 키 178cm에 아주 잘 맞는 적당한 기장입니다. 가슴단면 52cm는...").
        
        Important Coordinate Estimation Rules:
        We are overlaying a 2D clothing image on top of a full body image on a 0-100 percentage canvas.
        Based on the clothing category and body type:
        1. "top" (상의): Should be centered horizontally (x = 50). Y should align with the torso (usually y = 35 to 45).
        2. "bottom" (하의): Should be centered horizontally (x = 50). Y should align with the lower body (usually y = 62 to 72).
        3. "outer" (아우터): Should be centered horizontally (x = 50). Y should cover the torso (usually y = 37 to 47). Scale should be slightly larger than top (e.g. scaleX = 1.05).
        4. "fullbody" (원피스/세트): Should cover top to bottom (usually y = 50 to 55).
        
        Adjust "scaleX" (horizontal size) and "scaleY" (vertical size) values relative to 1.0 based on:
        - Weight and body shape: A heavier or muscular body shape should increase scaleX (e.g. 1.05 to 1.25). A slim body shape should decrease scaleX (e.g. 0.85 to 0.95).
        - Height: A taller user might need slightly larger scaleY if it's a long coat/pants, or adjusted scaleY to represent relative fit.
        
        Provide the response in Korean, focusing on professional fashion fitting analysis, sizing advice, and visual coordination suggestions.
      `;

      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: { parts },
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              sizeRecommendation: {
                type: Type.STRING,
                description: "추천 사이즈 및 핏감 한줄 요약 (예: '175cm/70kg 기준 M 사이즈가 알맞은 슬림핏으로 매칭됩니다')"
              },
              fitScore: {
                type: Type.INTEGER,
                description: "종합 피팅 어울림 점수 (0에서 100 사이)"
              },
              analysisText: {
                type: Type.STRING,
                description: "어깨, 가슴단면, 기장 등에 대한 상세한 한국어 분석 내용"
              },
              tightnessLevel: {
                type: Type.STRING,
                description: "피팅감 레벨",
                enum: ["tight", "perfect", "loose", "oversized"]
              },
              coordinates: {
                type: Type.OBJECT,
                properties: {
                  x: { type: Type.NUMBER, description: "의류 오버레이 x 좌표 퍼센트 (기본값: 50)" },
                  y: { type: Type.NUMBER, description: "의류 오버레이 y 좌표 퍼센트 (상의는 38~42, 하의는 65~70)" },
                  scaleX: { type: Type.NUMBER, description: "의류 오버레이 가로 너비 스케일값 (0.6 ~ 1.5)" },
                  scaleY: { type: Type.NUMBER, description: "의류 오버레이 세로 높이 스케일값 (0.6 ~ 1.5)" }
                },
                required: ["x", "y", "scaleX", "scaleY"]
              }
            },
            required: ["sizeRecommendation", "fitScore", "analysisText", "tightnessLevel", "coordinates"]
          }
        }
      });

      const responseText = response.text || "{}";
      const resultData = JSON.parse(responseText.trim());
      res.json(resultData);

    } catch (error: any) {
      console.error("Fit analysis failed:", error);
      res.status(500).json({ error: error.message || "Internal server error during fitting analysis." });
    }
  });

  // Handle Vite Dev Server or Production Static Serving
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
