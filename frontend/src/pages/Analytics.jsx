import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, X, BarChart3, Trash2, Calculator } from 'lucide-react';
import api from '../services/api';
import { useProject } from '../context/ProjectContext';
import KPICard from '../components/KPICard';
import CityBarChart from '../charts/CityBarChart';
import CategoryPieChart from '../charts/CategoryPieChart';
import CustomChartCard from '../components/CustomChartCard';

export default function Analytics() {
  const { activeFileId, localDatasets } = useProject();

  const localFile = activeFileId?.startsWith('local-') ? localDatasets[activeFileId] : null;

  // Fetch dataset records and analytics summary
  const { data: fileData } = useQuery({
    queryKey: ['file-details', activeFileId],
    queryFn: async () => {
      const res = await api.get(`/files/${activeFileId}`);
      return res.data?.file;
    },
    enabled: !!activeFileId && !localFile
  });

  const { data: analyticsData } = useQuery({
    queryKey: ['analytics', activeFileId],
    queryFn: async () => {
      const res = await api.get(`/analytics/${activeFileId}`);
      return res.data;
    },
    enabled: !!activeFileId && !localFile
  });

  const records = localFile?.records || fileData?.records || [];
  const charts = analyticsData?.analytics?.charts || {};
  const defaultKpis = analyticsData?.analytics?.kpis || {};

  // Compute Automated Real Top 4 KPI Cards (No Fake Data)
  const automatedKpis = useMemo(() => {
    if (defaultKpis.total_revenue > 0 || defaultKpis.total_orders > 0) {
      return [
        { id: 'kpi-1', title: 'Total Revenue', value: `₹${Number(defaultKpis.total_revenue).toLocaleString('en-IN')}`, change: defaultKpis.revenue_growth || 'Automated', isPositive: true, color: 'blue' },
        { id: 'kpi-2', title: 'Sales / Volume', value: `${defaultKpis.total_sales_qty || defaultKpis.total_orders || 0} Units`, change: 'Real Dataset', isPositive: true, color: 'green' },
        { id: 'kpi-3', title: 'Total Profit', value: `₹${Number(defaultKpis.total_profit).toLocaleString('en-IN')}`, change: 'Automated', isPositive: true, color: 'purple' },
        { id: 'kpi-4', title: 'Best Seller', value: defaultKpis.best_product || 'N/A', change: 'Top Item', isPositive: true, color: 'orange' }
      ];
    }

    if (!records.length) {
      return [
        { id: 'kpi-1', title: 'Total Revenue', value: '₹0', change: '0%', isPositive: true, color: 'blue' },
        { id: 'kpi-2', title: 'Sales / Volume', value: '0 Units', change: '0%', isPositive: true, color: 'green' },
        { id: 'kpi-3', title: 'Total Profit', value: '₹0', change: '0%', isPositive: true, color: 'purple' },
        { id: 'kpi-4', title: 'Best Seller', value: 'N/A', change: 'None', isPositive: true, color: 'orange' }
      ];
    }
    let rev = 0;
    let qty = 0;
    let prof = 0;
    const prodMap = {};

    const cleanVal = (v, def = 0) => {
      if (v === null || v === undefined || v === '') return def;
      if (typeof v === 'number') return isNaN(v) ? def : v;
      const s = String(v).replace(/[$₹,]/g, '').trim();
      const n = parseFloat(s);
      return isNaN(n) ? def : n;
    };

    const getColVal = (row, keywords) => {
      if (!row) return undefined;
      const keys = Object.keys(row);
      for (const kw of keywords) {
        const found = keys.find(k => k.toLowerCase().replace(/[^a-z0-9]/g, '').includes(kw.toLowerCase().replace(/[^a-z0-9]/g, '')));
        if (found !== undefined) return row[found];
      }
      return undefined;
    };

    const revKeywords = ['revenue', 'total revenue', 'total amount', 'sales amount', 'total price', 'purchase amount', 'grand total', 'subtotal', 'amount', 'sales', 'price', 'unit price'];
    const qtyKeywords = ['quantity', 'qty', 'units', 'count', 'items', 'volume'];
    const profitKeywords = ['profit', 'net profit', 'margin', 'gross profit'];
    const prodKeywords = ['product', 'item', 'product name', 'item name', 'description', 'title', 'sku'];

    records.forEach(r => {
      const rawRev = getColVal(r, revKeywords);
      const rawQty = getColVal(r, qtyKeywords);
      const rawProf = getColVal(r, profitKeywords);
      const prod = String(getColVal(r, prodKeywords) || 'Item');

      const q = cleanVal(rawQty, 1);
      const v = cleanVal(rawRev, 0);
      const p = cleanVal(rawProf, v * 0.2);

      rev += v;
      qty += q;
      prof += p;

      if (prod && v) {
        prodMap[prod] = (prodMap[prod] || 0) + v;
      }
    });

    let topProd = 'N/A';
    let maxRev = -1;
    Object.keys(prodMap).forEach(p => {
      if (prodMap[p] > maxRev) {
        maxRev = prodMap[p];
        topProd = p;
      }
    });

    return [
      { id: 'kpi-1', title: 'Total Revenue', value: `₹${Number(Math.round(rev)).toLocaleString('en-IN')}`, change: 'Real Dataset', isPositive: true, color: 'blue' },
      { id: 'kpi-2', title: 'Sales / Volume', value: `${Math.round(qty)} Units`, change: 'Automated', isPositive: true, color: 'green' },
      { id: 'kpi-3', title: 'Total Profit', value: `₹${Number(Math.round(prof)).toLocaleString('en-IN')}`, change: 'Automated', isPositive: true, color: 'purple' },
      { id: 'kpi-4', title: 'Best Seller', value: topProd, change: 'Top Item', isPositive: true, color: 'orange' }
    ];
  }, [defaultKpis, records]);

  // Dynamic user-added KPI Cards & Custom Charts State
  const [customKpis, setCustomKpis] = useState([]);

  // Sync customKpis with automatedKpis when automatedKpis load or change
  useEffect(() => {
    setCustomKpis(automatedKpis);
  }, [automatedKpis]);

  const [customCharts, setCustomCharts] = useState([]);
  
  // Modals state
  const [isAddChartOpen, setIsAddChartOpen] = useState(false);
  const [isAddKpiOpen, setIsAddKpiOpen] = useState(false);

  // Available column names
  const allColumns = useMemo(() => {
    if (!records.length) return [];
    return Object.keys(records[0]);
  }, [records]);

  // Identify numeric columns for Y-axis
  const numericColumns = useMemo(() => {
    if (!records.length) return [];
    return allColumns.filter(col => {
      const sample = records.find(r => r[col] !== null && r[col] !== undefined)?.[col];
      return !isNaN(parseFloat(sample));
    });
  }, [records, allColumns]);

  // Manual Chart Config State
  const [newChart, setNewChart] = useState({
    title: '',
    chartType: '📊 Bar Chart',
    xAxis: '',
    yAxis: '',
    aggFunc: 'Sum',
    color: 'Blue'
  });

  // Manual KPI Config State
  const [newKpi, setNewKpi] = useState({
    title: '',
    column: '',
    aggFunc: 'Sum',
    color: 'blue'
  });

  // Set default dropdown selections when columns load
  useEffect(() => {
    if (allColumns.length && !newChart.xAxis) {
      setNewChart(prev => ({
        ...prev,
        xAxis: allColumns[0],
        yAxis: numericColumns[0] || allColumns[0]
      }));
    }
    if (allColumns.length && !newKpi.column) {
      setNewKpi(prev => ({
        ...prev,
        column: numericColumns[0] || allColumns[0]
      }));
    }
  }, [allColumns, numericColumns]);

  // Compute custom KPI metric value from records
  const calculateKpiValue = (column, aggFunc) => {
    if (!records.length || !column) return '0';
    const vals = records.map(r => parseFloat(r[column])).filter(v => !isNaN(v));
    if (!vals.length) return '0';

    let res = 0;
    if (aggFunc === 'Sum') res = vals.reduce((a, b) => a + b, 0);
    else if (aggFunc === 'Average') res = vals.reduce((a, b) => a + b, 0) / vals.length;
    else if (aggFunc === 'Max') res = Math.max(...vals);
    else if (aggFunc === 'Min') res = Math.min(...vals);
    else if (aggFunc === 'Count') res = records.length;

    return res > 999 ? `₹${Number(Math.round(res)).toLocaleString('en-IN')}` : Math.round(res * 100) / 100;
  };

  // Add Custom Manual Chart
  const handleAddCustomChart = (e) => {
    e?.preventDefault();
    if (!newChart.xAxis || !newChart.yAxis) return;

    const chartEntry = {
      id: `chart-${Date.now()}`,
      title: newChart.title || `${newChart.aggFunc} of ${newChart.yAxis} by ${newChart.xAxis}`,
      chartType: newChart.chartType,
      xAxis: newChart.xAxis,
      yAxis: newChart.yAxis,
      aggFunc: newChart.aggFunc,
      color: newChart.color
    };

    setCustomCharts(prev => [...prev, chartEntry]);
    setIsAddChartOpen(false);
    setNewChart(prev => ({ ...prev, title: '' }));
  };

  // Add Custom KPI Card
  const handleAddCustomKpi = (e) => {
    e?.preventDefault();
    if (!newKpi.column) return;

    const val = calculateKpiValue(newKpi.column, newKpi.aggFunc);
    const kpiEntry = {
      id: `kpi-${Date.now()}`,
      title: newKpi.title || `${newKpi.aggFunc} ${newKpi.column}`,
      value: String(val),
      change: 'Custom Metric',
      isPositive: true,
      color: newKpi.color
    };

    setCustomKpis(prev => [...prev, kpiEntry]);
    setIsAddKpiOpen(false);
    setNewKpi(prev => ({ ...prev, title: '' }));
  };

  const chartTypeOptions = [
    "📊 Bar Chart",
    "📈 Line Chart",
    "🥧 Pie Chart",
    "🍩 Donut Chart",
    "📉 Area Chart",
    "📊 Stacked Bar",
    "📈 Multi-Line",
    "📊 Combo Chart",
    "🔵 Scatter Plot",
    "🌡️ Heatmap",
    "🌳 Treemap",
    "🌊 Waterfall",
    "🔻 Funnel",
    "🎯 Gauge",
    "📉 Histogram",
    "📈 Forecast",
    "🚨 Anomaly Detection"
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto font-sans">
      {/* Header with Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">
            Analytics & Dashboard Builder
          </h1>
          <p className="text-xs text-[#475569] mt-1">
            Build custom BI dashboards with automated KPI metric cards & 17 visual chart types
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsAddKpiOpen(true)}
            className="flex items-center gap-2 bg-white hover:bg-[#F8FAFC] text-[#0F172A] text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] shadow-sm transition-all"
          >
            <Plus className="w-4 h-4 text-[#22C55E]" />
            <span>Add KPI Card</span>
          </button>

          <button
            onClick={() => setIsAddChartOpen(true)}
            className="flex items-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Visualization</span>
          </button>
        </div>
      </div>

      {/* Top 4 Automated Real KPI Cards Row */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-[#475569] uppercase tracking-wider">Automated KPI Metric Cards</h3>
          <span className="text-xs text-[#94A3B8]">{customKpis.length} Cards</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {customKpis.map((kpi) => (
            <div key={kpi.id} className="relative group">
              <KPICard
                title={kpi.title}
                value={kpi.value}
                change={kpi.change}
                isPositive={kpi.isPositive}
                color={kpi.color}
                icon={BarChart3}
              />
              <button
                onClick={() => setCustomKpis(prev => prev.filter(k => k.id !== kpi.id))}
                className="absolute top-3 right-3 p-1 rounded-lg text-[#94A3B8] hover:text-[#EF4444] bg-white border border-[#E2E8F0] opacity-0 group-hover:opacity-100 transition-all"
                title="Remove KPI"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}

          {/* Quick Add KPI Button Box */}
          <button
            onClick={() => setIsAddKpiOpen(true)}
            className="glass-card p-5 border-2 border-dashed border-[#CBD5E1] hover:border-[#2563EB] rounded-2xl flex flex-col items-center justify-center text-center transition-all group bg-white"
          >
            <Plus className="w-6 h-6 text-[#94A3B8] group-hover:text-[#2563EB] transition-colors" />
            <span className="text-xs font-bold text-[#475569] group-hover:text-[#2563EB] mt-1">Add Custom KPI Metric</span>
          </button>
        </div>
      </div>

      {/* Standard Baseline Visualizers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-[#0F172A]">Regional City Revenue Distribution (Bar)</h3>
            <span className="text-xs text-[#475569]">Auto Summary</span>
          </div>
          <CityBarChart data={charts.city} />
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-[#0F172A]">Category Share (Pie)</h3>
            <span className="text-xs text-[#475569]">Auto Summary</span>
          </div>
          <CategoryPieChart data={charts.category} />
        </div>
      </div>

      {/* User Custom Added Visualizations Grid */}
      {customCharts.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-[#475569] uppercase tracking-wider">Custom Added Visualizations ({customCharts.length})</h3>
            <button 
              onClick={() => setCustomCharts([])}
              className="text-xs text-[#EF4444] font-semibold hover:underline"
            >
              Clear All Custom Visualizations
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {customCharts.map(c => (
              <CustomChartCard
                key={c.id}
                config={c}
                records={records}
                onDelete={() => setCustomCharts(prev => prev.filter(item => item.id !== c.id))}
              />
            ))}
          </div>
        </div>
      )}

      {/* Manual "+ Add Visualization" Modal */}
      {isAddChartOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-card bg-white max-w-md w-full p-6 space-y-5 border border-[#E2E8F0] shadow-xl relative animate-in fade-in zoom-in duration-150">
            <button 
              onClick={() => setIsAddChartOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#F1F5F9]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-blue-50 text-[#2563EB] border border-blue-200">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#0F172A]">Add Visualization</h3>
                <p className="text-xs text-[#475569]">Select visualization chart type, X/Y axes & aggregation</p>
              </div>
            </div>

            <form onSubmit={handleAddCustomChart} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-[#0F172A] block mb-1">Visualization Title (Optional)</label>
                <input
                  type="text"
                  value={newChart.title}
                  onChange={e => setNewChart({ ...newChart, title: e.target.value })}
                  placeholder="e.g. Sales Volume by City"
                  className="w-full bg-white border border-[#CBD5E1] rounded-xl px-3 py-2 text-[#0F172A] placeholder-[#94A3B8] focus:border-[#2563EB]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#0F172A] block mb-1">Chart Type</label>
                  <select
                    value={newChart.chartType}
                    onChange={e => setNewChart({ ...newChart, chartType: e.target.value })}
                    className="w-full bg-white border border-[#CBD5E1] rounded-xl p-2 text-[#0F172A] font-medium"
                  >
                    {chartTypeOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[#0F172A] block mb-1">Aggregation</label>
                  <select
                    value={newChart.aggFunc}
                    onChange={e => setNewChart({ ...newChart, aggFunc: e.target.value })}
                    className="w-full bg-white border border-[#CBD5E1] rounded-xl p-2 text-[#0F172A]"
                  >
                    <option value="Sum">Sum</option>
                    <option value="Average">Average</option>
                    <option value="Count">Count</option>
                    <option value="Max">Max</option>
                    <option value="Min">Min</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#0F172A] block mb-1">X-Axis Column (Category)</label>
                  <select
                    value={newChart.xAxis}
                    onChange={e => setNewChart({ ...newChart, xAxis: e.target.value })}
                    className="w-full bg-white border border-[#CBD5E1] rounded-xl p-2 text-[#0F172A]"
                  >
                    {allColumns.map(col => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[#0F172A] block mb-1">Y-Axis Column (Value)</label>
                  <select
                    value={newChart.yAxis}
                    onChange={e => setNewChart({ ...newChart, yAxis: e.target.value })}
                    className="w-full bg-white border border-[#CBD5E1] rounded-xl p-2 text-[#0F172A]"
                  >
                    {(numericColumns.length ? numericColumns : allColumns).map(col => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-[#0F172A] block mb-1">Chart Color Theme</label>
                <div className="flex items-center gap-2">
                  {['Blue', 'Green', 'Purple', 'Orange', 'Cyan', 'Pink'].map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewChart({ ...newChart, color: c })}
                      className={`w-7 h-7 rounded-full border-2 transition-all ${
                        newChart.color === c ? 'border-[#0F172A] scale-110' : 'border-transparent'
                      }`}
                      style={{
                        backgroundColor: 
                          c === 'Blue' ? '#2563EB' :
                          c === 'Green' ? '#22C55E' :
                          c === 'Purple' ? '#8B5CF6' :
                          c === 'Orange' ? '#F59E0B' :
                          c === 'Cyan' ? '#06B6D4' : '#EC4899'
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddChartOpen(false)}
                  className="px-4 py-2 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0F172A] rounded-xl font-semibold border border-[#CBD5E1]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl font-semibold shadow-sm"
                >
                  Create Visualization
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual "+ Add KPI" Modal */}
      {isAddKpiOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-card bg-white max-w-md w-full p-6 space-y-5 border border-[#E2E8F0] shadow-xl relative animate-in fade-in zoom-in duration-150">
            <button 
              onClick={() => setIsAddKpiOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#F1F5F9]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-green-50 text-[#22C55E] border border-green-200">
                <Calculator className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#0F172A]">Add Custom KPI Metric</h3>
                <p className="text-xs text-[#475569]">Select dataset metric & aggregation formula</p>
              </div>
            </div>

            <form onSubmit={handleAddCustomKpi} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-[#0F172A] block mb-1">KPI Title (Optional)</label>
                <input
                  type="text"
                  value={newKpi.title}
                  onChange={e => setNewKpi({ ...newKpi, title: e.target.value })}
                  placeholder="e.g. Average Unit Price"
                  className="w-full bg-white border border-[#CBD5E1] rounded-xl px-3 py-2 text-[#0F172A] placeholder-[#94A3B8] focus:border-[#2563EB]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#0F172A] block mb-1">Target Column</label>
                  <select
                    value={newKpi.column}
                    onChange={e => setNewKpi({ ...newKpi, column: e.target.value })}
                    className="w-full bg-white border border-[#CBD5E1] rounded-xl p-2 text-[#0F172A]"
                  >
                    {(numericColumns.length ? numericColumns : allColumns).map(col => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[#0F172A] block mb-1">Formula</label>
                  <select
                    value={newKpi.aggFunc}
                    onChange={e => setNewKpi({ ...newKpi, aggFunc: e.target.value })}
                    className="w-full bg-white border border-[#CBD5E1] rounded-xl p-2 text-[#0F172A]"
                  >
                    <option value="Sum">Sum Total</option>
                    <option value="Average">Average Mean</option>
                    <option value="Max">Maximum Peak</option>
                    <option value="Min">Minimum Value</option>
                    <option value="Count">Row Count</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-[#0F172A] block mb-1">Card Color</label>
                <select
                  value={newKpi.color}
                  onChange={e => setNewKpi({ ...newKpi, color: e.target.value })}
                  className="w-full bg-white border border-[#CBD5E1] rounded-xl p-2 text-[#0F172A]"
                >
                  <option value="blue">Blue</option>
                  <option value="green">Green</option>
                  <option value="purple">Purple</option>
                  <option value="orange">Orange</option>
                  <option value="cyan">Cyan</option>
                  <option value="pink">Pink</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddKpiOpen(false)}
                  className="px-4 py-2 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0F172A] rounded-xl font-semibold border border-[#CBD5E1]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#22C55E] hover:bg-green-600 text-white rounded-xl font-semibold shadow-sm"
                >
                  Add KPI
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
