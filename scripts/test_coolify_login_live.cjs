const { chromium } = require('playwright-core');

async function testCoolifyLogin() {
  console.log('Testing Coolify login live on http://localhost:8000 ...');
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--no-sandbox']
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto('http://localhost:8000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  console.log('Current URL before login:', page.url());

  // Fill email and password
  const emailInput = await page.waitForSelector('input[type="email"], input[name="email"], input[id*="email"]');
  const passInput = await page.waitForSelector('input[type="password"], input[name="password"], input[id*="password"]');

  await emailInput.fill('zohodigital.com@gmail.com');
  await passInput.fill('Ultrapie2026!');

  // Click submit / login button
  const loginBtn = await page.waitForSelector('button[type="submit"], button:has-text("Login"), button:has-text("Sign in")');
  await loginBtn.click();
  console.log('Clicked login button. Waiting for response...');

  await page.waitForTimeout(4000);

  const afterUrl = page.url();
  console.log('URL after login attempt:', afterUrl);

  const bodyText = await page.evaluate(() => document.body.innerText);
  const isFailed = bodyText.includes('These credentials do not match our records');
  console.log('Did login fail? ->', isFailed ? '❌ FAILED' : '✅ SUCCESS');

  const screenshotPath = 'C:\\Users\\User\\.gemini\\antigravity\\brain\\130bb0ea-5a61-4a3e-aed4-e1a987d4c48d\\coolify-login-success.png';
  await page.screenshot({ path: screenshotPath });
  console.log('Saved screenshot to:', screenshotPath);

  if (afterUrl.includes('/login')) {
    console.log('Snippet of page text:', bodyText.slice(0, 300));
  } else {
    console.log('🎉 Successfully logged into Coolify Dashboard!');
  }

  await browser.close();
}

testCoolifyLogin().catch(console.error);
