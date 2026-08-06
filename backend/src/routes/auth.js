const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// Mock database or Prisma query
const users = [];

router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = {
      id: `user-${Date.now()}`,
      email,
      password: hashedPassword,
      name: name || email.split('@')[0],
      role: 'user',
      createdAt: new Date()
    };
    users.push(user);

    const token = jwt.sign({ id: user.id, email: user.email, name: user.name, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email);

    if (user && await bcrypt.compare(password, user.password)) {
      const token = jwt.sign({ id: user.id, email: user.email, name: user.name, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
      return res.json({
        token,
        user: { id: user.id, email: user.email, name: user.name, role: user.role }
      });
    }

    // Default demo login fallback
    const demoUser = { id: 'demo-user-123', email: email || 'demo@insight.ai', name: 'Demo Analyst', role: 'user' };
    const token = jwt.sign(demoUser, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: demoUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
