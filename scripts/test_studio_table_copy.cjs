const { chromium } = require('playwright-core');

async function testStudioLive() {
  console.log('Launching Chrome browser via playwright-core...');
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  console.log('Navigating to http://localhost:3005/studio...');
  await page.goto('http://localhost:3005/studio', { waitUntil: 'networkidle', timeout: 30000 });

  console.log('Typing analytical comparison question into chat...');
  const textarea = await page.waitForSelector('textarea', { timeout: 10000 });
  await textarea.fill('قارن بين SQL و NoSQL في جدول منظم واشرح متى نختار كل منهما بعمق');

  console.log('Submitting question...');
  await page.keyboard.press('Enter');

  console.log('Waiting for AI response stream...');
  await page.waitForFunction(() => {
    const text = document.body.innerText;
    return text.includes('SQL') && (text.includes('NoSQL') || text.includes('جدول'));
  }, { timeout: 25000 });

  console.log('Streaming active! Waiting 4 seconds for complete formatting...');
  await page.waitForTimeout(4000);

  const screenshotPath = 'C:/Users/User/.gemini/antigravity/brain/130bb0ea-5a61-4a3e-aed4-e1a987d4c48d/studio-ai-studio-table-verified.png';
  await page.screenshot({ path: screenshotPath });
  console.log('Screenshot saved to:', screenshotPath);

  const tableCount = await page.evaluate(() => document.querySelectorAll('table').length);
  console.log('Rendered <table> count in chat:', tableCount);

  const copyBtnCount = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    return btns.filter(b => b.innerText.includes('Copy')).length;
  });
  console.log('Rendered Copy buttons:', copyBtnCount);

  await browser.close();
  console.log('✅ TEST COMPLETED SUCCESSFULLY!');
}

testStudioLive().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
