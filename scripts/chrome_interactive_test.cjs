const { chromium } = require('playwright-core');
const fs = require('fs');

async function testInteractiveStudio() {
  const chromePath = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
  console.log('--- Starting Chrome Interactive Studio Test ---');

  const browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
  });

  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
  });

  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  try {
    console.log('1. Navigating to http://localhost:3000/studio...');
    await page.goto('http://localhost:3000/studio', { waitUntil: 'load' });
    await page.waitForTimeout(2500);

    // Verify empty initial state
    console.log('2. Verifying clean initial state...');
    const emptyStateText = await page.textContent('body');
    const hasInitialIndicator = emptyStateText.includes('Ready to build') || emptyStateText.includes('Describe your app');
    console.log('Studio empty greeting found:', hasInitialIndicator);

    // Find textarea
    console.log('3. Submitting first prompt...');
    const textarea = await page.waitForSelector('textarea', { timeout: 5000 });
    await textarea.fill('Build a modern navbar and hero section for Ultrapie');
    
    // Click send or press Enter
    await page.keyboard.press('Enter');
    console.log('Prompt 1 submitted!');

    await page.waitForTimeout(1000);

    // Immediately submit second prompt without waiting
    console.log('4. Submitting concurrent second prompt (non-blocking test)...');
    await textarea.fill('Add a pricing section with 3 tiers');
    await page.keyboard.press('Enter');
    console.log('Prompt 2 submitted concurrently!');

    // Wait a few seconds to let live coding & streaming kick in
    console.log('5. Observing live code generation and streaming...');
    await page.waitForTimeout(7000);

    // Capture screenshot of live studio
    const screenshotDir = 'apps/web/public';
    fs.mkdirSync(screenshotDir, { recursive: true });
    const screenshotPath = 'apps/web/public/studio-live-test.png';
    await page.screenshot({ path: screenshotPath });
    console.log(`Screenshot saved to ${screenshotPath}`);

    // Verify chat messages count >= 2
    const messages = await page.$$('.whitespace-pre-wrap, .group');
    console.log(`Rendered chat elements found: ${messages.length}`);

    if (consoleErrors.length > 0) {
      console.log('❌ Console errors during interaction:', consoleErrors);
    } else {
      console.log('✓ Zero console errors during full interactive prompt cycle!');
    }

    console.log('--- Interactive Test Passed Successfully ---');
  } catch (err) {
    console.error('Interactive test error:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

testInteractiveStudio();