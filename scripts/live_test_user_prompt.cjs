const { chromium } = require('playwright-core');
const fs = require('fs');

async function runLiveTestWithUserPrompt() {
  console.log('Starting Live Browser Test with User Prompt in Studio...');
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  console.log('Navigating to http://localhost:3005/studio...');
  await page.goto('http://localhost:3005/studio', { waitUntil: 'networkidle', timeout: 30000 });

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

  console.log('Finding chat textarea...');
  const textarea = await page.waitForSelector('textarea', { timeout: 10000 });
  await textarea.fill(userPrompt);

  console.log('Submitting prompt to Gemini live stream...');
  const submitBtn = await page.$('button[title="Send Message"]');
  if (submitBtn) {
    await submitBtn.click();
  } else {
    await page.keyboard.press('Enter');
  }

  console.log('Waiting for AI response to start streaming...');
  await page.waitForFunction(() => {
    const text = document.body.innerText;
    return text.includes('المهندس') || text.includes('المسجل') || text.includes('محامي الشيطان') || text.includes('قاعة');
  }, { timeout: 35000 });

  console.log('Streaming detected! Monitoring stream progression...');
  let lastLength = 0;
  for (let i = 0; i < 25; i++) {
    await page.waitForTimeout(1000);
    const currentLength = await page.evaluate(() => document.body.innerText.length);
    if (currentLength === lastLength && i > 8) {
      console.log(`Stream finalized at tick ${i}.`);
      break;
    }
    lastLength = currentLength;
  }

  // Extract the live assistant message text
  const assistantResponse = await page.evaluate(() => {
    const bubbles = Array.from(document.querySelectorAll('aside div.bg-slate-900'));
    if (bubbles.length > 0) {
      return bubbles[bubbles.length - 1].innerText;
    }
    return 'Bubble not found';
  });

  const screenshotPath = 'C:/Users/User/.gemini/antigravity/brain/130bb0ea-5a61-4a3e-aed4-e1a987d4c48d/live-test-user-prompt-studio.png';
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log('Full page screenshot saved to:', screenshotPath);

  const chatPane = await page.$('aside.w-80');
  if (chatPane) {
    const chatScreenshotPath = 'C:/Users/User/.gemini/antigravity/brain/130bb0ea-5a61-4a3e-aed4-e1a987d4c48d/live-test-chat-pane-focused.png';
    await chatPane.screenshot({ path: chatScreenshotPath });
    console.log('Focused chat pane screenshot saved to:', chatScreenshotPath);
  }

  console.log('\n--- EXTRACTED LIVE RESPONSE FULL TEXT ---');
  console.log(assistantResponse);

  await browser.close();
  console.log('\n✅ LIVE BROWSER TEST COMPLETED SUCCESSFULLY!');
}

runLiveTestWithUserPrompt().catch(err => {
  console.error('Live test failed:', err);
  process.exit(1);
});
