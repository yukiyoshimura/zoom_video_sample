const { chromium } = require('playwright');

async function testUIKitJoin() {
    const browser = await chromium.launch({ 
        headless: true, // ヘッドレスモードで実行
        slowMo: 500
    });
    
    const context = await browser.newContext({
        viewport: { width: 1280, height: 720 }
    });
    
    const page = await context.newPage();
    
    // コンソールログを監視
    page.on('console', msg => {
        console.log(`[BROWSER] ${msg.type()}: ${msg.text()}`);
    });
    
    // エラーを監視
    page.on('pageerror', error => {
        console.error(`[ERROR] ${error.message}`);
    });
    
    try {
        console.log('🚀 Starting UIKit join test...');
        
        // UIKitページにアクセス
        await page.goto('http://localhost:3000/uikit');
        console.log('✅ Navigated to UIKit page');
        
        // ページの読み込み完了を待機
        await page.waitForLoadState('networkidle');
        console.log('✅ Page loaded');
        
        // フォーム要素が表示されるまで待機
        await page.waitForSelector('#sessionName', { timeout: 10000 });
        await page.waitForSelector('#userName', { timeout: 10000 });
        await page.waitForSelector('#joinButton', { timeout: 10000 });
        console.log('✅ Form elements loaded');
        
        // フォームに値を入力（デフォルト値があるか確認）
        const sessionName = await page.inputValue('#sessionName');
        const userName = await page.inputValue('#userName');
        
        console.log('📝 Form values:', { sessionName, userName });
        
        // セッション名が空の場合は入力
        if (!sessionName) {
            await page.fill('#sessionName', 'test-session');
            console.log('📝 Set session name: test-session');
        }
        
        // ユーザー名が空の場合は入力
        if (!userName) {
            await page.fill('#userName', 'test-user');
            console.log('📝 Set user name: test-user');
        }
        
        // 参加ボタンをクリック
        console.log('🔘 Clicking join button...');
        await page.click('#joinButton');
        
        // UIKit コンテナが表示されるまで待機
        await page.waitForSelector('#uikit-container', { 
            state: 'visible',
            timeout: 15000 
        });
        console.log('✅ UIKit container is visible');
        
        // ステータスメッセージを確認
        await page.waitForTimeout(3000); // 3秒待機
        
        const statusElement = await page.locator('#status');
        const statusVisible = await statusElement.isVisible();
        
        if (statusVisible) {
            const statusText = await statusElement.textContent();
            const statusClass = await statusElement.getAttribute('class');
            console.log('📊 Status:', { text: statusText, class: statusClass });
        }
        
        // 会議コントロールが表示されているか確認
        const controlsVisible = await page.locator('#meeting-controls').isVisible();
        console.log('🎛️ Meeting controls visible:', controlsVisible);
        
        // UIKitコンテナの内容を確認
        const uikitContainer = await page.locator('#uikit-container');
        const uikitContent = await uikitContainer.innerHTML();
        const hasContent = uikitContent.trim().length > 0;
        console.log('📦 UIKit container has content:', hasContent);
        
        if (hasContent) {
            console.log('✅ UIKit successfully loaded content');
        } else {
            console.log('⚠️ UIKit container is empty - may still be loading');
        }
        
        // 10秒間状態を観察
        console.log('👀 Observing for 10 seconds...');
        await page.waitForTimeout(10000);
        
        // 最終状態をチェック
        const finalStatusText = statusVisible ? await statusElement.textContent() : 'No status';
        const finalControlsVisible = await page.locator('#meeting-controls').isVisible();
        const finalUikitContent = await uikitContainer.innerHTML();
        
        console.log('🏁 Final state:', {
            status: finalStatusText,
            controlsVisible: finalControlsVisible,
            uikitHasContent: finalUikitContent.trim().length > 0
        });
        
        // スクリーンショットを撮影
        await page.screenshot({ 
            path: '/workspaces/zoom_video_sample/uikit-test-result.png',
            fullPage: true
        });
        console.log('📸 Screenshot saved as uikit-test-result.png');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        
        // エラー時もスクリーンショットを撮影
        await page.screenshot({ 
            path: '/workspaces/zoom_video_sample/uikit-test-error.png',
            fullPage: true
        });
        console.log('📸 Error screenshot saved as uikit-test-error.png');
    } finally {
        await browser.close();
        console.log('🔚 Browser closed');
    }
}

// テスト実行
testUIKitJoin().catch(console.error);