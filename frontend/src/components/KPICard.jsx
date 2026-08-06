import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function KPICard({ title, value, change, isPositive = true, icon: Icon, color = 'blue' }) {
  const colorStyles = {
    blue: 'bg-blue-50 text-[#2563EB] border-blue-200',
    green: 'bg-green-50 text-[#22C55E] border-green-200',
    purple: 'bg-purple-50 text-[#8B5CF6] border-purple-200',
    orange: 'bg-amber-50 text-[#F59E0B] border-amber-200',
    cyan: 'bg-cyan-50 text-[#06B6D4] border-cyan-200',
    pink: 'bg-pink-50 text-[#EC4899] border-pink-200'
  };

  const selectedColor = colorStyles[color] || colorStyles.blue;

  return (
    <div className="glass-card-hover p-5 relative overflow-hidden group">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-[#475569] tracking-wider uppercase">{title}</span>
        <div className={`p-2.5 rounded-xl border ${selectedColor}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="flex items-baseline justify-between mt-2">
        <h3 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">{value}</h3>
        {change && (
          <div className={`flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-md ${
            isPositive ? 'bg-green-50 text-[#22C55E] border border-green-200' : 'bg-red-50 text-[#EF4444] border border-red-200'
          }`}>
            {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            <span>{change}</span>
          </div>
        )}
      </div>
    </div>
  );
}
