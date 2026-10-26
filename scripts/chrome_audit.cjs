const { chromium } = require('playwright-core');

async function auditChrome() {
  const chromePath = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
  console.log('--- Starting Chrome Browser Audit ---');
  console.log('Chrome Path:', chromePath);

  const browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
  });

  const urls = [
    { name: 'Homepage', url: 'http://localhost:3000/' },
    { name: 'Studio', url: 'http://localhost:3000/studio' },
    { name: 'Hosting Panel', url: 'http://localhost:3000/hosting' },
    { name: 'AI Chatbot', url: 'http://localhost:3000/chatbot' },
  ];

  for (const item of urls) {
    console.log(`\n========================================`);
    console.log(`Testing Route: ${item.name} (${item.url})`);
    const page = await browser.newPage();
    const consoleErrors = [];
    const pageErrors = [];
    const failedRequests = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push({ text: msg.text(), location: msg.location() });
      }
    });

    page.on('response', (res) => {
      if (res.status() === 404) {
        failedRequests.push(`404: ${res.url()}`);
      }
    });

    page.on('pageerror', (err) => {
      pageErrors.push(err.message);
    });

    page.on('requestfailed', (req) => {
      failedRequests.push(`${req.url()} (${req.failure()?.errorText || 'failed'})`);
    });

    try {
      const response = await page.goto(item.url, { waitUntil: 'load', timeout: 15000 });
      await page.waitForTimeout(2000); // Wait for React hydration & Monaco

      console.log(`HTTP Status: ${response?.status()}`);
      console.log(`Page Title: "${await page.title()}"`);

      // Check for hydration or runtime errors
      if (consoleErrors.length > 0) {
        console.log(`❌ Console Errors (${consoleErrors.length}):`, consoleErrors);
      } else {
        console.log(`✓ Zero console errors.`);
      }

      if (pageErrors.length > 0) {
        console.log(`❌ Page Errors (${pageErrors.length}):`, pageErrors);
      } else {
        console.log(`✓ Zero uncaught page errors.`);
      }

      if (failedRequests.length > 0) {
        console.log(`⚠️ Failed network requests:`, failedRequests);
      } else {
        console.log(`✓ All network requests succeeded.`);
      }

      // Route-specific functional checks
      if (item.name === 'Studio') {
        const buttons = await page.$$('button');
        console.log(`Studio interactive buttons found: ${buttons.length}`);
      } else if (item.name === 'Hosting Panel') {
        const cards = await page.$$('.rounded-xl');
        console.log(`Hosting cards rendered: ${cards.length}`);
      }
    } catch (err) {
      console.error(`Error auditing ${item.name}:`, err.message);
    } finally {
      await page.close();
    }
  }

  await browser.close();
  console.log('\n--- Chrome Browser Audit Completed Successfully ---');
}

auditChrome().catch((err) => {
  console.error('Fatal error in Chrome audit:', err);
  process.exit(1);
});
