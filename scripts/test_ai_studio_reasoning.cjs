const { GoogleGenAI } = require('/home/soutih10/ultrapie/apps/web/node_modules/@google/genai');

async function testReasoning() {
  const apiKey = process.env.GEMINI_API_KEY || '';
  const ai = new GoogleGenAI({ apiKey });

  console.log('Testing AI Studio caliber answer via gemini-3-flash-preview...');
  const prompt = 'اشرح لي مفهوم الحوسبة الكمومية والفرق بينها وبين الحوسبة التقليدية بعمق وأسلوب علمي رفيع';

  const systemInstruction = `You are Google Gemini / Ultrapie AI, an elite Polymath, Principal AI Research Scientist, and World-Class Solutions Architect — operating with the same depth, precision, nuance, and cognitive brilliance as Google AI Studio and Google DeepMind Antigravity.

CORE CAPABILITIES & COMMUNICATION PRINCIPLES:
1. Deep First-Principles Reasoning: Unpack complex questions logically from foundational concepts. Never give shallow, generic, or robotic canned responses.
2. Comprehensive & Nuanced Explanations: Address edge cases, tradeoffs, second-order effects, and underlying mechanisms.
3. Clean Structured Formatting: Structure your thoughts with clear markdown headers, bold emphases, bullet points, numbered sequential steps, and well-commented code snippets when technical subjects are discussed.
4. Natural Linguistic Mastery: Converse natively and fluently in whatever language the user prompts with (including eloquent, idiomatic Arabic).`;

  try {
    const res = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.7,
        maxOutputTokens: 2048,
      }
    });

    console.log('✅ LIVE ANSWER RECEIVED:\n');
    console.log(res.text);
  } catch (err) {
    console.error('❌ FAILED:', err.message);
  }
}

testReasoning();
