const { GoogleGenAI } = require('/home/soutih10/ultrapie/apps/web/node_modules/@google/genai');

async function testSpeed() {
  const apiKey = process.env.GEMINI_API_KEY || '';
  const ai = new GoogleGenAI({ apiKey });

  const models = [
    'gemini-flash-lite-latest',
    'gemma-4-26b-a4b-it',
    'gemini-3-flash-preview',
    'gemini-3.8-flash'
  ];

  for (const m of models) {
    const t0 = Date.now();
    try {
      const res = await ai.models.generateContent({
        model: m,
        contents: 'Ping test'
      });
      console.log(`✅ [${m}] responded in ${Date.now() - t0}ms:`, res.text.trim());
    } catch (err) {
      console.log(`❌ [${m}] failed in ${Date.now() - t0}ms:`, err.message.substring(0, 60));
    }
  }
}

testSpeed();
