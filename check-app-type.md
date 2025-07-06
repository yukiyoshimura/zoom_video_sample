# Zoom Developer Console 確認事項

## 現在のアプリ設定を確認してください

### 1. アプリタイプの確認

- **General App** → ✅ 正しい選択
- **Webhook Only App** → ❌ Video SDK には使用不可

### 2. アプリの詳細設定で確認すべき項目

#### Features/Scopes タブ:

- [ ] Video SDK が有効になっているか
- [ ] Meeting SDK が有効になっているか（不要なら OFF）

#### Credentials タブ:

現在の資格情報の種類を確認：

→ SDK Key/SDK Secret を使用する

### 3. 確認手順

1. Zoom Marketplace → Manage → [あなたのアプリ] → Credentials
2. 「SDK Key」「SDK Secret」の項目があるかチェック
3. ない場合は Features タブで Video SDK を有効化

### 4. Video SDK が有効でない場合の対処

- Features タブで Video SDK を有効化
- アプリを一度 Publish/Activate
- 数分待ってから Credentials を再確認
