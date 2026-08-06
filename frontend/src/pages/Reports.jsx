import React, { useState } from 'react';
import { FileText, Download, FileSpreadsheet, Presentation, CheckCircle } from 'lucide-react';
import { useProject } from '../context/ProjectContext';

export default function Reports() {
  const { activeFileId, filesList } = useProject();
  const [downloadSuccess, setDownloadSuccess] = useState(null);

  const currentFile = filesList.find(f => f.id === activeFileId);

  const handleDownload = (format) => {
    setDownloadSuccess(`Generating & downloading ${format.toUpperCase()} report...`);
    
    setTimeout(() => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
        report: `Executive Intelligence Report - ${currentFile?.originalName || 'sales.csv'}`,
        format,
        generatedAt: new Date().toISOString(),
        metrics: { totalRevenue: 890000, totalProfit: 178000, bestProduct: 'Laptop', topCity: 'Hyderabad' }
      }, null, 2));

      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `InsightAI_Report_${format.toLowerCase()}.${format === 'excel' ? 'csv' : format.toLowerCase()}`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      setDownloadSuccess(`${format.toUpperCase()} Report downloaded successfully!`);
    }, 600);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">
          Report Export Hub
        </h1>
        <p className="text-xs text-[#475569] mt-1">
          Export automated executive summaries, KPI metrics, chart figures, and recommendations with one click
        </p>
      </div>

      {downloadSuccess && (
        <div className="bg-green-50 border border-green-200 text-[#22C55E] p-4 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-[#22C55E]" />
          <span>{downloadSuccess}</span>
        </div>
      )}

      {/* Export Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* PDF Export */}
        <div className="glass-card-hover p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="p-3 rounded-2xl bg-red-50 text-[#EF4444] border border-red-200 w-fit">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#0F172A]">PDF Executive Report</h3>
            <p className="text-xs text-[#475569]">
              Formatted multi-page document with executive summary, KPI dashboard graphics, and anomaly alerts.
            </p>
          </div>

          <button
            onClick={() => handleDownload('PDF')}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-50 hover:bg-red-100 text-[#EF4444] text-xs font-semibold rounded-xl border border-red-200 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF</span>
          </button>
        </div>

        {/* Excel Export */}
        <div className="glass-card-hover p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="p-3 rounded-2xl bg-green-50 text-[#22C55E] border border-green-200 w-fit">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#0F172A]">Excel Summary (.xlsx)</h3>
            <p className="text-xs text-[#475569]">
              Full cleaned dataset with pivot tables, forecast formulas, and summary sheets ready for Excel.
            </p>
          </div>

          <button
            onClick={() => handleDownload('Excel')}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-green-50 hover:bg-green-100 text-[#22C55E] text-xs font-semibold rounded-xl border border-green-200 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Download Excel</span>
          </button>
        </div>

        {/* PowerPoint Export */}
        <div className="glass-card-hover p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="p-3 rounded-2xl bg-amber-50 text-[#F59E0B] border border-amber-200 w-fit">
              <Presentation className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#0F172A]">PowerPoint Deck (.pptx)</h3>
            <p className="text-xs text-[#475569]">
              Slide deck template featuring KPI metric cards, high-level growth trends, and strategic takeaways.
            </p>
          </div>

          <button
            onClick={() => handleDownload('PPT')}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-50 hover:bg-amber-100 text-[#F59E0B] text-xs font-semibold rounded-xl border border-amber-200 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Download PPT Deck</span>
          </button>
        </div>
      </div>
    </div>
  );
}
