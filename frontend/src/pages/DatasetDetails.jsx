import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  useReactTable, 
  getCoreRowModel, 
  getFilteredRowModel, 
  getPaginationRowModel,
  flexRender 
} from '@tanstack/react-table';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../services/api';
import { useProject } from '../context/ProjectContext';

export default function DatasetDetails() {
  const { activeFileId, localDatasets } = useProject();
  const [globalFilter, setGlobalFilter] = useState('');

  const localFile = activeFileId?.startsWith('local-') ? localDatasets[activeFileId] : null;

  const { data, isLoading } = useQuery({
    queryKey: ['file-details', activeFileId],
    queryFn: async () => {
      const res = await api.get(`/files/${activeFileId}`);
      return res.data?.file;
    },
    enabled: !!activeFileId && !localFile
  });

  const records = localFile?.records || data?.records || [];
  const fileName = localFile?.originalName || data?.originalName || 'sales.csv';

  const columns = useMemo(() => {
    if (!records.length) return [];
    return Object.keys(records[0]).map(key => ({
      accessorKey: key,
      header: key
    }));
  }, [records]);

  const table = useReactTable({
    data: records,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } }
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">
            Dataset Grid & Schema
          </h1>
          <p className="text-xs text-[#475569] mt-1">
            {fileName} • {records.length} Total Records • TanStack Table
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={globalFilter ?? ''}
            onChange={e => setGlobalFilter(e.target.value)}
            placeholder="Search rows or values..."
            className="w-full bg-white border border-[#CBD5E1] rounded-xl pl-9 pr-4 py-2 text-xs text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB] shadow-sm"
          />
        </div>
      </div>

      {/* TanStack Data Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id} className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                  {headerGroup.headers.map(header => (
                    <th key={header.id} className="p-3.5 text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>

            <tbody className="divide-y divide-[#E2E8F0]">
              {table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map(row => (
                  <tr key={row.id} className="hover:bg-[#F1F5F9]/50 transition-colors">
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className="p-3.5 text-xs text-[#475569]">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length || 1} className="p-8 text-center text-xs text-[#94A3B8]">
                    No matching records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-[#E2E8F0] flex items-center justify-between text-xs text-[#475569]">
          <div className="flex items-center gap-2">
            <span>Show</span>
            <select
              value={table.getState().pagination.pageSize}
              onChange={e => table.setPageSize(Number(e.target.value))}
              className="bg-white border border-[#CBD5E1] text-[#0F172A] rounded px-2 py-1"
            >
              {[10, 20, 50].map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
            <span>entries per page</span>
          </div>

          <div className="flex items-center gap-2">
            <span>
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
            </span>
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="p-1.5 rounded-lg bg-white hover:bg-[#F1F5F9] border border-[#CBD5E1] text-[#0F172A] disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="p-1.5 rounded-lg bg-white hover:bg-[#F1F5F9] border border-[#CBD5E1] text-[#0F172A] disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
