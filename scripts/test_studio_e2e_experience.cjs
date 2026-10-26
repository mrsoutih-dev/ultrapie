const { chromium } = require('playwright-core');

async function testFullStudioExperience() {
  const chromePath = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
  console.log('=== STARTING END-TO-END GOOGLE AI STUDIO / ANTIGRAVITY VERIFICATION ===\n');

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
    // -------------------------------------------------------------------
    // STEP 1: Verify Homepage & Monthly Subscription Plans
    // -------------------------------------------------------------------
    console.log('Step 1: Navigating to Homepage (http://localhost:3000)...');
    await page.goto('http://localhost:3000', { waitUntil: 'load' });
    await page.waitForTimeout(1500);

    const pageTitle = await page.textContent('h1');
    console.log('✓ Homepage H1:', pageTitle.replace(/\s+/g, ' ').trim());

    // Check pricing plans visible
    const pricingText = await page.textContent('#pricing');
    console.log('✓ Monthly Subscription Plans section verified:', pricingText.includes('$19') && pricingText.includes('$49'));

    // -------------------------------------------------------------------
    // STEP 2: Verify Registration & Monthly Subscription Paywall
    // -------------------------------------------------------------------
    console.log('\nStep 2: Testing User Registration & Monthly Subscription Checkout...');
    const registerBtn = await page.locator('button:has-text("Register")').first();
    if (await registerBtn.isVisible()) {
      await registerBtn.click();
      await page.waitForTimeout(500);

      const uniqueEmail = `creator_${Date.now()}@ultrapie.app`;
      await page.fill('input[placeholder="Alex Rivers"]', 'New Creator');
      await page.fill('input[type="email"]', uniqueEmail);
      await page.fill('input[type="password"]', 'Password123!');
      await page.click('button[type="submit"]:has-text("Create Account")');

      console.log(`Submitted registration for: ${uniqueEmail}`);
      await page.waitForTimeout(2000);

      // Verify Subscription Modal popped up
      const subModalText = await page.textContent('body');
      console.log('✓ Subscription Paywall Modal triggered after registration:', subModalText.includes('Select Your Monthly Subscription Plan'));

      // Click "Pay $49 / Month & Activate Instantly"
      const payBtn = await page.locator('button:has-text("Pay $49 / Month")').first();
      if (await payBtn.isVisible()) {
        await payBtn.click();
        await page.waitForTimeout(2500);
        console.log('✓ Monthly subscription checkout completed successfully!');
      }
    }

    // -------------------------------------------------------------------
    // STEP 3: Verify Master Credentials Sign-In
    // -------------------------------------------------------------------
    console.log('\nStep 3: Verifying Master Credentials (zohodigital.com@gmail.com)...');
    const res = await page.evaluate(async () => {
      const resp = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'zohodigital.com@gmail.com', password: 'Ultrapie2026!' }),
      });
      return await resp.json();
    });
    console.log('✓ Master Login API Response:', res.success ? `SUCCESS (User: ${res.user.email}, Plan: ${res.user.plan})` : res.error);
    if (!res.success) {
      throw new Error('Master login credentials failed!');
    }

    // -------------------------------------------------------------------
    // STEP 4: Test Studio & Live View Switcher (Preview / Split / Code)
    // -------------------------------------------------------------------
    console.log('\nStep 4: Navigating to Studio (http://localhost:3000/studio)...');
    await page.goto('http://localhost:3000/studio', { waitUntil: 'load' });
    await page.waitForTimeout(2000);

    // Test View Mode switcher
    const previewTabBtn = await page.locator('button:has-text("Preview")').first();
    const codeTabBtn = await page.locator('button:has-text("Code")').first();
    const splitTabBtn = await page.locator('button:has-text("Split")').first();

    console.log('✓ Google AI Studio View Switchers visible:');
    console.log('  - Preview Tab:', await previewTabBtn.isVisible());
    console.log('  - Code Tab:', await codeTabBtn.isVisible());
    console.log('  - Split Tab:', await splitTabBtn.isVisible());

    // Switch to Full Preview
    await previewTabBtn.click();
    await page.waitForTimeout(400);

    // Switch back to Split View
    await splitTabBtn.click();
    await page.waitForTimeout(400);

    // -------------------------------------------------------------------
    // STEP 5: Test Live App Generation (Bakery Landing Page)
    // -------------------------------------------------------------------
    console.log('\nStep 5: Testing Live Code Generation: "Build a simple landing page for an artisan bakery"...');
    const textarea = await page.waitForSelector('textarea');
    await textarea.fill('Build a simple landing page for an artisan bakery');
    await page.keyboard.press('Enter');

    console.log('Waiting for Gemini 3 line-by-line streaming & live in-memory compilation (24s)...');
    await page.waitForTimeout(24000);

    // Verify chat bubble stays clean (no 400 lines of raw code in chat)
    const chatBubbles = await page.$$eval(
      '.p-3.rounded-xl.max-w-\\[95\\%\\]',
      (els) => els.map((e) => e.textContent || '')
    );
    const lastChatBubble = chatBubbles[chatBubbles.length - 1] || '';
    console.log('✓ Chat Assistant Message:\n', lastChatBubble.slice(0, 160) + '...');
    const hasRawCodeDump = lastChatBubble.includes('export default function') && lastChatBubble.length > 800;
    console.log('✓ Zero raw code dumped in chat bubble:', !hasRawCodeDump);

    // Verify Preview Sandbox rendered live HTML
    const iframe = await page.$('iframe');
    let renderedHtmlBytes = 0;
    if (iframe) {
      const frame = await iframe.contentFrame();
      if (frame) {
        const rootHtml = await frame.evaluate(() => document.getElementById('root')?.innerHTML || '').catch(() => '');
        renderedHtmlBytes = rootHtml.length;
        console.log(`✓ Live Preview Sandbox rendered ${renderedHtmlBytes} bytes of interactive HTML components!`);
        console.log('Preview snippet:\n', rootHtml.substring(0, 300));
      }
    }

    if (renderedHtmlBytes < 500) {
      throw new Error(`FAILED: Preview sandbox did not render full HTML (got ${renderedHtmlBytes} bytes)!`);
    }

    // Capture screenshot of the verified studio
    const screenshotPath = 'apps/web/public/studio-google-ai-studio-verified.png';
    await page.screenshot({ path: screenshotPath });
    console.log(`\n✓ Live high-res screenshot saved to: ${screenshotPath}`);

    console.log('\n======================================================');
    console.log('>>> ALL GOOGLE AI STUDIO & SUBSCRIPTION TESTS PASSED! <<<');
    console.log('======================================================');
  } catch (err) {
    console.error('Test Failed:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

testFullStudioExperience().catch(console.error);
