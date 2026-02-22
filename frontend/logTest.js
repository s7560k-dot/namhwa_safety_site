const p = require('puppeteer-core');
(async () => {
    try {
        console.log("Launching browser...");
        // Use local Edge or Chrome installation
        const b = await p.launch({
            executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
            headless: true
        });
        const page = await b.newPage();

        page.on('console', m => console.log('BROWSER LOG:', m.text()));
        page.on('pageerror', e => console.error('BROWSER ERROR:', e.message));

        await page.goto('http://localhost:5173/dashboard/siteA', { waitUntil: 'load' });
        console.log("Page loaded!");

        // Wait a bit to ensure all effects run
        await new Promise(r => setTimeout(r, 2000));
        await b.close();
    } catch (e) {
        console.error("Script failed:", e.message);
    }
})();
