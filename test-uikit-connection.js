const { chromium } = require('playwright');

async function testUIKitConnection() {
    console.log('🚀 Zoom UIKit接続テストを開始します...');
    
    // ブラウザを起動
    const browser = await chromium.launch({
        headless: true, // headlessモードで実行
        args: [
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
            '--use-fake-ui-for-media-stream',
            '--use-fake-device-for-media-stream',
            '--allow-running-insecure-content',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
            '--disable-background-timer-throttling',
            '--disable-features=TranslateUI',
            '--disable-ipc-flooding-protection',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage'
        ]
    });
    
    try {
        const context = await browser.newContext({
            permissions: ['camera', 'microphone'],
            viewport: { width: 1280, height: 720 }
        });
        
        const page = await context.newPage();
        
        // コンソールログを監視
        page.on('console', msg => {
            const type = msg.type();
            if (type === 'error') {
                console.log('❌ Console Error:', msg.text());
            } else if (type === 'log') {
                console.log('📋 Console Log:', msg.text());
            }
        });
        
        // エラーを監視
        page.on('pageerror', error => {
            console.log('💥 Page Error:', error.message);
        });
        
        // ネットワークリクエストを監視
        page.on('request', request => {
            if (request.url().includes('/api/token')) {
                console.log('🔗 Token Request:', request.url());
            }
        });
        
        page.on('response', response => {
            if (response.url().includes('/api/token')) {
                console.log('📥 Token Response:', response.status());
            }
        });
        
        console.log('🌐 UIKitページにアクセス中...');
        await page.goto('http://localhost:3000/uikit');
        
        // ページが完全に読み込まれるまで待機
        await page.waitForLoadState('networkidle');
        
        console.log('⏳ UIKit SDKの読み込みを待機中...');
        // UIKit の読み込みを待機
        try {
            await page.waitForFunction(() => {
                return typeof window.UIToolkit !== 'undefined';
            }, { timeout: 60000 });
        } catch (error) {
            console.log('❌ UIKit SDK読み込みタイムアウト - 詳細確認中...');
            
            // スクリプトタグの確認
            const scripts = await page.$$eval('script', scripts => 
                scripts.map(script => ({ src: script.src, loaded: script.readyState }))
            );
            console.log('📜 スクリプトタグ:', scripts);
            
            throw error;
        }
        
        console.log('✅ UIKit SDK読み込み完了');
        
        // フォームの入力
        console.log('📝 フォームに入力中...');
        
        // セッション名を入力（既にデフォルト値があるかチェック）
        const sessionNameValue = await page.inputValue('#sessionName');
        if (!sessionNameValue) {
            await page.fill('#sessionName', 'uikit-test-session');
        }
        
        // ユーザー名を入力
        const userNameValue = await page.inputValue('#userName');
        if (!userNameValue) {
            await page.fill('#userName', 'UIKitTestUser');
        }
        
        console.log('🎯 UIKit会議参加ボタンをクリック...');
        await page.click('#joinButton');
        
        // 参加処理の結果を待機
        console.log('⏳ UIKit会議参加処理を待機中...');
        
        // ステータスメッセージを監視
        const statusElement = page.locator('#status');
        
        // 最大60秒待機（UIKitは初期化に時間がかかる場合がある）
        let attempts = 0;
        const maxAttempts = 60;
        
        while (attempts < maxAttempts) {
            await page.waitForTimeout(1000);
            attempts++;
            
            const statusText = await statusElement.textContent();
            const isVisible = await statusElement.isVisible();
            
            console.log(`[${attempts}/${maxAttempts}] Status: ${statusText} (visible: ${isVisible})`);
            
            if (statusText && statusText.includes('UIKit会議に参加しました')) {
                console.log('🎉 UIKit会議に正常に参加しました！');
                
                // UIKitコンテナが表示されているかチェック
                const uikitContainer = page.locator('#uikit-container');
                const isUIKitVisible = await uikitContainer.isVisible();
                console.log('🎨 UIKitコンテナ表示:', isUIKitVisible);
                
                // UIKit内のビデオ要素をチェック
                await page.waitForTimeout(5000); // UIKit初期化待機
                const uikitVideoElements = await page.$$('#uikit-container video, #uikit-container canvas');
                console.log('🎬 UIKit内ビデオ要素数:', uikitVideoElements.length);
                
                // UIKitのコントロール要素をチェック
                const uikitControls = await page.$$('#uikit-container button, #uikit-container [role="button"]');
                console.log('🎮 UIKitコントロール数:', uikitControls.length);
                
                // 少し待機してUIKitの完全な読み込みを確認
                await page.waitForTimeout(3000);
                
                // 会議を退出
                console.log('🚪 UIKit会議を退出中...');
                await page.click('#leaveButton');
                
                await page.waitForTimeout(3000);
                const finalStatus = await statusElement.textContent();
                console.log('📤 退出後のステータス:', finalStatus);
                
                console.log('✅ UIKitテスト完了: 成功');
                return { 
                    success: true, 
                    message: 'UIKit会議への参加と退出が正常に完了しました',
                    details: {
                        uikitVisible: isUIKitVisible,
                        videoElements: uikitVideoElements.length,
                        controlElements: uikitControls.length
                    }
                };
            }
            
            if (statusText && statusText.includes('失敗')) {
                console.log('❌ UIKit会議参加に失敗しました:', statusText);
                return { success: false, message: statusText };
            }
        }
        
        console.log('⏰ タイムアウト: UIKit会議参加が完了しませんでした');
        return { success: false, message: 'タイムアウト: UIKit会議参加が完了しませんでした' };
        
    } catch (error) {
        console.error('💥 UIKitテスト中にエラーが発生しました:', error);
        return { success: false, message: error.message };
    } finally {
        await browser.close();
    }
}

// テストを実行
testUIKitConnection().then(result => {
    console.log('\n=== UIKitテスト結果 ===');
    console.log('成功:', result.success);
    console.log('メッセージ:', result.message);
    if (result.details) {
        console.log('詳細:', result.details);
    }
    process.exit(result.success ? 0 : 1);
}).catch(error => {
    console.error('UIKitテスト実行エラー:', error);
    process.exit(1);
});