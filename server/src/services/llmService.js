const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function isDisasterNews({ title, content }) {
  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: `Title: ${title}\nContent: ${content}\nThis is the details of a news article. ONLY ANSWER IN YES OR NO. If the news article is based on a natural disaster answer YES else NO`,
  });

  let answer = response.text;
  if (!answer) throw new Error('Empty LLM response');

  answer = answer.trim().toUpperCase();
  if (answer.includes('YES')) return 'YES';
  if (answer.includes('NO')) return 'NO';
  throw new Error('Invalid LLM response format');
}

module.exports = { isDisasterNews };
