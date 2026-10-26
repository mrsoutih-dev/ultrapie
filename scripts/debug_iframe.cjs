const { chromium } = require('playwright-core');

async function debugIframe() {
  const chromePath = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
  const browser = await chromium.launch({ executablePath: chromePath, headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  page.on('console', (msg) => console.log('PAGE LOG:', msg.text()));

  await page.goto('http://localhost:3000/studio');
  await page.waitForTimeout(1000);

  const textarea = await page.waitForSelector('textarea');
  await textarea.fill('Build a simple landing page for coffee');
  await page.keyboard.press('Enter');

  for (let i = 0; i < 20; i++) {
    await page.waitForTimeout(1000);
    const iframe = await page.$('iframe');
    if (iframe) {
      const frame = await iframe.contentFrame();
      if (frame) {
        const bodyHtml = await frame.evaluate(() => document.body.innerHTML).catch(() => 'err');
        console.log(`[Second ${i+1}] Iframe body:`, bodyHtml.substring(0, 200));
        if (bodyHtml.includes('ROAST') || bodyHtml.includes('Coffee') || bodyHtml.includes('<h1') || bodyHtml.includes('<div id="root">')) {
          const rootContent = await frame.evaluate(() => document.getElementById('root')?.innerHTML).catch(() => '');
          console.log('Root content:', rootContent.substring(0, 300));
        }
      }
    }
  }

  await page.screenshot({ path: 'apps/web/public/debug-iframe.png' });
  await browser.close();
}

debugIframe().catch(console.error);
