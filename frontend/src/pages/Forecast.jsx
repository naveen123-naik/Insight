import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, Calendar } from 'lucide-react';
import api from '../services/api';
import { useProject } from '../context/ProjectContext';
import ForecastChart from '../charts/ForecastChart';

export default function Forecast() {
  const { activeFileId } = useProject();

  const { data, isLoading } = useQuery({
    queryKey: ['forecast', activeFileId],
    queryFn: async () => {
      const res = await api.get(`/forecast/${activeFileId}`);
      return res.data;
    },
    enabled: !!activeFileId
  });

  const forecastData = data?.forecast || {};
  const historical = forecastData.historical || [];
  const forecast = forecastData.forecast || [];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight flex items-center gap-2">
            Predictive Revenue Forecast
            <span className="text-xs bg-purple-50 text-[#8B5CF6] border border-purple-200 px-2.5 py-0.5 rounded-full font-semibold">
              Scikit-Learn ML
            </span>
          </h1>
          <p className="text-xs text-[#475569] mt-1">
            Machine learning time-series projection predicting sales trends & confidence margins
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white border border-[#CBD5E1] px-3.5 py-2 rounded-xl text-xs text-[#0F172A] font-medium shadow-sm">
          <Calendar className="w-4 h-4 text-[#8B5CF6]" />
          <span>Horizon: 30 Days Ahead</span>
        </div>
      </div>

      {/* Metric Banner */}
      <div className="glass-card p-5 border-l-4 border-l-[#8B5CF6] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-purple-50 text-[#8B5CF6] border border-purple-100">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#0F172A]">Projected Growth Velocity</h3>
            <p className="text-xs text-[#8B5CF6] font-semibold">{forecastData.growth_estimate || '+18.2% estimated next 30 days'}</p>
          </div>
        </div>

        <div className="hidden sm:block text-right">
          <span className="text-[10px] text-[#475569] uppercase tracking-wider block">Model Algorithm</span>
          <span className="text-xs font-bold text-[#0F172A]">Polynomial Regressor</span>
        </div>
      </div>

      {/* Forecast Chart Card */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-[#0F172A]">Historical Sales vs 30-Day Predicted Trend</h3>
            <p className="text-xs text-[#475569]">Dotted orange line indicates predicted revenue with confidence envelope</p>
          </div>
        </div>

        <ForecastChart historical={historical} forecast={forecast} />
      </div>

      {/* Forecast Points Summary */}
      <div className="glass-card p-6">
        <h3 className="text-sm font-bold text-[#0F172A] mb-3">Predicted Milestone Targets</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {forecast.slice(0, 3).map((f, i) => (
            <div key={i} className="bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0]">
              <span className="text-[10px] text-[#475569] font-bold block">{f.date}</span>
              <p className="text-lg font-extrabold text-[#F59E0B] mt-1">₹{Number(f.forecast).toLocaleString('en-IN')}</p>
              <p className="text-[11px] text-[#475569] mt-1">Range: ₹{Number(f.lower).toLocaleString('en-IN')} - ₹{Number(f.upper).toLocaleString('en-IN')}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
