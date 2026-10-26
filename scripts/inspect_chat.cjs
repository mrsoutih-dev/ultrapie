const { chromium } = require('playwright-core');

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));

  await page.goto('http://localhost:3005/studio');
  await page.waitForTimeout(2000);
  
  await page.fill('textarea', 'Explain photosynthesis in 1 sentence.');
  await page.click('form button[type="submit"]');
  console.log('Clicked submit! Waiting 7s...');
  await page.waitForTimeout(7000);
  
  const msgs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('aside .rounded-xl')).map((el, i) => ({
      index: i,
      className: el.className,
      text: el.innerText
    }));
  });
  console.log('MESSAGES:', JSON.stringify(msgs, null, 2));

  await page.screenshot({ path: 'C:\\Users\\User\\.gemini\\antigravity\\brain\\130bb0ea-5a61-4a3e-aed4-e1a987d4c48d\\studio-inspect.png' });
  await browser.close();
})();
