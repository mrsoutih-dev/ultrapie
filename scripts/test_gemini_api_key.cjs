const { GoogleGenAI } = require('/home/soutih10/ultrapie/apps/web/node_modules/@google/genai');

async function testApiKey() {
  const apiKey = process.env.GEMINI_API_KEY || '';
  console.log('Testing user Gemini API key:', apiKey.substring(0, 10) + '...');
  
  const ai = new GoogleGenAI({ apiKey });
  
  const models = [
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-2.5-pro',
    'gemini-3-flash-preview',
    'gemini-3.8-flash',
  ];

  for (const m of models) {
    try {
      console.log(`Trying model: ${m} ...`);
      const res = await ai.models.generateContent({
        model: m,
        contents: 'Hi! Tell me your model name in 5 words.'
      });
      console.log(`✅ SUCCESS [${m}]:`, res.text);
      return;
    } catch (err) {
      console.log(`❌ FAILED [${m}]:`, err.message);
    }
  }
}

testApiKey();
