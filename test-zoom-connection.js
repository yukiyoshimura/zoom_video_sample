const { chromium } = require('playwright');

async function testZoomConnection() {
    console.log('🚀 Zoom Video接続テストを開始します...');
    
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
        
        console.log('🌐 ページにアクセス中...');
        await page.goto('http://localhost:3000');
        
        // ページが完全に読み込まれるまで待機
        await page.waitForLoadState('networkidle');
        
        console.log('⏳ Zoom Video SDKの読み込みを待機中...');
        // Zoom Video SDKの読み込みを待機
        try {
            await page.waitForFunction(() => {
                return typeof window.WebVideoSDK !== 'undefined';
            }, { timeout: 60000 });
        } catch (error) {
            console.log('❌ Zoom Video SDK読み込みタイムアウト - 詳細確認中...');
            
            // スクリプトタグの確認
            const scripts = await page.$$eval('script', scripts => 
                scripts.map(script => ({ src: script.src, loaded: script.readyState }))
            );
            console.log('📜 スクリプトタグ:', scripts);
            
            // エラーの詳細確認
            const errors = await page.evaluate(() => {
                return window.scriptErrors || [];
            });
            console.log('💥 スクリプトエラー:', errors);
            
            throw error;
        }
        
        console.log('✅ Zoom Video SDK読み込み完了');
        
        // フォームの入力
        console.log('📝 フォームに入力中...');
        
        // セッション名を入力（既にデフォルト値があるかチェック）
        const sessionNameValue = await page.inputValue('#sessionName');
        if (!sessionNameValue) {
            await page.fill('#sessionName', 'playwright-test-session');
        }
        
        // ユーザー名を入力
        const userNameValue = await page.inputValue('#userName');
        if (!userNameValue) {
            await page.fill('#userName', 'PlaywrightUser');
        }
        
        console.log('🎯 会議参加ボタンをクリック...');
        await page.click('#joinButton');
        
        // 参加処理の結果を待機
        console.log('⏳ 会議参加処理を待機中...');
        
        // ステータスメッセージを監視
        const statusElement = page.locator('#status');
        
        // 最大30秒待機
        let attempts = 0;
        const maxAttempts = 30;
        
        while (attempts < maxAttempts) {
            await page.waitForTimeout(1000);
            attempts++;
            
            const statusText = await statusElement.textContent();
            const isVisible = await statusElement.isVisible();
            
            console.log(`[${attempts}/${maxAttempts}] Status: ${statusText} (visible: ${isVisible})`);
            
            if (statusText && statusText.includes('会議に参加しました')) {
                console.log('🎉 会議に正常に参加しました！');
                
                // ビデオコンテナが表示されているかチェック
                const videoContainer = page.locator('#video-container');
                const isVideoVisible = await videoContainer.isVisible();
                console.log('📹 ビデオコンテナ表示:', isVideoVisible);
                
                // ビデオ要素内にcanvas/video要素があるかチェック
                await page.waitForTimeout(3000); // ビデオ読み込み待機
                const videoElements = await page.$$('#video-element video, #video-element canvas');
                console.log('🎬 ビデオ要素数:', videoElements.length);
                
                // 参加者リストをチェック
                const participantsList = await page.textContent('#participants-panel h3');
                console.log('👥 参加者リスト:', participantsList);
                
                const participantItems = await page.$$('#participants-list .participant-item');
                console.log('👤 参加者数:', participantItems.length);
                
                if (participantItems.length > 0) {
                    const firstParticipant = await page.textContent('#participants-list .participant-item:first-child .participant-name');
                    console.log('📝 最初の参加者:', firstParticipant);
                }
                
                // ビデオコントロールボタンをテスト
                console.log('🎮 ビデオコントロールをテスト...');
                await page.click('#toggleVideoButton');
                await page.waitForTimeout(1000);
                await page.click('#toggleAudioButton');
                await page.waitForTimeout(1000);
                
                // 少し待機して画面を確認
                await page.waitForTimeout(2000);
                
                // 会議を退出
                console.log('🚪 会議を退出中...');
                await page.click('#leaveButton');
                
                await page.waitForTimeout(2000);
                const finalStatus = await statusElement.textContent();
                console.log('📤 退出後のステータス:', finalStatus);
                
                console.log('✅ テスト完了: 成功');
                return { success: true, message: '会議への参加と退出が正常に完了しました' };
            }
            
            if (statusText && statusText.includes('失敗')) {
                console.log('❌ 会議参加に失敗しました:', statusText);
                return { success: false, message: statusText };
            }
        }
        
        console.log('⏰ タイムアウト: 会議参加が完了しませんでした');
        return { success: false, message: 'タイムアウト: 会議参加が完了しませんでした' };
        
    } catch (error) {
        console.error('💥 テスト中にエラーが発生しました:', error);
        return { success: false, message: error.message };
    } finally {
        await browser.close();
    }
}

// テストを実行
testZoomConnection().then(result => {
    console.log('\n=== テスト結果 ===');
    console.log('成功:', result.success);
    console.log('メッセージ:', result.message);
    process.exit(result.success ? 0 : 1);
}).catch(error => {
    console.error('テスト実行エラー:', error);
    process.exit(1);
});