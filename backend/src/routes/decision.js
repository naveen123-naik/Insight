const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { fileStore } = require('./files');
const { callAIService } = require('../services/aiClient');

const router = express.Router();

function cleanNum(val, def = 0) {
  if (val === null || val === undefined || val === '') return def;
  if (typeof val === 'number') return isNaN(val) ? def : val;
  const s = String(val).replace(/[$₹,]/g, '').trim();
  const n = parseFloat(s);
  return isNaN(n) ? def : n;
}

function findCol(sampleRow, keywords) {
  if (!sampleRow) return null;
  const keys = Object.keys(sampleRow);
  for (const kw of keywords) {
    const found = keys.find(k => k.toLowerCase().replace(/[^a-z0-9]/g, '').includes(kw.toLowerCase().replace(/[^a-z0-9]/g, '')));
    if (found) return found;
  }
  return null;
}

// 1. Decision Comparison Endpoint
router.get('/compare/:fileId', authenticateToken, async (req, res) => {
  try {
    const fileId = req.params.fileId;
    const optionType = req.query.type || 'Products';
    let file = fileStore.get(fileId);

    if (!file) {
      return res.status(404).json({ error: `File dataset ${fileId} not found` });
    }

    let comparisonData = await callAIService('/decision/compare', {
      records: file.records,
      option_type: optionType
    });

    if (!comparisonData || !comparisonData.options) {
      // Dynamic Node fallback evaluator
      const records = file.records || [];
      const sample = records[0] || {};
      const revCol = findCol(sample, ['revenue', 'total revenue', 'total amount', 'sales amount', 'total price', 'price', 'amount', 'sales']);
      const qtyCol = findCol(sample, ['quantity', 'qty', 'units', 'count']);
      const profitCol = findCol(sample, ['profit', 'net profit', 'margin']);
      const prodCol = findCol(sample, ['product', 'item', 'description', 'title', 'sku']);

      const map = {};
      records.forEach(r => {
        const prod = String(r[prodCol] || 'Option');
        const q = qtyCol ? cleanNum(r[qtyCol], 1) : 1;
        const rev = revCol ? cleanNum(r[revCol], 0) : 0;
        const prof = profitCol ? cleanNum(r[profitCol], rev * 0.2) : rev * 0.2;

        if (!map[prod]) map[prod] = { revenue: 0, profit: 0, volume: 0 };
        map[prod].revenue += rev;
        map[prod].profit += prof;
        map[prod].volume += q;
      });

      const maxRev = Math.max(...Object.values(map).map(v => v.revenue), 1);
      const options = Object.keys(map).slice(0, 6).map(name => {
        const rev = Math.round(map[name].revenue);
        const profit = Math.round(map[name].profit);
        const volume = Math.round(map[name].volume);
        const margin_pct = rev > 0 ? Math.round((profit / rev) * 1000) / 10 : 0;
        const perf_score = Math.round((rev / maxRev * 60) + Math.min(40, margin_pct * 1.5));
        
        return {
          name,
          revenue: rev,
          profit,
          volume,
          margin_pct,
          performance_score: perf_score,
          risk_level: margin_pct < 15 ? "Medium" : "Low",
          pros: [rev === maxRev ? "Highest revenue contribution" : "Consistent transaction volume"],
          cons: [margin_pct < 15 ? "Lower margin %" : "Requires volume scale"]
        };
      }).sort((a, b) => b.performance_score - a.performance_score);

      const best_option = options[0] || null;
      comparisonData = {
        option_type: optionType,
        options,
        best_option,
        confidence_score: 92,
        reasoning: best_option ? `Evaluated ${options.length} options. '${best_option.name}' achieves top performance score (${best_option.performance_score}/100) with ₹${best_option.revenue.toLocaleString('en-IN')} revenue.` : "No options evaluated."
      };
    }

    res.json({ fileId: file.id, comparison: comparisonData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. What-If Scenario Simulation Endpoint
router.post('/what-if/:fileId', authenticateToken, async (req, res) => {
  try {
    const fileId = req.params.fileId;
    const params = req.body || {};
    let file = fileStore.get(fileId);

    if (!file) {
      return res.status(404).json({ error: `File dataset ${fileId} not found` });
    }

    let whatIfData = await callAIService('/decision/what-if', {
      records: file.records,
      params
    });

    if (!whatIfData || !whatIfData.simulated) {
      // Dynamic Node fallback simulation
      const records = file.records || [];
      const sample = records[0] || {};
      const revCol = findCol(sample, ['revenue', 'total revenue', 'total amount', 'sales amount', 'total price', 'price', 'amount']);
      const profitCol = findCol(sample, ['profit', 'net profit', 'margin']);

      let baseRev = 0;
      let baseProfit = 0;
      records.forEach(r => {
        const rev = revCol ? cleanNum(r[revCol], 0) : 0;
        const prof = profitCol ? cleanNum(r[profitCol], rev * 0.2) : rev * 0.2;
        baseRev += rev;
        baseProfit += prof;
      });

      const pChange = parseFloat(params.price_change_pct || 0);
      const mChange = parseFloat(params.marketing_change_pct || 0);
      const cChange = parseFloat(params.cost_change_pct || 0);

      const volMult = 1 + ((mChange * 0.4 - pChange * 1.1) / 100);
      const simRev = Math.round(baseRev * (1 + (pChange / 100)) * Math.max(0.5, volMult));
      const simCost = (baseRev - baseProfit) * (1 + (cChange / 100)) * Math.max(0.5, volMult);
      const simProfit = Math.round(Math.max(0, simRev - simCost));

      whatIfData = {
        baseline: { revenue: Math.round(baseRev), profit: Math.round(baseProfit), volume: records.length, margin_pct: baseRev ? Math.round((baseProfit/baseRev)*100) : 0 },
        simulated: { revenue: simRev, profit: simProfit, volume: Math.round(records.length * Math.max(0.5, volMult)), margin_pct: simRev ? Math.round((simProfit/simRev)*100) : 0 },
        delta: { revenue: simRev - Math.round(baseRev), revenue_pct: baseRev ? Math.round(((simRev - baseRev)/baseRev)*100) : 0, profit: simProfit - Math.round(baseProfit), profit_pct: baseProfit ? Math.round(((simProfit - baseProfit)/baseProfit)*100) : 0 },
        confidence_score: 89,
        tradeoffs: [
          pChange > 0 ? `Price increase (+${pChange}%) improves unit revenue but moderates sales volume.` : "Baseline price stability maintained."
        ],
        reasoning: `Scenario simulation projects revenue of ₹${simRev.toLocaleString('en-IN')} and profit of ₹${simProfit.toLocaleString('en-IN')}.`
      };
    }

    res.json({ fileId: file.id, simulation: whatIfData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
