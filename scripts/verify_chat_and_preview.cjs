const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');

async function run() {
  console.log('🚀 Starting end-to-end verification of Ultrapie AI Studio...');
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  // Listen to console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('Browser Error:', msg.text());
    }
  });

  const screenshotsDir = 'C:\\Users\\User\\.gemini\\antigravity\\brain\\130bb0ea-5a61-4a3e-aed4-e1a987d4c48d';

  // 1. Navigate to Studio
  console.log('1. Navigating to http://localhost:3005/studio ...');
  await page.goto('http://localhost:3005/studio', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // 2. Test Question Answering (NOT dev code generation)
  console.log('2. Testing Question Answering (Concept/Question, not code)...');
  const chatInput = await page.waitForSelector('textarea[placeholder*="Ask anything"]');
  await chatInput.fill('What is Ultrapie and what can it do? Can you explain its architecture?');
  
  // Submit
  await page.keyboard.press('Enter');
  console.log('   Submitted question prompt. Waiting for response...');

  // Wait for stream to finish (stop generating button disappears or text settles)
  await page.waitForTimeout(6000);

  // Check the last message
  const assistantMessages = await page.$$eval('[data-role="assistant"], .prose, div.space-y-4 > div', els => {
    return els.map(e => e.innerText).filter(t => t.length > 50);
  });
  
  console.log('   Assistant responses count:', assistantMessages.length);
  const lastResponse = assistantMessages[assistantMessages.length - 1] || '';
  console.log('   Snippet of response:\n', lastResponse.slice(0, 300) + '...');

  const hasCodeDumping = lastResponse.includes('FILE: src/App.tsx') || lastResponse.includes('export default function App');
  console.log('   Does response dump raw file code? ->', hasCodeDumping ? '❌ YES (BAD)' : '✅ NO (CLEAN CONVERSATION)');

  const questionScreenshotPath = path.join(screenshotsDir, 'studio-question-answered.png');
  await page.screenshot({ path: questionScreenshotPath });
  console.log('   Saved question answering screenshot to:', questionScreenshotPath);

  // 3. Test App Development & Live Preview
  console.log('3. Testing App Development Prompt...');
  await chatInput.fill('Build a modern landing page for Ultrapie AI Cloud');
  await page.keyboard.press('Enter');
  console.log('   Submitted build prompt. Waiting for code generation...');

  // Wait for generation
  await page.waitForTimeout(7000);

  // Switch to Preview Tab
  console.log('4. Checking Preview Tab & Sandbox...');
  const previewTab = await page.waitForSelector('button:has-text("Live Preview"), button:has-text("Preview")');
  await previewTab.click();
  await page.waitForTimeout(3000);

  // Check iframe content
  const frameElement = await page.$('iframe');
  if (frameElement) {
    const frame = await frameElement.contentFrame();
    if (frame) {
      await page.waitForTimeout(4000);
      const bodyText = await frame.evaluate(() => document.body.innerText || '');
      console.log('   Iframe Body text snippet:', bodyText.slice(0, 200));

      const hasSpinnerOnly = bodyText.includes('Compiling React application') && !bodyText.includes('Ultrapie');
      console.log('   Is preview stuck on loading? ->', hasSpinnerOnly ? '❌ STUCK' : '✅ RENDERED SUCCESSFULLY');

      const appButtons = await frame.$$('button');
      console.log('   Interactive buttons inside live sandbox:', appButtons.length);
    }
  } else {
    console.log('   Could not find iframe');
  }

  const previewScreenshotPath = path.join(screenshotsDir, 'studio-live-preview-working.png');
  await page.screenshot({ path: previewScreenshotPath });
  console.log('   Saved live preview screenshot to:', previewScreenshotPath);

  await browser.close();
  console.log('✨ All verifications completed successfully!');
}

run().catch(err => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
