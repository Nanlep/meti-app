
import React, { useState, useMemo } from 'react';
import { generateSeoAudit, generateKeywordStrategy, analyzeContentSeo } from '../services/geminiService';
import { NicheSuggestion, PersonaProfile, KeywordData, SeoAuditIssue, SeoContentScore, User } from '../types';
import { Button, Card, SectionTitle } from './Shared';
import { Search, Globe, AlertTriangle, CheckCircle2, BarChart2, Zap, FileText, Settings, Smartphone, RefreshCw, AlignLeft, TrendingUp, AlertOctagon, Info, ArrowUpRight, Target } from 'lucide-react';
import { notify } from '../services/notificationService';

interface StepSEOProps {
  productName: string;
  niche: NicheSuggestion;
  persona: PersonaProfile;
  productUrl?: string;
  seoKeywords: KeywordData[];
  seoAuditResults: SeoAuditIssue[];
  seoContentAnalysis?: SeoContentScore;
  onUpdate: (data: any) => void;
  user?: User;
}

export const StepSEO: React.FC<StepSEOProps> = ({
  productName,
  niche,
  persona,
  productUrl,
  seoKeywords = [],
  seoAuditResults = [],
  seoContentAnalysis,
  onUpdate,
  user
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'audit' | 'keywords' | 'editor' | 'integrations'>('overview');
  const [loading, setLoading] = useState(false);

  // Audit State
  const [auditUrl, setAuditUrl] = useState(productUrl || '');

  // Keyword State
  const [seedKeyword, setSeedKeyword] = useState(niche.name);

  // Content Editor State
  const [editorContent, setEditorContent] = useState('');
  const [targetKeyword, setTargetKeyword] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Integration State
  const [connectedCms, setConnectedCms] = useState<string[]>([]);

  // --- Derived Metrics ---
  const healthScore = useMemo(() => {
    if (seoAuditResults.length === 0) return 0;
    const critical = seoAuditResults.filter(i => i.severity === 'critical').length;
    const warning = seoAuditResults.filter(i => i.severity === 'warning').length;
    // Simple scoring algorithm
    return Math.max(0, 100 - (critical * 15) - (warning * 5));
  }, [seoAuditResults]);

  const auditStats = useMemo(() => ({
    critical: seoAuditResults.filter(i => i.severity === 'critical').length,
    warning: seoAuditResults.filter(i => i.severity === 'warning').length,
    info: seoAuditResults.filter(i => i.severity === 'info').length
  }), [seoAuditResults]);

  // --- Handlers ---

  const runAudit = async () => {
    if (!auditUrl) {
        notify.error("Please enter a URL to audit");
        return;
    }
    setLoading(true);
    try {
      const results = await generateSeoAudit(auditUrl, productName);
      onUpdate({ seoAuditResults: results });
      notify.success("Site audit completed successfully");
    } catch (e) {
      console.error(e);
      notify.error("Audit failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const runKeywordResearch = async () => {
    if (!seedKeyword) {
      notify.warning("Please enter a seed keyword");
      return;
    }
    setLoading(true);
    try {
      const results = await generateKeywordStrategy(seedKeyword, niche.name, persona);
      onUpdate({ seoKeywords: results });
      notify.success("Keyword strategy generated");
    } catch (e) {
      console.error(e);
      notify.error("Keyword research failed");
    } finally {
      setLoading(false);
    }
  };

  const analyzeContent = async () => {
    if (!editorContent || !targetKeyword) {
        notify.warning("Please enter both content and a target keyword");
        return;
    }
    setIsAnalyzing(true);
    try {
      const results = await analyzeContentSeo(editorContent, targetKeyword);
      onUpdate({ seoContentAnalysis: results });
      notify.success("Content analysis updated");
    } catch (e) {
      console.error(e);
      notify.error("Analysis failed");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleCms = (cms: string) => {
      if (connectedCms.includes(cms)) {
          setConnectedCms(connectedCms.filter(c => c !== cms));
          notify.info(`${cms} disconnected`);
      } else {
          // Simulate auth popup
          const width = 600;
          const height = 600;
          const left = window.screen.width / 2 - width / 2;
          const top = window.screen.height / 2 - height / 2;
          const win = window.open('', 'Connect', `width=${width},height=${height},top=${top},left=${left}`);
          if (win) {
              win.document.write(`
                <div style="font-family:system-ui;text-align:center;padding-top:100px;background:#f8fafc;height:100vh;">
                  <h2 style="color:#0f172a;">Connecting to ${cms}...</h2>
                  <p style="color:#64748b;">Verifying API Credentials</p>
                  <div style="margin:20px auto;border:4px solid #f3f3f3;border-top:4px solid #6366f1;border-radius:50%;width:40px;height:40px;animation:spin 1s linear infinite;"></div>
                  <style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
                </div>
              `);
              setTimeout(() => {
                  win.close();
                  setConnectedCms([...connectedCms, cms]);
                  notify.success(`${cms} connected successfully`);
              }, 1500);
          }
      }
  };

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-140px)] flex flex-col">
      <div className="flex-shrink-0 mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <SectionTitle 
            title="SEO Command Center" 
            subtitle="Technical audits, keyword intelligence, and content optimization suite." 
          />
        </div>
        
        <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 overflow-x-auto shadow-sm">
          {[
            { id: 'overview', icon: BarChart2, label: 'Overview' },
            { id: 'audit', icon: AlertOctagon, label: 'Tech Audit' },
            { id: 'keywords', icon: Search, label: 'Keywords' },
            { id: 'editor', icon: FileText, label: 'Optimizer' },
            { id: 'integrations', icon: Zap, label: 'Connect' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <tab.icon size={16} />
              <span className="hidden md:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
        
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn">
             {/* Health Score Card */}
             <Card className="flex flex-col items-center justify-center p-8 bg-slate-900 border-slate-800 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 pointer-events-none"></div>
                <div className="relative w-40 h-40 flex items-center justify-center mb-6">
                   <svg className="w-full h-full transform -rotate-90">
                     <circle cx="80" cy="80" r="70" stroke="#1e293b" strokeWidth="12" fill="none" />
                     <circle 
                        cx="80" cy="80" r="70" 
                        stroke={healthScore > 80 ? "#10b981" : healthScore > 50 ? "#f59e0b" : "#ef4444"} 
                        strokeWidth="12" fill="none" 
                        strokeDasharray="440" 
                        strokeDashoffset={440 - (440 * (seoAuditResults.length > 0 ? healthScore : 0)) / 100} 
                        className="transition-all duration-1000 ease-out" 
                        strokeLinecap="round"
                     />
                   </svg>
                   <div className="absolute flex flex-col items-center">
                     <span className="text-4xl font-bold text-white tracking-tighter">
                       {seoAuditResults.length > 0 ? healthScore : '--'}
                     </span>
                     <span className="text-xs text-slate-500 uppercase font-bold tracking-wide">Health</span>
                   </div>
                </div>
                <div className="grid grid-cols-3 w-full gap-2 text-center">
                   <div className="p-2 rounded bg-red-500/10 border border-red-500/20">
                      <div className="text-lg font-bold text-red-400">{auditStats.critical}</div>
                      <div className="text-[10px] text-red-300/70 uppercase">Critical</div>
                   </div>
                   <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20">
                      <div className="text-lg font-bold text-amber-400">{auditStats.warning}</div>
                      <div className="text-[10px] text-amber-300/70 uppercase">Warnings</div>
                   </div>
                   <div className="p-2 rounded bg-blue-500/10 border border-blue-500/20">
                      <div className="text-lg font-bold text-blue-400">{auditStats.info}</div>
                      <div className="text-[10px] text-blue-300/70 uppercase">Info</div>
                   </div>
                </div>
                {seoAuditResults.length === 0 && (
                   <Button onClick={() => setActiveTab('audit')} variant="outline" className="mt-6 w-full text-xs">
                      Run Initial Audit
                   </Button>
                )}
             </Card>

             {/* Keywords Summary */}
             <Card className="md:col-span-2 flex flex-col bg-slate-800 border-slate-700">
                <div className="flex justify-between items-center mb-6">
                   <h3 className="font-bold text-white flex items-center gap-2">
                      <Target size={20} className="text-emerald-400" /> Keyword Opportunities
                   </h3>
                   <div className="flex gap-2">
                      <span className="text-xs text-slate-400 bg-slate-900 px-2 py-1 rounded">Total: {seoKeywords.length}</span>
                   </div>
                </div>
                
                {seoKeywords.length > 0 ? (
                   <div className="flex-1 overflow-x-auto">
                      <table className="w-full text-sm text-left">
                         <thead className="text-xs text-slate-500 uppercase bg-slate-900/50">
                            <tr>
                               <th className="px-4 py-3 rounded-l-lg">Keyword</th>
                               <th className="px-4 py-3">Vol</th>
                               <th className="px-4 py-3">KD %</th>
                               <th className="px-4 py-3 rounded-r-lg text-right">Potential</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-700/50">
                            {seoKeywords.slice(0, 5).map((kw, i) => (
                               <tr key={i} className="hover:bg-slate-700/30 transition-colors">
                                  <td className="px-4 py-3 font-medium text-white">{kw.keyword}</td>
                                  <td className="px-4 py-3 text-slate-400">{kw.volume}</td>
                                  <td className="px-4 py-3">
                                     <div className="flex items-center gap-2">
                                        <div className="w-12 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                           <div className={`h-full rounded-full ${kw.difficulty > 70 ? 'bg-red-500' : kw.difficulty > 40 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${kw.difficulty}%` }}></div>
                                        </div>
                                     </div>
                                  </td>
                                  <td className="px-4 py-3 text-right">
                                     <span className="text-indigo-400 font-bold">{kw.opportunityScore}</span>
                                  </td>
                               </tr>
                            ))}
                         </tbody>
                      </table>
                      <div className="mt-4 text-center">
                         <Button onClick={() => setActiveTab('keywords')} variant="secondary" className="text-xs w-full">View Full Strategy</Button>
                      </div>
                   </div>
                ) : (
                   <div className="flex-1 flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-700 rounded-xl p-8">
                      <Search size={32} className="mb-3 opacity-50" />
                      <p className="text-sm mb-4">No keyword data generated yet.</p>
                      <Button onClick={() => setActiveTab('keywords')} size="sm">Start Research</Button>
                   </div>
                )}
             </Card>

             {/* Quick Actions */}
             <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <button onClick={() => setActiveTab('audit')} className="p-4 bg-slate-800 border border-slate-700 hover:border-indigo-500 rounded-xl text-left transition-all group">
                   <div className="flex justify-between items-start mb-2">
                      <div className="bg-blue-500/10 p-2 rounded-lg text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors"><AlertOctagon size={20}/></div>
                      <ArrowUpRight size={16} className="text-slate-600 group-hover:text-indigo-400"/>
                   </div>
                   <div className="font-bold text-white text-sm">Technical Audit</div>
                   <div className="text-xs text-slate-500 mt-1">Scan for broken links & errors</div>
                </button>
                
                <button onClick={() => setActiveTab('keywords')} className="p-4 bg-slate-800 border border-slate-700 hover:border-indigo-500 rounded-xl text-left transition-all group">
                   <div className="flex justify-between items-start mb-2">
                      <div className="bg-purple-500/10 p-2 rounded-lg text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-colors"><Target size={20}/></div>
                      <ArrowUpRight size={16} className="text-slate-600 group-hover:text-indigo-400"/>
                   </div>
                   <div className="font-bold text-white text-sm">Gap Analysis</div>
                   <div className="text-xs text-slate-500 mt-1">Find untrapped keyword potential</div>
                </button>

                <button onClick={() => setActiveTab('editor')} className="p-4 bg-slate-800 border border-slate-700 hover:border-indigo-500 rounded-xl text-left transition-all group">
                   <div className="flex justify-between items-start mb-2">
                      <div className="bg-emerald-500/10 p-2 rounded-lg text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors"><FileText size={20}/></div>
                      <ArrowUpRight size={16} className="text-slate-600 group-hover:text-indigo-400"/>
                   </div>
                   <div className="font-bold text-white text-sm">Content Optimize</div>
                   <div className="text-xs text-slate-500 mt-1">Real-time LSI keyword checking</div>
                </button>

                <button onClick={() => setActiveTab('integrations')} className="p-4 bg-slate-800 border border-slate-700 hover:border-indigo-500 rounded-xl text-left transition-all group">
                   <div className="flex justify-between items-start mb-2">
                      <div className="bg-amber-500/10 p-2 rounded-lg text-amber-400 group-hover:bg-amber-500 group-hover:text-white transition-colors"><Settings size={20}/></div>
                      <ArrowUpRight size={16} className="text-slate-600 group-hover:text-indigo-400"/>
                   </div>
                   <div className="font-bold text-white text-sm">CMS Sync</div>
                   <div className="text-xs text-slate-500 mt-1">Connect WordPress/Webflow</div>
                </button>
             </div>
          </div>
        )}

        {/* AUDIT TAB */}
        {activeTab === 'audit' && (
          <div className="animate-fadeIn space-y-6">
             <Card className="bg-slate-800 border-slate-700">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                   <div className="flex-1 w-full">
                      <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">Target Website URL</label>
                      <div className="relative">
                         <Globe className="absolute left-3 top-3 text-slate-500" size={18} />
                         <input 
                           type="url" 
                           value={auditUrl}
                           onChange={(e) => setAuditUrl(e.target.value)}
                           placeholder="https://example.com"
                           className="w-full bg-slate-900 border border-slate-600 rounded-lg pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                         />
                      </div>
                   </div>
                   <Button onClick={runAudit} disabled={loading} className="w-full md:w-auto h-[46px]">
                      {loading ? 'Running Analysis...' : 'Run Technical Audit'}
                   </Button>
                </div>
             </Card>

             {seoAuditResults.length > 0 && (
                <div className="space-y-6">
                   {/* Grouped Results */}
                   {['critical', 'warning', 'info'].map((severity) => {
                      const items = seoAuditResults.filter(i => i.severity === severity);
                      if (items.length === 0) return null;
                      
                      const colors = {
                         critical: { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400', icon: AlertOctagon },
                         warning: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400', icon: AlertTriangle },
                         info: { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400', icon: Info }
                      };
                      const style = colors[severity as keyof typeof colors];
                      const Icon = style.icon;

                      return (
                         <div key={severity}>
                            <h3 className={`text-sm font-bold uppercase tracking-wider mb-3 flex items-center gap-2 ${style.text}`}>
                               <Icon size={16} /> {severity} Issues ({items.length})
                            </h3>
                            <div className="grid grid-cols-1 gap-3">
                               {items.map((result, idx) => (
                                  <div key={idx} className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center gap-4 bg-slate-800 ${style.border}`}>
                                     <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                           <span className="text-xs font-bold px-2 py-0.5 bg-slate-900 rounded text-slate-400 uppercase">{result.category}</span>
                                           <h4 className="font-bold text-white">{result.issue}</h4>
                                        </div>
                                        <p className="text-slate-400 text-sm">{result.recommendation}</p>
                                     </div>
                                     <Button variant="secondary" className="whitespace-nowrap text-xs h-8">
                                        View Fix
                                     </Button>
                                  </div>
                               ))}
                            </div>
                         </div>
                      );
                   })}
                </div>
             )}
          </div>
        )}

        {/* KEYWORDS TAB */}
        {activeTab === 'keywords' && (
           <div className="animate-fadeIn space-y-6">
              <Card className="bg-slate-800 border-slate-700">
                 <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                       <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">Seed Topic / Competitor</label>
                       <div className="relative">
                          <Search className="absolute left-3 top-3 text-slate-500" size={18} />
                          <input 
                            type="text" 
                            value={seedKeyword}
                            onChange={(e) => setSeedKeyword(e.target.value)}
                            placeholder="e.g. CRM for small business"
                            className="w-full bg-slate-900 border border-slate-600 rounded-lg pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                          />
                       </div>
                    </div>
                    <Button onClick={runKeywordResearch} disabled={loading} className="w-full md:w-auto h-[46px]">
                       {loading ? 'Mining Data...' : 'Find Keywords'}
                    </Button>
                 </div>
              </Card>

              {seoKeywords.length > 0 && (
                 <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-xl">
                    <div className="overflow-x-auto">
                       <table className="w-full text-left text-sm">
                          <thead className="bg-slate-950 text-slate-400 font-bold uppercase text-xs">
                             <tr>
                                <th className="p-4 w-1/3">Keyword</th>
                                <th className="p-4">Intent</th>
                                <th className="p-4">Volume</th>
                                <th className="p-4">Difficulty</th>
                                <th className="p-4 text-right">Opp. Score</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800">
                             {seoKeywords.map((kw, i) => (
                                <tr key={i} className="hover:bg-slate-800 transition-colors group">
                                   <td className="p-4 font-medium text-white">
                                      {kw.keyword}
                                      <div className="md:hidden text-xs text-slate-500 mt-1">{kw.intent}</div>
                                   </td>
                                   <td className="p-4 hidden md:table-cell">
                                      <span className={`px-2 py-1 rounded text-xs border ${
                                         kw.intent === 'Commercial' ? 'bg-green-900/20 text-green-400 border-green-900/50' :
                                         kw.intent === 'Transactional' ? 'bg-blue-900/20 text-blue-400 border-blue-900/50' :
                                         'bg-slate-800 text-slate-400 border-slate-700'
                                      }`}>{kw.intent}</span>
                                   </td>
                                   <td className="p-4 text-slate-300 font-mono">{kw.volume}</td>
                                   <td className="p-4">
                                      <div className="flex items-center gap-2">
                                         <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                                            <div className={`h-full rounded-full ${kw.difficulty > 70 ? 'bg-red-500' : kw.difficulty > 40 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${kw.difficulty}%` }}></div>
                                         </div>
                                         <span className="text-xs text-slate-500 w-6">{kw.difficulty}</span>
                                      </div>
                                   </td>
                                   <td className="p-4 text-right">
                                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-indigo-900/30 text-indigo-400 font-bold text-xs border border-indigo-500/30">
                                         {kw.opportunityScore}
                                      </div>
                                   </td>
                                </tr>
                             ))}
                          </tbody>
                       </table>
                    </div>
                 </div>
              )}
           </div>
        )}

        {/* EDITOR TAB */}
        {activeTab === 'editor' && (
           <div className="flex flex-col lg:flex-row gap-6 h-full animate-fadeIn min-h-[600px]">
              <div className="flex-1 flex flex-col gap-4">
                 <Card className="flex-none bg-slate-800 border-slate-700 p-4">
                    <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Focus Keyword</label>
                    <div className="flex gap-2">
                       <input 
                         type="text" 
                         placeholder="e.g. Best CRM Software" 
                         value={targetKeyword}
                         onChange={(e) => setTargetKeyword(e.target.value)}
                         className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none"
                       />
                       <Button onClick={analyzeContent} disabled={isAnalyzing} className="h-[38px] px-4">
                          {isAnalyzing ? <RefreshCw className="animate-spin" size={16}/> : 'Check Score'}
                       </Button>
                    </div>
                 </Card>
                 <div className="flex-1 relative">
                    <textarea 
                       className="w-full h-full bg-slate-900 border border-slate-700 rounded-xl p-6 text-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none resize-none font-serif text-lg leading-relaxed shadow-inner"
                       placeholder="Start writing your content here... The AI will analyze readability, keyword density, and provide LSI suggestions."
                       value={editorContent}
                       onChange={(e) => setEditorContent(e.target.value)}
                    />
                    <div className="absolute bottom-4 right-4 text-xs text-slate-600 bg-slate-900/80 px-2 py-1 rounded">
                       {editorContent.split(/\s+/).filter(w => w.length > 0).length} words
                    </div>
                 </div>
              </div>

              <div className="w-full lg:w-80 flex-shrink-0 space-y-4">
                 {seoContentAnalysis ? (
                    <div className="animate-slideIn space-y-4 h-full overflow-y-auto pr-1 custom-scrollbar">
                       <Card className="text-center p-6 bg-gradient-to-br from-indigo-900/30 to-slate-900 border-indigo-500/30">
                          <div className="relative inline-flex items-center justify-center">
                             <svg className="w-24 h-24">
                               <circle cx="48" cy="48" r="40" stroke="#1e293b" strokeWidth="8" fill="none" />
                               <circle cx="48" cy="48" r="40" stroke="#6366f1" strokeWidth="8" fill="none" strokeDasharray="251" strokeDashoffset={251 - (251 * seoContentAnalysis.score) / 100} className="transition-all duration-1000" transform="rotate(-90 48 48)" />
                             </svg>
                             <div className="absolute text-2xl font-bold text-white">{seoContentAnalysis.score}</div>
                          </div>
                          <div className="text-xs uppercase font-bold text-indigo-300 mt-2">Optimization Score</div>
                       </Card>

                       <Card className="bg-slate-800 border-slate-700">
                          <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 border-b border-slate-700 pb-2">Analysis</h4>
                          <div className="space-y-4">
                             <div>
                                <div className="flex justify-between text-sm mb-1">
                                   <span className="text-slate-300">Readability</span>
                                   <span className="text-white font-medium">{seoContentAnalysis.readability}</span>
                                </div>
                                <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                   <div className="h-full bg-blue-500 w-3/4 rounded-full"></div>
                                </div>
                             </div>
                             <div>
                                <div className="flex justify-between text-sm mb-1">
                                   <span className="text-slate-300">Keyword Density</span>
                                   <span className={`font-medium ${seoContentAnalysis.keywordDensity > 2.5 ? 'text-red-400' : seoContentAnalysis.keywordDensity < 0.5 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                      {seoContentAnalysis.keywordDensity}%
                                   </span>
                                </div>
                                <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                   <div 
                                      className={`h-full rounded-full ${seoContentAnalysis.keywordDensity > 2.5 ? 'bg-red-500' : 'bg-emerald-500'}`} 
                                      style={{ width: `${Math.min(seoContentAnalysis.keywordDensity * 20, 100)}%` }}
                                   ></div>
                                </div>
                             </div>
                          </div>
                       </Card>

                       <Card className="bg-slate-800 border-slate-700">
                          <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 border-b border-slate-700 pb-2">Suggestions</h4>
                          <ul className="space-y-2">
                             {seoContentAnalysis.suggestions.map((s, i) => (
                                <li key={i} className="flex items-start gap-2 text-xs text-slate-300 leading-relaxed">
                                   <AlertTriangle size={12} className="text-amber-400 mt-0.5 flex-shrink-0" /> {s}
                                </li>
                             ))}
                          </ul>
                       </Card>

                       <Card className="bg-slate-800 border-slate-700">
                          <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 border-b border-slate-700 pb-2">Missing LSI Keywords</h4>
                          <div className="flex flex-wrap gap-2">
                             {seoContentAnalysis.missingKeywords.map((k, i) => (
                                <span key={i} className="text-[10px] bg-slate-900 text-slate-400 px-2 py-1 rounded border border-slate-700">{k}</span>
                             ))}
                          </div>
                       </Card>
                    </div>
                 ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-800 rounded-xl text-slate-500 bg-slate-900/50">
                       <Zap size={32} className="mb-4 opacity-30" />
                       <p className="text-sm font-medium text-slate-400 mb-2">Real-time Assistant</p>
                       <p className="text-xs leading-relaxed max-w-[200px]">
                          Enter content and a target keyword, then click "Check Score" to get AI-powered SEO feedback.
                       </p>
                    </div>
                 )}
              </div>
           </div>
        )}

        {/* INTEGRATIONS TAB */}
        {activeTab === 'integrations' && (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
              {['WordPress', 'Shopify', 'Webflow', 'Wix', 'Squarespace'].map(cms => {
                 const isConnected = connectedCms.includes(cms);
                 return (
                    <Card key={cms} className={`flex flex-col justify-between h-48 transition-all relative overflow-hidden group ${isConnected ? 'border-emerald-500/50 bg-emerald-900/10' : 'border-slate-700 bg-slate-800 hover:border-slate-600'}`}>
                       <div className="flex justify-between items-start relative z-10">
                          <div className={`p-3 rounded-xl ${isConnected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                             {cms === 'WordPress' ? <FileText size={24} /> : cms === 'Shopify' ? <Globe size={24} /> : <AlignLeft size={24} />}
                          </div>
                          {isConnected && <div className="text-emerald-400 bg-emerald-500/10 p-1 rounded-full"><CheckCircle2 size={18} /></div>}
                       </div>
                       
                       <div className="relative z-10">
                          <h3 className="font-bold text-white text-lg mb-1">{cms}</h3>
                          <p className="text-xs text-slate-400">
                             {isConnected ? 'Auto-sync enabled for meta tags & content.' : 'Connect to publish optimizations directly.'}
                          </p>
                       </div>

                       <Button 
                          variant={isConnected ? 'outline' : 'primary'} 
                          className="w-full relative z-10"
                          onClick={() => toggleCms(cms)}
                       >
                          {isConnected ? 'Manage Connection' : 'Connect Store'}
                       </Button>
                       
                       {/* Decorative BG */}
                       <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-current opacity-5 rounded-full pointer-events-none group-hover:scale-150 transition-transform duration-500 text-indigo-500"></div>
                    </Card>
                 )
              })}
           </div>
        )}

      </div>
    </div>
  );
};
