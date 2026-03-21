const puppeteer = require('puppeteer-core');

(async () => {
  try {
    // Find Chrome path
    const { execSync } = require('child_process');
    let chromePath = '';
    try {
      chromePath = execSync('which google-chrome || which chromium || which chromium-browser || echo ""').toString().trim();
    } catch (e) {}
    
    if (!chromePath) {
      // macOS default Chrome path
      chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    }
    
    const browser = await puppeteer.launch({
      headless: 'new',
      executablePath: chromePath,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 3000));
    await page.screenshot({ path: '/Users/henry/.openclaw/workspace/weight-tracker-wechat/login_page.png', fullPage: true });
    await browser.close();
    console.log('Screenshot saved to login_page.png');
  } catch (err) {
    console.error('Error:', err.message);
  }
})();
