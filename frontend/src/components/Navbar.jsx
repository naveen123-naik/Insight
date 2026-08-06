import React from 'react';
import { Link } from 'react-router-dom';
import { Search, Upload, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProject } from '../context/ProjectContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { filesList, activeFileId } = useProject();
  
  const currentFile = filesList.find(f => f.id === activeFileId);

  return (
    <header className="h-16 border-b border-[#E2E8F0] bg-white px-6 flex items-center justify-between sticky top-0 z-20 shadow-sm">
      {/* Search / Context Status */}
      <div className="flex items-center gap-4 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Ask AI or search datasets, metrics, charts..."
            className="w-full bg-white border border-[#CBD5E1] rounded-xl pl-9 pr-4 py-1.5 text-xs text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] shadow-sm transition-all"
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {currentFile && (
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-xs">
            <span className="text-[#475569]">Dataset:</span>
            <span className="text-[#2563EB] font-semibold">{currentFile.originalName}</span>
            <span className="text-[#94A3B8]">({currentFile.rowCount} rows)</span>
          </div>
        )}

        <Link
          to="/upload"
          className="flex items-center gap-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-sm transition-all"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Upload Dataset</span>
        </Link>

        {/* User Info & Logout */}
        <div className="flex items-center gap-3 pl-3 border-l border-[#E2E8F0]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#2563EB] text-white flex items-center justify-center font-bold text-xs shadow-sm">
              {user?.name?.[0] || 'A'}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-[#0F172A]">{user?.name || 'Analyst'}</p>
              <p className="text-[10px] text-[#475569]">{user?.email || 'demo@insight.ai'}</p>
            </div>
          </div>

          <button
            onClick={logout}
            title="Sign Out"
            className="p-1.5 text-[#475569] hover:text-[#EF4444] rounded-lg hover:bg-[#F1F5F9] transition-all"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
