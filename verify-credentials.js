const jwt = require('jsonwebtoken');
require('dotenv').config();

console.log('=== Zoom Video SDK 資格情報の確認 ===\n');

// 環境変数の確認
console.log('1. 環境変数の確認:');
console.log('   ZOOM_ACCOUNT_ID:', process.env.ZOOM_ACCOUNT_ID ? '設定済み (' + process.env.ZOOM_ACCOUNT_ID + ')' : '未設定');
console.log('   ZOOM_CLIENT_ID:', process.env.ZOOM_CLIENT_ID ? '設定済み (' + process.env.ZOOM_CLIENT_ID + ')' : '未設定');
console.log('   ZOOM_CLIENT_SECRET:', process.env.ZOOM_CLIENT_SECRET ? '設定済み (' + process.env.ZOOM_CLIENT_SECRET.length + '文字)' : '未設定');
console.log('   SDK_KEY:', process.env.SDK_KEY ? '設定済み (' + process.env.SDK_KEY + ')' : '未設定');
console.log('   SDK_SECRET:', process.env.SDK_SECRET ? '設定済み (' + process.env.SDK_SECRET.length + '文字)' : '未設定');

// JWT生成テスト
console.log('\n2. JWT生成テスト:');
try {
    const payload = {
        app_key: process.env.SDK_KEY,
        tpc: 'test-session',
        role_type: 1,
        user_identity: 'test-user',
        version: 1,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (60 * 60)
    };
    
    console.log('   ペイロード:', JSON.stringify(payload, null, 4));
    
    const token = jwt.sign(payload, process.env.SDK_SECRET);
    console.log('   JWT生成: ✅ 成功');
    console.log('   トークン長:', token.length, '文字');
    console.log('   トークンの先頭50文字:', token.substring(0, 50) + '...');
    
    // JWTの検証
    const decoded = jwt.verify(token, process.env.SDK_SECRET);
    console.log('   JWT検証: ✅ 成功');
    console.log('   デコード結果:', JSON.stringify(decoded, null, 4));
    
} catch (error) {
    console.log('   JWT生成/検証: ❌ 失敗');
    console.log('   エラー:', error.message);
}

// 資格情報フォーマットの確認
console.log('\n3. 資格情報フォーマットの確認:');
const sdkKey = process.env.SDK_KEY;
const sdkSecret = process.env.SDK_SECRET;

if (sdkKey) {
    console.log('   SDK_KEY長:', sdkKey.length, '文字');
    console.log('   SDK_KEY形式:', /^[A-Za-z0-9_-]+$/.test(sdkKey) ? '✅ 英数字・ハイフン・アンダースコア' : '❌ 不正な文字が含まれています');
}

if (sdkSecret) {
    console.log('   SDK_SECRET長:', sdkSecret.length, '文字');
    console.log('   SDK_SECRET形式:', /^[A-Za-z0-9_-]+$/.test(sdkSecret) ? '✅ 英数字・ハイフン・アンダースコア' : '❌ 不正な文字が含まれています');
}

console.log('\n4. 推奨事項:');
console.log('   ✓ Zoom Developer Consoleで以下を確認してください:');
console.log('     - アプリがVideo SDK用に作成されているか');
console.log('     - アプリが有効化されているか');
console.log('     - 正しいCredentialsページからコピーしたか');
console.log('   ✓ https://marketplace.zoom.us/develop/create にアクセス');
console.log('   ✓ "Video SDK" アプリを選択し、Credentialsタブを確認');
console.log('   ✓ "SDK Key" と "SDK Secret" をコピー (Client IDとClient Secretではない)');