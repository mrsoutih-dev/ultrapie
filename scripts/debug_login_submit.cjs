const { chromium } = require('playwright-core');

async function testLoginDirectly() {
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  page.on('console', msg => console.log('LOG:', msg.type(), msg.text()));

  await page.goto('http://localhost:3005', { waitUntil: 'networkidle' });
  
  // Clear session to ensure clean login test
  await page.evaluate(() => {
    localStorage.removeItem('ultrapie_user_session');
    localStorage.setItem('ultrapie_has_visited', 'true');
  });
  await page.reload({ waitUntil: 'networkidle' });

  // Click Sign In
  const signInBtn = await page.$('button:has-text("Sign In")');
  console.log('Sign In button found:', Boolean(signInBtn));
  await signInBtn.click();
  await page.waitForTimeout(1000);

  // Fill credentials
  const emailInput = await page.$('input[type="email"]');
  const passInput = await page.$('input[type="password"]');
  console.log('Inputs found:', Boolean(emailInput), Boolean(passInput));
  await emailInput.fill('zohodigital.com@gmail.com');
  await passInput.fill('Ultrapie2026!');

  // Submit form
  const submitBtn = await page.$('form button[type="submit"]');
  console.log('Submit button text:', await submitBtn.innerText());
  await submitBtn.click();
  await page.waitForTimeout(2000);

  // Check if modal closed or error appeared
  const modalText = await page.evaluate(() => {
    const m = document.querySelector('div[role="dialog"], div.fixed.inset-0');
    return m ? m.innerText : 'NO_MODAL';
  });
  console.log('Modal after submit:', modalText.slice(0, 100));

  // Check if Admin Hub button is visible
  const adminHubBtn = await page.$('button:has-text("Admin Hub")');
  console.log('Admin Hub button visible:', Boolean(adminHubBtn));

  await browser.close();
}

testLoginDirectly().catch(console.error);
