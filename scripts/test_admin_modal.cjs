const { chromium } = require('playwright-core');

async function checkAdminModal() {
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--no-sandbox']
  });

  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  await page.goto('http://localhost:3005', { waitUntil: 'networkidle' });

  // Check user session in localStorage
  const userSession = await page.evaluate(() => localStorage.getItem('ultrapie_user_session'));
  console.log('localStorage user session:', userSession);

  // Click Admin Hub button
  const adminBtn = await page.$('button:has-text("Admin Hub")');
  console.log('Admin Hub button exists:', Boolean(adminBtn));
  if (adminBtn) {
    await adminBtn.click();
    await page.waitForTimeout(2000);
    const modalVisible = await page.evaluate(() => {
      return document.body.innerText.includes('Ultrapie Admin Control Center');
    });
    console.log('Admin Modal visible after click:', modalVisible);
    await page.screenshot({ path: 'apps/web/public/admin-modal-screenshot.png' });
  }

  await browser.close();
}

checkAdminModal().catch(console.error);
