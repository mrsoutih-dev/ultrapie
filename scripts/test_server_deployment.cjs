const { chromium } = require('playwright-core');

async function verifyServerDeployment() {
  console.log('Connecting to Chrome to test Ultrapie on WSL server (port 3005)...');
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // 1. Verify Landing Page on port 3005
  console.log('Testing Landing page at http://localhost:3005 ...');
  await page.goto('http://localhost:3005', { waitUntil: 'networkidle', timeout: 30000 });
  const pageTitle = await page.title();
  console.log(`Page title: ${pageTitle}`);

  const hasHostingPlan = await page.evaluate(() => {
    return document.body.innerText.includes('Starter') && 
           document.body.innerText.includes('$19') &&
           document.body.innerText.includes('Pro Unlimited') &&
           document.body.innerText.includes('$49');
  });
  console.log(`Has monthly hosting subscription plans ($19, $49, $99): ${hasHostingPlan}`);

  // Take screenshot of landing page
  await page.screenshot({ path: 'apps/web/public/server-deployed-landing.png' });
  console.log('Saved screenshot: apps/web/public/server-deployed-landing.png');

  // 2. Verify Studio on port 3005
  console.log('Testing AI Studio at http://localhost:3005/studio ...');
  await page.goto('http://localhost:3005/studio', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);

  const hasGoogleAIStudioLayout = await page.evaluate(() => {
    const text = document.body.innerText;
    return text.includes('Preview') && 
           text.includes('Split') && 
           text.includes('Code') &&
           text.includes('Gemini 3 Flash');
  });
  console.log(`Has Google AI Studio / Antigravity Layout & Gemini 3 Flash: ${hasGoogleAIStudioLayout}`);

  // Take screenshot of studio
  await page.screenshot({ path: 'apps/web/public/server-deployed-studio.png' });
  console.log('Saved screenshot: apps/web/public/server-deployed-studio.png');

  // 3. Verify API Health on port 4000
  console.log('Testing API health at http://localhost:4000/health ...');
  const apiPage = await context.newPage();
  const apiRes = await apiPage.goto('http://localhost:4000/health');
  const apiJson = await apiPage.evaluate(() => document.body.innerText);
  console.log(`API response status: ${apiRes.status()}, body: ${apiJson}`);

  await browser.close();
  console.log('🎉 Verification completed successfully!');
}

verifyServerDeployment().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
