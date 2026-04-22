const puppeteer = require('puppeteer-core');
const fs = require('fs');

(async () => {
    const executablePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
    
    const browser = await puppeteer.launch({
        executablePath,
        headless: "new"
    });
    
    const page = await browser.newPage();
    
    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.log('BROWSER ERROR:', msg.text());
        }
    });

    try {
        await page.goto('http://localhost:5173/admin', { waitUntil: 'domcontentloaded', timeout: 10000 });
        await new Promise(r => setTimeout(r, 2000));
        await page.screenshot({ path: 'admin_test.png' });
        console.log('Screenshot saved to admin_test.png');
    } catch (err) {
        console.error('Error:', err);
    }
    
    await browser.close();
})();
