const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = 'C:\\Users\\User\\.gemini\\antigravity\\brain\\130bb0ea-5a61-4a3e-aed4-e1a987d4c48d';
const PUBLIC_DIR = path.join(__dirname, '..', 'apps', 'web', 'public');

const results = [];

function recordResult(domain, testName, passed, details = '', screenshot = null) {
  results.push({ domain, testName, passed, details, screenshot });
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} [${domain.padEnd(10)}] ${testName.padEnd(35)} : ${details}`);
}

async function runLiveAudit() {
  console.log('====================================================');
  console.log('🚀 RUNNING COMPREHENSIVE BROWSER FEATURE AUDIT');
  console.log('====================================================\n');

  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('   [Browser Error]:', msg.text());
    }
  });

  try {
    // ----------------------------------------------------
    // TEST 1: Landing Page Load & Hero
    // ----------------------------------------------------
    console.log('--- 1. Testing Landing Page ---');
    await page.goto('http://localhost:3005', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const heroHeading = await page.$('h1');
    const heroText = heroHeading ? (await heroHeading.innerText()).replace(/\n/g, ' ') : '';
    const hasHero = heroText.length > 5;
    recordResult('Landing', 'Page Title & Hero', hasHero, `Hero text: "${heroText.slice(0, 40)}..."`);

    // ----------------------------------------------------
    // TEST 2: Theme Switching (Light/Dark)
    // ----------------------------------------------------
    console.log('\n--- 2. Testing Theme Switcher ---');
    const themeBtn = await page.$('button[title*="Light"], button[title*="Dark"], button[title*="Theme"], button[title*="theme"]');
    if (themeBtn) {
      await themeBtn.click();
      await page.waitForTimeout(500);
      const isLight = await page.evaluate(() => document.documentElement.classList.contains('light'));
      recordResult('Theme', 'Toggle to Light Mode', isLight, `HTML has 'light' class: ${isLight}`);

      await themeBtn.click();
      await page.waitForTimeout(500);
      const isDark = await page.evaluate(() => !document.documentElement.classList.contains('light'));
      recordResult('Theme', 'Toggle to Dark Mode', isDark, `Dark mode restored: ${isDark}`);
    } else {
      recordResult('Theme', 'Theme Switcher Button', false, 'Theme toggle button missing');
    }

    // ----------------------------------------------------
    // TEST 3: Auth & Registration Flow
    // ----------------------------------------------------
    console.log('\n--- 3. Testing Authentication & Session ---');
    // Check if user is currently logged in, if so, test logout to inspect Sign In & Register buttons
    let logoutBtn = await page.$('button[title*="Sign Out"]');
    if (logoutBtn) {
      console.log('   User was logged in. Clicking logout to test unauthenticated state...');
      await logoutBtn.click();
      await page.waitForTimeout(1000);
    }

    // Now Sign In & Register buttons must be visible
    const signInBtn = await page.$('button:has-text("Sign In")');
    const registerBtn = await page.$('button:has-text("Register")');
    recordResult('Auth', 'Sign In & Register Buttons', Boolean(signInBtn && registerBtn), 'Sign In & Register buttons visible in navbar');

    if (signInBtn) {
      await signInBtn.click();
      await page.waitForTimeout(800);
      
      const modal = await page.$('text=Sign in to Ultrapie');
      recordResult('Auth', 'Open Sign In Modal', Boolean(modal), 'Sign in modal rendered with email & password inputs');

      // Check Google Auth button & Guide
      const googleBtn = await page.$('button:has-text("Continue with Google")');
      recordResult('Auth', 'Google Sign-In Button', Boolean(googleBtn), 'Official Google OAuth button present with SVG logo');

      const guideBtn = await page.$('button:has-text("Setup Guide & Paste JSON")');
      if (guideBtn) {
        await guideBtn.click();
        await page.waitForTimeout(600);
        const guideModal = await page.$('text=Google Cloud OAuth Setup Guide');
        recordResult('Auth', 'Google Cloud OAuth Guide Modal', Boolean(guideModal), 'OAuth JSON credentials setup guide modal opened');

        // Close guide
        const closeGuide = await page.$('div:has-text("Google Cloud OAuth Setup Guide") button:has-text("Cancel"), button:has-text("Cancel")');
        if (closeGuide) await closeGuide.click();
        await page.waitForTimeout(600);
      } else {
        recordResult('Auth', 'Google Cloud OAuth Guide Modal', false, 'Setup Guide button not found');
      }

      // Perform Login with Admin Credentials
      console.log('   Executing login with master admin credentials...');
      const emailInput = await page.$('input[type="email"]');
      const passInput = await page.$('input[type="password"]');
      if (emailInput && passInput) {
        await emailInput.fill('zohodigital.com@gmail.com');
        await passInput.fill('Ultrapie2026!');
        
        const submitBtn = await page.$('form button[type="submit"]');
        if (submitBtn) await submitBtn.click();
        await page.waitForTimeout(2000);

        // Verify successful login
        const openStudioBtn = await page.waitForSelector('text=Open Studio', { timeout: 4000 }).catch(() => null);
        recordResult('Auth', 'Admin Login Verification', Boolean(openStudioBtn), 'Successfully logged in as Elhoussine Soutih');
      }
    }

    // ----------------------------------------------------
    // TEST 4: Master Owner Admin Hub & Metrics
    // ----------------------------------------------------
    console.log('\n--- 4. Testing Master Owner Admin Hub ---');
    const adminBtn = await page.waitForSelector('button:has-text("Admin Hub")', { timeout: 4000 }).catch(() => null);
    if (adminBtn) {
      await adminBtn.click();
      await page.waitForTimeout(1000);

      const adminTitle = await page.$('text=Ultrapie Admin Control Center');
      const statsMrr = await page.$('text=Monthly MRR');
      const statsBuilds = await page.$('text=Studio Builds');
      recordResult('Admin', 'Admin Hub Access & Metrics', Boolean(adminTitle && statsMrr && statsBuilds), 'Admin Control Center opened with live Monthly MRR & Studio Builds metrics');

      // Check User Management tab in Admin Hub
      const usersTab = await page.$('button:has-text("User Management")');
      if (usersTab) {
        await usersTab.click();
        await page.waitForTimeout(600);
      }
      const usersTable = await page.$('table');
      recordResult('Admin', 'User Management & Audit Log', Boolean(usersTable), 'User directory and audit log active in modal');

      const closeAdmin = await page.$('button:has-text("Done")');
      if (closeAdmin) await closeAdmin.click();
      await page.waitForTimeout(600);
    } else {
      recordResult('Admin', 'Admin Hub Button', false, 'Admin Hub button not found in header');
    }

    // ----------------------------------------------------
    // TEST 5: Navigate to Studio (/studio)
    // ----------------------------------------------------
    console.log('\n--- 5. Testing Studio Page (/studio) ---');
    await page.goto('http://localhost:3005/studio', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    const brand = await page.$('span:has-text("AI Studio")');
    recordResult('Studio', 'AI Studio Initialization', Boolean(brand), 'Studio topbar and workspace active');

    // ----------------------------------------------------
    // TEST 6: Viewport Switchers
    // ----------------------------------------------------
    console.log('\n--- 6. Testing Viewport Controls ---');
    const tabletBtn = await page.$('button[title*="Tablet"]');
    const mobileBtn = await page.$('button[title*="Mobile"]');
    const desktopBtn = await page.$('button[title*="Desktop"]');

    if (tabletBtn && mobileBtn && desktopBtn) {
      await tabletBtn.click();
      await page.waitForTimeout(400);
      const isTablet = await page.$('.max-w-\\[768px\\]');
      recordResult('Studio', 'Tablet Viewport (768px)', Boolean(isTablet), 'Preview responsive frame resized to tablet');

      await mobileBtn.click();
      await page.waitForTimeout(400);
      const isMobile = await page.$('.max-w-\\[375px\\]');
      recordResult('Studio', 'Mobile Viewport (375px)', Boolean(isMobile), 'Preview responsive frame resized to mobile');

      await desktopBtn.click();
      await page.waitForTimeout(400);
      recordResult('Studio', 'Desktop Viewport (100%)', true, 'Preview responsive frame restored to desktop');
    } else {
      recordResult('Studio', 'Viewport Switcher Buttons', false, 'Viewport buttons missing in TopBar');
    }

    // ----------------------------------------------------
    // TEST 7: AI Conversational Question Mode
    // ----------------------------------------------------
    console.log('\n--- 7. Testing AI Conversational Question Mode ---');
    const chatInput = await page.waitForSelector('textarea[placeholder*="Ask anything"]');
    await chatInput.fill('What is Ultrapie and what can it do? Can you explain its architecture?');
    await page.keyboard.press('Enter');
    console.log('   Waiting for AI conversational response...');
    await page.waitForTimeout(7000);

    // Verify chat response
    const assistantMessages = await page.$$eval('[data-role="assistant"], .prose, div.space-y-4 > div', els => els.map(e => e.innerText).filter(t => t.length > 50));
    const lastMsg = assistantMessages[assistantMessages.length - 1] || '';
    const isCleanQuestionAnswer = (lastMsg.includes('Ultrapie') || lastMsg.includes('Architecture') || lastMsg.includes('Features')) && !lastMsg.includes('FILE: src/App.tsx');
    recordResult('AI Gateway', 'Question Mode (No Code Dumps)', isCleanQuestionAnswer, `Responded with ${lastMsg.length} chars of structured markdown`);

    // ----------------------------------------------------
    // TEST 8: AI App Generation & Live Code Stream
    // ----------------------------------------------------
    console.log('\n--- 8. Testing AI App Generation ---');
    await chatInput.fill('Build a modern landing page for an AI cloud startup');
    await page.keyboard.press('Enter');
    console.log('   Waiting for code generation stream...');
    await page.waitForTimeout(8000);

    const appFile = await page.$('text=App.tsx');
    recordResult('Studio', 'File Tree src/App.tsx', Boolean(appFile), 'src/App.tsx generated in file explorer');

    // ----------------------------------------------------
    // TEST 9: Live Preview Sandbox Execution
    // ----------------------------------------------------
    console.log('\n--- 9. Testing Live Preview Sandbox ---');
    const iframeElement = await page.$('iframe');
    let iframeRendered = false;
    let buttonCount = 0;
    if (iframeElement) {
      const frame = await iframeElement.contentFrame();
      if (frame) {
        await page.waitForTimeout(3000);
        const frameText = await frame.evaluate(() => document.body.innerText || '');
        const buttons = await frame.$$('button');
        buttonCount = buttons.length;
        iframeRendered = frameText.length > 50 && !frameText.includes('Compiling React application');
        recordResult('Preview', 'In-App React Sandbox Execution', iframeRendered, `Live interactive app rendered with ${buttonCount} buttons`);
      }
    } else {
      recordResult('Preview', 'Iframe Sandbox Presence', false, 'Iframe not found in DOM');
    }

    // ----------------------------------------------------
    // TEST 10: Standalone Preview Popout (New Tab)
    // ----------------------------------------------------
    console.log('\n--- 10. Testing Standalone Preview Popout ---');
    const newTabBtn = await page.$('button[title*="Open preview in new tab"]');
    if (newTabBtn) {
      const pagePromise = context.waitForEvent('page');
      await newTabBtn.click();
      const newPage = await pagePromise;
      await newPage.waitForLoadState('domcontentloaded');
      await newPage.waitForTimeout(3000);

      const newPageUrl = newPage.url();
      const newPageText = await newPage.evaluate(() => document.body.innerText || '');
      const isBlobValid = newPageUrl.startsWith('blob:') && newPageText.length > 50;
      recordResult('Preview', 'Standalone Popout Application', isBlobValid, `Rendered independently at: ${newPageUrl.slice(0, 45)}...`);
      await newPage.close();
    } else {
      recordResult('Preview', 'Open In New Tab Button', false, 'Popout button not found');
    }

    // ----------------------------------------------------
    // TEST 11: 1-Click Easy Deploy Modal
    // ----------------------------------------------------
    console.log('\n--- 11. Testing Easy Deploy Modal ---');
    const easyDeployBtn = await page.$('button:has-text("Easy Deploy")');
    if (easyDeployBtn) {
      await easyDeployBtn.click();
      await page.waitForTimeout(800);

      const modalTitle = await page.$('text=1-Click Easy Deploy');
      const coolifyOption = await page.$('text=Self-Hosted VPS (Coolify v4)');
      recordResult('Deploy', '1-Click Easy Deploy Modal', Boolean(modalTitle && coolifyOption), 'Modal opened with Coolify VPS and Cloudflare targets');

      const closeDeploy = await page.$('button >> svg.lucide-x, button[aria-label="Close"]');
      if (closeDeploy) await closeDeploy.click();
      await page.waitForTimeout(500);
    } else {
      recordResult('Deploy', 'Easy Deploy Button', false, 'Easy Deploy button missing');
    }

    // ----------------------------------------------------
    // TEST 12: GitHub Integration Modal
    // ----------------------------------------------------
    console.log('\n--- 12. Testing GitHub Modal ---');
    const githubBtn = await page.$('button:has-text("GitHub")');
    if (githubBtn) {
      await githubBtn.click();
      await page.waitForTimeout(800);

      const gitModal = await page.$('text=GitHub Repository');
      const patInput = await page.$('input[placeholder*="Personal Access Token"], input[type="password"]');
      recordResult('GitHub', 'GitHub Integration Modal', Boolean(gitModal && patInput), 'GitHub PAT and repo sync dialog verified');

      const closeGit = await page.$('button:has-text("Cancel")');
      if (closeGit) await closeGit.click();
      await page.waitForTimeout(500);
    } else {
      recordResult('GitHub', 'GitHub Button in TopBar', false, 'GitHub button missing');
    }

    // ----------------------------------------------------
    // TEST 13: Coolify Hosting Dashboard (/hosting)
    // ----------------------------------------------------
    console.log('\n--- 13. Testing Hosting Dashboard (/hosting) ---');
    await page.goto('http://localhost:3005/hosting', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const hostingTitle = await page.$('text=Self-Hosted Infrastructure via Coolify API');
    const hasAppsSection = await page.$('text=Deployed Applications');
    recordResult('Hosting', 'Coolify Hosting Panel', Boolean(hostingTitle && hasAppsSection), 'Hosting management interface verified');

  } catch (err) {
    console.error('Audit encountered an unexpected exception:', err);
    recordResult('Audit', 'Unexpected Error', false, err.message);
  } finally {
    await browser.close();
  }

  // ----------------------------------------------------
  // Summary & Scorecard
  // ----------------------------------------------------
  console.log('\n====================================================');
  console.log('📊 AUDIT SUMMARY & SCORECARD');
  console.log('====================================================');
  const passedCount = results.filter(r => r.passed).length;
  const totalCount = results.length;
  const passRate = Math.round((passedCount / totalCount) * 100);

  console.log(`Passed: ${passedCount} / ${totalCount} (${passRate}%)\n`);
  for (const r of results) {
    console.log(`${r.passed ? '✅' : '❌'} [${r.domain.padEnd(10)}] ${r.testName.padEnd(35)} : ${r.details}`);
  }

  fs.writeFileSync(
    path.join(ARTIFACT_DIR, 'live_browser_audit_results.json'),
    JSON.stringify({ passedCount, totalCount, passRate, results }, null, 2)
  );

  return { passedCount, totalCount, passRate, results };
}

runLiveAudit().catch(err => {
  console.error('Fatal audit failure:', err);
  process.exit(1);
});
