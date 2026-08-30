import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.toString()));
  
  await page.goto('http://localhost:3001', { waitUntil: 'networkidle2' });
  
  // Get map dimensions
  const mapSize = await page.evaluate(() => {
    const map = document.querySelector('.leaflet-container');
    if (!map) return 'No map found';
    return {
      width: map.clientWidth,
      height: map.clientHeight
    };
  });
  
  console.log('Map size:', mapSize);
  
  await browser.close();
})();
