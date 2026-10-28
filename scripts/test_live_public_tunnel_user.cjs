const { chromium } = require('playwright-core');

async function testPublicTunnel() {
  console.log('Testing Public Live URL via Playwright...');
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const publicUrl = 'https://princess-tenant-veterans-based.trycloudflare.com/studio';

  console.log(`Navigating to public URL: ${publicUrl}...`);
  await page.goto(publicUrl, { waitUntil: 'networkidle', timeout: 45000 });

  const testPrompt = 'ما الفرق بين SQL و NoSQL؟ أجب باختصار في جدول رصين.';
  console.log('Submitting prompt:', testPrompt);

  const textarea = await page.waitForSelector('textarea', { timeout: 15000 });
  await textarea.fill(testPrompt);
  await page.keyboard.press('Enter');

  console.log('Waiting for AI Assistant response bubble to populate...');
  await page.waitForFunction(() => {
    const bubbles = Array.from(document.querySelectorAll('aside div.bg-slate-900'));
    if (bubbles.length === 0) return false;
    const lastBubble = bubbles[bubbles.length - 1];
    const text = lastBubble.innerText || '';
    return text.length > 80 && !text.includes('Gemini is thinking');
  }, { timeout: 35000 });

  console.log('Response populated! Waiting 4 seconds for stream completion...');
  await page.waitForTimeout(4000);

  const screenshotPath = 'C:/Users/User/.gemini/antigravity/brain/130bb0ea-5a61-4a3e-aed4-e1a987d4c48d/live-public-tunnel-verified-test.png';
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log('Saved screenshot to:', screenshotPath);

  const responseText = await page.evaluate(() => {
    const bubbles = Array.from(document.querySelectorAll('aside div.bg-slate-900'));
    return bubbles[bubbles.length - 1].innerText;
  });

  console.log('\n--- LIVE AI STREAMED RESPONSE FROM PUBLIC INTERNET ---');
  console.log(responseText);

  await browser.close();
  console.log('\n✅ PUBLIC TUNNEL TEST PASSED WITH REAL AI RESPONSE!');
}

testPublicTunnel().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
