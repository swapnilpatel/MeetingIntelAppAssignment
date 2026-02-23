/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { 
  BarChart3, 
  Plus, 
  FileText, 
  Settings, 
  HelpCircle, 
  ChevronRight, 
  Upload, 
  Presentation, 
  BrainCircuit, 
  ShieldCheck, 
  CheckCircle2, 
  Users, 
  FileSearch, 
  Info, 
  TrendingUp, 
  CreditCard, 
  ArrowRight, 
  Mic, 
  Copy, 
  Download, 
  Share2, 
  AlertTriangle, 
  Zap, 
  Lock,
  MessageSquare,
  ListOrdered
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { generateMeetingIntelligence } from './services/geminiService';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Step = 'INPUT' | 'ANALYZING' | 'REPORT';

interface ReportData {
  id: string;
  date: string;
  title: string;
  meetingType: string;
  confidence: number;
  sentiment: string;
  focusArea: string;
  summary: {
    overview: string;
    objective: string;
    strategicImportance: string;
    criticalDecision: string;
  };
  strategicIntelligence: {
    stakeholders: Array<{ role: string; sentiment: string }>;
    powerDynamics: string;
    incentiveAnalysis: string;
  };
  riskIdentification: {
    risks: Array<{ type: string; title: string; description: string }>;
    hiddenObjection: string;
  };
  talkingPoints: {
    points: Array<{ title: string; description: string }>;
    framingStrategy: string;
  };
  objections: Array<{ question: string; response: string }>;
  nextSteps: Array<{ action: string; ownership: string; timeline: string; status: string }>;
  executiveBrief: string;
  coverImagePrompt: string;
}

const MOCK_REPORT: ReportData = {
  id: 'mock-1',
  date: 'Oct 12, 2024',
  title: 'Strategy Sync - Q4 Growth',
  meetingType: 'Strategic Planning',
  confidence: 98,
  sentiment: 'Positive',
  focusArea: 'Expansion',
  summary: {
    overview: 'High-level alignment on Q4 expansion into EMEA markets.',
    objective: 'Finalize budget allocation for regional hubs.',
    strategicImportance: 'Critical for meeting annual revenue targets.',
    criticalDecision: 'Approved $2.4M for Berlin and Dubai offices.',
  },
  strategicIntelligence: {
    stakeholders: [
      { role: 'CEO', sentiment: 'Champion' },
      { role: 'CFO', sentiment: 'Supportive' },
      { role: 'Head of Sales', sentiment: 'Neutral' },
    ],
    powerDynamics: 'Strong alignment between executive leadership; sales team requires more incentive clarity.',
    incentiveAnalysis: 'Performance bonuses tied to regional launch speed.',
  },
  riskIdentification: {
    risks: [
      { type: 'Strategic', title: 'Market Saturation', description: 'Competitor X recently launched similar services in Berlin.' },
      { type: 'Political', title: 'Regulatory Hurdles', description: 'New data privacy laws in UAE might delay launch.' },
    ],
    hiddenObjection: 'The CFO is concerned about the long-term lease commitments in Dubai.',
  },
  talkingPoints: {
    points: [
      { title: 'Market Opportunity', description: 'EMEA represents a $50B untapped market for our segment.' },
      { title: 'Operational Readiness', description: 'Core team is already identified and ready to relocate.' },
    ],
    framingStrategy: 'Focus on "First-Mover Advantage" to counter cost concerns.',
  },
  objections: [
    { question: 'Why Dubai now?', response: 'Strategic gateway to MENA region with favorable tax structures.' },
  ],
  nextSteps: [
    { action: 'Sign lease agreements', ownership: 'Legal', timeline: 'Oct 20', status: 'PENDING' },
  ],
  executiveBrief: 'We are moving forward with the EMEA expansion. Budget is approved. Focus is on speed to market. Risks are manageable but require close monitoring of regional regulations.',
  coverImagePrompt: 'A futuristic office skyline connecting Berlin and Dubai with glowing digital lines, professional, cinematic lighting.',
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'GENERATE' | 'REPORTS'>('GENERATE');
  const [step, setStep] = useState<Step>('INPUT');
  const [notes, setNotes] = useState('');
  const [context, setContext] = useState('');
  const [files, setFiles] = useState<{ name: string; type: string; data: string }[]>([]);
  const [report, setReport] = useState<ReportData | null>(null);
  const [reportsHistory, setReportsHistory] = useState<ReportData[]>([MOCK_REPORT]);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [currentAnalysisStep, setCurrentAnalysisStep] = useState(0);

  const analysisSteps = [
    { title: 'Processing Materials...', description: 'Audio transcript and slide deck indexed.', icon: <FileText className="w-4 h-4" /> },
    { title: 'Extracting Themes...', description: 'Synthesizing core discussion pillars...', icon: <BrainCircuit className="w-4 h-4" /> },
    { title: 'Identifying Stakeholders...', description: 'Mapping influence and decision makers.', icon: <Users className="w-4 h-4" /> },
    { title: 'Finalizing Executive Summary', description: 'Generating strategic action items.', icon: <FileSearch className="w-4 h-4" /> },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setFiles(prev => [...prev, { name: file.name, type: file.type, data: base64 }]);
    };
    reader.readAsDataURL(file);
  };

  const startAnalysis = async () => {
    setStep('ANALYZING');
    setAnalysisProgress(0);
    setCurrentAnalysisStep(0);

    // Simulate progress while calling API
    const interval = setInterval(() => {
      setAnalysisProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        const next = prev + Math.random() * 15;
        if (next > 25 && currentAnalysisStep === 0) setCurrentAnalysisStep(1);
        if (next > 50 && currentAnalysisStep === 1) setCurrentAnalysisStep(2);
        if (next > 75 && currentAnalysisStep === 2) setCurrentAnalysisStep(3);
        return next;
      });
    }, 800);

    try {
      const result = await generateMeetingIntelligence(notes, '', context, files.map(f => ({ data: f.data, mimeType: f.type })));
      const finalReport: ReportData = {
        ...result,
        id: Math.random().toString(36).substr(2, 9),
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        title: files[0]?.name.split('.')[0] || 'Untitled Session',
      };
      setReport(finalReport);
      setReportsHistory(prev => [finalReport, ...prev]);
      setAnalysisProgress(100);
      setCurrentAnalysisStep(3);
      setTimeout(() => setStep('REPORT'), 1000);
    } catch (error) {
      console.error('Analysis failed:', error);
      setStep('INPUT');
      alert('Failed to generate report. Please try again.');
    } finally {
      clearInterval(interval);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f5f7f8] font-sans text-slate-900">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col shrink-0">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#001f3d] flex items-center justify-center text-white">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 leading-tight">Meeting Intel</h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Executive Workspace</p>
          </div>
        </div>

        <div className="px-4 mb-6">
          <button 
            onClick={() => { 
              setActiveTab('GENERATE');
              setStep('INPUT'); 
              setReport(null); 
              setFiles([]); 
              setNotes(''); 
              setContext(''); 
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#001f3d] text-white rounded-lg font-semibold text-sm transition-all hover:bg-[#001f3d]/90 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Session
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 space-y-1">
          <p className="px-2 pb-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Navigation</p>
          
          <button 
            onClick={() => { setActiveTab('GENERATE'); setStep('INPUT'); }}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-sm text-left transition-colors",
              activeTab === 'GENERATE' ? "bg-[#001f3d]/5 text-[#001f3d]" : "text-slate-600 hover:bg-slate-50"
            )}
          >
            <Zap className="w-4 h-4" />
            Generate Meeting Intel
          </button>

          <button 
            onClick={() => { setActiveTab('REPORTS'); setStep('INPUT'); }}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-sm text-left transition-colors",
              activeTab === 'REPORTS' ? "bg-[#001f3d]/5 text-[#001f3d]" : "text-slate-600 hover:bg-slate-50"
            )}
          >
            <ListOrdered className="w-4 h-4" />
            Reports
          </button>

          <div className="pt-6">
            <p className="px-2 pb-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Recent Intelligence</p>
            {reportsHistory.slice(0, 5).map((item) => (
              <button 
                key={item.id} 
                onClick={() => {
                  setReport(item);
                  setStep('REPORT');
                  setActiveTab('REPORTS');
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:bg-slate-50 font-medium text-sm text-left transition-colors"
              >
                <FileText className="w-4 h-4" />
                <span className="truncate">{item.title}</span>
              </button>
            ))}
          </div>
        </nav>

        <div className="p-4 border-t border-slate-200 space-y-2">
          <button className="w-full flex items-center gap-3 px-3 py-2 text-slate-600 text-sm font-medium hover:bg-slate-50 rounded-lg">
            <Settings className="w-4 h-4" />
            Settings
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 text-slate-600 text-sm font-medium hover:bg-slate-50 rounded-lg">
            <HelpCircle className="w-4 h-4" />
            Support
          </button>
          <div className="pt-4 px-3 flex items-center gap-3">
            <img 
              src="https://picsum.photos/seed/alex/100/100" 
              alt="User" 
              className="w-8 h-8 rounded-full border border-slate-200"
              referrerPolicy="no-referrer"
            />
            <div className="flex flex-col min-w-0">
              <p className="text-xs font-bold truncate">Alex Sterling</p>
              <p className="text-[10px] text-slate-500 truncate">Pro Account</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 border-b border-slate-200 bg-white px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
            <span>Workspace</span>
            <ChevronRight className="w-4 h-4" />
            <span className="text-slate-900">
              {activeTab === 'GENERATE' ? (
                step === 'INPUT' ? 'New Intelligence Session' : step === 'ANALYZING' ? 'Analysis in Progress' : 'Intelligence Portal'
              ) : (
                step === 'REPORT' ? 'Report Detail' : 'Intelligence Archive'
              )}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-green-600 animate-pulse"></span>
              System Ready
            </span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'REPORTS' && step !== 'REPORT' && (
              <motion.div
                key="reports-list"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-6xl mx-auto px-8 py-12"
              >
                <div className="mb-12">
                  <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-3">Intelligence Archive</h1>
                  <p className="text-lg text-slate-500 max-w-2xl leading-relaxed">
                    Access and manage all previously generated meeting intelligence reports.
                  </p>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-500">Report Title</th>
                          <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-500">Date</th>
                          <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-500">Type</th>
                          <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-500">Focus</th>
                          <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-500 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {reportsHistory.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-[#001f3d]/5 flex items-center justify-center text-[#001f3d]">
                                  <FileText className="w-4 h-4" />
                                </div>
                                <span className="font-bold text-slate-900">{item.title}</span>
                              </div>
                            </td>
                            <td className="px-6 py-5 text-sm text-slate-500 font-medium">{item.date}</td>
                            <td className="px-6 py-5">
                              <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold uppercase">
                                {item.meetingType}
                              </span>
                            </td>
                            <td className="px-6 py-5">
                              <span className="px-2.5 py-1 rounded-full bg-[#001f3d]/5 text-[#001f3d] text-[10px] font-bold uppercase">
                                {item.focusArea}
                              </span>
                            </td>
                            <td className="px-6 py-5 text-right">
                              <button 
                                onClick={() => {
                                  setReport(item);
                                  setStep('REPORT');
                                }}
                                className="inline-flex items-center gap-2 text-[#001f3d] font-bold text-sm hover:underline"
                              >
                                View Report
                                <ArrowRight className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'GENERATE' && step === 'INPUT' && (
              <motion.div 
                key="input"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-5xl mx-auto px-8 py-12"
              >
                <div className="mb-12">
                  <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-3">Intelligence Engine</h1>
                  <p className="text-lg text-slate-500 max-w-2xl leading-relaxed">
                    Transform raw notes and slides into structured, decision-ready intelligence. Our AI analyzes your inputs to extract key insights, action items, and strategic summaries.
                  </p>
                </div>

                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Notes Upload */}
                    <div className="group">
                      <label className="block text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#001f3d]" />
                        Notes PDF
                      </label>
                      <div className="relative border-2 border-dashed border-slate-300 rounded-xl p-10 flex flex-col items-center justify-center transition-all cursor-pointer bg-white hover:border-[#001f3d] hover:bg-[#001f3d]/[0.02]">
                        <input 
                          type="file" 
                          className="absolute inset-0 opacity-0 cursor-pointer" 
                          onChange={(e) => handleFileUpload(e, 'notes')}
                          accept=".pdf,.docx"
                        />
                        <div className="w-14 h-14 rounded-full bg-[#001f3d]/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          <Upload className="w-6 h-6 text-[#001f3d]" />
                        </div>
                        <p className="text-sm font-semibold text-slate-900">
                          {files.find(f => f.type.includes('pdf') || f.type.includes('word'))?.name || 'Click to upload or drag & drop'}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">PDF, DOCX up to 20MB</p>
                      </div>
                    </div>

                    {/* Slides Upload */}
                    <div className="group">
                      <label className="block text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                        <Presentation className="w-4 h-4 text-[#001f3d]" />
                        Presentation Slides
                      </label>
                      <div className="relative border-2 border-dashed border-slate-300 rounded-xl p-10 flex flex-col items-center justify-center transition-all cursor-pointer bg-white hover:border-[#001f3d] hover:bg-[#001f3d]/[0.02]">
                        <input 
                          type="file" 
                          className="absolute inset-0 opacity-0 cursor-pointer" 
                          onChange={(e) => handleFileUpload(e, 'slides')}
                          accept=".pptx,.pdf"
                        />
                        <div className="w-14 h-14 rounded-full bg-[#001f3d]/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          <Plus className="w-6 h-6 text-[#001f3d]" />
                        </div>
                        <p className="text-sm font-semibold text-slate-900">
                          {files.find(f => f.type.includes('presentation') || f.name.endsWith('.pptx'))?.name || 'Click to upload or drag & drop'}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">PPTX, PDF up to 50MB</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-[#001f3d]" />
                      Paste Content or Context
                    </label>
                    <div className="relative">
                      <textarea 
                        value={context}
                        onChange={(e) => setContext(e.target.value)}
                        className="w-full min-h-[240px] rounded-xl border-slate-300 bg-white focus:border-[#001f3d] focus:ring-1 focus:ring-[#001f3d] p-6 text-base leading-relaxed placeholder:text-slate-400 transition-all shadow-sm" 
                        placeholder="Paste additional context, meeting agendas, or raw transcripts here to provide the engine with more depth..."
                      />
                      <div className="absolute bottom-4 right-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-white px-2 py-1">
                        Text context optional
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-200 flex flex-col items-center">
                    <button 
                      onClick={startAnalysis}
                      className="group relative inline-flex items-center justify-center gap-3 px-10 py-5 bg-[#001f3d] text-white rounded-xl font-bold text-lg transition-all hover:bg-[#001f3d]/95 shadow-xl hover:shadow-[#001f3d]/20 hover:-translate-y-0.5 overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                      <BrainCircuit className="w-6 h-6" />
                      Generate Intelligence Report
                    </button>
                    <p className="mt-4 text-xs text-slate-500 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" />
                      Your data is encrypted and used only for this session.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 'ANALYZING' && (
              <motion.div 
                key="analyzing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="max-w-5xl mx-auto px-8 py-12"
              >
                <div className="text-center mb-12">
                  <h1 className="text-4xl md:text-5xl font-black text-[#001f3d] tracking-tight mb-4">
                    Analyzing Meeting Intelligence
                  </h1>
                  <p className="text-slate-600 text-lg max-w-2xl mx-auto leading-relaxed">
                    Automatically detecting meeting dynamics and strategic context.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  <div className="lg:col-span-5 space-y-6">
                    <div className="bg-white rounded-xl p-8 shadow-sm border border-[#001f3d]/5">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-[#001f3d]/40 mb-8">AI Analysis Pipeline</h3>
                      <div className="space-y-8 relative">
                        <div className="absolute left-4 top-2 bottom-2 w-[2px] bg-[#001f3d]/10"></div>
                        {analysisSteps.map((s, i) => {
                          const isComplete = i < currentAnalysisStep;
                          const isActive = i === currentAnalysisStep;
                          return (
                            <div key={i} className={cn("flex items-start gap-4 relative transition-opacity", !isActive && !isComplete && "opacity-40")}>
                              <div className={cn(
                                "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center z-10 transition-colors",
                                isComplete ? "bg-green-500 text-white" : isActive ? "bg-[#001f3d] text-white animate-pulse" : "bg-slate-200 text-slate-500"
                              )}>
                                {isComplete ? <CheckCircle2 className="w-4 h-4" /> : s.icon}
                              </div>
                              <div className="pt-1">
                                <p className={cn("text-sm font-bold", isActive ? "text-[#001f3d]" : "text-slate-900")}>{s.title}</p>
                                <p className="text-xs text-slate-500">{s.description}</p>
                                {isActive && (
                                  <div className="mt-3 w-48 h-1.5 bg-[#001f3d]/10 rounded-full overflow-hidden">
                                    <motion.div 
                                      className="bg-[#001f3d] h-full rounded-full"
                                      initial={{ width: '0%' }}
                                      animate={{ width: '100%' }}
                                      transition={{ duration: 2, repeat: Infinity }}
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="bg-[#001f3d]/5 rounded-xl p-6 border border-[#001f3d]/10">
                      <div className="flex gap-4">
                        <Info className="w-5 h-5 text-[#001f3d]" />
                        <div>
                          <p className="text-sm font-semibold text-[#001f3d]">Strategic Context Engine</p>
                          <p className="text-xs text-[#001f3d]/70 mt-1 leading-relaxed">
                            Our AI is cross-referencing this meeting with your objectives to identify potential risks and growth opportunities.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-7">
                    <div className="bg-white rounded-xl overflow-hidden shadow-xl border border-[#001f3d]/10">
                      <div className="h-64 relative overflow-hidden flex items-center justify-center bg-slate-50">
                        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#001f3d] via-transparent to-transparent"></div>
                        <div className="relative z-10 flex flex-col items-center">
                          <div className="w-24 h-24 rounded-full border-4 border-[#001f3d]/20 border-t-[#001f3d] animate-spin mb-6"></div>
                          <div className="bg-[#001f3d] text-white px-6 py-2 rounded-full font-bold text-sm tracking-wide shadow-lg uppercase">
                            Processing Data...
                          </div>
                        </div>
                      </div>
                      <div className="p-8 border-t border-[#001f3d]/5 text-center">
                        <p className="text-xs font-bold text-[#001f3d]/50 uppercase tracking-widest mb-2">System Status</p>
                        <p className="text-sm font-medium text-slate-600">Finalizing executive summary and action items...</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 'REPORT' && report && (
              <motion.div 
                key="report"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="max-w-[1440px] mx-auto px-6 py-8 lg:px-12"
              >
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
                  {/* Left Sidebar Navigation */}
                  <aside className="hidden lg:col-span-3 lg:block">
                    <nav className="sticky top-24 flex flex-col gap-1 rounded-xl border border-slate-200 bg-white p-4">
                      <p className="mb-2 px-3 text-xs font-bold uppercase tracking-widest text-slate-400">Report Sections</p>
                      {[
                        { id: 'summary', label: 'Executive Summary', icon: <FileText className="w-4 h-4" /> },
                        { id: 'strategic', label: 'Strategic Intelligence', icon: <Zap className="w-4 h-4" /> },
                        { id: 'risk', label: 'Risk Identification', icon: <AlertTriangle className="w-4 h-4" /> },
                        { id: 'talking', label: 'Key Talking Points', icon: <Mic className="w-4 h-4" /> },
                        { id: 'objection', label: 'Objection Simulation', icon: <MessageSquare className="w-4 h-4" /> },
                        { id: 'next-steps', label: 'Next Steps', icon: <ListOrdered className="w-4 h-4" /> },
                      ].map((s) => (
                        <a 
                          key={s.id} 
                          href={`#${s.id}`} 
                          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-[#001f3d]"
                        >
                          {s.icon} {s.label}
                        </a>
                      ))}
                      <div className="my-2 border-t border-slate-100"></div>
                      <a href="#brief" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-bold text-[#001f3d] hover:bg-[#001f3d]/5">
                        <Zap className="w-4 h-4" /> 60-Sec Executive Brief
                      </a>
                    </nav>
                  </aside>

                  {/* Main Content Area */}
                  <div className="lg:col-span-9 space-y-8">
                    {/* Header Controls */}
                    <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold">
                          {report.confidence}% Confidence
                        </div>
                        <div className="bg-[#001f3d]/10 text-[#001f3d] px-3 py-1 rounded-full text-xs font-bold">
                          {report.focusArea}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
                          <Download className="w-4 h-4" /> Export PDF
                        </button>
                        <button className="flex items-center gap-2 rounded-lg bg-[#001f3d] px-4 py-2 text-sm font-bold text-white hover:bg-[#001f3d]/90">
                          <Share2 className="w-4 h-4" /> Share Report
                        </button>
                      </div>
                    </div>

                    {/* 1. EXECUTIVE MEETING SUMMARY */}
                    <section id="summary" className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                      <div className="border-b border-slate-100 bg-slate-50/50 p-6">
                        <h2 className="text-xl font-extrabold uppercase tracking-tight text-[#001f3d]">1. Executive Meeting Summary</h2>
                      </div>
                      <div className="p-8">
                        <div className="grid gap-8 md:grid-cols-2">
                          <div className="space-y-4">
                            <div>
                              <label className="text-xs font-bold uppercase text-slate-400">Concise Overview</label>
                              <p className="mt-1 text-base leading-relaxed text-slate-700">{report.summary.overview}</p>
                            </div>
                            <div>
                              <label className="text-xs font-bold uppercase text-slate-400">Objective</label>
                              <p className="mt-1 text-base leading-relaxed text-slate-700">{report.summary.objective}</p>
                            </div>
                          </div>
                          <div className="rounded-xl bg-[#001f3d]/5 p-6">
                            <div className="mb-4">
                              <label className="text-xs font-bold uppercase text-[#001f3d]/70">Strategic Importance</label>
                              <p className="mt-1 text-sm font-medium text-slate-800 italic">"{report.summary.strategicImportance}"</p>
                            </div>
                            <div className="rounded-lg border-2 border-[#001f3d]/20 bg-white p-4">
                              <span className="inline-block rounded bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700 mb-2 uppercase">Critical</span>
                              <p className="text-xs font-bold uppercase text-slate-500">Decision Required</p>
                              <p className="text-lg font-black text-[#001f3d]">{report.summary.criticalDecision}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </section>

                    {/* 2. STRATEGIC INTELLIGENCE */}
                    <section id="strategic" className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                      <div className="border-b border-slate-100 bg-slate-50/50 p-6">
                        <h2 className="text-xl font-extrabold uppercase tracking-tight text-[#001f3d]">2. Strategic Intelligence</h2>
                      </div>
                      <div className="p-8">
                        <div className="grid gap-6 md:grid-cols-3">
                          <div className="rounded-lg border border-slate-100 p-4">
                            <h3 className="mb-3 flex items-center gap-2 font-bold text-[#001f3d]">
                              <Users className="w-4 h-4" /> Stakeholder Map
                            </h3>
                            <ul className="space-y-3 text-sm">
                              {report.strategicIntelligence.stakeholders.map((s, i) => (
                                <li key={i} className="flex items-center justify-between border-b border-slate-50 pb-2">
                                  <span className="font-medium">{s.role}</span>
                                  <span className={cn(
                                    "rounded px-1.5 py-0.5 text-[10px] font-bold uppercase",
                                    s.sentiment === 'Supportive' ? "bg-green-100 text-green-700" : 
                                    s.sentiment === 'Champion' ? "bg-[#001f3d]/10 text-[#001f3d]" : "bg-amber-100 text-amber-700"
                                  )}>
                                    {s.sentiment}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className="rounded-lg border border-slate-100 p-4">
                            <h3 className="mb-3 flex items-center gap-2 font-bold text-[#001f3d]">
                              <Zap className="w-4 h-4" /> Power Dynamics
                            </h3>
                            <p className="text-sm leading-relaxed text-slate-600">{report.strategicIntelligence.powerDynamics}</p>
                          </div>
                          <div className="rounded-lg border border-slate-100 p-4">
                            <h3 className="mb-3 flex items-center gap-2 font-bold text-[#001f3d]">
                              <CreditCard className="w-4 h-4" /> Incentive Analysis
                            </h3>
                            <p className="text-sm leading-relaxed text-slate-600">{report.strategicIntelligence.incentiveAnalysis}</p>
                          </div>
                        </div>
                      </div>
                    </section>

                    {/* 3. RISK IDENTIFICATION */}
                    <section id="risk" className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                      <div className="border-b border-slate-100 bg-slate-50/50 p-6">
                        <h2 className="text-xl font-extrabold uppercase tracking-tight text-[#001f3d]">3. Risk Identification</h2>
                      </div>
                      <div className="p-8">
                        <div className="grid gap-4 md:grid-cols-3">
                          {report.riskIdentification.risks.map((r, i) => (
                            <div key={i} className={cn(
                              "group relative rounded-lg border-l-4 p-4 transition-all hover:bg-slate-50",
                              r.type === 'Strategic' ? "border-red-500" : r.type === 'Political' ? "border-amber-500" : "border-[#001f3d]"
                            )}>
                              <div className="flex items-center justify-between mb-2">
                                <span className={cn(
                                  "text-[10px] font-black uppercase",
                                  r.type === 'Strategic' ? "text-red-600" : r.type === 'Political' ? "text-amber-600" : "text-[#001f3d]"
                                )}>{r.type}</span>
                                <AlertTriangle className="w-3 h-3 text-slate-400" />
                              </div>
                              <h4 className="font-bold text-slate-900">{r.title}</h4>
                              <p className="mt-1 text-xs text-slate-600">{r.description}</p>
                            </div>
                          ))}
                        </div>
                        <div className="mt-6 rounded-lg bg-red-50 p-4 border border-red-100">
                          <h4 className="text-sm font-bold text-red-800 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" /> Hidden Objection Alert
                          </h4>
                          <p className="mt-1 text-sm text-red-700">{report.riskIdentification.hiddenObjection}</p>
                        </div>
                      </div>
                    </section>

                    {/* 4. KEY TALKING POINTS */}
                    <section id="talking" className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                      <div className="border-b border-slate-100 bg-slate-50/50 p-6">
                        <h2 className="text-xl font-extrabold uppercase tracking-tight text-[#001f3d]">4. Key Talking Points</h2>
                      </div>
                      <div className="p-8">
                        <div className="flex flex-col gap-6 md:flex-row">
                          <div className="flex-1 space-y-4">
                            {report.talkingPoints.points.map((p, i) => (
                              <div key={i} className="flex items-start gap-4">
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#001f3d] text-[10px] font-bold text-white">
                                  {i + 1}
                                </span>
                                <div>
                                  <p className="font-bold">{p.title}</p>
                                  <p className="text-sm text-slate-600">{p.description}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="md:w-1/3 rounded-xl border border-[#001f3d]/10 bg-[#001f3d]/5 p-4">
                            <h4 className="mb-2 text-xs font-black uppercase text-[#001f3d]">Framing Strategy</h4>
                            <p className="text-sm italic leading-relaxed text-slate-700">"{report.talkingPoints.framingStrategy}"</p>
                          </div>
                        </div>
                      </div>
                    </section>

                    {/* 5. OBJECTION & PRESSURE SIMULATION */}
                    <section id="objection" className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                      <div className="border-b border-slate-100 bg-slate-50/50 p-6">
                        <h2 className="text-xl font-extrabold uppercase tracking-tight text-[#001f3d]">5. Objection & Pressure Simulation</h2>
                      </div>
                      <div className="p-8 space-y-4">
                        {report.objections.map((o, i) => (
                          <div key={i} className="rounded-lg bg-slate-50 p-5">
                            <p className="text-xs font-bold uppercase text-slate-400">Likely Question / Pushback</p>
                            <p className="mt-1 font-bold italic text-slate-900">"{o.question}"</p>
                            <div className="mt-4 rounded border border-slate-200 bg-white p-4">
                              <p className="text-xs font-bold uppercase text-[#001f3d]">Recommended Response</p>
                              <p className="mt-1 text-sm text-slate-700">{o.response}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>

                    {/* 6. NEXT STEPS ARCHITECTURE */}
                    <section id="next-steps" className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                      <div className="border-b border-slate-100 bg-slate-50/50 p-6">
                        <h2 className="text-xl font-extrabold uppercase tracking-tight text-[#001f3d]">6. Next Steps Architecture</h2>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-500">
                            <tr>
                              <th className="px-8 py-4">Immediate Action</th>
                              <th className="px-8 py-4">Ownership</th>
                              <th className="px-8 py-4">Timeline</th>
                              <th className="px-8 py-4">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {report.nextSteps.map((step, i) => (
                              <tr key={i}>
                                <td className="px-8 py-5 font-medium">{step.action}</td>
                                <td className="px-8 py-5 text-sm">{step.ownership}</td>
                                <td className="px-8 py-5 text-sm">{step.timeline}</td>
                                <td className="px-8 py-5">
                                  <span className={cn(
                                    "rounded-full px-2.5 py-1 text-[10px] font-bold",
                                    step.status === 'PENDING' ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"
                                  )}>
                                    {step.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </section>

                    {/* 7. EXECUTIVE BRIEF */}
                    <section id="brief" className="rounded-xl bg-[#001f3d] p-1 shadow-2xl">
                      <div className="rounded-lg border border-white/20 bg-[#001f3d] p-10 text-white">
                        <div className="flex items-center gap-4 mb-6">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white">
                            <Mic className="w-6 h-6" />
                          </div>
                          <div>
                            <h2 className="text-2xl font-black uppercase tracking-tight">Executive Brief</h2>
                            <p className="text-sm font-medium text-white/60 uppercase tracking-widest">60-Second Verbal Version</p>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <p className="text-xl font-medium leading-relaxed italic opacity-90">
                            {report.executiveBrief}
                          </p>
                        </div>
                        <div className="mt-8 flex items-center gap-3 rounded-lg bg-white/5 p-4 text-xs font-bold text-white/80">
                          <TrendingUp className="w-4 h-4" />
                          ESTIMATED READING TIME: 54 SECONDS
                        </div>
                      </div>
                    </section>

                    {/* 8. COVER IMAGE PROMPT */}
                    <section className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-500">Report Cover Image Prompt</h3>
                        <button 
                          onClick={() => navigator.clipboard.writeText(report.coverImagePrompt)}
                          className="flex items-center gap-1 text-[10px] font-bold uppercase text-[#001f3d] hover:underline"
                        >
                          <Copy className="w-3 h-3" /> Copy Prompt
                        </button>
                      </div>
                      <div className="rounded bg-slate-900 p-6 font-mono text-sm leading-relaxed text-slate-300">
                        "{report.coverImagePrompt}"
                      </div>
                    </section>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <footer className="h-12 border-t border-slate-200 bg-white px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-6 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
            <a href="#" className="hover:text-[#001f3d]">Privacy Policy</a>
            <a href="#" className="hover:text-[#001f3d]">Security Standards</a>
            <a href="#" className="hover:text-[#001f3d]">Terms of Service</a>
          </div>
          <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
            © 2024 Meeting Intelligence Engine. All rights reserved.
          </div>
        </footer>
      </main>
    </div>
  );
}
