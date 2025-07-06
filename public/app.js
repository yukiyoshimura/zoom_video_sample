class ZoomVideoConference {
    constructor() {
        this.uitoolkit = null;
        this.isJoined = false;
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        document.getElementById('joinButton').addEventListener('click', () => this.joinSession());
        document.getElementById('leaveButton').addEventListener('click', () => this.leaveSession());
        
        // デフォルトのユーザー名を設定
        document.getElementById('userName').value = 'User_' + Math.floor(Math.random() * 1000);
    }

    showStatus(message, type = 'info') {
        const statusDiv = document.getElementById('status');
        statusDiv.textContent = message;
        statusDiv.className = `status ${type}`;
        statusDiv.style.display = 'block';
        
        // 3秒後に自動的に隠す
        setTimeout(() => {
            statusDiv.style.display = 'none';
        }, 3000);
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
            this.showStatus('会議に参加中...', 'info');

            // JWTトークンを生成
            const token = await this.generateToken(sessionName, userName);

            // UI Toolkitの設定
            const config = {
                videoSDKJWT: token,
                sessionName: sessionName,
                userName: userName,
                sessionPasscode: sessionPasscode,
                features: ['video', 'audio', 'settings', 'users', 'chat', 'share'],
                options: {
                    init: {
                        language: 'ja-JP',
                        stayAwake: true
                    },
                    audio: {
                        autoplay: true,
                        enable: true
                    },
                    video: {
                        localVideo: {
                            enable: true
                        }
                    },
                    share: {
                        enable: true
                    }
                }
            };

            // UI Toolkitを初期化
            this.uitoolkit = new ZoomVideoUiToolkit();
            
            // 会議に参加
            await this.uitoolkit.joinSession(
                document.getElementById('video-element'),
                config
            );

            this.isJoined = true;
            document.getElementById('join-form').style.display = 'none';
            document.getElementById('video-container').style.display = 'block';
            this.showStatus('会議に参加しました', 'success');

        } catch (error) {
            console.error('Join session error:', error);
            this.showStatus('会議への参加に失敗しました: ' + error.message, 'error');
        } finally {
            document.getElementById('joinButton').disabled = false;
        }
    }

    async leaveSession() {
        if (!this.isJoined || !this.uitoolkit) {
            return;
        }

        try {
            await this.uitoolkit.leaveSession();
            this.isJoined = false;
            
            document.getElementById('video-container').style.display = 'none';
            document.getElementById('join-form').style.display = 'block';
            this.showStatus('会議を退出しました', 'info');
        } catch (error) {
            console.error('Leave session error:', error);
            this.showStatus('退出に失敗しました: ' + error.message, 'error');
        }
    }
}

// アプリケーションを初期化
document.addEventListener('DOMContentLoaded', () => {
    new ZoomVideoConference();
});