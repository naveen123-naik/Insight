import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, ShieldAlert, CheckCircle, Info, X, Search, Check, MessageSquareCode } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useProject } from '../context/ProjectContext';

export default function Anomalies() {
  const { activeFileId } = useProject();
  const navigate = useNavigate();
  
  const [dismissedRows, setDismissedRows] = useState([]);
  const [investigatingItem, setInvestigatingItem] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['anomalies', activeFileId],
    queryFn: async () => {
      const res = await api.get(`/anomalies/${activeFileId}`);
      return res.data;
    },
    enabled: !!activeFileId
  });

  const anomalyData = data?.anomalies || {};
  const rawList = anomalyData.anomalies || [];
  
  // Filter out dismissed anomalies
  const anomaliesList = rawList.filter(item => !dismissedRows.includes(item.row_index));

  const handleDismiss = (rowIndex, product) => {
    setDismissedRows(prev => [...prev, rowIndex]);
    setToastMessage(`Dismissed anomaly alert for Row #${rowIndex} (${product})`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleInvestigate = (item) => {
    setInvestigatingItem(item);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 bg-[#0F172A] text-white text-xs px-4 py-3 rounded-xl shadow-lg border border-slate-700 flex items-center gap-2 z-50 animate-bounce">
          <Check className="w-4 h-4 text-[#22C55E]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight flex items-center gap-2">
            Anomaly & Outlier Alerts
            <span className="text-xs bg-red-50 text-[#EF4444] border border-red-200 px-2.5 py-0.5 rounded-full font-semibold">
              Isolation Forest ML
            </span>
          </h1>
          <p className="text-xs text-[#475569] mt-1">
            Automated detection of fraudulent spikes, unexpected inventory drops, or pricing anomalies
          </p>
        </div>

        <div className="flex items-center gap-2 bg-red-50 border border-red-200 px-3.5 py-2 rounded-xl text-xs text-[#EF4444] font-semibold">
          <ShieldAlert className="w-4 h-4" />
          <span>{anomaliesList.length} Active Anomalies</span>
        </div>
      </div>

      {/* Anomalies List */}
      <div className="space-y-4">
        {anomaliesList.length > 0 ? (
          anomaliesList.map((item, idx) => (
            <div 
              key={item.row_index || idx} 
              className="glass-card p-5 border-l-4 border-l-[#EF4444] flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-red-300"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-red-50 text-[#EF4444] border border-red-100 mt-0.5">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-[#EF4444] uppercase tracking-wider">
                      Row #{item.row_index} • Severity {item.severity}
                    </span>
                    <span className="text-[10px] bg-[#F1F5F9] text-[#475569] px-2 py-0.5 rounded font-mono border border-[#E2E8F0]">
                      Score: {item.anomaly_score}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-[#0F172A] mt-1">
                    {item.product} ({item.city}) - Quantity: {item.quantity} | Price: ₹{Number(item.price).toLocaleString('en-IN')}
                  </h3>

                  <p className="text-xs text-[#475569] mt-1 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-[#F59E0B] shrink-0" />
                    <span>Reason: {item.reason}</span>
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-end md:self-center">
                <button 
                  onClick={() => handleDismiss(item.row_index, item.product)}
                  className="px-3.5 py-1.5 rounded-xl bg-[#F1F5F9] hover:bg-[#E2E8F0] text-xs font-semibold text-[#0F172A] border border-[#CBD5E1] transition-all shadow-sm active:scale-95"
                >
                  Dismiss
                </button>
                <button 
                  onClick={() => handleInvestigate(item)}
                  className="px-3.5 py-1.5 rounded-xl bg-[#EF4444] hover:bg-red-600 text-xs font-semibold text-white shadow-sm transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Investigate</span>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="glass-card p-10 text-center space-y-3 bg-white">
            <CheckCircle className="w-10 h-10 text-[#22C55E] mx-auto" />
            <h3 className="text-sm font-bold text-[#0F172A]">All Anomalies Handled</h3>
            <p className="text-xs text-[#475569]">There are no active unflagged outliers in the dataset.</p>
            {dismissedRows.length > 0 && (
              <button 
                onClick={() => setDismissedRows([])}
                className="mt-2 text-xs text-[#2563EB] font-semibold underline"
              >
                Reset {dismissedRows.length} dismissed alert(s)
              </button>
            )}
          </div>
        )}
      </div>

      {/* Investigation Details Modal */}
      {investigatingItem && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-card bg-white max-w-lg w-full p-6 space-y-5 border border-[#E2E8F0] shadow-xl relative animate-in fade-in zoom-in duration-150">
            <button 
              onClick={() => setInvestigatingItem(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#F1F5F9]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-red-50 text-[#EF4444] border border-red-200">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#0F172A]">
                  Anomaly Deep-Dive: Row #{investigatingItem.row_index}
                </h3>
                <p className="text-xs text-[#475569]">Detailed statistical analysis & diagnostic metrics</p>
              </div>
            </div>

            <div className="bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0] space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 text-[#0F172A]">
                <div><span className="text-[#475569] block">Product:</span> <strong>{investigatingItem.product}</strong></div>
                <div><span className="text-[#475569] block">City/Region:</span> <strong>{investigatingItem.city}</strong></div>
                <div><span className="text-[#475569] block">Quantity:</span> <strong>{investigatingItem.quantity} units</strong></div>
                <div><span className="text-[#475569] block">Price:</span> <strong>₹{Number(investigatingItem.price).toLocaleString('en-IN')}</strong></div>
                <div><span className="text-[#475569] block">Isolation Forest Score:</span> <strong className="font-mono text-[#EF4444]">{investigatingItem.anomaly_score}</strong></div>
                <div><span className="text-[#475569] block">Severity Rating:</span> <strong className="text-[#EF4444]">{investigatingItem.severity}</strong></div>
              </div>

              <div className="pt-2 border-t border-[#E2E8F0]">
                <span className="text-[#475569] font-semibold block mb-1">Root Cause Explanation:</span>
                <p className="text-[#0F172A] font-medium bg-white p-2.5 rounded-lg border border-[#CBD5E1]">
                  {investigatingItem.reason}
                </p>
              </div>
            </div>

            {/* Action Recommendations inside modal */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-[#0F172A]">Recommended Operational Actions:</h4>
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => {
                    handleDismiss(investigatingItem.row_index, investigatingItem.product);
                    setInvestigatingItem(null);
                  }}
                  className="w-full py-2 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0F172A] text-xs font-semibold rounded-xl border border-[#CBD5E1] transition-all"
                >
                  Mark as Expected & Dismiss
                </button>
                <button 
                  onClick={() => {
                    setInvestigatingItem(null);
                    navigate('/chat');
                  }}
                  className="w-full py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
                >
                  <MessageSquareCode className="w-4 h-4" />
                  <span>Ask AI Assistant About This Transaction</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
