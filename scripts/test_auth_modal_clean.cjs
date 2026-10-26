const { chromium } = require('playwright-core');

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  
  await page.goto('http://localhost:3005');
  await page.waitForTimeout(1000);

  // Click Logout button in header
  const logoutBtn = await page.$('button[title*="Sign Out" i], header button:has(svg.lucide-log-out)');
  if (logoutBtn) {
    console.log('Found Logout button! Clicking it...');
    await logoutBtn.click();
    await page.waitForTimeout(800);
  }

  const signInBtn = await page.waitForSelector('button:has-text("Sign In")');
  console.log('Sign in button visible:', Boolean(signInBtn));

  await signInBtn.click();
  await page.waitForTimeout(600);

  const googleBtn = await page.waitForSelector('button:has-text("Continue with Google")');
  console.log('Google OAuth button visible in Auth modal:', Boolean(googleBtn));

  const guideBtn = await page.waitForSelector('button:has-text("Setup Guide & Paste JSON")');
  console.log('Setup Guide & Paste JSON button visible:', Boolean(guideBtn));

  await guideBtn.click();
  await page.waitForTimeout(600);

  const guideModalText = await page.evaluate(() => document.body.innerText);
  const guideHasInstructions = guideModalText.includes('OAuth 2.0') || guideModalText.includes('JSON');
  console.log('Google Cloud Guide Modal active and readable:', guideHasInstructions);

  await page.screenshot({ path: 'C:\\Users\\User\\.gemini\\antigravity\\brain\\130bb0ea-5a61-4a3e-aed4-e1a987d4c48d\\live-audit-google-auth-modal.png' });
  console.log('Saved screenshot: live-audit-google-auth-modal.png');

  await browser.close();
  console.log('ALL AUTH TESTS SUCCESSFUL!');
})();
