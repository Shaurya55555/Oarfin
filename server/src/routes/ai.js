const express = require('express');
const router = express.Router();
const { GoogleGenAI } = require('@google/genai');

const AI_MODELS = [
  'gemini-2.0-flash-lite',
  'gemini-2.0-flash',
  'gemini-1.5-flash-8b',
  'gemini-1.5-flash',
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function generateWithRetry(ai, prompt, retries = 2, delayMs = 3000) {
  let lastError = null;

  for (const model of AI_MODELS) {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const result = await ai.models.generateContent({ model, contents: prompt });
        return result.text || 'No response generated.';
      } catch (err) {
        const isRateLimit =
          err.message?.includes('429') ||
          err.message?.includes('RESOURCE_EXHAUSTED') ||
          err.message?.includes('quota') ||
          err.status === 429;

        if (isRateLimit) {
          lastError = err;
          if (attempt < retries) {
            // wait before retrying same model
            await sleep(delayMs * (attempt + 1));
          }
          // after retries exhausted, move to next model
        } else {
          // non-quota error, throw immediately
          throw err;
        }
      }
    }
  }

  // all models and retries exhausted
  console.warn('All AI models quota-exhausted:', lastError?.message);
  return null; // signal rate limit to caller
}

router.post('/chat', async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.json({
        reply: 'AI features are offline. GEMINI_API_KEY is missing in server .env file.',
        error: 'missing_key',
      });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const { message, location, disaster, shelters } = req.body;

    if (!message || !message.trim()) {
      return res.json({ reply: 'Please send a message.', error: 'empty_message' });
    }

    let shelterInfo = '';
    if (shelters && Array.isArray(shelters) && shelters.length > 0) {
      shelterInfo =
        '\nNearby shelters:\n' +
        shelters
          .slice(0, 5)
          .map((s) => `- ${s.name || 'Unnamed'} (${s.distance_km}km away)`)
          .join('\n');
    }

    const prompt = `You are a disaster management assistant named Surakshayan AI.
User Location: ${location || 'Unknown'}
Disaster Context: ${disaster || 'General Inquiry'}${shelterInfo}

Answer concisely in 2-4 sentences or bullets. If asked about evacuation, name nearest shelters. Tailor advice to the disaster type.

User: ${message}`;

    const reply = await generateWithRetry(ai, prompt);

    if (reply === null) {
      return res.json({
        reply: 'The AI service is currently busy due to high demand. Please try again in a moment.',
        error: 'rate_limited',
      });
    }

    return res.json({ reply });
  } catch (error) {
    console.error('AI Chat Error:', error.message);
    return res.json({
      reply: `Sorry, I encountered an error: ${error.message}`,
      error: 'server_error',
    });
  }
});

module.exports = router;
