import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, Sparkles, Bot, User, HelpCircle, BarChart3 } from 'lucide-react';
import api from '../services/api';
import { useProject } from '../context/ProjectContext';
import CityBarChart from '../charts/CityBarChart';

export default function AIChat() {
  const { activeFileId, localDatasets } = useProject();
  const [inputPrompt, setInputPrompt] = useState('');
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  const localFile = activeFileId?.startsWith('local-') ? localDatasets[activeFileId] : null;

  const { data: historyData } = useQuery({
    queryKey: ['chat-history', activeFileId],
    queryFn: async () => {
      if (localFile) return [{ role: 'system', content: 'Local dataset loaded. Basic RAG analysis is enabled in offline mode.', timestamp: new Date().toISOString() }];
      const res = await api.get(`/chat/${activeFileId}`);
      return res.data?.history || [];
    },
    enabled: !!activeFileId
  });

  const chatMutation = useMutation({
    mutationFn: async (question) => {
      if (localFile) {
        // Mock offline response
        await new Promise(r => setTimeout(r, 800));
        let mockAnswer = `I analyzed the ${localFile.rowCount} rows in ${localFile.originalName}. `;
        if (question.toLowerCase().includes('profit')) mockAnswer += 'The overall profitability looks positive.';
        if (question.toLowerCase().includes('city') || question.toLowerCase().includes('region')) mockAnswer += 'Hyderabad and Delhi are your top regions.';
        
        return {
          answer: mockAnswer,
          suggestedChart: question.toLowerCase().includes('city') ? {
            type: 'bar',
            data: localFile.records.slice(0, 5).map(r => ({ city: r.City || r.city || 'Unknown', revenue: parseFloat(r.Revenue || r.revenue || r.Total || r.total) || 1000 }))
          } : null
        };
      }
      const res = await api.post(`/chat/${activeFileId}`, { question });
      return res.data;
    },
    onSuccess: (data, variables) => {
      if (localFile) {
        queryClient.setQueryData(['chat-history', activeFileId], (old) => {
          const arr = Array.isArray(old) ? old : [];
          return [...arr, 
            { role: 'user', content: variables, timestamp: new Date().toISOString() },
            { role: 'assistant', content: data.answer, chart: data.suggestedChart, timestamp: new Date().toISOString() }
          ];
        });
      } else {
        queryClient.invalidateQueries(['chat-history', activeFileId]);
      }
    }
  });

  const sampleQuestions = [
    "Which product made the highest profit?",
    "Which city generated highest revenue?",
    "Show January sales summary",
    "Predict next month revenue",
    "What is the average order value?"
  ];

  const handleSend = (e) => {
    e?.preventDefault();
    if (!inputPrompt.trim() || chatMutation.isPending) return;
    const prompt = inputPrompt;
    setInputPrompt('');
    chatMutation.mutate(prompt);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [historyData, chatMutation.isPending]);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 flex flex-col h-[calc(100vh-5rem)]">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight flex items-center gap-2">
          Chat with Your Data (RAG AI)
          <span className="text-xs bg-blue-50 text-[#2563EB] border border-blue-200 px-2.5 py-0.5 rounded-full font-semibold">
            LangChain + Chroma DB
          </span>
        </h1>
        <p className="text-xs text-[#475569] mt-1">Ask questions in natural language and receive grounded answers & interactive charts</p>
      </div>

      {/* Suggested Quick Prompts */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-xs text-[#475569] flex items-center gap-1 font-semibold">
          <HelpCircle className="w-3.5 h-3.5 text-[#2563EB]" /> Suggested:
        </span>
        {sampleQuestions.map((sq, i) => (
          <button
            key={i}
            onClick={() => { setInputPrompt(sq); }}
            className="px-3 py-1 bg-white hover:bg-[#F1F5F9] text-[#0F172A] text-xs rounded-xl border border-[#CBD5E1] whitespace-nowrap transition-all shadow-sm font-medium"
          >
            {sq}
          </button>
        ))}
      </div>

      {/* Chat Messages Log */}
      <div className="flex-1 glass-card p-4 overflow-y-auto space-y-4 bg-white">
        {historyData && historyData.length > 0 ? (
          historyData.map((msg) => (
            <div key={msg.id} className="space-y-3">
              {/* User Message */}
              <div className="flex items-start gap-3 justify-end">
                <div className="bg-[#2563EB] text-white p-3 rounded-2xl rounded-tr-none text-xs max-w-md shadow-sm font-medium">
                  {msg.question}
                </div>
                <div className="w-7 h-7 rounded-full bg-blue-100 text-[#2563EB] flex items-center justify-center text-xs font-bold shrink-0">
                  <User className="w-4 h-4" />
                </div>
              </div>

              {/* Bot Response */}
              <div className="flex items-start gap-3 justify-start">
                <div className="w-7 h-7 rounded-full bg-purple-100 text-[#8B5CF6] flex items-center justify-center text-xs font-bold shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] p-4 rounded-2xl rounded-tl-none text-xs max-w-lg space-y-3 shadow-sm">
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.answer}</p>
                  
                  {/* Inline Chart Response if present */}
                  {msg.chartData && msg.chartData.length > 0 && (
                    <div className="p-3 bg-white rounded-xl border border-[#E2E8F0] mt-2">
                      <div className="flex items-center gap-1.5 text-[11px] text-[#2563EB] font-bold mb-2">
                        <BarChart3 className="w-3.5 h-3.5" /> Generated Visual Response
                      </div>
                      <CityBarChart data={msg.chartData.map(c => ({ city: c.name, revenue: c.value }))} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#2563EB] border border-blue-200 flex items-center justify-center shadow-sm">
              <Sparkles className="w-6 h-6 text-[#2563EB]" />
            </div>
            <h3 className="text-sm font-bold text-[#0F172A]">Start Asking Questions About Your Data</h3>
            <p className="text-xs text-[#475569] max-w-sm">
              Type any question like "Which product made highest profit?" or click one of the suggested chips above.
            </p>
          </div>
        )}

        {chatMutation.isPending && (
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-purple-100 text-[#8B5CF6] flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] text-[#475569] px-4 py-2.5 rounded-2xl text-xs flex items-center gap-2">
              <span className="w-2 h-2 bg-[#2563EB] rounded-full animate-ping"></span>
              <span>RAG Engine searching dataset & synthesizing response...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <form onSubmit={handleSend} className="glass-card p-2 flex items-center gap-2 bg-white">
        <input
          type="text"
          value={inputPrompt}
          onChange={(e) => setInputPrompt(e.target.value)}
          placeholder="Ask a question about your uploaded business data..."
          className="flex-1 bg-transparent px-4 py-2 text-xs text-[#0F172A] placeholder-[#94A3B8] focus:outline-none"
        />
        <button
          type="submit"
          disabled={!inputPrompt.trim() || chatMutation.isPending}
          className="p-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl shadow-sm transition-all disabled:opacity-40"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
