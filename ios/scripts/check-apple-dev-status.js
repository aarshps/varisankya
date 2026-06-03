const { chromium } = require('playwright');
const path = require('path');

const OUT_DIR = path.join(__dirname, '..', '..');
const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

async function snap(page, name) {
  const f = path.join(OUT_DIR, `enrollment-check-${name}-${ts}.png`);
  await page.screenshot({ path: f, fullPage: true });
  console.log('Saved:', f);
}

(async () => {
  console.log('=== Apple Developer / Account status check (separate session) ===');
  const browser = await chromium.launch({ channel: 'msedge', headless: false, args: ['--start-maximized'] });
  const ctx = await browser.newContext({ viewport: null });
  const p = await ctx.newPage();

  // Apple ID
  console.log('Apple ID manage... (pause for auth if needed)');
  await p.goto('https://appleid.apple.com/account/manage', { waitUntil: 'domcontentloaded' });
  await p.pause();
  await p.waitForTimeout(3000);
  await snap(p, 'appleid');

  // Developer account main
  console.log('Developer account main... (pause for sign-in)');
  await p.goto('https://developer.apple.com/account/', { waitUntil: 'domcontentloaded' });
  await p.pause();
  await p.waitForTimeout(4000);
  await snap(p, 'dev-account-main');

  // Try membership
  try {
    await p.goto('https://developer.apple.com/account/#/membership', { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(3000);
    await snap(p, 'dev-membership');
  } catch (e) { console.log('membership nav skipped'); }

  // App Store Connect
  console.log('App Store Connect (pause for auth)...');
  await p.goto('https://appstoreconnect.apple.com', { waitUntil: 'domcontentloaded' });
  await p.pause();
  await p.waitForTimeout(4000);
  await snap(p, 'asc');

  // Contact / support if useful
  try {
    await p.goto('https://developer.apple.com/contact/', { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(2000);
    await snap(p, 'dev-contact');
  } catch {}

  console.log('Apple checks done. Close browser after review.');
  await p.waitForTimeout(8000);
  await browser.close();
})().catch(console.error);