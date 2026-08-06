import React from 'react';
import { ResponsiveContainer, ComposedChart, Line, Area, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';

export default function ForecastChart({ historical = [], forecast = [] }) {
  const combined = [
    ...historical.map(h => ({ date: h.date, actual: h.actual, forecast: null, upper: null, lower: null })),
    ...forecast.map(f => ({ date: f.date, actual: null, forecast: f.forecast, upper: f.upper, lower: f.lower }))
  ];

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={combined} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
          <XAxis dataKey="date" stroke="#475569" fontSize={11} tickLine={false} />
          <YAxis stroke="#475569" fontSize={11} tickLine={false} tickFormatter={(val) => `₹${val > 999 ? (val/1000).toFixed(0)+'k' : val}`} />
          <Tooltip 
            cursor={{ stroke: '#2563EB', strokeDasharray: '3 3' }}
            contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '12px', fontSize: '12px', color: '#0F172A', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
            formatter={(val, name) => [val ? `₹${Number(val).toLocaleString('en-IN')}` : '-', name]}
          />
          <Legend verticalAlign="top" height={36} formatter={(val) => <span className="text-xs text-[#475569] font-medium">{val}</span>} />
          
          {/* Confidence interval area */}
          <Area type="monotone" dataKey="upper" name="Upper Bound" stroke="none" fill="#38BDF8" fillOpacity={0.15} />
          <Area type="monotone" dataKey="lower" name="Lower Bound" stroke="none" fill="#F8FAFC" fillOpacity={0.8} />

          {/* Historical actual series */}
          <Line type="monotone" dataKey="actual" name="Historical Sales" stroke="#2563EB" strokeWidth={3} dot={{ r: 3, fill: '#2563EB' }} />

          {/* Predicted forecast series */}
          <Line type="monotone" dataKey="forecast" name="Predicted Trend" stroke="#F59E0B" strokeWidth={3} strokeDasharray="5 5" dot={{ r: 4, fill: '#F59E0B' }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
