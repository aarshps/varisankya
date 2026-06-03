const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, '..', '..');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

async function takeScreenshot(page, name) {
  const file = path.join(OUT_DIR, `enrollment-check-${name}-${timestamp}.png`);
  await page.screenshot({ path: file, fullPage: true });
  console.log(`Saved: ${file}`);
  return file;
}

(async () => {
  console.log('Launching Microsoft Edge (headed) via Playwright for enrollment status checks...');
  console.log('When a page requires login (Gmail, Apple ID, Developer), the script will PAUSE.');
  console.log('Use the Playwright Inspector window (or browser) to log in as needed.');
  console.log('After auth, click "Resume" in the inspector to continue the script.');
  console.log('Screenshots will be saved next to the repo root for review via read_file (multimodal).');

  const browser = await chromium.launch({
    channel: 'msedge',
    headless: false,
    args: ['--start-maximized', '--disable-blink-features=AutomationControlled']
  });

  const context = await browser.newContext({
    viewport: null,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0'
  });

  const page = await context.newPage();

  // --- 1. Public forum thread (check for new replies)
  console.log('\n[1/6] Navigating to forum thread...');
  await page.goto('https://developer.apple.com/forums/thread/828487', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  await takeScreenshot(page, 'forum');

  // --- 2. Tweet (check replies/engagement)
  console.log('\n[2/6] Navigating to tweet...');
  await page.goto('https://x.com/aarshps/status/2061572757847187899', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  await takeScreenshot(page, 'tweet');

  // --- 3. Gmail search for case replies (KEY STEP)
  console.log('\n[3/6] Opening Gmail search for case numbers / Apple Developer support...');
  console.log('   Search query: 102900128848 OR 102905434551 OR "ID Verification Rejected" OR Yana OR "Developer Support"');
  await page.goto('https://mail.google.com/mail/u/0/#search/102900128848+OR+102905434551+OR+%22ID+Verification+Rejected%22+OR+Yana+OR+%22asia.dev%40apple.com%22+OR+%22Apple+Developer+Program%22', { waitUntil: 'domcontentloaded' });
  await page.pause();  // <<< USER: log into Gmail here if prompted. Then Resume.
  await page.waitForTimeout(4000);
  await takeScreenshot(page, 'gmail-search');

  // Optional: also go to primary inbox or all mail for recent Apple emails
  await page.goto('https://mail.google.com/mail/u/0/#inbox', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  await takeScreenshot(page, 'gmail-inbox');

  // --- 4. Apple ID account / profile (name, verification status hints)
  console.log('\n[4/6] Checking Apple ID account page...');
  await page.goto('https://appleid.apple.com/account/manage', { waitUntil: 'domcontentloaded' });
  await page.pause();  // <<< USER: auth with aarshps@gmail.com if needed. Resume after.
  await page.waitForTimeout(3000);
  await takeScreenshot(page, 'appleid-account');

  // --- 5. Apple Developer account / membership / enrollment status (the key page)
  console.log('\n[5/6] Checking Apple Developer account (membership/enrollment status)...');
  await page.goto('https://developer.apple.com/account/', { waitUntil: 'domcontentloaded' });
  await page.pause();  // <<< USER: sign in if needed. Look for "Apple Developer Program" status, "ID Verification", Enroll button, etc. Resume.
  await page.waitForTimeout(4000);
  await takeScreenshot(page, 'developer-account');

  // Try the membership details card area if present
  try {
    await page.goto('https://developer.apple.com/account/#/membership', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    await takeScreenshot(page, 'developer-membership');
  } catch (e) {
    console.log('Membership deep link may require navigation from main account page.');
  }

  // --- 6. App Store Connect (any apps or enrollment signals)
  console.log('\n[6/6] Checking App Store Connect...');
  await page.goto('https://appstoreconnect.apple.com', { waitUntil: 'domcontentloaded' });
  await page.pause();  // <<< USER: auth if needed.
  await page.waitForTimeout(4000);
  await takeScreenshot(page, 'appstoreconnect');

  // Bonus: developer contact / support history if accessible
  try {
    await page.goto('https://developer.apple.com/contact/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    await takeScreenshot(page, 'developer-contact');
  } catch {}

  console.log('\n=== All checks complete. Screenshots saved in repo root. ===');
  console.log('Review them with read_file (they will be described visually).');
  console.log('If cases have replies or enrollment status changed, note the details.');
  console.log('Close the browser when done reviewing.');

  // Keep open a bit longer or close
  await page.waitForTimeout(10000);
  await browser.close();
})().catch(console.error);