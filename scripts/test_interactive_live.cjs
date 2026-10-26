const { chromium } = require('playwright-core');
const path = require('path');

async function testLive() {
  console.log('Testing live in browser...');
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--no-sandbox']
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto('http://localhost:3005/studio', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Type build command
  const chatInput = await page.waitForSelector('textarea[placeholder*="Ask anything"]');
  await chatInput.fill('Build a modern landing page for my product');
  await page.keyboard.press('Enter');
  console.log('Submitted prompt. Streaming code...');

  await page.waitForTimeout(4000);

  // Check preview iframe
  const iframe = await page.$('iframe');
  if (iframe) {
    const frame = await iframe.contentFrame();
    if (frame) {
      await page.waitForTimeout(2500);
      const text = await frame.evaluate(() => document.body.innerText);
      console.log('Rendered App snippet:\n', text.slice(0, 150));
      const buttons = await frame.$$('button');
      console.log('Total interactive buttons:', buttons.length);

      // Click an interactive button inside the preview app (e.g., likes or pricing toggle)
      const starBtn = await frame.$('button:has-text("Likes")');
      if (starBtn) {
        console.log('Clicking Likes button inside preview...');
        await starBtn.click();
        await page.waitForTimeout(500);
        const newLikes = await frame.evaluate(() => document.querySelector('button') ? document.body.innerText.match(/\d+ Likes/)?.[0] : null);
        console.log('Likes counter updated to:', newLikes);
      }
    }
  }

  const screenshotPath = 'C:\\Users\\User\\.gemini\\antigravity\\brain\\130bb0ea-5a61-4a3e-aed4-e1a987d4c48d\\studio-interactive-live-test.png';
  await page.screenshot({ path: screenshotPath });
  console.log('Saved screenshot to:', screenshotPath);

  await browser.close();
  console.log('✨ Live test finished!');
}

testLive().catch(console.error);
