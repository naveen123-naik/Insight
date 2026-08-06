const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { fileStore } = require('./files');
const { callAIService } = require('../services/aiClient');

const router = express.Router();

// Store chat history in memory per file
const chatHistoryMap = new Map();

router.post('/:fileId', authenticateToken, async (req, res) => {
  try {
    const fileId = req.params.fileId;
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'Question prompt is required' });
    }

    let file = fileStore.get(fileId);
    if (!file) {
      return res.status(404).json({ error: `File dataset ${fileId} not found` });
    }

    let chatResult = await callAIService('/chat', {
      question,
      records: file.records
    });

    if (!chatResult) {
      let answer = `Analyzed dataset '${file.originalName}'. Total records: ${file.rowCount}.`;
      chatResult = { answer, chart_type: "text", chart_data: null };
    }

    const messageEntry = {
      id: `chat-${Date.now()}`,
      fileId: file.id,
      question,
      answer: chatResult.answer,
      chartType: chatResult.chart_type,
      chartData: chatResult.chart_data,
      timestamp: new Date().toISOString()
    };

    if (!chatHistoryMap.has(file.id)) {
      chatHistoryMap.set(file.id, []);
    }
    chatHistoryMap.get(file.id).push(messageEntry);

    res.json(messageEntry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:fileId', authenticateToken, (req, res) => {
  const fileId = req.params.fileId;
  const history = chatHistoryMap.get(fileId) || [];
  res.json({ history });
});

module.exports = router;
