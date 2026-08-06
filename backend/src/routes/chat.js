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
      const records = file.records || [];
      const q = question.toLowerCase();
      let mockAnswer = `Analyzed dataset '${file.originalName}'. Total records: ${file.rowCount}.`;
      let chartData = null;

      try {
        if (q.includes('profit') && q.includes('product')) {
          const prodMap = {};
          records.forEach(r => {
            const p = String(r.Profit || r.profit || 0).replace(/[^0-9.-]+/g,"");
            const name = r.Product || r.product || r.Item || 'Unknown';
            prodMap[name] = (prodMap[name] || 0) + (parseFloat(p) || 0);
          });
          const topProd = Object.entries(prodMap).sort((a,b) => b[1] - a[1])[0];
          if (topProd) mockAnswer = `Based on the data, the product that made the highest profit is **${topProd[0]}** with a total profit of ₹${topProd[1].toLocaleString('en-IN')}.`;
        } else if (q.includes('city') || q.includes('region')) {
          const cityMap = {};
          records.forEach(r => {
            const rev = String(r.Revenue || r.revenue || r.Total || r.total || r.Price || 0).replace(/[^0-9.-]+/g,"");
            const city = r.City || r.city || r.Region || 'Unknown';
            cityMap[city] = (cityMap[city] || 0) + (parseFloat(rev) || 0);
          });
          const topCity = Object.entries(cityMap).sort((a,b) => b[1] - a[1])[0];
          if (topCity) mockAnswer = `The city generating the highest revenue is **${topCity[0]}** with ₹${topCity[1].toLocaleString('en-IN')}.`;
          chartData = Object.entries(cityMap).slice(0, 5).map(([name, value]) => ({ name, value }));
        } else if (q.includes('january') || q.includes('summary')) {
          let total = 0;
          records.forEach(r => {
            const rev = String(r.Revenue || r.revenue || r.Total || r.total || r.Price || 0).replace(/[^0-9.-]+/g,"");
            total += (parseFloat(rev) || 0);
          });
          mockAnswer = `The total sales summary shows a cumulative revenue of ₹${total.toLocaleString('en-IN')} across ${records.length} recorded transactions.`;
        } else if (q.includes('average')) {
          let total = 0;
          records.forEach(r => {
            const rev = String(r.Revenue || r.revenue || r.Total || r.total || r.Price || 0).replace(/[^0-9.-]+/g,"");
            total += (parseFloat(rev) || 0);
          });
          const avg = total / (records.length || 1);
          mockAnswer = `The average order value (AOV) across all records is ₹${avg.toLocaleString('en-IN', {maximumFractionDigits: 2})}.`;
        }
      } catch (e) {
        mockAnswer += ' (Could not compute metric).';
      }

      chatResult = { answer: mockAnswer, chart_type: chartData ? "bar" : "text", chart_data: chartData };
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
