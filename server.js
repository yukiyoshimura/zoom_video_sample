const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// JWT生成エンドポイント
app.post('/api/token', (req, res) => {
  const { sessionName, userIdentity, roleType } = req.body;
  
  if (!sessionName || !userIdentity) {
    return res.status(400).json({ error: 'sessionName and userIdentity are required' });
  }

  const payload = {
    iss: process.env.ZOOM_VIDEO_SDK_KEY,
    exp: Math.floor(Date.now() / 1000) + (60 * 60 * 2), // 2時間有効
    iat: Math.floor(Date.now() / 1000),
    aud: 'zoom',
    appKey: process.env.ZOOM_VIDEO_SDK_KEY,
    tokenExp: Math.floor(Date.now() / 1000) + (60 * 60 * 2),
    alg: 'HS256',
    typ: 'JWT',
    sessionName: sessionName,
    userIdentity: userIdentity,
    roleType: roleType || 1
  };

  try {
    const token = jwt.sign(payload, process.env.ZOOM_VIDEO_SDK_SECRET);
    res.json({ token });
  } catch (error) {
    console.error('JWT generation error:', error);
    res.status(500).json({ error: 'Token generation failed' });
  }
});

// メインページ
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});