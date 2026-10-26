const { chromium } = require('playwright-core');

async function testCoolifyLogin() {
  const chromePath = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
  const browser = await chromium.launch({ executablePath: chromePath, headless: true });
  const page = await browser.newPage();

  console.log('Navigating to Coolify login http://localhost:8000/login...');
  await page.goto('http://localhost:8000/login');
  await page.waitForTimeout(2000);

  console.log('Current URL:', page.url());

  // Fill in email and password
  const emailInput = await page.$('input[type="email"], input[name="email"]');
  const passwordInput = await page.$('input[type="password"], input[name="password"]');

  if (emailInput && passwordInput) {
    await emailInput.fill('zohodigital.com@gmail.com');
    await passwordInput.fill('Ultrapie2026!');
    console.log('Filled credentials. Submitting form...');
    
    // Find submit button or press Enter
    await passwordInput.press('Enter');
    await page.waitForTimeout(4000);

    console.log('URL after login attempt:', page.url());
    const pageText = await page.textContent('body');
    if (pageText.includes('These credentials do not match') || pageText.includes('do not match our records')) {
      console.log('❌ Login failed: Credentials do not match');
    } else {
      console.log('✅ Login successful! Reached dashboard or authenticated page:', page.url());
    }
  } else {
    console.log('Could not find email/password inputs on page. HTML:\n', (await page.content()).substring(0, 300));
  }

  await browser.close();
}

testCoolifyLogin().catch(console.error);
