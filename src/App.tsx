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
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1280 && window.innerWidth >= 1024) {
        setIsSidebarCollapsed(true);
      }
      if (window.innerWidth < 1024) {
        setIsSidebarCollapsed(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [notes, setNotes] = useState('');
  const [context, setContext] = useState('');
  const [files, setFiles] = useState<{ name: string; type: string; data: string }[]>([]);
  const [report, setReport] = useState<ReportData | null>(null);
  const [reportsHistory, setReportsHistory] = useState<ReportData[]>([MOCK_REPORT]);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [currentAnalysisStep, setCurrentAnalysisStep] = useState(0);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    document.documentElement.style.colorScheme = newTheme;
  };

  React.useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

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
    <div className={cn(
      "flex min-h-screen font-sans transition-colors duration-300",
      theme === 'dark' ? "bg-[#0f1923] text-slate-100 dark" : "bg-[#f5f7f8] text-slate-900"
    )}>
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-all duration-300 lg:static lg:translate-x-0",
        isSidebarCollapsed ? "w-20" : "w-72 md:w-64 lg:w-72",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className={cn("p-6 flex items-center gap-3", isSidebarCollapsed && "justify-center px-0")}>
          <div className="w-10 h-10 rounded-lg bg-[#001f3d] dark:bg-white flex items-center justify-center text-white dark:text-[#001f3d] shrink-0">
            <BarChart3 className="w-6 h-6" />
          </div>
          {!isSidebarCollapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h2 className="font-bold text-slate-900 dark:text-white leading-tight">Meeting Intel</h2>
              <p className="text-[10px] text-slate-700 dark:text-slate-400 font-bold uppercase tracking-wider">Executive Workspace</p>
            </motion.div>
          )}
        </div>

        <div className={cn("px-4 mb-6", isSidebarCollapsed && "px-2")}>
          <button 
            onClick={() => { 
              setActiveTab('GENERATE');
              setStep('INPUT'); 
              setReport(null); 
              setFiles([]); 
              setNotes(''); 
              setContext(''); 
              setIsMobileMenuOpen(false);
            }}
            className={cn(
              "w-full flex items-center justify-center gap-2 py-2.5 bg-[#001f3d] dark:bg-white text-white dark:text-[#001f3d] rounded-lg font-semibold text-sm transition-all hover:bg-[#001f3d]/90 dark:hover:bg-white/90 shadow-sm border border-transparent dark:border-slate-800",
              isSidebarCollapsed ? "px-0" : "px-4"
            )}
            title="New Session"
          >
            <Plus className="w-4 h-4 shrink-0" />
            {!isSidebarCollapsed && <span>New Session</span>}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 space-y-1 scrollbar-hide">
          {!isSidebarCollapsed && <p className="px-2 pb-2 text-[11px] font-black text-slate-800 dark:text-slate-400 uppercase tracking-widest">Navigation</p>}
          
          <button 
            onClick={() => { setActiveTab('GENERATE'); setStep('INPUT'); setIsMobileMenuOpen(false); }}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-bold text-sm text-left transition-colors",
              activeTab === 'GENERATE' ? "bg-[#001f3d]/5 dark:bg-white/5 text-[#001f3d] dark:text-white" : "text-slate-800 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800",
              isSidebarCollapsed && "justify-center px-0"
            )}
            title="Generate Meeting Intel"
          >
            <Zap className="w-4 h-4 shrink-0" />
            {!isSidebarCollapsed && <span>Generate Meeting Intel</span>}
          </button>

          <button 
            onClick={() => { setActiveTab('REPORTS'); setStep('INPUT'); setIsMobileMenuOpen(false); }}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-bold text-sm text-left transition-colors",
              activeTab === 'REPORTS' ? "bg-[#001f3d]/5 dark:bg-white/5 text-[#001f3d] dark:text-white" : "text-slate-800 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800",
              isSidebarCollapsed && "justify-center px-0"
            )}
            title="Reports"
          >
            <ListOrdered className="w-4 h-4 shrink-0" />
            {!isSidebarCollapsed && <span>Reports</span>}
          </button>

          <div className="pt-6">
            {!isSidebarCollapsed && <p className="px-2 pb-2 text-[11px] font-black text-slate-800 dark:text-slate-400 uppercase tracking-widest">Recent Intelligence</p>}
            {reportsHistory.slice(0, 5).map((item) => (
              <button 
                key={item.id} 
                onClick={() => {
                  setReport(item);
                  setStep('REPORT');
                  setActiveTab('REPORTS');
                  setIsMobileMenuOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-800 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold text-sm text-left transition-colors",
                  isSidebarCollapsed && "justify-center px-0"
                )}
                title={item.title}
              >
                <FileText className="w-4 h-4 shrink-0" />
                {!isSidebarCollapsed && <span className="truncate">{item.title}</span>}
              </button>
            ))}
          </div>
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
          <button 
            onClick={toggleTheme}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 text-slate-800 dark:text-slate-400 text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors",
              isSidebarCollapsed && "justify-center px-0"
            )}
            title={theme === 'light' ? "Switch to Dark Mode" : "Switch to Light Mode"}
          >
            {theme === 'light' ? <Lock className="w-4 h-4 shrink-0" /> : <ShieldCheck className="w-4 h-4 shrink-0" />}
            {!isSidebarCollapsed && <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>}
          </button>
          
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className={cn(
              "hidden lg:flex w-full items-center gap-3 px-3 py-2 text-slate-800 dark:text-slate-400 text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors",
              isSidebarCollapsed && "justify-center px-0"
            )}
            title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isSidebarCollapsed ? <ChevronRight className="w-4 h-4 shrink-0" /> : <ArrowRight className="w-4 h-4 shrink-0 rotate-180" />}
            {!isSidebarCollapsed && <span>Collapse Menu</span>}
          </button>

          <div className={cn("pt-4 px-3 flex items-center gap-3", isSidebarCollapsed && "justify-center px-0")}>
            <img 
              src="https://picsum.photos/seed/alex/100/100" 
              alt="User" 
              className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 shrink-0"
              referrerPolicy="no-referrer"
            />
            {!isSidebarCollapsed && (
              <div className="flex flex-col min-w-0">
                <p className="text-xs font-bold truncate text-slate-900 dark:text-white">Alex Sterling</p>
                <p className="text-[10px] text-slate-700 dark:text-slate-400 truncate">Pro Account</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden" 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 md:px-8 flex items-center justify-between shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden p-2 text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <ListOrdered className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2 text-slate-800 dark:text-slate-400 text-sm font-medium overflow-hidden">
              <span className="hidden sm:inline">Workspace</span>
              <ChevronRight className="w-4 h-4 shrink-0 hidden sm:inline" />
              <span className="text-[#001f3d] dark:text-white truncate font-black">
                {activeTab === 'GENERATE' ? (
                  step === 'INPUT' ? 'New Intelligence Session' : step === 'ANALYZING' ? 'Analysis in Progress' : 'Intelligence Portal'
                ) : (
                  step === 'REPORT' ? 'Report Detail' : 'Intelligence Archive'
                )}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-green-700 bg-green-50 dark:bg-green-900/20 px-2.5 py-1 rounded-full uppercase tracking-wider border border-green-100 dark:border-transparent">
              <span className="w-1.5 h-1.5 rounded-full bg-green-600 animate-pulse"></span>
              <span className="hidden xs:inline">System Ready</span>
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
                className="max-w-6xl mx-auto px-4 sm:px-8 py-8 md:py-12"
              >
                <div className="mb-8 md:mb-12">
                  <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-3">Intelligence Archive</h1>
                  <p className="text-base md:text-lg text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
                    Access and manage all previously generated meeting intelligence reports.
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[600px]">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                          <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400">Report Title</th>
                          <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400">Date</th>
                          <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400">Type</th>
                          <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400">Focus</th>
                          <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {reportsHistory.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-[#001f3d]/5 dark:bg-white/5 flex items-center justify-center text-[#001f3d] dark:text-white">
                                  <FileText className="w-4 h-4" />
                                </div>
                                <span className="font-bold text-slate-900 dark:text-white">{item.title}</span>
                              </div>
                            </td>
                            <td className="px-6 py-5 text-sm text-slate-600 dark:text-slate-400 font-medium">{item.date}</td>
                            <td className="px-6 py-5">
                              <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold uppercase">
                                {item.meetingType}
                              </span>
                            </td>
                            <td className="px-6 py-5">
                              <span className="px-2.5 py-1 rounded-full bg-[#001f3d]/5 dark:bg-white/5 text-[#001f3d] dark:text-white text-[10px] font-bold uppercase">
                                {item.focusArea}
                              </span>
                            </td>
                            <td className="px-6 py-5 text-right">
                              <button 
                                onClick={() => {
                                  setReport(item);
                                  setStep('REPORT');
                                }}
                                className="inline-flex items-center gap-2 text-[#001f3d] dark:text-white font-bold text-sm hover:underline"
                              >
                                <span className="hidden sm:inline">View Report</span>
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
                className="max-w-5xl mx-auto px-4 sm:px-8 py-8 md:py-12"
              >
                <div className="mb-8 md:mb-12">
                  <h1 className="text-3xl md:text-4xl font-black text-[#001f3d] dark:text-white tracking-tight mb-3">Intelligence Engine</h1>
                  <p className="text-base md:text-lg text-slate-800 dark:text-slate-400 max-w-2xl leading-relaxed font-semibold">
                    Transform raw notes and slides into structured, decision-ready intelligence. Our AI analyzes your inputs to extract key insights, action items, and strategic summaries.
                  </p>
                </div>

                <div className="space-y-6 md:space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    {/* Notes Upload */}
                    <div className="group">
                      <label className="block text-sm font-black text-[#001f3d] dark:text-slate-300 mb-3 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#001f3d] dark:text-white" />
                        Notes PDF
                      </label>
                      <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-6 md:p-10 flex flex-col items-center justify-center transition-all cursor-pointer bg-white dark:bg-slate-900 hover:border-[#001f3d] dark:hover:border-white hover:bg-[#001f3d]/[0.02] dark:hover:bg-white/[0.02] shadow-sm">
                        <input 
                          type="file" 
                          className="absolute inset-0 opacity-0 cursor-pointer" 
                          onChange={(e) => handleFileUpload(e, 'notes')}
                          accept=".pdf,.docx"
                        />
                        <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-[#001f3d]/5 dark:bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          <Upload className="w-5 h-5 md:w-6 md:h-6 text-[#001f3d] dark:text-white" />
                        </div>
                        <p className="text-sm font-black text-[#001f3d] dark:text-white text-center">
                          {files.find(f => f.type.includes('pdf') || f.type.includes('word'))?.name || 'Click to upload or drag & drop'}
                        </p>
                        <p className="text-xs text-slate-800 dark:text-slate-400 mt-1 font-bold">PDF, DOCX up to 20MB</p>
                      </div>
                    </div>

                    {/* Slides Upload */}
                    <div className="group">
                      <label className="block text-sm font-black text-[#001f3d] dark:text-slate-300 mb-3 flex items-center gap-2">
                        <Presentation className="w-4 h-4 text-[#001f3d] dark:text-white" />
                        Presentation Slides
                      </label>
                      <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-6 md:p-10 flex flex-col items-center justify-center transition-all cursor-pointer bg-white dark:bg-slate-900 hover:border-[#001f3d] dark:hover:border-white hover:bg-[#001f3d]/[0.02] dark:hover:bg-white/[0.02] shadow-sm">
                        <input 
                          type="file" 
                          className="absolute inset-0 opacity-0 cursor-pointer" 
                          onChange={(e) => handleFileUpload(e, 'slides')}
                          accept=".pptx,.pdf"
                        />
                        <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-[#001f3d]/5 dark:bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          <Plus className="w-5 h-5 md:w-6 md:h-6 text-[#001f3d] dark:text-white" />
                        </div>
                        <p className="text-sm font-black text-[#001f3d] dark:text-white text-center">
                          {files.find(f => f.type.includes('presentation') || f.name.endsWith('.pptx'))?.name || 'Click to upload or drag & drop'}
                        </p>
                        <p className="text-xs text-slate-800 dark:text-slate-400 mt-1 font-bold">PPTX, PDF up to 50MB</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-black text-[#001f3d] dark:text-slate-300 mb-3 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-[#001f3d] dark:text-white" />
                      Paste Content or Context
                    </label>
                    <div className="relative">
                      <textarea 
                        value={context}
                        onChange={(e) => setContext(e.target.value)}
                        className="w-full min-h-[180px] md:min-h-[240px] rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-[#001f3d] dark:focus:border-white focus:ring-1 focus:ring-[#001f3d] dark:focus:ring-white p-4 md:p-6 text-base leading-relaxed placeholder:text-slate-400 transition-all shadow-sm text-slate-950 dark:text-white" 
                        placeholder="Paste additional context, meeting agendas, or raw transcripts here to provide the engine with more depth..."
                      />
                      <div className="absolute bottom-4 right-4 text-[10px] font-bold text-slate-700 dark:text-slate-400 uppercase tracking-widest bg-white dark:bg-slate-900 px-2 py-1">
                        Text context optional
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col items-center">
                    <button 
                      onClick={startAnalysis}
                      className="group relative w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 md:px-10 py-4 md:py-5 bg-[#001f3d] dark:bg-white text-white dark:text-[#001f3d] rounded-xl font-bold text-base md:text-lg transition-all hover:bg-[#001f3d]/95 dark:hover:bg-white/90 shadow-xl hover:shadow-[#001f3d]/20 dark:hover:shadow-white/10 hover:-translate-y-0.5 overflow-hidden border border-transparent dark:border-slate-200"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                      <BrainCircuit className="w-5 h-5 md:w-6 md:h-6" />
                      Generate Intelligence Report
                    </button>
                    <p className="mt-4 text-[10px] md:text-xs text-slate-700 dark:text-slate-400 flex items-center gap-2 text-center font-bold">
                      <ShieldCheck className="w-3 h-3 md:w-4 md:h-4" />
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
                className="max-w-5xl mx-auto px-4 sm:px-8 py-8 md:py-12"
              >
                <div className="text-center mb-8 md:mb-12">
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-[#001f3d] dark:text-white tracking-tight mb-4">
                    Analyzing Meeting Intelligence
                  </h1>
                  <p className="text-slate-800 dark:text-slate-400 text-base md:text-lg max-w-2xl mx-auto leading-relaxed font-medium">
                    Automatically detecting meeting dynamics and strategic context.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-start">
                  <div className="lg:col-span-5 space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-xl p-6 md:p-8 shadow-sm border border-slate-200 dark:border-slate-800">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-400 mb-6 md:mb-8">AI Analysis Pipeline</h3>
                      <div className="space-y-6 md:space-y-8 relative">
                        <div className="absolute left-4 top-2 bottom-2 w-[2px] bg-slate-100 dark:bg-slate-800"></div>
                        {analysisSteps.map((s, i) => {
                          const isComplete = i < currentAnalysisStep;
                          const isActive = i === currentAnalysisStep;
                          return (
                            <div key={i} className={cn("flex items-start gap-4 relative transition-opacity", !isActive && !isComplete && "opacity-60")}>
                              <div className={cn(
                                "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center z-10 transition-colors",
                                isComplete ? "bg-green-500 text-white" : isActive ? "bg-[#001f3d] dark:bg-white text-white dark:text-[#001f3d] animate-pulse" : "bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-400"
                              )}>
                                {isComplete ? <CheckCircle2 className="w-4 h-4" /> : s.icon}
                              </div>
                              <div className="pt-1">
                                <p className={cn("text-sm font-bold", isActive ? "text-[#001f3d] dark:text-white" : "text-slate-950 dark:text-slate-200")}>{s.title}</p>
                                <p className="text-xs text-slate-900 dark:text-slate-400 font-medium">{s.description}</p>
                                {isActive && (
                                  <div className="mt-3 w-32 md:w-48 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <motion.div 
                                      className="bg-[#001f3d] dark:bg-white h-full rounded-full"
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

                    <div className="bg-[#001f3d]/5 dark:bg-white/5 rounded-xl p-6 border border-[#001f3d]/10 dark:border-white/10">
                      <div className="flex gap-4">
                        <Info className="w-5 h-5 text-[#001f3d] dark:text-white" />
                        <div>
                          <p className="text-sm font-bold text-[#001f3d] dark:text-white">Strategic Context Engine</p>
                          <p className="text-xs text-[#001f3d] dark:text-white/70 mt-1 leading-relaxed font-medium">
                            Our AI is cross-referencing this meeting with your objectives to identify potential risks and growth opportunities.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-7">
                    <div className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-xl border border-slate-200 dark:border-slate-800">
                      <div className="h-48 md:h-64 relative overflow-hidden flex items-center justify-center bg-slate-50 dark:bg-slate-800/50">
                        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#001f3d] dark:from-white via-transparent to-transparent"></div>
                        <div className="relative z-10 flex flex-col items-center">
                          <div className="w-16 h-16 md:w-24 md:h-24 rounded-full border-4 border-[#001f3d]/20 dark:border-white/20 border-t-[#001f3d] dark:border-t-white animate-spin mb-6"></div>
                          <div className="bg-[#001f3d] dark:bg-white text-white dark:text-[#001f3d] px-6 py-2 rounded-full font-bold text-sm tracking-wide shadow-lg uppercase">
                            Processing Data...
                          </div>
                        </div>
                      </div>
                      <div className="p-6 md:p-8 border-t border-slate-100 dark:border-slate-800 text-center">
                        <p className="text-[10px] font-bold text-slate-700 dark:text-slate-400 uppercase tracking-widest mb-2">System Status</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-slate-400">Finalizing executive summary and action items...</p>
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
                className="max-w-[1440px] mx-auto px-4 sm:px-6 py-6 md:py-8 lg:px-12"
              >
                <div className="grid grid-cols-1 gap-6 md:gap-8 lg:grid-cols-12">
                  {/* Left Sidebar Navigation */}
                  <aside className="hidden lg:col-span-3 lg:block">
                    <nav className="sticky top-24 flex flex-col gap-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
                      <p className="mb-2 px-3 text-xs font-bold uppercase tracking-widest text-slate-700 dark:text-slate-400">Report Sections</p>
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
                          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-bold text-slate-800 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-[#001f3d] dark:hover:text-white transition-colors"
                        >
                          {s.icon} {s.label}
                        </a>
                      ))}
                      <div className="my-2 border-t border-slate-100 dark:border-slate-800"></div>
                      <a href="#brief" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-black text-[#001f3d] dark:text-white hover:bg-[#001f3d]/5 dark:hover:bg-white/5 transition-colors">
                        <Zap className="w-4 h-4" /> 60-Sec Executive Brief
                      </a>
                    </nav>
                  </aside>

                  {/* Main Content Area */}
                  <div className="lg:col-span-9 space-y-6 md:space-y-8">
                    {/* Header Controls */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white dark:bg-slate-900 p-4 md:p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm gap-4">
                      <div className="flex flex-wrap items-center gap-3 md:gap-4">
                        <div className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 px-3 py-1 rounded-full text-[10px] md:text-xs font-bold">
                          {report.confidence}% Confidence
                        </div>
                        <div className="bg-[#001f3d]/10 dark:bg-white/10 text-[#001f3d] dark:text-white px-3 py-1 rounded-full text-[10px] md:text-xs font-bold">
                          {report.focusArea}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 md:gap-3 w-full sm:w-auto">
                        <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-xs md:text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                          <Download className="w-4 h-4" /> Export
                        </button>
                        <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-lg bg-[#001f3d] dark:bg-white px-4 py-2 text-xs md:text-sm font-bold text-white dark:text-[#001f3d] hover:bg-[#001f3d]/90 dark:hover:bg-white/90 transition-colors">
                          <Share2 className="w-4 h-4" /> Share
                        </button>
                      </div>
                    </div>

                    {/* 1. EXECUTIVE MEETING SUMMARY */}
                    <section id="summary" className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                      <div className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 p-6">
                        <h2 className="text-lg md:text-xl font-extrabold uppercase tracking-tight text-[#001f3d] dark:text-white">1. Executive Meeting Summary</h2>
                      </div>
                      <div className="p-6 md:p-8">
                        <div className="grid gap-8 md:grid-cols-2">
                          <div className="space-y-6">
                            <div>
                              <label className="text-[10px] font-black uppercase text-slate-700 dark:text-slate-400 tracking-widest">Concise Overview</label>
                              <p className="mt-2 text-sm md:text-base leading-relaxed text-slate-900 dark:text-slate-300 font-medium">{report.summary.overview}</p>
                            </div>
                            <div>
                              <label className="text-[10px] font-black uppercase text-slate-700 dark:text-slate-400 tracking-widest">Objective</label>
                              <p className="mt-2 text-sm md:text-base leading-relaxed text-slate-900 dark:text-slate-300 font-medium">{report.summary.objective}</p>
                            </div>
                          </div>
                          <div className="rounded-xl bg-slate-50 dark:bg-white/5 p-6 border border-slate-200 dark:border-white/10">
                            <div className="mb-6">
                              <label className="text-[10px] font-black uppercase text-slate-700 dark:text-white/70 tracking-widest">Strategic Importance</label>
                              <p className="mt-2 text-sm font-bold text-slate-900 dark:text-slate-200 italic leading-relaxed">"{report.summary.strategicImportance}"</p>
                            </div>
                            <div className="rounded-lg border-2 border-[#001f3d]/20 dark:border-white/20 bg-white dark:bg-slate-800 p-4 shadow-sm">
                              <span className="inline-block rounded bg-red-100 dark:bg-red-900/30 px-2 py-0.5 text-[10px] font-bold text-red-800 dark:text-red-400 mb-2 uppercase">Critical</span>
                              <p className="text-[10px] font-black uppercase text-slate-700 dark:text-slate-400">Decision Required</p>
                              <p className="text-base md:text-lg font-black text-[#001f3d] dark:text-white">{report.summary.criticalDecision}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </section>

                    {/* 2. STRATEGIC INTELLIGENCE */}
                    <section id="strategic" className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                      <div className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 p-6">
                        <h2 className="text-lg md:text-xl font-extrabold uppercase tracking-tight text-[#001f3d] dark:text-white">2. Strategic Intelligence</h2>
                      </div>
                      <div className="p-6 md:p-8">
                        <div className="grid gap-6 md:grid-cols-3">
                          <div className="rounded-lg border border-slate-100 dark:border-slate-800 p-4">
                            <h3 className="mb-4 flex items-center gap-2 font-bold text-[#001f3d] dark:text-white text-sm">
                              <Users className="w-4 h-4" /> Stakeholder Map
                            </h3>
                            <ul className="space-y-3 text-xs md:text-sm">
                              {report.strategicIntelligence.stakeholders.map((s, i) => (
                                <li key={i} className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                                  <span className="font-bold text-slate-800 dark:text-slate-300">{s.role}</span>
                                  <span className={cn(
                                    "rounded px-1.5 py-0.5 text-[9px] md:text-[10px] font-bold uppercase",
                                    s.sentiment === 'Supportive' ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400" : 
                                    s.sentiment === 'Champion' ? "bg-[#001f3d]/10 dark:bg-white/10 text-[#001f3d] dark:text-white" : "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400"
                                  )}>
                                    {s.sentiment}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className="rounded-lg border border-slate-100 dark:border-slate-800 p-4">
                            <h3 className="mb-4 flex items-center gap-2 font-bold text-[#001f3d] dark:text-white text-sm">
                              <Zap className="w-4 h-4" /> Power Dynamics
                            </h3>
                            <p className="text-xs md:text-sm leading-relaxed text-slate-800 dark:text-slate-400 font-medium">{report.strategicIntelligence.powerDynamics}</p>
                          </div>
                          <div className="rounded-lg border border-slate-100 dark:border-slate-800 p-4">
                            <h3 className="mb-4 flex items-center gap-2 font-bold text-[#001f3d] dark:text-white text-sm">
                              <CreditCard className="w-4 h-4" /> Incentive Analysis
                            </h3>
                            <p className="text-xs md:text-sm leading-relaxed text-slate-800 dark:text-slate-400 font-medium">{report.strategicIntelligence.incentiveAnalysis}</p>
                          </div>
                        </div>
                      </div>
                    </section>

                    {/* 3. RISK IDENTIFICATION */}
                    <section id="risk" className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                      <div className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 p-6">
                        <h2 className="text-lg md:text-xl font-extrabold uppercase tracking-tight text-[#001f3d] dark:text-white">3. Risk Identification</h2>
                      </div>
                      <div className="p-6 md:p-8">
                        <div className="grid gap-4 md:grid-cols-3">
                          {report.riskIdentification.risks.map((r, i) => (
                            <div key={i} className={cn(
                              "group relative rounded-lg border-l-4 p-4 transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50",
                              r.type === 'Strategic' ? "border-red-500" : r.type === 'Political' ? "border-amber-500" : "border-[#001f3d] dark:border-white"
                            )}>
                              <div className="flex items-center justify-between mb-2">
                                <span className={cn(
                                  "text-[10px] font-black uppercase tracking-widest",
                                  r.type === 'Strategic' ? "text-red-700 dark:text-red-400" : r.type === 'Political' ? "text-amber-700 dark:text-amber-400" : "text-[#001f3d] dark:text-white"
                                )}>{r.type}</span>
                                <AlertTriangle className="w-3 h-3 text-slate-600" />
                              </div>
                              <h4 className="font-bold text-slate-950 dark:text-white text-sm">{r.title}</h4>
                              <p className="mt-1 text-[11px] md:text-xs text-slate-800 dark:text-slate-400 leading-relaxed font-medium">{r.description}</p>
                            </div>
                          ))}
                        </div>
                        <div className="mt-6 rounded-lg bg-red-50 dark:bg-red-900/20 p-4 border border-red-100 dark:border-red-900/30">
                          <h4 className="text-sm font-bold text-red-800 dark:text-red-400 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" /> Hidden Objection Alert
                          </h4>
                          <p className="mt-1 text-xs md:text-sm text-red-700 dark:text-red-300 leading-relaxed">{report.riskIdentification.hiddenObjection}</p>
                        </div>
                      </div>
                    </section>

                    {/* 4. KEY TALKING POINTS */}
                    <section id="talking" className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                      <div className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 p-6">
                        <h2 className="text-lg md:text-xl font-extrabold uppercase tracking-tight text-[#001f3d] dark:text-white">4. Key Talking Points</h2>
                      </div>
                      <div className="p-6 md:p-8">
                        <div className="flex flex-col gap-8 md:flex-row">
                          <div className="flex-1 space-y-6">
                            {report.talkingPoints.points.map((p, i) => (
                              <div key={i} className="flex items-start gap-4">
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#001f3d] dark:bg-white text-[10px] font-bold text-white dark:text-[#001f3d]">
                                  {i + 1}
                                </span>
                                <div>
                                  <p className="font-bold text-slate-950 dark:text-white text-sm md:text-base">{p.title}</p>
                                  <p className="text-xs md:text-sm text-slate-800 dark:text-slate-400 leading-relaxed mt-1 font-medium">{p.description}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="md:w-1/3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-6">
                            <h4 className="mb-3 text-[10px] font-black uppercase text-slate-700 dark:text-white tracking-widest">Framing Strategy</h4>
                            <p className="text-sm font-bold italic leading-relaxed text-slate-900 dark:text-slate-300">"{report.talkingPoints.framingStrategy}"</p>
                          </div>
                        </div>
                      </div>
                    </section>

                    {/* 5. OBJECTION & PRESSURE SIMULATION */}
                    <section id="objection" className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                      <div className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 p-6">
                        <h2 className="text-lg md:text-xl font-extrabold uppercase tracking-tight text-[#001f3d] dark:text-white">5. Objection & Pressure Simulation</h2>
                      </div>
                      <div className="p-6 md:p-8 space-y-6">
                        {report.objections.map((o, i) => (
                          <div key={i} className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-5 border border-slate-200 dark:border-slate-800">
                            <p className="text-[10px] font-black uppercase text-slate-700 dark:text-slate-400 tracking-widest">Likely Question / Pushback</p>
                            <p className="mt-2 font-bold italic text-slate-950 dark:text-white text-sm md:text-base">"{o.question}"</p>
                            <div className="mt-6 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 shadow-sm">
                              <p className="text-[10px] font-black uppercase text-slate-700 dark:text-white tracking-widest">Recommended Response</p>
                              <p className="mt-2 text-sm text-slate-900 dark:text-slate-300 leading-relaxed font-medium">{o.response}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>

                    {/* 6. NEXT STEPS ARCHITECTURE */}
                    <section id="next-steps" className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                      <div className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 p-6">
                        <h2 className="text-lg md:text-xl font-extrabold uppercase tracking-tight text-[#001f3d] dark:text-white">6. Next Steps Architecture</h2>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[600px]">
                          <thead className="bg-slate-100 dark:bg-slate-800/50 text-[10px] font-black uppercase tracking-widest text-slate-800 dark:text-slate-400">
                            <tr className="border-b border-slate-200 dark:border-slate-800">
                              <th className="px-8 py-4">Immediate Action</th>
                              <th className="px-8 py-4">Ownership</th>
                              <th className="px-8 py-4">Timeline</th>
                              <th className="px-8 py-4">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                            {report.nextSteps.map((step, i) => (
                              <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                <td className="px-8 py-5 font-bold text-slate-950 dark:text-white text-sm">{step.action}</td>
                                <td className="px-8 py-5 text-sm text-slate-800 dark:text-slate-400 font-bold">{step.ownership}</td>
                                <td className="px-8 py-5 text-sm text-slate-800 dark:text-slate-400 font-bold">{step.timeline}</td>
                                <td className="px-8 py-5">
                                  <span className={cn(
                                    "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
                                    step.status === 'PENDING' ? "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400" : "bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-400"
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
                    <section id="brief" className="rounded-xl bg-white dark:bg-slate-900 p-1 shadow-2xl border border-slate-200 dark:border-slate-800">
                      <div className="rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 md:p-10 text-slate-900 dark:text-white">
                        <div className="flex items-center gap-4 mb-6 md:mb-8">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#001f3d]/5 dark:bg-white/10 text-[#001f3d] dark:text-white">
                            <Mic className="w-6 h-6" />
                          </div>
                          <div>
                            <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-[#001f3d] dark:text-white">Executive Brief</h2>
                            <p className="text-[10px] md:text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">60-Second Verbal Version</p>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <p className="text-lg md:text-xl font-bold leading-relaxed italic opacity-100 text-slate-900 dark:text-slate-100">
                            {report.executiveBrief}
                          </p>
                        </div>
                        <div className="mt-8 flex items-center gap-3 rounded-lg bg-slate-50 dark:bg-white/5 p-4 text-[10px] md:text-xs font-bold text-slate-700 dark:text-slate-400 uppercase tracking-widest">
                          <TrendingUp className="w-4 h-4" />
                          ESTIMATED READING TIME: 54 SECONDS
                        </div>
                      </div>
                    </section>

                    {/* 8. COVER IMAGE PROMPT */}
                    <section className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/30 p-6 md:p-8 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-800 dark:text-slate-400">Report Cover Image Prompt</h3>
                        <button 
                          onClick={() => navigator.clipboard.writeText(report.coverImagePrompt)}
                          className="flex items-center gap-1 text-[10px] font-bold uppercase text-[#001f3d] dark:text-white hover:underline"
                        >
                          <Copy className="w-3 h-3" /> Copy Prompt
                        </button>
                      </div>
                      <div className="rounded-lg bg-slate-100 dark:bg-black p-4 md:p-6 font-mono text-xs md:text-sm leading-relaxed text-slate-900 dark:text-slate-400 border border-slate-200 dark:border-slate-800">
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
        <footer className="py-6 md:h-12 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 md:px-8 flex flex-col md:flex-row items-center justify-between shrink-0 gap-4 md:gap-0">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 md:gap-6 text-slate-700 dark:text-slate-400 text-[9px] md:text-[10px] font-bold uppercase tracking-wider">
            <a href="#" className="hover:text-[#001f3d] dark:hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-[#001f3d] dark:hover:text-white transition-colors">Security Standards</a>
            <a href="#" className="hover:text-[#001f3d] dark:hover:text-white transition-colors">Terms of Service</a>
          </div>
          <div className="text-slate-700 dark:text-slate-400 text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-center md:text-right">
            © 2024 Meeting Intelligence Engine. All rights reserved.
          </div>
        </footer>
      </main>
    </div>
  );
}
