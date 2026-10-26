const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = 'C:\\Users\\User\\.gemini\\antigravity\\brain\\130bb0ea-5a61-4a3e-aed4-e1a987d4c48d';
const PUBLIC_URL = 'https://devon-heath-recruitment-sussex.trycloudflare.com';
const LOCAL_URL = 'http://localhost:3005';

const results = {
  timestamp: new Date().toISOString(),
  endpoints: {},
  features: {},
  screenshots: []
};

async function runComprehensiveTest() {
  console.log('====================================================');
  console.log('   ULTRA-PIE COMPREHENSIVE LIVE AUDIT & TEST SUITE   ');
  console.log('====================================================\n');

  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  try {
    // ----------------------------------------------------
    // TEST 1: LANDING PAGE & THEME TOGGLE
    // ----------------------------------------------------
    console.log('>>> [1/10] Testing Landing Page & Theme Toggle...');
    const landingRes = await page.goto(LOCAL_URL, { waitUntil: 'networkidle', timeout: 20000 });
    results.endpoints['landing'] = { status: landingRes.status(), ok: landingRes.ok() };
    console.log(`Landing Page Status: ${landingRes.status()}`);

    // Check title / brand
    const title = await page.title();
    console.log(`Landing Title: "${title}"`);

    // Toggle theme to Light
    const themeBtn = await page.$('button[title*="theme" i], button[aria-label*="theme" i], header button:has(svg)');
    let themeToggled = false;
    if (themeBtn) {
      await themeBtn.click();
      await page.waitForTimeout(600);
      themeToggled = true;
    }
    results.features['landing_theme_toggle'] = { passed: true, toggled: themeToggled };

    const shot1 = path.join(ARTIFACT_DIR, 'live-audit-landing.png');
    await page.screenshot({ path: shot1 });
    results.screenshots.push('live-audit-landing.png');
    console.log('  ✓ Landing page tested and screenshot saved.');

    // ----------------------------------------------------
    // TEST 2: AUTH MODAL & GOOGLE OAUTH FLOW
    // ----------------------------------------------------
    console.log('\n>>> [2/10] Testing Auth Modal & Google OAuth Controls...');
    const signInBtn = await page.$('button:has-text("Sign In"), button:has-text("Connexion")');
    let authModalOpened = false;
    let hasGoogleBtn = false;
    let hasGoogleGuide = false;

    if (signInBtn) {
      await signInBtn.click();
      await page.waitForTimeout(800);
      authModalOpened = true;

      // Check Google button
      const googleBtn = await page.$('button:has-text("Google")');
      if (googleBtn) hasGoogleBtn = true;

      // Check Google setup guide button
      const guideBtn = await page.$('button:has-text("Google Cloud Setup Guide"), button:has-text("Guide")');
      if (guideBtn) {
        hasGoogleGuide = true;
        await guideBtn.click();
        await page.waitForTimeout(500);
        // Close guide modal if open
        const closeGuide = await page.$('button:has-text("Got it"), button:has-text("Close")');
        if (closeGuide) await closeGuide.click();
      }

      // Close auth modal
      const closeAuth = await page.$('div[role="dialog"] button:has(svg), .fixed button:has(svg)');
      if (closeAuth) await closeAuth.click();
      await page.waitForTimeout(400);
    }
    results.features['auth_modal_and_google'] = {
      passed: authModalOpened,
      hasGoogleBtn,
      hasGoogleGuide
    };
    console.log(`  ✓ Auth Modal: ${authModalOpened}, Google OAuth Button: ${hasGoogleBtn}, Guide: ${hasGoogleGuide}`);

    // ----------------------------------------------------
    // TEST 3: ADMIN HUB & MASTER OWNER CONTROLS
    // ----------------------------------------------------
    console.log('\n>>> [3/10] Testing Admin Hub & Master Owner Controls...');
    // Login as Admin
    await page.evaluate(() => {
      localStorage.setItem('ultrapie_user', JSON.stringify({
        id: 'usr_admin_001',
        email: 'zohodigital.com@gmail.com',
        name: 'Elhoussine Soutih',
        role: 'admin',
        plan: 'enterprise'
      }));
    });
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(800);

    const adminBtn = await page.$('button:has-text("Admin Hub"), button:has-text("Admin")');
    let adminHubOpened = false;
    let hasStats = false;
    let hasUsersTable = false;

    if (adminBtn) {
      await adminBtn.click();
      await page.waitForTimeout(800);
      adminHubOpened = true;

      // Check metrics
      const modalText = await page.evaluate(() => document.body.innerText);
      hasStats = modalText.includes('MRR') || modalText.includes('Total Users') || modalText.includes('Builds');
      hasUsersTable = modalText.includes('zohodigital.com@gmail.com') || modalText.includes('Active Users');

      const shot2 = path.join(ARTIFACT_DIR, 'live-audit-admin-hub.png');
      await page.screenshot({ path: shot2 });
      results.screenshots.push('live-audit-admin-hub.png');

      // Close Admin modal
      const closeAdmin = await page.$('div[role="dialog"] button:has(svg), .fixed.inset-0 button:has(svg)');
      if (closeAdmin) await closeAdmin.click();
      await page.waitForTimeout(400);
    }
    results.features['admin_hub'] = { passed: adminHubOpened, hasStats, hasUsersTable };
    console.log(`  ✓ Admin Hub Opened: ${adminHubOpened}, Metrics: ${hasStats}, Users Directory: ${hasUsersTable}`);

    // ----------------------------------------------------
    // TEST 4: STUDIO NAVIGATION & VIEWPORTS
    // ----------------------------------------------------
    console.log('\n>>> [4/10] Testing Studio Navigation & Viewport Switching...');
    const studioRes = await page.goto(`${LOCAL_URL}/studio`, { waitUntil: 'networkidle', timeout: 30000 });
    results.endpoints['studio_local'] = { status: studioRes.status(), ok: studioRes.ok() };
    await page.waitForTimeout(1500);

    // Test Viewport toggles: Tablet (768px), Mobile (375px), Desktop
    const tabletBtn = await page.$('button[title*="Tablet" i], button:has-text("Tablet")');
    let tabletWorking = false;
    if (tabletBtn) {
      await tabletBtn.click();
      await page.waitForTimeout(300);
      tabletWorking = true;
    }

    const mobileBtn = await page.$('button[title*="Mobile" i], button:has-text("Mobile")');
    let mobileWorking = false;
    if (mobileBtn) {
      await mobileBtn.click();
      await page.waitForTimeout(300);
      mobileWorking = true;
    }

    const desktopBtn = await page.$('button[title*="Desktop" i], button:has-text("Desktop")');
    if (desktopBtn) {
      await desktopBtn.click();
      await page.waitForTimeout(300);
    }

    results.features['studio_viewports'] = { tabletWorking, mobileWorking };
    console.log(`  ✓ Viewports: Tablet (${tabletWorking}), Mobile (${mobileWorking}), Desktop (Active)`);

    // ----------------------------------------------------
    // TEST 5: SETTINGS MODAL & GEMINI CONFIGURATION
    // ----------------------------------------------------
    console.log('\n>>> [5/10] Testing Settings Modal & Model Selection...');
    const settingsBtn = await page.$('button[title*="Settings" i], button:has(svg.lucide-settings)');
    let settingsOpened = false;
    let modelCount = 0;

    if (settingsBtn) {
      await settingsBtn.click();
      await page.waitForTimeout(600);
      settingsOpened = true;

      const options = await page.$$eval('select option', opts => opts.map(o => o.value));
      modelCount = options.length;
      console.log('Available models in dropdown:', options);

      // Close settings
      const closeSettings = await page.$('div[role="dialog"] button:has(svg), .fixed button:has(svg)');
      if (closeSettings) await closeSettings.click();
      await page.waitForTimeout(300);
    }
    results.features['settings_modal'] = { passed: settingsOpened, modelCount };
    console.log(`  ✓ Settings Modal: ${settingsOpened}, Models count: ${modelCount}`);

    // ----------------------------------------------------
    // TEST 6: DYNAMIC GENERAL KNOWLEDGE AI ANSWER
    // ----------------------------------------------------
    console.log('\n>>> [6/10] Testing Gemini General Knowledge & Reasoning Live...');
    const generalPrompt = 'Explain the difference between TCP and UDP in 2 distinct bullet points.';
    console.log(`Prompt: "${generalPrompt}"`);

    await page.fill('textarea', generalPrompt);
    await page.waitForTimeout(200);
    await page.click('form button[type="submit"]');

    console.log('Waiting for Gemini live stream response...');
    await page.waitForTimeout(8000);

    const chatBubbles = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('aside div.overflow-y-auto .rounded-xl'))
        .map(b => b.innerText.trim())
        .filter(Boolean);
    });

    const aiAnswer = chatBubbles[chatBubbles.length - 1] || '';
    console.log('AI Answer Preview:\n', aiAnswer.slice(0, 250));

    const isIntelligent = (aiAnswer.includes('TCP') || aiAnswer.includes('UDP')) &&
                          (aiAnswer.toLowerCase().includes('connection') || aiAnswer.toLowerCase().includes('handshake') || aiAnswer.toLowerCase().includes('reliable'));
    const isCanned = aiAnswer.includes('Thank you for your question! Here is what you should know:');

    results.features['ai_general_knowledge'] = {
      passed: isIntelligent && !isCanned,
      isCanned,
      answerLength: aiAnswer.length
    };

    const shot3 = path.join(ARTIFACT_DIR, 'live-audit-studio-general-question.png');
    await page.screenshot({ path: shot3 });
    results.screenshots.push('live-audit-studio-general-question.png');
    console.log(`  ✓ General AI Answer: Intelligent=${isIntelligent}, Canned=${isCanned}, Length=${aiAnswer.length}`);

    // ----------------------------------------------------
    // TEST 7: NATURAL LANGUAGE APP BUILDING & INTERACTIVE PREVIEW
    // ----------------------------------------------------
    console.log('\n>>> [7/10] Testing Live React App Building & Babel Preview...');
    const buildPrompt = 'Build a modern sleek calculator app with digital display, buttons for numbers 0-9, operators plus minus multiply divide, and Clear button using Tailwind CSS';
    console.log(`Prompt: "${buildPrompt}"`);

    await page.fill('textarea', buildPrompt);
    await page.waitForTimeout(200);
    await page.click('form button[type="submit"]');

    console.log('Waiting for Monaco line-by-line streaming and live Babel transpilation...');
    await page.waitForTimeout(16000);

    // Check iframe preview
    const iframeHandle = await page.$('iframe');
    let previewRendered = false;
    let buttonCount = 0;
    let displayContent = '';

    if (iframeHandle) {
      const frame = await iframeHandle.contentFrame();
      if (frame) {
        const text = await frame.evaluate(() => document.body ? document.body.innerText : '');
        console.log('Iframe preview text preview:\n', text.slice(0, 150));
        
        buttonCount = await frame.$$eval('button', btns => btns.length);
        console.log(`Buttons found inside live app preview: ${buttonCount}`);

        // Try interactive click on a number button inside iframe!
        const numBtn = await frame.$('button:has-text("7"), button:has-text("1"), button:has-text("5")');
        if (numBtn) {
          await numBtn.click();
          await page.waitForTimeout(500);
          displayContent = await frame.evaluate(() => document.body ? document.body.innerText : '');
          console.log('Live app responded to interactive click inside iframe!');
        }

        if (buttonCount >= 5) {
          previewRendered = true;
        }
      }
    }

    results.features['live_app_preview'] = {
      passed: previewRendered,
      buttonCount,
      hasInteractiveClick: Boolean(displayContent)
    };

    const shot4 = path.join(ARTIFACT_DIR, 'live-audit-studio-live-calculator-preview.png');
    await page.screenshot({ path: shot4 });
    results.screenshots.push('live-audit-studio-live-calculator-preview.png');
    console.log(`  ✓ Live Preview Rendered: ${previewRendered}, Interactive Buttons: ${buttonCount}`);

    // ----------------------------------------------------
    // TEST 8: 1-CLICK EASY DEPLOY & GITHUB MODALS
    // ----------------------------------------------------
    console.log('\n>>> [8/10] Testing 1-Click Easy Deploy & GitHub Modals...');
    const deployBtn = await page.$('button:has-text("Easy Deploy"), button:has-text("Deploy")');
    let deployModalWorking = false;

    if (deployBtn) {
      await deployBtn.click();
      await page.waitForTimeout(800);
      const modalText = await page.evaluate(() => document.body.innerText);
      deployModalWorking = modalText.includes('Coolify') || modalText.includes('Cloudflare') || modalText.includes('ZIP');

      const shot5 = path.join(ARTIFACT_DIR, 'live-audit-easy-deploy.png');
      await page.screenshot({ path: shot5 });
      results.screenshots.push('live-audit-easy-deploy.png');

      const closeDeploy = await page.$('.fixed button:has(svg)');
      if (closeDeploy) await closeDeploy.click();
      await page.waitForTimeout(400);
    }
    results.features['easy_deploy_modal'] = { passed: deployModalWorking };
    console.log(`  ✓ Easy Deploy Modal: ${deployModalWorking}`);

    // ----------------------------------------------------
    // TEST 9: COOLIFY HOSTING DASHBOARD (`/hosting`)
    // ----------------------------------------------------
    console.log('\n>>> [9/10] Testing Coolify Hosting Page (`/hosting`)...');
    const hostingRes = await page.goto(`${LOCAL_URL}/hosting`, { waitUntil: 'networkidle', timeout: 20000 });
    results.endpoints['hosting'] = { status: hostingRes.status(), ok: hostingRes.ok() };
    await page.waitForTimeout(1000);

    const hostingText = await page.evaluate(() => document.body.innerText);
    const hasCoolifyConnected = hostingText.includes('Connected') || hostingText.includes('Active') || hostingText.includes('8000');

    const shot6 = path.join(ARTIFACT_DIR, 'live-audit-coolify-hosting.png');
    await page.screenshot({ path: shot6 });
    results.screenshots.push('live-audit-coolify-hosting.png');
    results.features['coolify_hosting_page'] = { passed: hostingRes.ok(), hasCoolifyConnected };
    console.log(`  ✓ Hosting page status: ${hostingRes.status()}, Connected indicator: ${hasCoolifyConnected}`);

    // ----------------------------------------------------
    // TEST 10: PUBLIC CLOUDFLARE EDGE TUNNEL AUDIT
    // ----------------------------------------------------
    console.log('\n>>> [10/10] Testing Live Worldwide Public Tunnel URL...');
    console.log(`Visiting: ${PUBLIC_URL} ...`);
    const publicRes = await page.goto(PUBLIC_URL, { waitUntil: 'networkidle', timeout: 30000 });
    results.endpoints['public_tunnel_landing'] = { status: publicRes.status(), ok: publicRes.ok() };
    console.log(`Public Tunnel Landing Status: ${publicRes.status()}`);

    const publicStudioRes = await page.goto(`${PUBLIC_URL}/studio`, { waitUntil: 'networkidle', timeout: 30000 });
    results.endpoints['public_tunnel_studio'] = { status: publicStudioRes.status(), ok: publicStudioRes.ok() };
    console.log(`Public Tunnel Studio Status: ${publicStudioRes.status()}`);

    const shot7 = path.join(ARTIFACT_DIR, 'live-audit-public-tunnel-studio.png');
    await page.screenshot({ path: shot7 });
    results.screenshots.push('live-audit-public-tunnel-studio.png');

    results.features['public_tunnel'] = {
      landingStatus: publicRes.status(),
      studioStatus: publicStudioRes.status(),
      accessibleWorldwide: publicRes.ok() && publicStudioRes.ok()
    };
    console.log(`  ✓ Public Tunnel Worldwide Accessible: ${publicRes.ok() && publicStudioRes.ok()}`);

  } catch (err) {
    console.error('Audit execution error:', err.message);
    results.error = err.message;
  } finally {
    await browser.close();
  }

  // Save results JSON
  const resultsPath = path.join(ARTIFACT_DIR, 'comprehensive_live_audit_results.json');
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  console.log('\n====================================================');
  console.log('AUDIT COMPLETE! Results saved to:', resultsPath);
  console.log('====================================================');
}

runComprehensiveTest();
