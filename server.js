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
  
  console.log('🔑 Token generation request:', { sessionName, userIdentity, roleType });
  
  if (!sessionName || !userIdentity) {
    console.log('❌ Missing required fields');
    return res.status(400).json({ error: 'sessionName and userIdentity are required' });
  }

  const payload = {
    app_key: process.env.SDK_KEY,
    tpc: sessionName,
    role_type: roleType || 1,
    user_identity: userIdentity,
    version: 1,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (60 * 60 * 2) // 2時間有効
  };

  console.log('📝 JWT payload:', payload);
  console.log('🔐 Using SDK Key:', process.env.SDK_KEY);
  console.log('🔐 Using SDK Secret:', process.env.SDK_SECRET ? '[HIDDEN]' : 'NOT SET');

  try {
    const token = jwt.sign(payload, process.env.SDK_SECRET);
    console.log('✅ Token generated successfully');
    res.json({ token });
  } catch (error) {
    console.error('❌ JWT generation error:', error);
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