const { chromium } = require('playwright-core');

async function testNewTab() {
  console.log('Testing New Tab Blob rendering...');
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  await page.goto('http://localhost:3005/studio', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Generate app
  const chatInput = await page.waitForSelector('textarea[placeholder*="Ask anything"]');
  await chatInput.fill('Build a modern landing page');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(7000);

  // Listen for new page
  const pagePromise = context.waitForEvent('page');
  const openNewTabBtn = await page.waitForSelector('button[title*="Open preview in new tab"]');
  await openNewTabBtn.click();
  const newPage = await pagePromise;
  await newPage.waitForLoadState('domcontentloaded');
  await newPage.waitForTimeout(4000);

  const newPageText = await newPage.evaluate(() => document.body.innerText || '');
  console.log('New tab URL:', newPage.url());
  console.log('New tab rendered text snippet:', newPageText.slice(0, 150));
  const renderedSuccessfully = newPageText.includes('Ultrapie') || newPageText.includes('Build and Deploy');
  console.log('Does new tab render live app? ->', renderedSuccessfully ? '✅ YES' : '❌ NO');

  await browser.close();
}

testNewTab().catch(err => {
  console.error(err);
  process.exit(1);
});
