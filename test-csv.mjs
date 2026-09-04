import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage();

try {
  await page.goto('http://localhost:4201/', { waitUntil: 'networkidle' });
  console.log('✓ App loaded');

  // Wait for page to fully load
  await page.waitForTimeout(2000);

  // Take screenshot
  await page.screenshot({ path: '/tmp/app-screenshot.png' });
  console.log('✓ Screenshot saved to /tmp/app-screenshot.png');

  // Check for CSV button
  const csvButton = await page.$('button:has-text("CSV出力")');
  console.log(`✓ CSV button found: ${csvButton ? 'Yes' : 'No'}`);

  // Check page content
  const h1 = await page.$eval('h1', el => el.textContent).catch(() => null);
  console.log(`✓ Page h1: ${h1}`);

} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
} finally {
  await browser.close();
}
