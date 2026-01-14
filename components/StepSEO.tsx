
import React, { useState, useMemo } from 'react';
import { generateSeoAudit, generateKeywordStrategy, analyzeContentSeo } from '../services/geminiService';
import { NicheSuggestion, PersonaProfile, KeywordData, SeoAuditIssue, SeoContentScore, User, SeoAuditResponse } from '../types';
import { Button, Card, SectionTitle } from './Shared';
import { Search, Globe, AlertTriangle, CheckCircle2, BarChart2, Zap, FileText, Settings, Smartphone, RefreshCw, AlignLeft, TrendingUp, AlertOctagon, Info, ArrowUpRight, Target, ExternalLink } from 'lucide-react';
import { notify } from '../services/notificationService';
import { FeatureGuard } from './FeatureGuard';
import { permissionService } from '../services/permissionService';

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
  onUpgrade?: () => void;
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
  user,
  onUpgrade
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'audit' | 'keywords' | 'editor' | 'integrations'>('overview');
  const [loading, setLoading] = useState(false);
  const [auditSources, setAuditSources] = useState<any[]>([]);

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
    if (!seoAuditResults || seoAuditResults.length === 0) return 0;
    const total = seoAuditResults.length;
    const critical = seoAuditResults.filter(i => i.severity === 'critical').length;
    const warning = seoAuditResults.filter(i => i.severity === 'warning').length;
    const passed = seoAuditResults.filter(i => i.severity === 'passed').length;
    
    // Total analysis score: Weight criticals heavily, passed checks improve score
    const deductions = (critical * 20) + (warning * 8);
    const score = Math.max(0, 100 - deductions);
    
    return Math.min(100, score);
  }, [seoAuditResults]);

  const auditStats = useMemo(() => ({
    critical: (seoAuditResults || []).filter(i => i.severity === 'critical').length,
    warning: (seoAuditResults || []).filter(i => i.severity === 'warning').length,
    info: (seoAuditResults || []).filter(i => i.severity === 'info').length,
    passed: (seoAuditResults || []).filter(i => i.severity === 'passed').length
  }), [seoAuditResults]);

  // --- Handlers ---

  const runAudit = async () => {
    if (!auditUrl) {
        notify.error("Please enter a URL to audit");
        return;
    }
    setLoading(true);
    setAuditSources([]);
    try {
      const response: SeoAuditResponse = await generateSeoAudit(auditUrl, productName);
      const results = response.results || [];
      const sources = response.sources || [];
      
      setAuditSources(sources);
      onUpdate({ seoAuditResults: results });
      notify.success("Site audit complete");
    } catch (e) {
      console.error(e);
      notify.error("Audit failed. Site may be unreachable.");
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
      notify.success("Strategy generated");
    } catch (e) {
      console.error(e);
      notify.error("Keyword research failed");
    } finally {
      setLoading(false);
    }
  };

  const analyzeContent = async () => {
    if (!editorContent || !targetKeyword) {
        notify.warning("Enter content and target keyword");
        return;
    }
    setIsAnalyzing(true);
    try {
      const results = await analyzeContentSeo(editorContent, targetKeyword);
      onUpdate({ seoContentAnalysis: results });
      notify.success("Analysis updated");
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
          setConnectedCms([...connectedCms, cms]);
          notify.success(`${cms} connected`);
      }
  };

  const issueItems = seoAuditResults.filter(i => i.severity !== 'passed');
  const passedItems = seoAuditResults.filter(i => i.severity === 'passed');

  if (user && !permissionService.hasAccess(user, 'pro') && onUpgrade) {
    return <FeatureGuard user={user} requiredTier="pro" featureName="SEO Suite" onUpgrade={onUpgrade}>{null}</FeatureGuard>;
  }

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-140px)] flex flex-col animate-fadeIn">
      <div className="flex-shrink-0 mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <SectionTitle 
            title="SEO Command Center" 
            subtitle="Grounded audits, competitive keywords, and content intelligence." 
          />
        </div>
        
        <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 overflow-x-auto shadow-sm">
          {[
            { id: 'overview', icon: BarChart2, label: 'Overview' },
            { id: 'audit', icon: AlertOctagon, label: 'Technical Audit' },
            { id: 'keywords', icon: Search, label: 'Keywords' },
            { id: 'editor', icon: FileText, label: 'Optimizer' },
            { id: 'integrations', icon: Zap, label: 'Sync' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'bg-indigo-600 text-white shadow-lg' 
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
        
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <Card className="flex flex-col items-center justify-center p-8 bg-slate-900/50 border-slate-800">
                <div className="relative w-40 h-40 flex items-center justify-center mb-6">
                   <svg className="w-full h-full transform -rotate-90">
                     <circle cx="80" cy="80" r="70" stroke="#1e293b" strokeWidth="12" fill="none" />
                     <circle 
                        cx="80" cy="80" r="70" 
                        stroke={healthScore > 80 ? "#10b981" : healthScore > 50 ? "#f59e0b" : "#ef4444"} 
                        strokeWidth="12" fill="none" 
                        strokeDasharray="440" 
                        strokeDashoffset={440 - (440 * (seoAuditResults?.length > 0 ? healthScore : 0)) / 100} 
                        className="transition-all duration-1000 ease-out" 
                        strokeLinecap="round"
                     />
                   </svg>
                   <div className="absolute flex flex-col items-center">
                     <span className="text-4xl font-bold text-white">
                       {seoAuditResults?.length > 0 ? healthScore : '--'}
                     </span>
                     <span className="text-xs text-slate-500 uppercase font-bold">Health Score</span>
                   </div>
                </div>
                <div className="grid grid-cols-2 w-full gap-2 text-center">
                   <div className="p-2 rounded bg-red-500/10 border border-red-500/20">
                      <div className="text-lg font-bold text-red-400">{auditStats.critical}</div>
                      <div className="text-[10px] text-red-300/70 uppercase">Critical</div>
                   </div>
                   <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/20">
                      <div className="text-lg font-bold text-emerald-400">{auditStats.passed}</div>
                      <div className="text-[10px] text-emerald-300/70 uppercase">Passed</div>
                   </div>
                </div>
             </Card>

             <Card className="md:col-span-2 flex flex-col bg-slate-800 border-slate-700">
                <h3 className="font-bold text-white flex items-center gap-2 mb-6 uppercase tracking-widest text-xs text-slate-500">
                   <Target size={14} className="text-emerald-400" /> Keyword Opportunity Snapshot
                </h3>
                {seoKeywords?.length > 0 ? (
                   <div className="flex-1 space-y-3">
                      {seoKeywords.slice(0, 4).map((kw, i) => (
                         <div key={i} className="flex justify-between items-center p-3 bg-slate-900/50 rounded-lg border border-slate-700/50 group hover:border-indigo-500 transition-colors">
                            <span className="text-slate-100 font-medium text-sm">{kw.keyword}</span>
                            <div className="flex items-center gap-4">
                               <span className="text-xs text-slate-500">{kw.volume} searches</span>
                               <span className="text-indigo-400 font-bold text-xs bg-indigo-900/20 px-2 py-0.5 rounded border border-indigo-500/20">{kw.opportunityScore}% Opp</span>
                            </div>
                         </div>
                      ))}
                      <Button onClick={() => setActiveTab('keywords')} variant="secondary" className="w-full text-xs h-9">Full Keyword Map</Button>
                   </div>
                ) : (
                   <div className="flex-1 flex flex-col items-center justify-center text-slate-500 border border-dashed border-slate-700 rounded-xl p-8">
                      <Search size={32} className="mb-3 opacity-20" />
                      <p className="text-xs">No analysis data yet.</p>
                   </div>
                )}
             </Card>
          </div>
        )}

        {/* ... Rest of tabs logic remains unchanged but inside the guard ... */}
        {activeTab === 'audit' && (
          <div className="space-y-6">
             <Card className="bg-slate-800 border-slate-700">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                   <div className="flex-1 w-full">
                      <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">Crawl Target URL</label>
                      <div className="relative">
                         <Globe className="absolute left-3 top-3 text-slate-500" size={18} />
                         <input 
                           type="url" 
                           value={auditUrl}
                           onChange={(e) => setAuditUrl(e.target.value)}
                           placeholder="https://example.com"
                           className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                         />
                      </div>
                   </div>
                   <Button onClick={runAudit} disabled={loading} className="w-full md:w-auto h-[46px] min-w-[180px]">
                      {loading ? <RefreshCw className="animate-spin" /> : 'Run Grounded Audit'}
                   </Button>
                </div>
             </Card>

             {loading && (
               <div className="text-center py-20 bg-slate-900/50 rounded-xl border border-dashed border-slate-800 animate-pulse">
                  <RefreshCw size={48} className="text-indigo-500 animate-spin mx-auto mb-4" />
                  <h4 className="text-white font-bold mb-2 uppercase text-sm">Deploying Technical Crawler...</h4>
                  <p className="text-slate-500 text-xs">Simulating Googlebot & Querying Index data.</p>
               </div>
             )}

             {auditSources.length > 0 && !loading && (
               <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-4 flex flex-wrap gap-2 items-center">
                  <div className="text-indigo-400 text-[10px] font-bold uppercase tracking-widest mr-2">Audit Footprints:</div>
                  {auditSources.map((source, i) => (
                    <a key={i} href={source.web?.uri} target="_blank" className="text-[10px] font-medium text-slate-400 bg-slate-800 px-2 py-1 rounded border border-slate-700 flex items-center gap-1 hover:text-white transition-colors">
                       <ExternalLink size={10} /> {new URL(source.web?.uri).hostname}
                    </a>
                  ))}
               </div>
             )}

             {seoAuditResults?.length > 0 && !loading && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                   <div>
                      <h3 className="text-xs font-bold text-red-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                         <AlertOctagon size={16} /> Technical Issues ({issueItems.length})
                      </h3>
                      <div className="space-y-3">
                         {issueItems.map((item, idx) => (
                            <div key={idx} className={`p-4 rounded-xl border bg-slate-800/50 transition-all ${
                               item.severity === 'critical' ? 'border-red-500/30' : 'border-amber-500/30'
                            }`}>
                               <div className="flex justify-between items-start mb-2">
                                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                     item.severity === 'critical' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                                  }`}>{item.severity}</span>
                                  <span className="text-[10px] text-slate-500 font-bold uppercase">{item.category}</span>
                               </div>
                               <h4 className="text-white font-bold text-sm mb-1">{item.issue}</h4>
                               <p className="text-slate-400 text-xs leading-relaxed italic">Recommendation: {item.recommendation}</p>
                            </div>
                         ))}
                         {issueItems.length === 0 && <p className="text-slate-600 text-xs italic">No issues found.</p>}
                      </div>
                   </div>

                   <div>
                      <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                         <CheckCircle2 size={16} /> Healthy Systems ({passedItems.length})
                      </h3>
                      <div className="space-y-3 opacity-70">
                         {passedItems.map((item, idx) => (
                            <div key={idx} className="p-4 rounded-xl border border-emerald-500/20 bg-slate-900/50">
                               <div className="flex justify-between items-start mb-2">
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase bg-emerald-500/20 text-emerald-400">PASSED</span>
                                  <span className="text-[10px] text-slate-600 font-bold uppercase">{item.category}</span>
                               </div>
                               <h4 className="text-slate-300 font-bold text-sm mb-1">{item.issue}</h4>
                               <p className="text-slate-500 text-[11px]">{item.recommendation}</p>
                            </div>
                         ))}
                         {passedItems.length === 0 && <p className="text-slate-600 text-xs italic">No passed tests recorded.</p>}
                      </div>
                   </div>
                </div>
             )}
          </div>
        )}

        {activeTab === 'keywords' && (
           <div className="space-y-6">
              <Card className="bg-slate-800 border-slate-700">
                 <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                       <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">Seed Topic / competitor</label>
                       <div className="relative">
                          <Search className="absolute left-3 top-3 text-slate-500" size={18} />
                          <input 
                            type="text" 
                            value={seedKeyword}
                            onChange={(e) => setSeedKeyword(e.target.value)}
                            placeholder="e.g. B2B CRM tools"
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                          />
                       </div>
                    </div>
                    <Button onClick={runKeywordResearch} disabled={loading} className="w-full md:w-auto h-[46px]">
                       {loading ? <RefreshCw className="animate-spin" /> : 'Analyze Landscape'}
                    </Button>
                 </div>
              </Card>

              {seoKeywords?.length > 0 && (
                 <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
                    <table className="w-full text-left text-sm">
                       <thead className="bg-slate-950 text-slate-500 font-bold uppercase text-[10px] tracking-widest">
                          <tr>
                             <th className="p-4">Keyword Target</th>
                             <th className="p-4">Intent</th>
                             <th className="p-4">Monthly Vol</th>
                             <th className="p-4">Difficulty %</th>
                             <th className="p-4 text-right">Potential</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-800">
                          {seoKeywords.map((kw, i) => (
                             <tr key={i} className="hover:bg-slate-800/40 transition-colors">
                                <td className="p-4 font-bold text-white">{kw.keyword}</td>
                                <td className="p-4">
                                   <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 border border-slate-700 text-slate-400">{kw.intent.toUpperCase()}</span>
                                </td>
                                <td className="p-4 text-slate-400">{kw.volume}</td>
                                <td className="p-4">
                                   <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                                      <div className={`h-full rounded-full ${kw.difficulty > 70 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${kw.difficulty}%` }}></div>
                                   </div>
                                </td>
                                <td className="p-4 text-right text-indigo-400 font-bold">{kw.opportunityScore}%</td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              )}
           </div>
        )}

        {activeTab === 'editor' && (
           <div className="flex flex-col lg:flex-row gap-6 h-full min-h-[600px]">
              <div className="flex-1 flex flex-col gap-4">
                 <Card className="flex-none bg-slate-800 border-slate-700 p-4">
                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block tracking-widest">Focus Keyword Node</label>
                    <div className="flex gap-2">
                       <input 
                         type="text" 
                         placeholder="e.g. Best CRM for Startups" 
                         value={targetKeyword}
                         onChange={(e) => setTargetKeyword(e.target.value)}
                         className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none"
                       />
                       <Button onClick={analyzeContent} disabled={isAnalyzing} className="h-[38px] px-4">
                          {isAnalyzing ? <RefreshCw className="animate-spin" size={16}/> : 'Analyze Semantic Score'}
                       </Button>
                    </div>
                 </Card>
                 <textarea 
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-6 text-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none resize-none font-serif text-lg leading-relaxed shadow-inner"
                    placeholder="Draft your high-converting SEO content here..."
                    value={editorContent}
                    onChange={(e) => setEditorContent(e.target.value)}
                 />
              </div>

              {seoContentAnalysis && (
                 <div className="w-full lg:w-80 space-y-4">
                    <Card className="text-center p-6 bg-gradient-to-br from-indigo-500/10 to-transparent border-indigo-500/30">
                       <div className="text-3xl font-bold text-white mb-1">{seoContentAnalysis.score}%</div>
                       <div className="text-[10px] uppercase font-bold text-indigo-300 tracking-widest">Optimized Status</div>
                    </Card>
                    <Card className="bg-slate-800 border-slate-700">
                       <h4 className="text-[10px] font-bold text-slate-500 uppercase mb-4 tracking-widest">Strategic Advice</h4>
                       <ul className="space-y-3">
                          {seoContentAnalysis.suggestions.map((s, i) => (
                             <li key={i} className="flex items-start gap-2 text-[11px] text-slate-300 leading-relaxed">
                                <AlertTriangle size={12} className="text-amber-500 mt-0.5 flex-shrink-0" /> {s}
                             </li>
                          ))}
                       </ul>
                    </Card>
                 </div>
              )}
           </div>
        )}

        {activeTab === 'integrations' && (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {['WordPress', 'Shopify', 'Webflow'].map(cms => (
                 <Card key={cms} className="flex flex-col justify-between h-44 bg-slate-800/50 border-slate-700 hover:border-indigo-500 transition-all">
                    <div>
                       <h3 className="font-bold text-white mb-1">{cms} Bridge</h3>
                       <p className="text-[11px] text-slate-500">Auto-sync metadata and publish SEO optimized posts directly.</p>
                    </div>
                    <Button 
                       variant={connectedCms.includes(cms) ? 'outline' : 'primary'} 
                       className="w-full font-bold text-xs"
                       onClick={() => toggleCms(cms)}
                    >
                       {connectedCms.includes(cms) ? 'Disconnect' : 'Connect via API'}
                    </Button>
                 </Card>
              ))}
           </div>
        )}
      </div>
    </div>
  );
};
