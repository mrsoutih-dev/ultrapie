const { chromium } = require('playwright-core');

async function testInteractiveBrowser() {
  const chromePath = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
  console.log('--- Launching Interactive Browser Test ---');

  const browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
  });

  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
  });

  try {
    await page.goto('http://localhost:3000/studio', { waitUntil: 'load' });
    await page.waitForTimeout(2000);

    // Click the Send button explicitly
    const textarea = await page.waitForSelector('textarea');
    await textarea.fill('Build a simple landing page');
    const sendBtn = await page.waitForSelector('button[title="Send Message"]');
    await sendBtn.click();
    console.log('Clicked Send button!');

    // Wait 12 seconds for Gemini streaming & compilation
    await page.waitForTimeout(12000);

    const iframeEl = await page.$('iframe');
    console.log('Iframe element found:', Boolean(iframeEl));

    if (iframeEl) {
      const frame = await iframeEl.contentFrame();
      const content = await frame.content();
      console.log('Iframe Content Length:', content.length);
      const h1Text = await frame.textContent('h1').catch(() => null);
      console.log('Iframe H1 Heading:', h1Text);
    }

    // Check Chat messages
    const chatTexts = await page.$$eval('.p-3.rounded-xl.max-w-\\[95\\%\\]', (els) =>
      els.map((e) => e.textContent || '')
    );
    console.log('\nChat Messages:');
    chatTexts.forEach((msg, i) => console.log(`[Msg ${i + 1}]:`, msg.slice(0, 120)));

    await page.screenshot({ path: 'apps/web/public/interactive-test-screenshot.png' });
    console.log('\nScreenshot saved to apps/web/public/interactive-test-screenshot.png');
  } catch (err) {
    console.error('Test error:', err);
  } finally {
    await browser.close();
  }
}

testInteractiveBrowser();
