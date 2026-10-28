const http = require('http');
const fs = require('fs');

async function testUserPrompt() {
  const userPrompt = `الهدف/المشكلة: [

قم بمسح التطبيق واختباره وجعله بمثابة Google AI Studio، فأنا بحاجة إلى أن يجيب برنامج الدردشة الآلي بشكل جيد ليس فقط على إجابة عادية ولكن على إجابة جيدة
]

أنت لست مساعداً ولن تعطيني إجابة الآن. أنت "مُسجل" ينقل حرفياً حواراً حياً داخل قاعة عمليات مغلقة. لا توجد إجابة مسبقة.

أعضاء القاعة (أعطهم أسماء لتسهيل التسجيل):
1. "المهندس": يبني الهيكل الأساسي للحل.
2. "محامي الشيطان": ناقد شرس مهمته تدمير الافتراضات واصطياد الثغرات.
3. "الزبون الغبي": مستخدم نهائي ساخر، يكره التعقيد، ويفهم الأمور بأسوأ طريقة ممكنة.
4. "الخبير المتخصص": (حلل هدفي أولاً، واستدعِ أفضل خبير عالمي يناسب هذه المشكلة تحديداً للمجلس).
5. "المايسترو": صامت تماماً في هذه المرحلة. يراقب فقط.

المهمة الآن:
قم بتوليد نص المداولة (حوار مباشر). استدعِ الخبير أولاً، ثم دع المهندس يطرح خطته، ولتبدأ المعركة بينهم.
ممنوع منعاً باتاً تقديم أي استنتاج، تلخيص، أو إجابة نهائية في هذه المرحلة.

قوانين المداولة (تُنفذ كقيود حتمية أثناء الحوار):

حظر المجاملة: "محامي الشيطان" و"الزبون الغبي" ملزمان برفض المسودة الأولى واستخراج "عيب قاتل" واحد على الأقل.

المبادئ الأولى والعواقب: يجب على الخبير المتخصص تفكيك الفكرة لجذورها وتوقع الكوارث المستقبلية (Second-order effects).

التطور الإجباري: يجب أن تتصادم الآراء وتتعدل الخطة بناءً على النقد داخل الحوار. لا توافقوا بسرعة.`;

  const payload = JSON.stringify({
    prompt: userPrompt,
    existingFiles: {},
    chatHistory: []
  });

  const req = http.request({
    hostname: '127.0.0.1',
    port: 3005,
    path: '/api/studio/stream',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    }
  }, (res) => {
    let fullText = '';
    res.on('data', chunk => {
      const lines = chunk.toString().split('\n');
      for (const line of lines) {
        if (line.startsWith('data:')) {
          try {
            const parsed = JSON.parse(line.replace('data:', '').trim());
            if (parsed.text) fullText += parsed.text;
          } catch {}
        }
      }
    });
    res.on('end', () => {
      fs.writeFileSync('C:/Users/User/.gemini/antigravity/brain/130bb0ea-5a61-4a3e-aed4-e1a987d4c48d/studio_deliberation_output.txt', fullText);
      console.log('Saved deliberation text! Length:', fullText.length);
      console.log('Ending preview:\n', fullText.slice(-500));
    });
  });

  req.write(payload);
  req.end();
}

testUserPrompt();
