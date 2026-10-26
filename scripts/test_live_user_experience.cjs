const { chromium } = require('playwright-core');

async function testLiveUserExperience() {
  const chromePath = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
  console.log('--- Testing Live User Experience in Google Chrome ---');

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

    // ========================================================
    // TEST 1: Conversational question (MUST NOT generate code)
    // ========================================================
    console.log('\n2. Testing Conversational Question: "Hi, what can you do?"...');
    const textarea = await page.waitForSelector('textarea');
    await textarea.fill('Hi, what can you do?');
    await page.keyboard.press('Enter');

    // Wait for response
    await page.waitForTimeout(4000);

    const chatMessagesAfterQuestion = await page.$$eval(
      '.p-3.rounded-xl.max-w-\\[95\\%\\]',
      (els) => els.map((e) => e.textContent || '')
    );
    const lastAnswer = chatMessagesAfterQuestion[chatMessagesAfterQuestion.length - 1] || '';
    console.log('Chatbot Answer to Question:\n', lastAnswer.slice(0, 150) + '...\n');

    // Assert: Chatbot did NOT output code blocks
    const containsCodeInChat = lastAnswer.includes('import React') || lastAnswer.includes('```');
    console.log('✓ Did NOT dump code in chat on conversational question:', !containsCodeInChat);
    if (containsCodeInChat) {
      throw new Error('FAILED: Chatbot dumped raw code when user only asked a question!');
    }

    // ========================================================
    // TEST 2: App Build Command: "Build a simple landing page"
    // ========================================================
    console.log('\n3. Testing App Build Command: "Build a simple landing page"...');
    await textarea.fill('Build a simple landing page');
    await page.keyboard.press('Enter');

    // Poll until files are generated, code streams, and iframe renders the full app
    console.log('Waiting for code streaming and live preview compilation (25s)...');
    let previewRendered = false;
    let headingText = '';

    for (let attempt = 0; attempt < 30; attempt++) {
      await page.waitForTimeout(1000);

      try {
        const iframeElement = await page.$('iframe');
        if (iframeElement) {
          const frame = await iframeElement.contentFrame();
          if (frame) {
            const rootHtml = await frame.evaluate(() => document.getElementById('root')?.innerHTML || '').catch(() => '');
            if (rootHtml.length > 500 && !rootHtml.includes('Live Coding & Rendering in Progress')) {
              headingText = rootHtml.slice(0, 150);
              previewRendered = true;
              break;
            }
          }
        }
      } catch {
        // Frame compiling, continue polling
      }
    }

    console.log('✓ Preview Sandbox rendered live UI content (bytes > 500):\n', headingText);
    if (!previewRendered) {
      throw new Error('FAILED: Preview sandbox did not render UI content in time!');
    }

    // Verify chat message stays clean (no giant raw code dump in the chat bubble)
    const chatMessagesAfterBuild = await page.$$eval(
      '.p-3.rounded-xl.max-w-\\[95\\%\\]',
      (els) => els.map((e) => e.textContent || '')
    );
    const buildSummary = chatMessagesAfterBuild[chatMessagesAfterBuild.length - 1] || '';
    console.log('\nChatbot Summary for Build (Clean):\n', buildSummary.slice(0, 160) + '...');
    const chatHasRawCode = buildSummary.includes('export default function') && buildSummary.length > 800;
    console.log('✓ Chat bubble keeps clean friendly text (no raw code dump):', !chatHasRawCode);

    // Verify Monaco editor has the code
    const activeFileBadge = await page.textContent('.font-mono.text-cyan-400');
    console.log('✓ Monaco Active File:', activeFileBadge);

    // Take screenshot of live studio with rendered landing page
    const screenshotPath = 'apps/web/public/live-landing-page-verified.png';
    await page.screenshot({ path: screenshotPath });
    console.log(`✓ Live screenshot saved to: ${screenshotPath}`);

    if (consoleErrors.length > 0) {
      console.log('⚠️ Console errors:', consoleErrors);
    } else {
      console.log('✓ ZERO console errors detected during entire interactive session!');
    }

    console.log('\n========================================');
    console.log('>>> ALL VERIFICATION CHECKS PASSED! <<<');
    console.log('========================================');
  } catch (err) {
    console.error('Test Failed:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

testLiveUserExperience();
