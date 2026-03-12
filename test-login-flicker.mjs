import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Listen for console logs
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  
  // Listen for requests
  let reqCount = 0;
  page.on('request', request => {
    reqCount++;
    if (reqCount % 10 === 0) console.log(`Made ${reqCount} requests so far...`);
  });

  console.log("Navigating to login page...");
  await page.goto('http://localhost:3000/login');
  
  console.log("Waiting 5 seconds to observe behavior...");
  await page.waitForTimeout(5000);
  
  console.log(`Total requests made during idle: ${reqCount}`);

  console.log("Done.");
  await browser.close();
})();
