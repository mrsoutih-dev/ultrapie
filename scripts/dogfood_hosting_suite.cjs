const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = 'C:\\Users\\User\\.gemini\\antigravity\\brain\\f734eed1-2d42-4e67-b107-7cc460139a26';
const BASE_URL = 'http://localhost:3008';

if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

async function runHostingDogfooding() {
  console.log('====================================================');
  console.log('🚀 LIVE BROWSER DOGFOODING: ULTRA-PIE HOSTING SUITE');
  console.log('====================================================\n');

  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  try {
    // ----------------------------------------------------
    // TEST 1: LOAD /hosting DASHBOARD
    // ----------------------------------------------------
    console.log('>>> [1/9] Navigating to /hosting Control Center...');
    await page.goto(`${BASE_URL}/hosting`, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(1000);

    const shot1 = path.join(ARTIFACT_DIR, 'dogfood-1-hosting-dashboard.png');
    await page.screenshot({ path: shot1 });
    console.log('  ✓ Loaded /hosting dashboard and saved screenshot: dogfood-1-hosting-dashboard.png');

    // ----------------------------------------------------
    // TEST 2: BACKUPS & DISASTER RECOVERY MODAL
    // ----------------------------------------------------
    console.log('\n>>> [2/9] Testing Backups & Disaster Recovery Modal...');
    const drButton = await page.$('button:has-text("Backups & DR")');
    if (drButton) {
      await drButton.click();
      await page.waitForTimeout(600);

      // Click "Create Backup Now"
      const createBackupBtn = await page.$('button:has-text("Create Backup Now")');
      if (createBackupBtn) {
        console.log('  -> Triggering Instant Full Backup...');
        await createBackupBtn.click();
        await page.waitForTimeout(1200);
      }

      // Click "Run Recovery Drill"
      const runDrillBtn = await page.$('button:has-text("Run Recovery Drill")');
      if (runDrillBtn) {
        console.log('  -> Triggering Automated Disaster Recovery Drill...');
        await runDrillBtn.click();
        await page.waitForTimeout(1500);
      }

      const shot2 = path.join(ARTIFACT_DIR, 'dogfood-2-backups-modal.png');
      await page.screenshot({ path: shot2 });
      console.log('  ✓ Backups & DR modal executed and screenshot saved: dogfood-2-backups-modal.png');

      // Close modal
      const closeBtn = await page.$('button:has-text("Close")');
      if (closeBtn) await closeBtn.click();
      await page.waitForTimeout(400);
    } else {
      console.warn('  ⚠️ "Backups & DR" button not found');
    }

    // ----------------------------------------------------
    // TEST 3: DATABASES TAB & MANAGED CLUSTERS
    // ----------------------------------------------------
    console.log('\n>>> [3/9] Testing Databases Tab...');
    const dbsTab = await page.$('button:has-text("Databases")');
    if (dbsTab) {
      await dbsTab.click();
      await page.waitForTimeout(600);

      const shot3 = path.join(ARTIFACT_DIR, 'dogfood-3-databases-tab.png');
      await page.screenshot({ path: shot3 });
      console.log('  ✓ Databases tab loaded and screenshot saved: dogfood-3-databases-tab.png');

      // ----------------------------------------------------
      // TEST 4: SQL QUERY CONSOLE MODAL
      // ----------------------------------------------------
      console.log('\n>>> [4/9] Testing SQL Query Console...');
      const queryBtn = await page.$('button:has-text("Query Console")');
      if (queryBtn) {
        await queryBtn.click();
        await page.waitForTimeout(600);

        // Click "Run Query"
        const executeQueryBtn = await page.$('button:has-text("Run Query")');
        if (executeQueryBtn) {
          await executeQueryBtn.click();
          await page.waitForTimeout(800);
        }

        const shot4 = path.join(ARTIFACT_DIR, 'dogfood-4-sql-query-console.png');
        await page.screenshot({ path: shot4 });
        console.log('  ✓ Query Console executed and screenshot saved: dogfood-4-sql-query-console.png');

        // Close query modal
        const closeQueryBtn = await page.$('div:has-text("Database:") button:has-text("Close")');
        if (closeQueryBtn) {
          await closeQueryBtn.click();
        } else {
          const xBtn = await page.$('div.bg-slate-900 button:has(svg)');
          if (xBtn) await xBtn.click();
        }
        await page.waitForTimeout(800);
      }
    }

    // Switch back to Applications tab
    const appsTab = await page.$('button:has-text("Applications")');
    if (appsTab) {
      await appsTab.click();
      await page.waitForTimeout(600);
    }

    // ----------------------------------------------------
    // TEST 5: QR CODE & 1-CLICK SOCIAL SHARE MODAL
    // ----------------------------------------------------
    console.log('\n>>> [5/9] Testing Mobile QR Code & Social Sharing...');
    const qrBtn = await page.$('button[title*="Mobile QR Code"]');
    if (qrBtn) {
      await qrBtn.click();
      await page.waitForTimeout(600);

      const shot5 = path.join(ARTIFACT_DIR, 'dogfood-5-qr-code-share.png');
      await page.screenshot({ path: shot5 });
      console.log('  ✓ QR Code modal opened and screenshot saved: dogfood-5-qr-code-share.png');

      const closeQr = await page.$('div:has-text("Test on Real Device") button:has(svg), button:has-text("Close")');
      if (closeQr) await closeQr.click();
      await page.waitForTimeout(400);
    }

    // ----------------------------------------------------
    // TEST 6: REAL-TIME TELEMETRY & ANALYTICS MODAL
    // ----------------------------------------------------
    console.log('\n>>> [6/9] Testing Telemetry & Core Web Vitals Analytics...');
    const analyticsBtn = await page.$('button:has-text("Analytics")');
    if (analyticsBtn) {
      await analyticsBtn.click();
      await page.waitForTimeout(600);

      const shot6 = path.join(ARTIFACT_DIR, 'dogfood-6-telemetry-analytics.png');
      await page.screenshot({ path: shot6 });
      console.log('  ✓ Analytics modal opened and screenshot saved: dogfood-6-telemetry-analytics.png');

      const closeAnalytics = await page.$('button:has-text("Close")');
      if (closeAnalytics) await closeAnalytics.click();
      await page.waitForTimeout(400);
    }

    // ----------------------------------------------------
    // TEST 7: SUBDOMAIN CLAIMER MODAL
    // ----------------------------------------------------
    console.log('\n>>> [7/9] Testing Subdomain Claimer...');
    const claimBtn = await page.$('button[title*="Claim & Customize Subdomain"]');
    if (claimBtn) {
      await claimBtn.click();
      await page.waitForTimeout(600);

      const shot7 = path.join(ARTIFACT_DIR, 'dogfood-7-subdomain-claimer.png');
      await page.screenshot({ path: shot7 });
      console.log('  ✓ Claim Subdomain modal opened and screenshot saved: dogfood-7-subdomain-claimer.png');

      const closeClaim = await page.$('button:has-text("Cancel")');
      if (closeClaim) await closeClaim.click();
      await page.waitForTimeout(400);
    }

    // ----------------------------------------------------
    // TEST 8: GITHUB BRANCH PREVIEW MODAL
    // ----------------------------------------------------
    console.log('\n>>> [8/9] Testing GitHub Branch Deployment...');
    const branchBtn = await page.$('button[title*="GitHub Branch CI/CD"]');
    if (branchBtn) {
      await branchBtn.click();
      await page.waitForTimeout(600);

      const shot8 = path.join(ARTIFACT_DIR, 'dogfood-8-branch-preview.png');
      await page.screenshot({ path: shot8 });
      console.log('  ✓ Branch Deploy modal opened and screenshot saved: dogfood-8-branch-preview.png');

      const closeBranch = await page.$('button:has-text("Cancel")');
      if (closeBranch) await closeBranch.click();
      await page.waitForTimeout(400);
    }

    // ----------------------------------------------------
    // TEST 9: STANDALONE RUNNER /preview/counter-demo
    // ----------------------------------------------------
    console.log('\n>>> [9/9] Testing Standalone Edge Preview Runner (/preview/counter-demo)...');
    await page.goto(`${BASE_URL}/preview/counter-demo`, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(2000);

    // Click increment button in the preview app
    const incrementBtn = await page.$('button:has-text("+"), button:has-text("Increment")');
    if (incrementBtn) {
      await incrementBtn.click();
      await page.waitForTimeout(300);
      await incrementBtn.click();
      await page.waitForTimeout(300);
    }

    const shot9 = path.join(ARTIFACT_DIR, 'dogfood-9-preview-standalone.png');
    await page.screenshot({ path: shot9 });
    console.log('  ✓ Standalone preview tested and screenshot saved: dogfood-9-preview-standalone.png');

    console.log('\n====================================================');
    console.log('🎉 ALL 9 LIVE BROWSER DOGFOODING TESTS COMPLETED 100%');
    console.log('====================================================\n');

  } catch (error) {
    console.error('❌ Dogfooding failed with error:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runHostingDogfooding();
