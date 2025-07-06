class ZoomVideoConference {
    constructor() {
        this.client = null;
        this.isJoined = false;
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        document.getElementById('joinButton').addEventListener('click', () => this.joinSession());
        document.getElementById('leaveButton').addEventListener('click', () => this.leaveSession());
        document.getElementById('toggleVideoButton').addEventListener('click', () => this.toggleVideo());
        document.getElementById('toggleAudioButton').addEventListener('click', () => this.toggleAudio());
        
        // デフォルトのユーザー名を設定
        document.getElementById('userName').value = 'User_' + Math.floor(Math.random() * 1000);
        
        // ビデオ・オーディオの状態を追跡
        this.videoEnabled = false;
        this.audioEnabled = false;
        
        // 参加者リストを追跡
        this.participants = new Map();
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

            // ZoomVideoSDKの読み込み待機
            if (typeof window.WebVideoSDK === 'undefined') {
                this.showStatus('Zoom Video SDKの読み込みを待機中...', 'info');
                await this.waitForZoomVideo();
            }

            // Zoom Video SDKを初期化
            this.client = window.WebVideoSDK.default.createClient();
            
            // 会議に参加
            await this.client.init({
                language: 'ja-JP',
                stayAwake: true
            });
            
            await this.client.join(
                sessionName,
                token,
                userName,
                sessionPasscode
            );

            this.isJoined = true;
            
            // ビデオとオーディオを開始
            await this.startVideoAndAudio(userName);
            
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

    async waitForZoomVideo() {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 200; // 20秒間待機
            
            const checkInterval = setInterval(() => {
                attempts++;
                console.log(`🔍 WebVideoSDK check attempt ${attempts}, window.WebVideoSDK:`, typeof window.WebVideoSDK);
                
                if (typeof window.WebVideoSDK !== 'undefined') {
                    console.log('✅ WebVideoSDK loaded successfully');
                    clearInterval(checkInterval);
                    resolve();
                } else if (attempts >= maxAttempts) {
                    console.log('❌ WebVideoSDK loading timeout');
                    clearInterval(checkInterval);
                    reject(new Error('WebVideoSDK の読み込みがタイムアウトしました'));
                }
            }, 100);
        });
    }

    async startVideoAndAudio(userName) {
        try {
            console.log('🎥 ビデオとオーディオを開始中...');
            
            // カメラとマイクのアクセス許可を取得
            const stream = this.client.getMediaStream();
            
            // ビデオを開始
            await stream.startVideo();
            this.videoEnabled = true;
            console.log('✅ ビデオ開始');
            
            // 自分のビデオを表示
            const videoElement = document.getElementById('video-element');
            const selfVideo = await stream.attachVideo(this.client.getCurrentUserInfo().userId, 3);
            videoElement.appendChild(selfVideo);
            
            // オーディオを開始（オプション）
            await stream.startAudio();
            this.audioEnabled = true;
            console.log('✅ オーディオ開始');
            
            // イベントリスナーを設定
            this.setupEventListeners();
            
            // 自分を参加者リストに追加
            const currentUser = this.client.getCurrentUserInfo();
            this.addParticipant(currentUser.userId, currentUser.displayName || userName, true);
            
            this.showStatus('ビデオとオーディオを開始しました', 'success');
            
        } catch (error) {
            console.error('Video/Audio start error:', error);
            this.showStatus('ビデオ/オーディオの開始に失敗: ' + error.message, 'error');
        }
    }

    setupEventListeners() {
        // 参加者の入退室を監視
        this.client.on('user-added', (payload) => {
            console.log('👋 ユーザー参加:', payload);
            this.addParticipant(payload.userId, payload.displayName, false);
        });

        this.client.on('user-removed', (payload) => {
            console.log('👋 ユーザー退出:', payload);
            this.removeParticipant(payload.userId);
        });

        // ビデオ状態の変更を監視
        this.client.on('peer-video-state-change', (payload) => {
            console.log('📹 参加者ビデオ状態変更:', payload);
            this.updateParticipantVideoStatus(payload.userId, payload.action === 'Start');
            if (payload.action === 'Start') {
                this.renderVideo(payload.userId);
            }
        });

        // オーディオ状態の変更を監視
        this.client.on('user-audio-change', (payload) => {
            console.log('🔊 参加者オーディオ状態変更:', payload);
            this.updateParticipantAudioStatus(payload.userId, payload.action === 'on');
        });
    }

    addParticipant(userId, displayName, isSelf = false) {
        this.participants.set(userId, {
            userId,
            displayName: displayName || `User ${userId}`,
            isSelf,
            videoOn: isSelf ? this.videoEnabled : false,
            audioOn: isSelf ? this.audioEnabled : false
        });
        this.updateParticipantsList();
        console.log('➕ 参加者追加:', displayName);
    }

    removeParticipant(userId) {
        if (this.participants.has(userId)) {
            const participant = this.participants.get(userId);
            this.participants.delete(userId);
            this.updateParticipantsList();
            console.log('➖ 参加者削除:', participant.displayName);
        }
    }

    updateParticipantVideoStatus(userId, videoOn) {
        if (this.participants.has(userId)) {
            this.participants.get(userId).videoOn = videoOn;
            this.updateParticipantsList();
        }
    }

    updateParticipantAudioStatus(userId, audioOn) {
        if (this.participants.has(userId)) {
            this.participants.get(userId).audioOn = audioOn;
            this.updateParticipantsList();
        }
    }

    updateParticipantsList() {
        const participantsList = document.getElementById('participants-list');
        participantsList.innerHTML = '';

        this.participants.forEach(participant => {
            const participantDiv = document.createElement('div');
            participantDiv.className = `participant-item ${participant.isSelf ? 'self' : ''}`;
            
            participantDiv.innerHTML = `
                <div class="participant-name">
                    ${participant.displayName}${participant.isSelf ? ' (あなた)' : ''}
                </div>
                <div class="participant-status">
                    <span class="status-icon ${participant.videoOn ? 'video-on' : 'video-off'}" 
                          title="${participant.videoOn ? 'ビデオON' : 'ビデオOFF'}"></span>
                    <span class="status-icon ${participant.audioOn ? 'audio-on' : 'audio-off'}" 
                          title="${participant.audioOn ? '音声ON' : '音声OFF'}"></span>
                </div>
            `;
            
            participantsList.appendChild(participantDiv);
        });

        // 参加者数を表示
        const participantsCount = this.participants.size;
        const title = document.querySelector('#participants-panel h3');
        title.textContent = `参加者一覧 (${participantsCount}人)`;
    }

    async renderVideo(userId) {
        try {
            const stream = this.client.getMediaStream();
            const videoElement = document.getElementById('video-element');
            const userVideo = await stream.attachVideo(userId, 3);
            videoElement.appendChild(userVideo);
            console.log('👤 ユーザービデオを表示:', userId);
        } catch (error) {
            console.error('Video render error:', error);
        }
    }

    async toggleVideo() {
        if (!this.isJoined || !this.client) {
            return;
        }

        try {
            const stream = this.client.getMediaStream();
            if (this.videoEnabled) {
                await stream.stopVideo();
                this.videoEnabled = false;
                console.log('📹 ビデオを停止');
                this.showStatus('ビデオを停止しました', 'info');
            } else {
                await stream.startVideo();
                this.videoEnabled = true;
                console.log('📹 ビデオを開始');
                this.showStatus('ビデオを開始しました', 'success');
                
                // 自分のビデオを表示
                const videoElement = document.getElementById('video-element');
                const selfVideo = await stream.attachVideo(this.client.getCurrentUserInfo().userId, 3);
                videoElement.appendChild(selfVideo);
            }
            
            // 自分の状態を更新
            this.updateParticipantVideoStatus(this.client.getCurrentUserInfo().userId, this.videoEnabled);
        } catch (error) {
            console.error('Toggle video error:', error);
            this.showStatus('ビデオ切り替えに失敗: ' + error.message, 'error');
        }
    }

    async toggleAudio() {
        if (!this.isJoined || !this.client) {
            return;
        }

        try {
            const stream = this.client.getMediaStream();
            if (this.audioEnabled) {
                await stream.stopAudio();
                this.audioEnabled = false;
                console.log('🔇 オーディオを停止');
                this.showStatus('オーディオを停止しました', 'info');
            } else {
                await stream.startAudio();
                this.audioEnabled = true;
                console.log('🔊 オーディオを開始');
                this.showStatus('オーディオを開始しました', 'success');
            }
            
            // 自分の状態を更新
            this.updateParticipantAudioStatus(this.client.getCurrentUserInfo().userId, this.audioEnabled);
        } catch (error) {
            console.error('Toggle audio error:', error);
            this.showStatus('オーディオ切り替えに失敗: ' + error.message, 'error');
        }
    }

    async leaveSession() {
        if (!this.isJoined || !this.client) {
            return;
        }

        try {
            // ビデオとオーディオを停止（エラーを無視）
            try {
                const stream = this.client.getMediaStream();
                if (this.videoEnabled) {
                    await stream.stopVideo();
                }
                if (this.audioEnabled) {
                    await stream.stopAudio();
                }
            } catch (error) {
                console.log('📹 ビデオ/オーディオ停止時のエラー（無視）:', error.message);
            }
            
            await this.client.leave();
            this.isJoined = false;
            
            // ビデオ要素をクリア
            const videoElement = document.getElementById('video-element');
            videoElement.innerHTML = '';
            
            // 参加者リストをクリア
            this.participants.clear();
            this.updateParticipantsList();
            
            // 状態をリセット
            this.videoEnabled = false;
            this.audioEnabled = false;
            
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