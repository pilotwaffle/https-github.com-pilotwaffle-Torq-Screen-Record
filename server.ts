import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, GenerateVideosOperation } from "@google/genai";

// Ensure process.env.GEMINI_API_KEY is available when not in production (or passed by host)
const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  
  // 1. Start generation
  app.post("/api/generate-video", async (req, res) => {
    try {
      const { prompt, imageBytes, imageMimeType = 'image/png' } = req.body;
      if (!prompt && !imageBytes) {
         res.status(400).json({ error: "Prompt or image is required" });
         return;
      }

      console.log(`Starting video generation for prompt: "${prompt}"`);
      const options: any = {
        model: 'veo-3.1-lite-generate-preview',
        config: {
          numberOfVideos: 1,
          resolution: '720p', 
          aspectRatio: '16:9'
        }
      };
      
      if (prompt) options.prompt = prompt;
      if (imageBytes) {
        options.image = {
          imageBytes: imageBytes,
          mimeType: imageMimeType,
        };
      }
      
      const operation = await ai.models.generateVideos(options);
      res.json({ operationName: operation.name });
    } catch (error: any) {
      console.error("Generate video error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // 2. Poll status
  app.post("/api/video-status", async (req, res) => {
    try {
      const { operationName } = req.body;
      if (!operationName) {
         res.status(400).json({ error: "operationName is required" });
         return;
      }
      
      const op = new GenerateVideosOperation();
      op.name = operationName;
      const updated = await ai.operations.getVideosOperation({ operation: op });
      res.json({ done: updated.done });
    } catch (error: any) {
      console.error("Video status error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // 3. Download video
  app.post("/api/video-download", async (req, res) => {
    try {
      const { operationName } = req.body;
      if (!operationName) {
         res.status(400).json({ error: "operationName is required" });
         return;
      }
      
      const op = new GenerateVideosOperation();
      op.name = operationName;
      const updated = await ai.operations.getVideosOperation({ operation: op });
      
      if (!updated.done) {
         res.status(400).json({ error: "Operation is not complete yet" });
         return;
      }

      const uri = updated.response?.generatedVideos?.[0]?.video?.uri;
      if (!uri) {
         throw new Error("No video URI found in the completed operation");
      }

      const videoRes = await fetch(uri, {
        headers: { 'x-goog-api-key': apiKey as string },
      });
      
      if (!videoRes.ok) {
         throw new Error(`Failed to fetch video: ${videoRes.statusText}`);
      }

      res.setHeader('Content-Type', 'video/mp4');
      if (videoRes.body) {
        // Express res is a NodeJS WritableStream, we can pipe directly using Web Streams
        const reader = videoRes.body.getReader();
        const pump = async () => {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              res.end();
              break;
            }
            res.write(value);
          }
        };
        pump();
      } else {
         throw new Error("No video body stream");
      }
    } catch (error: any) {
      console.error("Video download error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // 4. Generate Speech
  app.post("/api/generate-speech", async (req, res) => {
    try {
      const { text, voice = 'Kore' } = req.body;
      if (!text) {
         res.status(400).json({ error: "Text is required" });
         return;
      }
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: [{ parts: [{ text }] }],
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: voice },
              },
          },
        },
      });
      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        res.json({ audio: base64Audio });
      } else {
        throw new Error("No audio generated");
      }
    } catch (error: any) {
      console.error("Speech generation error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // 5. Generate Music
  app.post("/api/generate-music", async (req, res) => {
    try {
      const { prompt } = req.body;
      if (!prompt) {
         res.status(400).json({ error: "Prompt is required" });
         return;
      }
      
      const response = await ai.models.generateContentStream({
        model: "lyria-3-clip-preview",
        contents: prompt,
      });

      let audioBase64 = "";
      let mimeType = "audio/wav";

      for await (const chunk of response) {
        const parts = chunk.candidates?.[0]?.content?.parts;
        if (!parts) continue;
        for (const part of parts) {
          if (part.inlineData?.data) {
            if (!audioBase64 && part.inlineData.mimeType) {
              mimeType = part.inlineData.mimeType;
            }
            audioBase64 += part.inlineData.data;
          }
        }
      }

      if (audioBase64) {
        res.json({ audio: audioBase64, mimeType });
      } else {
        throw new Error("No music generated");
      }
    } catch (error: any) {
      console.error("Music generation error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
