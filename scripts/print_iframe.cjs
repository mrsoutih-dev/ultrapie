const { chromium } = require('playwright-core');
async function test() {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
  });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/studio');
  await page.waitForTimeout(2000);
  const textarea = await page.waitForSelector('textarea');
  await textarea.fill('Build a simple landing page');
  await page.click('button[title="Send Message"]');
  console.log('Submitted prompt, waiting for generation...');
  await page.waitForTimeout(16000);

  const iframeEl = await page.$('iframe');
  if (iframeEl) {
    const frame = await iframeEl.contentFrame();
    console.log('IFRAME CONTENT:');
    console.log(await frame.content());
  } else {
    console.log('NO IFRAME FOUND!');
  }
  await browser.close();
}
test();
