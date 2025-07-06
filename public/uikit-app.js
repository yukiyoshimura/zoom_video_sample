class ZoomUIKitConference {
    constructor() {
        this.isJoined = false;
        this.uiToolkit = null;
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        document.getElementById('joinButton').addEventListener('click', () => this.joinSession());
        document.getElementById('leaveButton').addEventListener('click', () => this.leaveSession());
        
        // デフォルトのユーザー名を設定
        document.getElementById('userName').value = 'UIKit_User_' + Math.floor(Math.random() * 1000);
    }

    showStatus(message, type = 'info') {
        const statusDiv = document.getElementById('status');
        statusDiv.textContent = message;
        statusDiv.className = `status ${type}`;
        statusDiv.style.display = 'block';
        
        // 3秒後に自動的に隠す（成功メッセージ以外）
        if (type !== 'success') {
            setTimeout(() => {
                statusDiv.style.display = 'none';
            }, 3000);
        }
    }

    async generateToken(sessionName, userIdentity) {
        try {
            const response = await fetch('/api/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sessionName,
                    userIdentity,
                    roleType: 1
                })
            });

            if (!response.ok) {
                throw new Error('Token generation failed');
            }

            const data = await response.json();
            return data.token;
        } catch (error) {
            console.error('Token generation error:', error);
            throw error;
        }
    }

    async joinSession() {
        const sessionName = document.getElementById('sessionName').value.trim();
        const userName = document.getElementById('userName').value.trim();
        const sessionPasscode = document.getElementById('sessionPasscode').value.trim();

        if (!sessionName || !userName) {
            this.showStatus('セッション名とユーザー名を入力してください', 'error');
            return;
        }

        try {
            document.getElementById('joinButton').disabled = true;
            this.showStatus('UIKit会議に参加中...', 'info');

            // JWTトークンを生成
            const token = await this.generateToken(sessionName, userName);
            console.log('🔑 Token generated for UIKit');

            // UIKit コンテナを表示
            document.getElementById('uikit-container').style.display = 'block';
            document.getElementById('meeting-controls').style.display = 'block';
            document.getElementById('join-section').style.display = 'none';

            // UIKit セッション設定（シンプルな設定に変更）
            const sessionConfig = {
                sessionName: sessionName,
                sessionPasscode: sessionPasscode || '',
                userName: userName,
                sessionKey: token,
                userIdentity: userName,
                // 基本機能のみ有効化
                features: ['video', 'audio', 'users', 'chat'],
                options: {
                    init: {
                        language: 'en-US', // 日本語でエラーが出る可能性があるため英語に変更
                        stayAwake: true
                    },
                    audio: {
                        autoStart: true,
                        mute: false
                    },
                    video: {
                        autoStart: true,
                        mute: false
                    }
                }
            };

            console.log('🚀 UIKit session config:', sessionConfig);

            // UIKit セッションに参加
            this.uiToolkit = window.uitoolkit;
            
            await this.uiToolkit.joinSession(
                document.getElementById('uikit-container'),
                sessionConfig
            );

            this.isJoined = true;
            console.log('✅ UIKit session joined successfully');
            this.showStatus('UIKit会議に参加しました！プロフェッショナルなUI体験をお楽しみください', 'success');

            // UIKit イベントリスナーを設定
            this.setupUIKitEventListeners();

        } catch (error) {
            console.error('UIKit Join session error:', error);
            this.showStatus('UIKit会議への参加に失敗しました: ' + error.message, 'error');
            
            // エラー時は表示を元に戻す
            document.getElementById('uikit-container').style.display = 'none';
            document.getElementById('meeting-controls').style.display = 'none';
            document.getElementById('join-section').style.display = 'block';
        } finally {
            document.getElementById('joinButton').disabled = false;
        }
    }

    setupUIKitEventListeners() {
        // UIKit のイベントリスナーを設定
        if (this.uiToolkit && this.uiToolkit.onSessionJoined) {
            this.uiToolkit.onSessionJoined(() => {
                console.log('🎉 UIKit Session fully joined');
                this.showStatus('UIKit会議セッションが完全に開始されました', 'success');
            });
        }

        if (this.uiToolkit && this.uiToolkit.onSessionLeft) {
            this.uiToolkit.onSessionLeft(() => {
                console.log('👋 UIKit Session left');
                this.handleSessionLeft();
            });
        }

        if (this.uiToolkit && this.uiToolkit.onUserJoined) {
            this.uiToolkit.onUserJoined((user) => {
                console.log('👋 User joined UIKit session:', user);
                this.showStatus(`${user.displayName} が参加しました`, 'info');
            });
        }

        if (this.uiToolkit && this.uiToolkit.onUserLeft) {
            this.uiToolkit.onUserLeft((user) => {
                console.log('👋 User left UIKit session:', user);
                this.showStatus(`${user.displayName} が退出しました`, 'info');
            });
        }
    }

    handleSessionLeft() {
        this.isJoined = false;
        document.getElementById('uikit-container').style.display = 'none';
        document.getElementById('meeting-controls').style.display = 'none';
        document.getElementById('join-section').style.display = 'block';
        this.showStatus('UIKit会議セッションを退出しました', 'info');
    }

    async leaveSession() {
        if (!this.isJoined || !this.uiToolkit) {
            return;
        }

        try {
            console.log('🚪 Leaving UIKit session...');
            this.showStatus('UIKit会議から退出中...', 'info');

            // UIKit セッションを退出
            await this.uiToolkit.leaveSession();
            
            // 手動でUI状態をリセット（イベントが発火しない場合のため）
            setTimeout(() => {
                this.handleSessionLeft();
            }, 1000);

        } catch (error) {
            console.error('UIKit Leave session error:', error);
            this.showStatus('UIKit退出に失敗しました: ' + error.message, 'error');
        }
    }
}

// UIKitの読み込み完了を待ってアプリケーションを初期化
document.addEventListener('DOMContentLoaded', () => {
    // UIKit の読み込み確認
    const checkUIKit = () => {
        if (typeof window.UIToolkit !== 'undefined') {
            console.log('✅ Zoom UIKit loaded successfully');
            // UIToolkitをグローバルのuitoolkitとして設定
            window.uitoolkit = window.UIToolkit;
            new ZoomUIKitConference();
        } else {
            console.log('⏳ Waiting for UIKit to load...', typeof window.UIToolkit);
            setTimeout(checkUIKit, 100);
        }
    };
    
    checkUIKit();
});