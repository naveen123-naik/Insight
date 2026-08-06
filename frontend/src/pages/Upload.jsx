import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, CheckCircle2, AlertCircle, Sparkles, ArrowRight } from 'lucide-react';
import api from '../services/api';
import { useProject } from '../context/ProjectContext';

export default function Upload() {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState(null);
  
  const { fetchFiles, setActiveFileId } = useProject();
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setError(null);
    }
  };

  const handleUploadSubmit = async () => {
    if (!file) {
      setError('Please select a file first (.csv, .xlsx, or .json)');
      return;
    }

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setUploadResult(res.data.file);
      await fetchFiles();
      if (res.data.file?.id) {
        setActiveFileId(res.data.file.id);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'File upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">
          Upload & Auto-Clean Dataset
        </h1>
        <p className="text-xs text-[#475569] mt-1">
          Upload your business spreadsheet (Excel, CSV, or JSON). InsightAI automatically cleans data, fixes missing values, detects column types, and generates dashboards.
        </p>
      </div>

      {/* Drag & Drop Zone */}
      <div 
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className="glass-card p-10 border-2 border-dashed border-[#CBD5E1] hover:border-[#2563EB] rounded-2xl text-center cursor-pointer transition-all bg-white group"
      >
        <input 
          type="file" 
          accept=".csv, .xlsx, .xls, .json" 
          onChange={handleFileChange}
          className="hidden" 
          id="file-upload-input"
        />
        <label htmlFor="file-upload-input" className="cursor-pointer flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#2563EB] border border-blue-200 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform shadow-sm">
            <UploadCloud className="w-7 h-7" />
          </div>

          <h3 className="text-sm font-bold text-[#0F172A]">
            {file ? file.name : 'Drag & drop your file here or click to browse'}
          </h3>
          <p className="text-xs text-[#475569] mt-1">Supported formats: Excel (.xlsx, .xls), CSV (.csv), JSON (.json)</p>
          <span className="text-[11px] text-[#94A3B8] mt-2">Maximum file size: 50MB</span>
        </label>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-[#EF4444] p-4 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {file && !uploadResult && (
        <div className="flex justify-end">
          <button
            onClick={handleUploadSubmit}
            disabled={isUploading}
            className="flex items-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-xs px-6 py-3 rounded-xl shadow-sm transition-all disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isUploading ? 'Auto-Cleaning & Analyzing...' : 'Process & Clean Dataset'}</span>
          </button>
        </div>
      )}

      {uploadResult && (
        <div className="glass-card p-6 border-l-4 border-l-[#22C55E] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-green-50 text-[#22C55E] border border-green-200">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#0F172A]">Dataset Processed & Cleaned Successfully!</h3>
                <p className="text-xs text-[#475569]">{uploadResult.originalName} • {uploadResult.rowCount} Rows • {uploadResult.columnCount} Columns</p>
              </div>
            </div>

            <button
              onClick={() => navigate('/details')}
              className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-[#2563EB] border border-blue-200 text-xs font-semibold px-4 py-2 rounded-xl transition-all"
            >
              <span>Inspect Data Grid</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0] space-y-2">
            <h4 className="text-xs font-bold text-[#0F172A] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" /> Auto-Cleaner Report & Fixes Applied:
            </h4>
            <ul className="space-y-1">
              {uploadResult.cleanIssues?.map((issue, idx) => (
                <li key={idx} className="text-xs text-[#475569] flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]"></span>
                  <span>{issue}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
