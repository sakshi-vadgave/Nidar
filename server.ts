import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize GenAI client with correct recommended format
  const apiKey = process.env.GEMINI_API_KEY;
  const ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // API router - Safety chatbot proxy endpoint
  app.post("/api/chatbot", async (req, res) => {
    try {
      const { message, history } = req.body;
      if (!message) {
        return res.status(400).json({ error: "Message is required." });
      }

      const systemInstruction = `You are "NIDAR AI Assistant" (also referred to as "NIDAR Assistant"), a specialized safety assistant for the NIDAR Safety app.
NIDAR is a women-safety & emergency application designed to keep users secure, empower them, and allow them to take control of their environmental safety.
Your tone must be helpful, professional, friendly, empathetic, and supportive.
Purpose: Provide safety guidance, safety tips, women's safety awareness, cybercrime tips, self-defense instruction, and instant emergency assistance guidance.

You are fully trained to answer questions on:
- Women's Safety & Empowerment and self-defense
- Emergency Procedures & crisis scenarios
- Self Defense awareness, training, and strategic mindset
- Cyber Safety, securing devices, reporting harassment online
- Travel Safety, precautions in transit/cabs, safe routing
- Emergency Contacts (like standard responder national helplines: 112, 1091, 1930)
- NIDAR App Features:
  * SOS Transmitter (Tapping the main SOS button streams live location pattern and GPS telemetry to Priority protector contacts/Guardians)
  * Guardian Features (Store and manage protectors. Alert feed keeps a live sync status of guardians)
  * Safe Journey Guide (Plot secure tracks/routes on the map, simulate walking, and get automated route deviation alerts)
  * Fake Call (Simulate a realistic mock incoming phone call with custom caller names and numbers to easily walk out of uncomfortable, suspicious, or awkward situations)
  * Sonic Deterrents (Launch a very high-decibel safety alarm/siren to instantly deter potential threats and seek public help)
  * Emergency Location Maps (Display critical landmarks, rescue stations, nearby secure police stations, and hospital locations)
  * Encrypted Evidence Security Vault (Capture or stream high-fidelity proof camera shots, photos, and high-quality voice audio, directly stored with strict local key encryption)
  * Fearless State training module (Includes safety challenges, diagnostic articles, badges like "Knowledge Seeker", and active points progression)

CRITICAL EMERGENCY HANDLER:
If the user inputs words, questions, or triggers expressing immediate danger, crisis, or threat-like terms such as "Help", "Emergency", "Danger", "SOS", "Unsafe", "Someone is following me", "I am scared", or "Accident", you must:
1. Urgently prioritize immediate physical safety first. Give quick actionable commands (e.g. "Move into a bright, populated street immediately", "Get to a nearby public establishment like a store, café, or gas station").
2. Explicitly prompt them to trigger the NIDAR main "SOS" button or voice-activated SOS controls.
3. Show vital emergency numbers clearly:
   - National Emergency Helpline: 112
   - Women Helpline: 1091
   - Cyber Crime Helpline: 1930
4. Remind them of fast NIDAR features they can trigger right now: Click "Fake Call" to deter people and establish an excuse, trigger the "Sonic Deterrent" Siren to seek help, look at the GPS Map to locate the nearest Police station, or send a precomposed Alert SMS to Guardians.

Keep explanations highly actionable, descriptive but concise, beautifully structured with bullet points or numbered layouts, and empathetic. Make the user feel completely supported and equipped. Use helpful markdown formatting.`;

      // Build discussion structure
      const contents = [];
      if (Array.isArray(history)) {
        history.forEach(h => {
          contents.push({
            role: h.role === 'user' ? 'user' : 'model',
            parts: [{ text: h.text }]
          });
        });
      }
      
      // Append newest user message
      contents.push({
        role: 'user',
        parts: [{ text: message }]
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.6,
        },
      });

      const reply = response.text || "Hello! I am your NIDAR Security Assistant. I am here to guide you to safety and answer any questions. If you are in real danger, please press the emergency SOS trigger immediately or dial 112.";
      res.json({ reply });
    } catch (error: any) {
      console.error("Error in NIDAR Chatbot backend:", error);
      res.status(500).json({ error: error.message || "Failed to contact NIDAR safety servers." });
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
