const { chromium } = require('playwright-core');

async function checkAdminClick() {
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  await page.goto('http://localhost:3005', { waitUntil: 'networkidle' });

  const adminBtn = await page.$('button:has-text("Admin Hub")');
  console.log('Admin Hub button exists on page:', Boolean(adminBtn));
  if (adminBtn) {
    await adminBtn.click();
    await page.waitForTimeout(2000);

    const bodyText = await page.evaluate(() => document.body.innerText);
    console.log('Body includes "Ultrapie Admin Control Center"?', bodyText.includes('Ultrapie Admin Control Center'));
    console.log('Body includes "Monthly MRR"?', bodyText.includes('Monthly MRR'));
    console.log('Body includes "Studio Generations"?', bodyText.includes('Studio Generations'));
    console.log('Snippet of modal body:\n', bodyText.slice(0, 400));
  }

  await browser.close();
}

checkAdminClick().catch(console.error);
