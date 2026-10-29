const { chromium } = require('playwright-core');

async function testBraveLaunch() {
  console.log('Testing Brave launch...');
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
    headless: true,
    args: ['--no-sandbox']
  });
  console.log('Brave launched successfully! Version:', await browser.version());
  await browser.close();
  console.log('Brave closed cleanly.');
}

testBraveLaunch().catch(err => {
  console.error('Brave launch error:', err);
  process.exit(1);
});
