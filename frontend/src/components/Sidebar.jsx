import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  UploadCloud, 
  Table, 
  BarChart3, 
  BrainCircuit,
  TrendingUp, 
  AlertTriangle, 
  MessageSquareCode, 
  FileSpreadsheet, 
  Database,
  Sparkles
} from 'lucide-react';
import { useProject } from '../context/ProjectContext';

export default function Sidebar() {
  const { activeFileId, setActiveFileId, filesList } = useProject();

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Upload Dataset', path: '/upload', icon: UploadCloud },
    { label: 'Data Details', path: '/details', icon: Table },
    { label: 'Analytics Hub', path: '/analytics', icon: BarChart3 },
    { label: 'Decision AI', path: '/decision', icon: BrainCircuit, badge: 'AI' },
    { label: 'Forecast (AI)', path: '/forecast', icon: TrendingUp },
    { label: 'Anomalies', path: '/anomalies', icon: AlertTriangle, badge: 'Red' },
    { label: 'Chat with Data', path: '/chat', icon: MessageSquareCode, badge: 'RAG' },
    { label: 'Reports & Export', path: '/reports', icon: FileSpreadsheet },
  ];

  return (
    <aside className="w-64 bg-[#F1F5F9] border-r border-[#E2E8F0] flex flex-col h-screen sticky top-0 z-30 font-sans">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#E2E8F0] flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#2563EB] flex items-center justify-center shadow-sm">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-extrabold text-xl tracking-tight text-[#0F172A]">InsightAI</h1>
          <p className="text-[11px] text-[#475569] font-medium">Analytics & AI Platform</p>
        </div>
      </div>

      {/* Dataset File Switcher Dropdown */}
      <div className="p-4 border-b border-[#E2E8F0]">
        <label className="text-[11px] font-bold text-[#475569] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
          <Database className="w-3.5 h-3.5 text-[#2563EB]" /> Active Dataset
        </label>
        <select
          value={activeFileId}
          onChange={(e) => setActiveFileId(e.target.value)}
          className="w-full bg-white border border-[#CBD5E1] text-xs text-[#0F172A] font-medium rounded-lg p-2.5 outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] shadow-sm transition-all"
        >
          {filesList.map(f => (
            <option key={f.id} value={f.id}>
              {f.originalName} ({f.rowCount} rows)
            </option>
          ))}
        </select>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] shadow-sm'
                    : 'text-[#475569] hover:text-[#0F172A] hover:bg-[#E2E8F0]/60'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 text-[#2563EB]" />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                  item.badge === 'Red' 
                    ? 'bg-red-100 text-[#EF4444] border border-red-200'
                    : 'bg-blue-100 text-[#2563EB] border border-blue-200'
                }`}>
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer User / Status Info */}
      <div className="p-4 border-t border-[#E2E8F0] bg-white text-xs text-[#475569]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#22C55E]"></span>
            <span className="text-[#0F172A] font-medium text-[11px]">AI Engine Active</span>
          </div>
          <span className="text-[10px] bg-[#F1F5F9] border border-[#E2E8F0] px-2 py-0.5 rounded text-[#475569] font-mono">v1.1</span>
        </div>
      </div>
    </aside>
  );
}
