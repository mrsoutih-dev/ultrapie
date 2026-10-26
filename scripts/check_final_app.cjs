const { chromium } = require('playwright-core');

async function checkFinalRenderedApp() {
  const chromePath = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
  const browser = await chromium.launch({ executablePath: chromePath, headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  page.on('console', (msg) => console.log('BROWSER LOG:', msg.type(), msg.text()));

  console.log('Navigating to Studio...');
  await page.goto('http://localhost:3000/studio');
  await page.waitForTimeout(1000);

  const textarea = await page.waitForSelector('textarea');
  await textarea.fill('Build a simple landing page');
  await page.keyboard.press('Enter');

  console.log('Waiting for code streaming to complete (25s)...');
  await page.waitForTimeout(25000);

  const iframe = await page.$('iframe');
  if (iframe) {
    const frame = await iframe.contentFrame();
    if (frame) {
      await page.waitForTimeout(2000);
      const rootHtml = await frame.evaluate(() => document.getElementById('root')?.innerHTML || '');
      console.log('FINAL ROOT HTML length:', rootHtml.length);
      console.log('FINAL ROOT HTML snippet:\n', rootHtml.substring(0, 500));
    }
  }

  await page.screenshot({ path: 'apps/web/public/final-rendered-landing-page.png' });
  console.log('Saved final screenshot to apps/web/public/final-rendered-landing-page.png');
  await browser.close();
}

checkFinalRenderedApp().catch(console.error);
