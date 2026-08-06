const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { fileStore } = require('./files');

const router = express.Router();

function cleanNum(val, def = 0) {
  if (val === null || val === undefined || val === '') return def;
  if (typeof val === 'number') return isNaN(val) ? def : val;
  const s = String(val).replace(/[$₹,]/g, '').trim();
  const n = parseFloat(s);
  return isNaN(n) ? def : n;
}

router.get('/export/:fileId', authenticateToken, (req, res) => {
  try {
    const fileId = req.params.fileId;
    
    let file = fileStore.get(fileId);
    if (!file) {
      return res.status(404).json({ error: `File dataset ${fileId} not found` });
    }

    const records = file.records || [];
    const sample = records[0] || {};
    const keys = Object.keys(sample);
    const revKey = keys.find(k => k.toLowerCase().includes('revenue') || k.toLowerCase().includes('amount') || k.toLowerCase().includes('price'));
    const qtyKey = keys.find(k => k.toLowerCase().includes('quantity') || k.toLowerCase().includes('qty'));

    let totalRev = 0;
    records.forEach(r => {
      const q = qtyKey ? cleanNum(r[qtyKey], 1) : 1;
      const v = revKey ? cleanNum(r[revKey], 0) : 0;
      totalRev += (revKey && revKey.toLowerCase().includes('total')) ? v : v * q;
    });

    const reportContent = {
      title: `Executive Intelligence Report - ${file.originalName}`,
      generatedAt: new Date().toISOString(),
      datasetDetails: {
        filename: file.originalName,
        totalRows: file.rowCount,
        totalColumns: file.columnCount
      },
      executiveSummary: `Analyzed ${file.rowCount} transactions for ${file.originalName}. Total calculated dataset revenue is ₹${Math.round(totalRev).toLocaleString('en-IN')}.`,
      metrics: {
        totalRevenue: Math.round(totalRev),
        totalProfit: Math.round(totalRev * 0.2)
      },
      records: file.records
    };

    res.json(reportContent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
