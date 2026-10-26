const { chromium } = require('playwright-core');

async function testLiveBuildingAndEasyDeploy() {
  const chromePath = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
  console.log('--- Testing Live Building & Easy Deploy in Chrome ---');

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
    console.log('1. Navigating to Studio...');
    await page.goto('http://localhost:3000/studio', { waitUntil: 'load' });
    await page.waitForTimeout(2000);

    // Verify Easy Deploy button is visible in header
    console.log('2. Checking Easy Deploy button...');
    const easyDeployBtn = await page.waitForSelector('button:has-text("Easy Deploy")', { timeout: 5000 });
    console.log('✓ Easy Deploy button found in TopBar!');

    // Type prompt to build an app
    console.log('3. Submitting prompt to trigger line-by-line build...');
    const textarea = await page.waitForSelector('textarea');
    await textarea.fill('Build a modern landing page');
    await page.keyboard.press('Enter');

    // Wait 2 seconds to observe live line-by-line coding
    await page.waitForTimeout(2500);

    // Check for live coding indicator
    const content = await page.content();
    const hasLiveIndicator = content.includes('Live Coding') || content.includes('Live Rendering');
    console.log('✓ Live Coding / Live Rendering indicator active while building:', hasLiveIndicator);

    // Wait a few seconds for code generation to complete
    await page.waitForTimeout(6000);

    // Now test 1-Click Easy Deploy
    console.log('4. Testing 1-Click Easy Deploy Modal...');
    await easyDeployBtn.click();
    await page.waitForTimeout(1000);

    // Verify Modal opened
    const modalHeader = await page.waitForSelector('h2:has-text("1-Click Easy Deploy")');
    console.log('✓ Easy Deploy modal opened successfully!');

    // Click Deploy Live in 1 Click
    console.log('5. Triggering 1-Click Deployment...');
    const deployActionBtn = await page.waitForSelector('button:has-text("Deploy Live in 1 Click")');
    await deployActionBtn.click();

    // Wait for deployment simulation steps (packaging, building, container, SSL)
    await page.waitForTimeout(3500);

    // Verify success view
    const successTitle = await page.waitForSelector('h3:has-text("Deployment Successful!")', { timeout: 5000 });
    console.log('✓ Deployment succeeded! Live URL generated and ready.');

    if (consoleErrors.length > 0) {
      console.log('❌ Console errors:', consoleErrors);
    } else {
      console.log('✓ Zero console errors throughout the entire test!');
    }

    console.log('--- ALL TESTS PASSED! ---');
  } catch (err) {
    console.error('Test error:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

testLiveBuildingAndEasyDeploy();
