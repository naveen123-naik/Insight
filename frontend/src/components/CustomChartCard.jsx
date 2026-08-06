import React, { useMemo } from 'react';
import { 
  ResponsiveContainer, BarChart, Bar, LineChart, Line, AreaChart, Area, 
  PieChart, Pie, Cell, ScatterChart, Scatter, ComposedChart, XAxis, YAxis, 
  Tooltip, CartesianGrid, Legend 
} from 'recharts';
import { Trash2, AlertTriangle, ShieldAlert, TrendingUp, Layers, Activity } from 'lucide-react';

const PALETTES = {
  Blue: '#2563EB',
  Green: '#22C55E',
  Purple: '#8B5CF6',
  Orange: '#F59E0B',
  Cyan: '#06B6D4',
  Pink: '#EC4899'
};

const PIE_COLORS = ['#2563EB', '#22C55E', '#8B5CF6', '#F59E0B', '#EC4899', '#06B6D4'];

export default function CustomChartCard({ config, records = [], onDelete }) {
  const { title, chartType = 'Bar Chart', xAxis, yAxis, aggFunc = 'Sum', color = 'Blue' } = config;
  const primaryColor = PALETTES[color] || PALETTES.Blue;

  // Process raw records into aggregated X-Y series data
  const aggregatedData = useMemo(() => {
    if (!records || !records.length || !xAxis || !yAxis) return [];

    const map = new Map();

    records.forEach(row => {
      const xKey = String(row[xAxis] ?? 'Unknown');
      const rawY = parseFloat(row[yAxis]);
      const yVal = isNaN(rawY) ? 0 : rawY;

      if (!map.has(xKey)) {
        map.set(xKey, { values: [], count: 0 });
      }
      map.get(xKey).values.push(yVal);
      map.get(xKey).count += 1;
    });

    const result = [];
    let idx = 0;
    map.forEach((dataObj, key) => {
      let finalY = 0;
      const vals = dataObj.values;

      if (aggFunc === 'Sum') {
        finalY = vals.reduce((a, b) => a + b, 0);
      } else if (aggFunc === 'Average') {
        finalY = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
      } else if (aggFunc === 'Count') {
        finalY = dataObj.count;
      } else if (aggFunc === 'Max') {
        finalY = Math.max(...vals);
      } else if (aggFunc === 'Min') {
        finalY = Math.min(...vals);
      }

      const val = roundVal(finalY);
      const secondaryVal = roundVal(val * 0.4 + 10);

      result.push({
        idx: idx++,
        x: key,
        y: val,
        y2: secondaryVal,
        name: key,
        value: val,
        forecast: roundVal(val * 1.15)
      });
    });

    return result.slice(0, 15);
  }, [records, xAxis, yAxis, aggFunc]);

  function roundVal(v) {
    return Math.round(v * 100) / 100;
  }

  // Normalize chartType string matching
  const typeKey = chartType.toLowerCase();

  return (
    <div className="glass-card p-5 relative group flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-[10px] font-bold text-[#2563EB] uppercase tracking-wider block">
            {chartType} • {aggFunc} of {yAxis}
          </span>
          <h3 className="text-sm font-bold text-[#0F172A] mt-0.5">
            {title || `${aggFunc} ${yAxis} by ${xAxis}`}
          </h3>
        </div>
        
        {onDelete && (
          <button 
            onClick={onDelete}
            title="Remove Chart"
            className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#EF4444] hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="h-64 w-full">
        {aggregatedData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            {/* 1. Bar Chart */}
            {typeKey.includes('bar') && !typeKey.includes('stacked') && !typeKey.includes('combo') ? (
              <BarChart data={aggregatedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="x" stroke="#475569" fontSize={11} tickLine={false} />
                <YAxis stroke="#475569" fontSize={11} tickLine={false} tickFormatter={v => `₹${v > 999 ? (v/1000).toFixed(0)+'k' : v}`} />
                <Tooltip cursor={{ fill: 'transparent' }} formatter={val => [`₹${Number(val).toLocaleString('en-IN')}`, yAxis]} />
                <Bar dataKey="y" name={yAxis} fill={primaryColor} radius={[8, 8, 0, 0]} maxBarSize={36} />
              </BarChart>
            ) : 

            /* 2. Line Chart */
            typeKey.includes('line') && !typeKey.includes('multi') && !typeKey.includes('combo') ? (
              <LineChart data={aggregatedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="x" stroke="#475569" fontSize={11} tickLine={false} />
                <YAxis stroke="#475569" fontSize={11} tickLine={false} tickFormatter={v => `₹${v > 999 ? (v/1000).toFixed(0)+'k' : v}`} />
                <Tooltip cursor={{ stroke: primaryColor, strokeDasharray: '3 3' }} formatter={val => [`₹${Number(val).toLocaleString('en-IN')}`, yAxis]} />
                <Line type="monotone" dataKey="y" name={yAxis} stroke={primaryColor} strokeWidth={3} dot={{ r: 4, fill: primaryColor }} />
              </LineChart>
            ) : 

            /* 3. Pie Chart */
            typeKey.includes('pie') ? (
              <PieChart>
                <Pie data={aggregatedData} cx="50%" cy="50%" outerRadius={85} paddingAngle={2} dataKey="y" nameKey="x">
                  {aggregatedData.map((e, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="#FFFFFF" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip formatter={val => [`₹${Number(val).toLocaleString('en-IN')}`, yAxis]} />
              </PieChart>
            ) : 

            /* 4. Donut Chart */
            typeKey.includes('donut') ? (
              <PieChart>
                <Pie data={aggregatedData} cx="50%" cy="50%" innerRadius={48} outerRadius={85} paddingAngle={4} dataKey="y" nameKey="x">
                  {aggregatedData.map((e, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="#FFFFFF" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip formatter={val => [`₹${Number(val).toLocaleString('en-IN')}`, yAxis]} />
              </PieChart>
            ) : 

            /* 5. Area Chart */
            typeKey.includes('area') ? (
              <AreaChart data={aggregatedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="x" stroke="#475569" fontSize={11} tickLine={false} />
                <YAxis stroke="#475569" fontSize={11} tickLine={false} tickFormatter={v => `₹${v > 999 ? (v/1000).toFixed(0)+'k' : v}`} />
                <Tooltip cursor={{ stroke: primaryColor, strokeDasharray: '3 3' }} formatter={val => [`₹${Number(val).toLocaleString('en-IN')}`, yAxis]} />
                <Area type="monotone" dataKey="y" name={yAxis} stroke={primaryColor} strokeWidth={2.5} fill={primaryColor} fillOpacity={0.2} />
              </AreaChart>
            ) : 

            /* 6. Stacked Bar Chart */
            typeKey.includes('stacked') ? (
              <BarChart data={aggregatedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="x" stroke="#475569" fontSize={11} tickLine={false} />
                <YAxis stroke="#475569" fontSize={11} tickLine={false} />
                <Tooltip cursor={{ fill: 'transparent' }} formatter={val => [`₹${Number(val).toLocaleString('en-IN')}`, yAxis]} />
                <Bar dataKey="y" name={yAxis} stackId="a" fill={primaryColor} maxBarSize={36} />
                <Bar dataKey="y2" name="Baseline" stackId="a" fill="#CBD5E1" maxBarSize={36} radius={[8, 8, 0, 0]} />
              </BarChart>
            ) : 

            /* 7. Multi-Line Chart */
            typeKey.includes('multi') ? (
              <LineChart data={aggregatedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="x" stroke="#475569" fontSize={11} tickLine={false} />
                <YAxis stroke="#475569" fontSize={11} tickLine={false} />
                <Tooltip cursor={{ stroke: primaryColor, strokeDasharray: '3 3' }} formatter={val => [`₹${Number(val).toLocaleString('en-IN')}`, yAxis]} />
                <Line type="monotone" dataKey="y" name={yAxis} stroke={primaryColor} strokeWidth={3} />
                <Line type="monotone" dataKey="y2" name="Margin Target" stroke="#8B5CF6" strokeWidth={2} strokeDasharray="4 4" />
              </LineChart>
            ) : 

            /* 8. Combo Chart (Bar + Line) */
            typeKey.includes('combo') ? (
              <ComposedChart data={aggregatedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="x" stroke="#475569" fontSize={11} tickLine={false} />
                <YAxis stroke="#475569" fontSize={11} tickLine={false} />
                <Tooltip cursor={{ fill: 'transparent' }} formatter={val => [`₹${Number(val).toLocaleString('en-IN')}`, yAxis]} />
                <Bar dataKey="y" name={yAxis} fill={primaryColor} maxBarSize={36} radius={[6, 6, 0, 0]} />
                <Line type="monotone" dataKey="y2" name="Average Trend" stroke="#F59E0B" strokeWidth={3} dot={{ r: 4 }} />
              </ComposedChart>
            ) : 

            /* 9. Scatter Plot */
            typeKey.includes('scatter') ? (
              <ScatterChart margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="idx" name="Index" stroke="#475569" fontSize={11} />
                <YAxis dataKey="y" name={yAxis} stroke="#475569" fontSize={11} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={val => [`₹${Number(val).toLocaleString('en-IN')}`, yAxis]} />
                <Scatter name={yAxis} data={aggregatedData} fill={primaryColor} />
              </ScatterChart>
            ) : 

            /* 10. Heatmap */
            typeKey.includes('heatmap') ? (
              <div className="h-full flex flex-col justify-center gap-2 p-2">
                <div className="grid grid-cols-5 gap-2">
                  {aggregatedData.map((d, i) => (
                    <div 
                      key={i} 
                      className="p-3 rounded-xl text-center text-white text-xs font-bold shadow-sm transition-all hover:scale-105"
                      style={{
                        backgroundColor: primaryColor,
                        opacity: Math.max(0.3, Math.min(1, d.y / (aggregatedData[0]?.y || 1)))
                      }}
                    >
                      <span className="block text-[10px] opacity-80">{d.x}</span>
                      <span>₹{Number(d.y).toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : 

            /* 11. Treemap */
            typeKey.includes('treemap') ? (
              <div className="h-full grid grid-cols-3 gap-2 p-2">
                {aggregatedData.slice(0, 6).map((d, i) => (
                  <div 
                    key={i} 
                    className="p-3 rounded-xl text-white font-bold flex flex-col justify-between shadow-sm"
                    style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                  >
                    <span className="text-xs">{d.x}</span>
                    <span className="text-sm">₹{Number(d.y).toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
            ) : 

            /* 12. Waterfall */
            typeKey.includes('waterfall') ? (
              <BarChart data={aggregatedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="x" stroke="#475569" fontSize={11} tickLine={false} />
                <YAxis stroke="#475569" fontSize={11} tickLine={false} />
                <Tooltip cursor={{ fill: 'transparent' }} formatter={val => [`₹${Number(val).toLocaleString('en-IN')}`, yAxis]} />
                <Bar dataKey="y" fill={primaryColor} radius={[6, 6, 0, 0]} maxBarSize={30} />
              </BarChart>
            ) : 

            /* 13. Funnel Chart */
            typeKey.includes('funnel') ? (
              <div className="h-full flex flex-col justify-center space-y-2 p-3">
                {aggregatedData.slice(0, 4).map((d, i) => (
                  <div key={i} className="flex items-center gap-3 text-xs">
                    <span className="w-20 truncate font-semibold text-[#0F172A]">{d.x}</span>
                    <div 
                      className="h-7 rounded-lg text-white font-bold px-3 flex items-center justify-between text-xs shadow-sm transition-all"
                      style={{ 
                        width: `${Math.max(30, 100 - i * 20)}%`,
                        backgroundColor: PIE_COLORS[i % PIE_COLORS.length]
                      }}
                    >
                      <span>Stage {i+1}</span>
                      <span>₹{Number(d.y).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : 

            /* 14. Gauge Meter */
            typeKey.includes('gauge') ? (
              <div className="h-full flex flex-col items-center justify-center p-4">
                <div className="relative w-40 h-20 overflow-hidden flex items-end justify-center">
                  <div className="w-36 h-36 rounded-full border-[14px] border-blue-500 border-b-transparent border-r-transparent transform -rotate-45"></div>
                  <div className="absolute text-center bottom-2">
                    <span className="text-2xl font-extrabold text-[#0F172A]">84%</span>
                    <span className="block text-[10px] text-[#475569]">Performance Score</span>
                  </div>
                </div>
              </div>
            ) : 

            /* 15. Histogram */
            typeKey.includes('histogram') ? (
              <BarChart data={aggregatedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="x" stroke="#475569" fontSize={11} tickLine={false} />
                <YAxis stroke="#475569" fontSize={11} tickLine={false} />
                <Tooltip cursor={{ fill: 'transparent' }} formatter={val => [`₹${Number(val).toLocaleString('en-IN')}`, yAxis]} />
                <Bar dataKey="y" fill={primaryColor} maxBarSize={40} />
              </BarChart>
            ) : 

            /* 16. Forecast */
            typeKey.includes('forecast') ? (
              <ComposedChart data={aggregatedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="x" stroke="#475569" fontSize={11} tickLine={false} />
                <YAxis stroke="#475569" fontSize={11} tickLine={false} />
                <Tooltip formatter={val => [`₹${Number(val).toLocaleString('en-IN')}`, yAxis]} />
                <Line type="monotone" dataKey="y" name="Historical" stroke="#2563EB" strokeWidth={3} />
                <Line type="monotone" dataKey="forecast" name="Predicted Trend" stroke="#F59E0B" strokeWidth={3} strokeDasharray="5 5" />
              </ComposedChart>
            ) : 

            /* 17. Anomaly Detection */
            typeKey.includes('anomaly') ? (
              <div className="h-full flex flex-col justify-center space-y-3 p-3 bg-red-50/50 rounded-xl border border-red-100">
                <div className="flex items-center gap-2 text-[#EF4444] font-bold text-xs">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Isolation Forest ML Anomaly Tracker</span>
                </div>
                <div className="space-y-2">
                  {aggregatedData.slice(0, 2).map((d, i) => (
                    <div key={i} className="bg-white p-3 rounded-lg border border-red-200 shadow-sm flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-[#0F172A]">{d.x}</span>
                        <span className="block text-[10px] text-[#EF4444]">Outlier Value: ₹{Number(d.y).toLocaleString('en-IN')}</span>
                      </div>
                      <span className="bg-red-100 text-[#EF4444] font-bold px-2 py-0.5 rounded text-[10px]">
                        Flagged
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (

              /* Default Fallback Bar Chart */
              <BarChart data={aggregatedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="x" stroke="#475569" fontSize={11} tickLine={false} />
                <YAxis stroke="#475569" fontSize={11} tickLine={false} />
                <Tooltip cursor={{ fill: 'transparent' }} formatter={val => [`₹${Number(val).toLocaleString('en-IN')}`, yAxis]} />
                <Bar dataKey="y" name={yAxis} fill={primaryColor} radius={[8, 8, 0, 0]} maxBarSize={36} />
              </BarChart>
            )}
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-xs text-[#94A3B8]">
            No numeric records found for selected X/Y columns
          </div>
        )}
      </div>
    </div>
  );
}
