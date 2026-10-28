const { chromium } = require('playwright-core');

async function extractLastMessage() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:3005/studio', { waitUntil: 'networkidle' });

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
ممنوع منعاً باتاً تقديم أي استنتاج، تلخيص، أو إجابة نهائية في هذه المرحلة.`;

  const textarea = await page.waitForSelector('textarea');
  await textarea.fill(userPrompt);
  await page.keyboard.press('Enter');

  // Wait for the stream to complete
  console.log('Waiting for response...');
  await page.waitForTimeout(6000);

  const responseText = await page.evaluate(() => {
    const bubbles = Array.from(document.querySelectorAll('aside div.bg-slate-900'));
    if (bubbles.length > 0) {
      return bubbles[bubbles.length - 1].innerText;
    }
    return 'No bubble found';
  });

  console.log('--- ACTUAL LIVE ANSWER FROM STUDIO CHATBOT ---');
  console.log(responseText);

  await browser.close();
}

extractLastMessage();
