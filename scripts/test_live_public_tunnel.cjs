const { chromium } = require('playwright-core');

async function testPublicTunnel() {
  console.log('Testing live public tunnel URL: https://hotel-boom-configurations-edge.trycloudflare.com/studio ...');
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--no-sandbox']
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto('https://hotel-boom-configurations-edge.trycloudflare.com/studio', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const title = await page.title();
  console.log('Page Title:', title);

  const studioBrand = await page.$('span:has-text("AI Studio")');
  console.log('Studio brand found:', Boolean(studioBrand));

  // Take screenshot
  const screenshotPath = 'C:\\Users\\User\\.gemini\\antigravity\\brain\\130bb0ea-5a61-4a3e-aed4-e1a987d4c48d\\live-public-tunnel-studio.png';
  await page.screenshot({ path: screenshotPath });
  console.log('Saved screenshot of live public tunnel to:', screenshotPath);

  await browser.close();
}

testPublicTunnel().catch(console.error);
