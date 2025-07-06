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

            // UIKit セッション設定（正式なパラメータ名を使用）
            // すべてのパラメータを文字列として確実に設定
            const sessionConfig = {
                topic: String(sessionName).trim(),                    // sessionName → topic
                sessionName: String(sessionName).trim(),             // バックアップとして残す
                sessionPasscode: String(sessionPasscode || '').trim(),
                userName: String(userName).trim(),
                sessionKey: String(token).trim(),
                userIdentity: String(userName).trim(),
                token: String(token).trim(),                         // sessionKey → token としても設定
                featuresOptions: {
                    video: {
                        enable: true
                    },
                    audio: {
                        enable: true
                    },
                    users: {
                        enable: true
                    },
                    chat: {
                        enable: true
                    },
                    settings: {
                        enable: true
                    }
                }
            };

            // 必須パラメータの検証
            if (!sessionConfig.sessionName || !sessionConfig.userName || !sessionConfig.sessionKey) {
                throw new Error('Missing required parameters: sessionName, userName, or sessionKey');
            }

            // デバッグ用：各パラメータの詳細情報
            console.log('🔍 Parameter types and values:', {
                sessionName: {
                    type: typeof sessionConfig.sessionName,
                    value: sessionConfig.sessionName,
                    length: sessionConfig.sessionName.length
                },
                userName: {
                    type: typeof sessionConfig.userName,
                    value: sessionConfig.userName,
                    length: sessionConfig.userName.length
                },
                sessionKey: {
                    type: typeof sessionConfig.sessionKey,
                    value: sessionConfig.sessionKey.substring(0, 20) + '...',
                    length: sessionConfig.sessionKey.length
                },
                sessionPasscode: {
                    type: typeof sessionConfig.sessionPasscode,
                    value: sessionConfig.sessionPasscode,
                    length: sessionConfig.sessionPasscode.length
                }
            });

            console.log('🚀 UIKit session config:', sessionConfig);

            // UIKit セッションに参加
            this.uiToolkit = window.uitoolkit;
            console.log('🚀 UIKit instance:', this.uiToolkit);
            console.log('🚀 UIKit methods:', Object.getOwnPropertyNames(this.uiToolkit));
            
            // Check if it's a class constructor or instance
            if (typeof this.uiToolkit === 'function') {
                console.log('🏗️ UIKit appears to be a constructor, creating instance...');
                this.uiToolkit = new this.uiToolkit();
                console.log('🏗️ UIKit instance created:', this.uiToolkit);
            }
            
            // Try different ways to initialize UIKit
            if (typeof this.uiToolkit.init === 'function') {
                console.log('📝 Initializing UIKit...');
                await this.uiToolkit.init();
            }
            
            console.log('📞 Joining session with config:', sessionConfig);
            
            // 正式なUIKit設定（公式ドキュメント準拠 + 基本機能）
            const minimalConfig = {
                videoSDKJWT: String(token).trim(),
                sessionName: String(sessionName).trim(),
                userName: String(userName).trim(),
                sessionPasscode: String(sessionPasscode || '').trim(),
                features: ['video', 'audio', 'users', 'chat', 'settings'],
                options: {
                    init: {
                        language: 'en-US'
                    },
                    video: {
                        localVideo: {
                            visible: true
                        }
                    },
                    audio: {
                        localAudio: {
                            visible: true
                        }
                    }
                }
            };
            
            // すべてのプロパティが正しく設定されているか確認
            console.log('🔧 Trying minimal config:', JSON.stringify(minimalConfig, null, 2));
            console.log('🔧 Minimal config validation:', {
                videoSDKJWTValid: typeof minimalConfig.videoSDKJWT === 'string' && minimalConfig.videoSDKJWT.length > 0,
                sessionNameValid: typeof minimalConfig.sessionName === 'string' && minimalConfig.sessionName.length > 0,
                userNameValid: typeof minimalConfig.userName === 'string' && minimalConfig.userName.length > 0,
                sessionPasscodeValid: typeof minimalConfig.sessionPasscode === 'string'
            });
            
            // joinSessionを実行する前にUIKitの状態を確認
            console.log('🔍 Pre-join checks:', {
                uiToolkitExists: !!this.uiToolkit,
                joinSessionExists: typeof this.uiToolkit.joinSession === 'function',
                containerExists: !!document.getElementById('uikit-container'),
                configValid: !!minimalConfig && typeof minimalConfig === 'object'
            });

            try {
                const result = await this.uiToolkit.joinSession(
                    document.getElementById('uikit-container'),
                    minimalConfig
                );
                
                console.log('📞 Join result:', result);

                this.isJoined = true;
                console.log('✅ UIKit session joined successfully');
                this.showStatus('UIKit会議に参加しました！', 'success');

                // UIKit イベントリスナーを設定
                this.setupUIKitEventListeners();
                
                // UIKitコンテナの状態を確認
                setTimeout(() => {
                    const container = document.getElementById('uikit-container');
                    const hasChildren = container.children.length > 0;
                    const computedStyle = window.getComputedStyle(container);
                    
                    console.log('🔍 UIKit Container Status:', {
                        hasChildren: hasChildren,
                        childrenCount: container.children.length,
                        containerHeight: computedStyle.height,
                        containerWidth: computedStyle.width,
                        containerDisplay: computedStyle.display,
                        innerHTML: container.innerHTML.substring(0, 200) + '...'
                    });
                    
                    if (!hasChildren) {
                        console.warn('⚠️ UIKit container is empty, trying to force render...');
                        // UIKitコンポーネントを表示する試み
                        if (this.uiToolkit.showUitoolkitComponents) {
                            this.uiToolkit.showUitoolkitComponents(['video', 'audio', 'users']);
                        }
                    }
                }, 2000);
                
            } catch (joinError) {
                console.error('❌ Join session failed:', joinError);
                console.error('❌ Error details:', {
                    message: joinError.message,
                    stack: joinError.stack,
                    errorCode: joinError.errorCode,
                    reason: joinError.reason,
                    type: joinError.type
                });
                
                // エラー情報をより詳しく表示
                if (joinError.reason) {
                    throw new Error(`UIKit Join failed: ${joinError.reason} (Code: ${joinError.errorCode})`);
                } else {
                    throw new Error(`UIKit Join failed: ${joinError.message || joinError}`);
                }
            }

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
        console.log('🔍 Checking for UIKit...', {
            UIToolkit: typeof window.UIToolkit,
            ZoomVideoSDKUIToolkit: typeof window.ZoomVideoSDKUIToolkit,
            keys: Object.keys(window).filter(k => k.includes('Toolkit') || k.includes('Zoom') || k.includes('UIKit'))
        });
        
        // Try different possible UIKit exports
        const toolkit = window.UIToolkit || window.ZoomVideoSDKUIToolkit || window.uitoolkit;
        
        if (toolkit) {
            console.log('✅ Zoom UIKit loaded successfully', toolkit);
            // UIToolkitをグローバルのuitoolkitとして設定
            window.uitoolkit = toolkit;
            new ZoomUIKitConference();
        } else {
            console.log('⏳ Waiting for UIKit to load...');
            setTimeout(checkUIKit, 100);
        }
    };
    
    // Give the scripts a moment to load
    setTimeout(checkUIKit, 500);
});