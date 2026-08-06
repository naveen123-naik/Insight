const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const { router: filesRoutes } = require('./routes/files');
const analyticsRoutes = require('./routes/analytics');
const forecastRoutes = require('./routes/forecast');
const anomaliesRoutes = require('./routes/anomalies');
const chatRoutes = require('./routes/chat');
const reportsRoutes = require('./routes/reports');
const decisionRoutes = require('./routes/decision');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/forecast', forecastRoutes);
app.use('/api/anomalies', anomaliesRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/decision', decisionRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'InsightAI Express Gateway' });
});

// Socket.io Real-Time Dashboard updates
io.on('connection', (socket) => {
  console.log(`[Socket.io] Client connected: ${socket.id}`);
  
  socket.on('join_file_room', (fileId) => {
    socket.join(fileId);
    console.log(`[Socket.io] Socket ${socket.id} joined room ${fileId}`);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.io] Client disconnected: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 InsightAI Backend Server listening on http://localhost:${PORT}`);
});
