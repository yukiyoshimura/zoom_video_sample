# Zoom Video Conference Application

Zoom Video SDKを使用したWebベースのビデオ会議アプリケーションです。

## 機能

- ボタンクリックでZoom Video会議を開始
- 複数ユーザーが同じセッションに参加可能
- ビデオ、音声、画面共有、チャット機能
- DevContainer環境での開発サポート

## セットアップ

### 1. Zoom Video SDK認証情報の取得

1. [Zoom Marketplace](https://marketplace.zoom.us/)でアカウントを作成
2. Video SDK appを作成
3. SDK KeyとSecretを取得

### 2. 環境変数の設定

`.env.example`を`.env`にコピーして認証情報を設定:

```bash
cp .env.example .env
```

`.env`ファイルに以下を設定:
```
ZOOM_VIDEO_SDK_KEY=your_zoom_video_sdk_key_here
ZOOM_VIDEO_SDK_SECRET=your_zoom_video_sdk_secret_here
PORT=3000
```

### 3. DevContainerでの開発

1. VS Codeで「Dev Containers: Reopen in Container」を実行
2. 依存関係が自動的にインストールされます

### 4. アプリケーションの起動

```bash
npm start
```

または開発モード:
```bash
npm run dev
```

## 使用方法

1. ブラウザで `http://localhost:3000` にアクセス
2. セッション名とユーザー名を入力
3. 「会議に参加」ボタンをクリック
4. 他のユーザーも同じセッション名で参加可能

## 技術スタック

- **Frontend**: HTML/CSS/JavaScript + Zoom Video SDK UI Toolkit
- **Backend**: Node.js + Express
- **Authentication**: JWT
- **Development**: DevContainer

## 注意事項

- 本番環境では、JWT生成をセキュアなバックエンドで行ってください
- HTTPS環境が推奨されます（カメラ・マイクのアクセス許可のため）
- 同時接続数に制限があります（Zoom Video SDKのプランに依存）
