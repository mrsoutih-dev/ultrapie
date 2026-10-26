const { chromium } = require('playwright-core');

async function testGoogleAuthUI() {
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--no-sandbox']
  });

  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  await page.goto('http://localhost:3005', { waitUntil: 'networkidle' });

  // Clear session to simulate logged out user
  await page.evaluate(() => localStorage.removeItem('ultrapie_user_session'));
  await page.reload({ waitUntil: 'networkidle' });

  // Verify Sign In and Register buttons appear
  const hasSignIn = await page.$('button:has-text("Sign In")');
  const hasRegister = await page.$('button:has-text("Register")');
  console.log('Unauthenticated state shows Sign In:', Boolean(hasSignIn), 'and Register:', Boolean(hasRegister));

  // Click Sign In
  if (hasSignIn) {
    await hasSignIn.click();
    await page.waitForTimeout(1000);

    const hasGoogleButton = await page.evaluate(() => {
      return document.body.innerText.includes('Continue with Google') &&
             document.body.innerText.includes('Setup Guide & Paste JSON');
    });
    console.log('AuthModal shows "Continue with Google" & Guide link:', hasGoogleButton);
    await page.screenshot({ path: 'apps/web/public/auth-modal-with-google.png' });

    // Click Google Setup Guide link
    await page.click('button:has-text("Setup Guide & Paste JSON")');
    await page.waitForTimeout(1000);

    const hasGuideModal = await page.evaluate(() => {
      return document.body.innerText.includes('Google Cloud OAuth Setup Guide') &&
             document.body.innerText.includes('Authorized redirect URIs');
    });
    console.log('Google Cloud OAuth Setup Guide visible:', hasGuideModal);
    await page.screenshot({ path: 'apps/web/public/google-cloud-guide-modal.png' });
  }

  await browser.close();
}

testGoogleAuthUI().catch(console.error);
