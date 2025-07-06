const { chromium } = require('playwright');

async function debugSDK() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // WebVideoSDKのプロパティを確認
    const sdkInfo = await page.evaluate(() => {
        if (typeof window.WebVideoSDK !== 'undefined') {
            const defaultSDK = window.WebVideoSDK.default;
            return {
                type: typeof window.WebVideoSDK,
                keys: Object.keys(window.WebVideoSDK),
                hasCreateClient: typeof window.WebVideoSDK.createClient,
                defaultType: typeof defaultSDK,
                defaultKeys: defaultSDK ? Object.keys(defaultSDK) : null,
                defaultHasCreateClient: defaultSDK ? typeof defaultSDK.createClient : null
            };
        }
        return { error: 'WebVideoSDK not found' };
    });
    
    console.log('WebVideoSDK info:', JSON.stringify(sdkInfo, null, 2));
    
    await browser.close();
}

debugSDK().catch(console.error);