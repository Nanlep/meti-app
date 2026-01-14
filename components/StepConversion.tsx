
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ProjectData, User, LeadItem, LocalBusinessResult, SocialSearchQuery, ChatMessage, QualificationQuestion, FollowUpEmail } from '../types';
import { searchLocalBusinesses, generateSocialSearchQueries, sendChatMessage, sendChatMessageStream, handleObjection, generateColdDMs, generateQualification, generateFollowUp } from '../services/geminiService';
import { Button, Card, SectionTitle } from './Shared';
import { FeatureGuard } from './FeatureGuard';
import { 
  MapPin, RefreshCw, Star, ExternalLink, 
  MessageCircle, ShieldAlert, Zap, Send, User as UserIcon, 
  Copy, Check, BookOpen, Mail, Target,
  CheckCircle2, PlusCircle, Download, Search, Info, Link as LinkIcon, Building2, Globe
} from 'lucide-react';
import { permissionService } from '../services/permissionService';
import { notify } from '../services/notificationService';
import { generateId } from '../utils/core';

interface StepConversionProps {
  data: ProjectData;
  onUpdate: (updates: Partial<ProjectData>) => void;
  user?: User;
  onUpgrade?: () => void;
}

export const StepConversion: React.FC<StepConversionProps> = ({ data, onUpdate, user, onUpgrade }) => {
  const [activeTab, setActiveTab] = useState<'intel' | 'playbook' | 'outreach' | 'simulator'>('intel');
  
  // --- INTEL (LEADS) STATE ---
  const [location, setLocation] = useState('');
  const [loadingLocal, setLoadingLocal] = useState(false);
  const [localResults, setLocalResults] = useState<LocalBusinessResult | null>(data.leadSearchResults || null);
  const [socialQueries, setSocialQueries] = useState<SocialSearchQuery[]>(data.socialSearchQueries || []);
  
  useEffect(() => {
    setLocalResults(data.leadSearchResults || null);
    setSocialQueries(data.socialSearchQueries || []);
  }, [data.leadSearchResults, data.socialSearchQueries]);

  const [loadingSocial, setLoadingSocial] = useState(false);
  
  // --- PLAYBOOK (STRATEGY) STATE ---
  const [qualQuestions, setQualQuestions] = useState<QualificationQuestion[]>(data.qualificationFramework || []);
  const [objections, setObjections] = useState<string[]>(data.salesObjections || []);
  const [loadingPlaybook, setLoadingPlaybook] = useState(false);
  const [objectionInput, setObjectionInput] = useState('');
  const [analyzingObjection, setAnalyzingObjection] = useState(false);
  const [currentRebuttals, setCurrentRebuttals] = useState<string[]>([]);

  // --- OUTREACH (EXECUTION) STATE ---
  const [coldDms, setColdDms] = useState<string[]>(data.salesColdDms || []);
  const [emailSeq, setEmailSeq] = useState<FollowUpEmail[]>(data.followUpSequence || []);
  const [loadingOutreach, setLoadingOutreach] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // --- SIMULATOR (ROLEPLAY) STATE ---
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [currentSources, setCurrentSources] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const persona = data.persona!;
  const niche = data.selectedNiche!;

  const existingCompanyNames = useMemo(() => {
      const crmLeads = Array.isArray(data.crmLeads) ? data.crmLeads : [];
      return new Set(crmLeads.map(l => l.companyName.toLowerCase().trim()));
  }, [data.crmLeads]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeTab]);

  const handleLocalSearch = async () => {
    if (!location) { notify.error("Enter a location"); return; }
    setLoadingLocal(true);
    try {
      const results = await searchLocalBusinesses(niche.name, location);
      setLocalResults(results);
      onUpdate({ leadSearchResults: results });
      notify.success("Market scan complete");
    } catch (e) { 
      console.error("Local search error:", e);
      notify.error("Search failed"); 
    } finally { 
      setLoadingLocal(false); 
    }
  };

  const addToPipeline = (business: any) => {
      if (!business || !business.title) return;
      const title = business.title;
      if (existingCompanyNames.has(title.toLowerCase().trim())) {
          notify.info(`${title} is already in pipeline.`);
          return;
      }
      const existingLeads = Array.isArray(data.crmLeads) ? data.crmLeads : [];
      const newLead: LeadItem = {
          id: generateId(),
          companyName: title,
          contactName: '', 
          source: 'Lead Scout',
          stage: 'New',
          value: data.productPrice || 0,
          probability: 10,
          notes: `Lead scouted in ${location}.\nRef: ${business.uri}\nSnippet: ${business.placeAnswerSources?.reviewSnippets?.[0]?.content || 'Scanned node'}`,
          addedAt: Date.now()
      };
      onUpdate({ crmLeads: [...existingLeads, newLead] });
      notify.success("Target pushed to CRM");
  };

  const downloadLeadsCSV = () => {
    if (!localResults?.mapChunks) return;
    const headers = ['Target Name', 'Source', 'Reference URL', 'AI Context'];
    const rows = localResults.mapChunks
        .map(c => {
            const m = c.maps || (c as any).web;
            if (!m || !m.title) return null;
            return [
                `"${m.title.replace(/"/g, '""')}"`,
                c.maps ? 'Maps Grounding' : 'Web Grounding',
                `"${m.uri || ''}"`,
                `"${(m.placeAnswerSources?.reviewSnippets?.[0]?.content || 'Verified business node').replace(/"/g, '""')}"`
            ];
        }).filter(Boolean);
    const csvContent = [headers.join(','), ...rows.map(r => r!.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Lead_Report_${location.replace(/\s+/g, '_')}.csv`;
    link.click();
    notify.success("Report exported");
  };

  const handleSocialGeneration = async () => {
    setLoadingSocial(true);
    try {
      const results = await generateSocialSearchQueries(persona, niche.name);
      setSocialQueries(results);
      onUpdate({ socialSearchQueries: results });
      notify.success("Agents deployed");
    } catch (e) { 
      console.error("Social gen error:", e);
      notify.error("Agent failed to deploy"); 
    } finally { 
      setLoadingSocial(false); 
    }
  };

  const handleGeneratePlaybook = async () => {
    setLoadingPlaybook(true);
    try {
      const questions = await generateQualification(data.productName, persona);
      setQualQuestions(questions);
      onUpdate({ qualificationFramework: questions }); 
      notify.success("Qualification framework generated");
    } catch (e) { notify.error("Failed to generate playbook"); } finally { setLoadingPlaybook(false); }
  };

  const handleObjectionSubmit = async () => {
    if (!objectionInput.trim()) return;
    setAnalyzingObjection(true);
    try {
      const results = await handleObjection(objectionInput, data.productName, persona);
      setCurrentRebuttals(results);
      if (!objections.includes(objectionInput)) {
          const newObjections = [...objections, objectionInput];
          setObjections(newObjections);
          onUpdate({ salesObjections: newObjections });
      }
    } catch (e) { notify.error("Analysis failed"); } finally { setAnalyzingObjection(false); }
  };

  const handleGenerateOutreach = async () => {
    setLoadingOutreach(true);
    try {
      const [dms, emails] = await Promise.all([
        generateColdDMs(data.productName, persona),
        generateFollowUp(data.productName, persona, null)
      ]);
      setColdDms(dms);
      setEmailSeq(emails);
      onUpdate({ salesColdDms: dms, followUpSequence: emails });
      notify.success("Assets ready");
    } catch (e) { notify.error("Generation failed"); } finally { setLoadingOutreach(false); }
  };

  const startSimulation = () => {
    setMessages([{ role: 'model', text: `Hi there. I'm a ${persona.jobTitle}. I'm listening, but I'm busy. What do you have?` }]);
    setCurrentSources([]);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    const userMsg: ChatMessage = { role: 'user', text: inputMessage };
    const newHistory = [...messages, userMsg];
    
    // Add user msg + empty model msg for streaming
    setMessages([...newHistory, { role: 'model', text: '' }]);
    setInputMessage('');
    setChatLoading(true);
    setCurrentSources([]);

    try {
      await sendChatMessageStream(newHistory, data.productName, persona, (chunk) => {
        setMessages(prev => {
          const last = prev[prev.length - 1];
          const rest = prev.slice(0, -1);
          return [...rest, { role: 'model', text: (last.text || '') + chunk.text }];
        });
        if (chunk.sources && chunk.sources.length > 0) {
          setCurrentSources(prev => [...prev, ...chunk.sources!]);
        }
      });
    } catch (e) { 
      notify.error("Stream failed. Simulator offline."); 
    } finally { 
      setChatLoading(false); 
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
    notify.info("Copied");
  };

  const extractedTargets = useMemo(() => {
    if (!localResults?.mapChunks) return [];
    return localResults.mapChunks
      .map(c => c.maps || (c as any).web)
      .filter(item => item && item.title);
  }, [localResults]);

  if (user && !permissionService.hasAccess(user, 'pro') && onUpgrade) {
    return <FeatureGuard user={user} requiredTier="pro" featureName="Conversion Engine" onUpgrade={onUpgrade}>{null}</FeatureGuard>;
  }

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-140px)] flex flex-col">
      <div className="flex-shrink-0 mb-6 flex flex-col md:flex-row justify-between items-end gap-4">
        <SectionTitle title="Conversion Engine" subtitle="From target acquisition to closed deal." />
        <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 shadow-sm">
          {[
            { id: 'intel', icon: MapPin, label: 'Intel' },
            { id: 'playbook', icon: BookOpen, label: 'Playbook' },
            { id: 'outreach', icon: Send, label: 'Outreach' },
            { id: 'simulator', icon: MessageCircle, label: 'Simulator' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
              <tab.icon size={16} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden bg-slate-900/50 border border-slate-800 rounded-xl relative">
        {activeTab === 'intel' && (
          /* ... existing intel UI ... */
          <div className="h-full flex flex-col md:flex-row animate-fadeIn">
             <div className="w-full md:w-80 border-r border-slate-800 flex flex-col bg-slate-900">
                <div className="p-4 border-b border-slate-800">
                   <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block tracking-widest">Market Scan</label>
                   <div className="flex gap-2">
                      <div className="relative flex-1">
                        <MapPin className="absolute left-2.5 top-2.5 text-slate-500" size={14} />
                        <input 
                          type="text" 
                          placeholder="Region / City" 
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 rounded pl-8 pr-3 py-2 text-white text-sm outline-none focus:border-indigo-500 transition-colors"
                          onKeyDown={(e) => e.key === 'Enter' && handleLocalSearch()}
                        />
                      </div>
                      <Button size="sm" onClick={handleLocalSearch} disabled={loadingLocal} className="px-3 min-w-[44px]">
                        {loadingLocal ? <RefreshCw className="animate-spin" size={16} /> : <Search size={16} />}
                      </Button>
                   </div>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4 bg-slate-900/50">
                   <h4 className="text-[10px] font-bold text-slate-500 uppercase flex justify-between items-center tracking-widest">
                      Search Agents
                      <button onClick={handleSocialGeneration} disabled={loadingSocial} className="text-indigo-400 hover:text-indigo-300 font-bold uppercase">
                         {loadingSocial ? 'Busy...' : 'Run'}
                      </button>
                   </h4>
                   {socialQueries.map((q, idx) => (
                      <div key={idx} className="p-3 bg-slate-800/80 rounded-lg border border-slate-700/50 text-[10px] group transition-all">
                         <div className="flex justify-between mb-1.5">
                            <span className="font-bold text-white uppercase">{q.platform}</span>
                            <a href={q.directUrl} target="_blank" className="text-slate-500 hover:text-indigo-400 transition-colors"><ExternalLink size={10}/></a>
                         </div>
                         <div className="font-mono text-slate-400 break-all bg-slate-950/50 p-2 rounded border border-slate-800">{q.query}</div>
                      </div>
                   ))}
                </div>
             </div>

             <div className="flex-1 flex flex-col min-h-0 bg-slate-950/20">
                <div className="p-6 pb-2">
                   {localResults?.text && (
                      <div className="mb-6 p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-xl flex gap-3 items-start">
                         <Info size={16} className="text-indigo-400 mt-0.5 flex-shrink-0" />
                         <p className="text-sm text-slate-300 leading-relaxed italic">"{localResults.text}"</p>
                      </div>
                   )}

                   <div className="flex justify-between items-center mb-6">
                       <h3 className="text-lg font-bold text-white flex items-center gap-2 uppercase tracking-widest text-xs text-slate-500">
                           <Target size={14} className="text-emerald-400" /> Grounded Targets ({extractedTargets.length})
                       </h3>
                       {extractedTargets.length > 0 && (
                          <Button onClick={downloadLeadsCSV} variant="secondary" className="text-[10px] h-8 bg-slate-800 hover:bg-slate-700 border-slate-700 uppercase tracking-widest">
                             <Download size={12} className="mr-2" /> Export
                          </Button>
                       )}
                   </div>
                </div>

                <div className="flex-1 overflow-x-auto custom-scrollbar px-6 pb-6">
                   {extractedTargets.length > 0 ? (
                      <table className="w-full text-left border-collapse min-w-[700px]">
                         <thead>
                            <tr className="border-b border-slate-800 text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] bg-slate-900/30">
                               <th className="py-4 px-4 rounded-tl-xl">Entity Node</th>
                               <th className="py-4 px-4">Verification</th>
                               <th className="py-4 px-4">Intelligence</th>
                               <th className="py-4 px-4 rounded-tr-xl text-right">Pipeline</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-800/50">
                            {extractedTargets.map((m: any, i) => {
                               const isAdded = existingCompanyNames.has(m.title?.toLowerCase().trim() || '');
                               return (
                                  <tr key={i} className={`group hover:bg-slate-900/40 transition-colors ${isAdded ? 'bg-emerald-950/10' : ''}`}>
                                     <td className="py-4 px-4">
                                        <div className="font-bold text-slate-100 truncate max-w-[220px]">{m.title}</div>
                                     </td>
                                     <td className="py-4 px-4">
                                        <a href={m.uri} target="_blank" className="flex items-center gap-1 text-[10px] text-indigo-400 hover:text-indigo-300 transition-colors">
                                           <MapPin size={10} /> Verified Location <ExternalLink size={8} />
                                        </a>
                                     </td>
                                     <td className="py-4 px-4">
                                        <p className="text-[10px] text-slate-500 line-clamp-1 max-w-xs italic font-serif">
                                           {m.placeAnswerSources?.reviewSnippets?.[0]?.content || "Verified business node found."}
                                        </p>
                                     </td>
                                     <td className="py-4 px-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                           <button onClick={() => addToPipeline(m)} disabled={isAdded} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-bold transition-all uppercase tracking-widest ${
                                                 isAdded ? 'bg-emerald-500/10 text-emerald-400' : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                                              }`}>
                                              {isAdded ? <Check size={10}/> : <PlusCircle size={10}/>}
                                              {isAdded ? 'In Pipeline' : 'Push to CRM'}
                                           </button>
                                        </div>
                                     </td>
                                  </tr>
                               );
                            })}
                         </tbody>
                      </table>
                   ) : !loadingLocal && (
                      <div className="h-full flex flex-col items-center justify-center text-slate-600 border-2 border-dashed border-slate-800 rounded-xl m-6 opacity-50">
                         <Target size={48} className="mb-4" />
                         <p className="text-xs uppercase tracking-widest">Target Acquisition Mode Inactive</p>
                      </div>
                   )}
                   {loadingLocal && (
                      <div className="flex flex-col items-center justify-center h-full animate-pulse">
                         <RefreshCw size={48} className="animate-spin text-indigo-500 mb-4" />
                         <p className="text-white font-bold text-xs tracking-[0.3em] uppercase">Scanning Territory Infrastructure...</p>
                      </div>
                   )}
                </div>
             </div>
          </div>
        )}

        {/* Playbook tab ... */}
        {activeTab === 'playbook' && (
           <div className="h-full flex flex-col md:flex-row animate-fadeIn">
              <div className="flex-1 border-r border-slate-800 p-6 overflow-y-auto">
                 <div className="flex justify-between items-center mb-6 uppercase tracking-widest text-[10px] font-bold text-slate-500">
                    <span>Qualification Framework</span>
                    {qualQuestions.length === 0 && <Button size="sm" onClick={handleGeneratePlaybook} disabled={loadingPlaybook}>Analyze</Button>}
                 </div>
                 <div className="space-y-4">
                    {qualQuestions.map((q, i) => (
                       <div key={i} className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                          <div className="text-indigo-400 text-[9px] font-bold uppercase mb-1">Intent: {q.intent}</div>
                          <div className="text-white font-medium text-sm mb-3">{q.question}</div>
                          <div className="text-[10px] text-emerald-400 bg-emerald-950/30 p-2 rounded border border-emerald-500/10 italic">"{q.idealAnswer}"</div>
                       </div>
                    ))}
                 </div>
              </div>
              <div className="flex-1 p-6 overflow-y-auto bg-slate-900/30">
                 <h3 className="uppercase tracking-widest text-[10px] font-bold text-slate-500 mb-6 flex items-center gap-2">
                    <ShieldAlert size={14} className="text-red-400" /> Objection Handler
                 </h3>
                 <div className="flex gap-2 mb-6">
                    <input value={objectionInput} onChange={e => setObjectionInput(e.target.value)} placeholder="e.g. 'Too expensive'" className="flex-1 bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white text-sm outline-none" onKeyDown={(e) => e.key === 'Enter' && handleObjectionSubmit()} />
                    <Button size="sm" onClick={handleObjectionSubmit} disabled={analyzingObjection} className="bg-red-600">
                      {analyzingObjection ? <RefreshCw className="animate-spin" size={16}/> : <Zap size={16}/>}
                    </Button>
                 </div>
                 <div className="space-y-3">
                    {currentRebuttals.map((r, i) => (
                       <div key={i} className="bg-slate-800/80 border border-slate-600/50 p-4 rounded-lg cursor-pointer transition-all hover:bg-slate-800 group" onClick={() => copyToClipboard(r, i)}>
                          <p className="text-xs text-slate-300 italic group-hover:text-white transition-colors">"{r}"</p>
                       </div>
                    ))}
                 </div>
              </div>
           </div>
        )}

        {/* Outreach tab ... */}
        {activeTab === 'outreach' && (
           <div className="h-full flex flex-col p-6 overflow-y-auto animate-fadeIn">
              <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-800">
                 <h3 className="uppercase tracking-widest text-[10px] font-bold text-slate-500">Asset Library: Outreach</h3>
                 {coldDms.length === 0 && <Button onClick={handleGenerateOutreach} disabled={loadingOutreach} size="sm">Generate Tools</Button>}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                 <div className="space-y-4">
                    <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-4">Curiosity DMs</h4>
                    {coldDms.map((dm, i) => (
                       <div key={i} className="bg-slate-800/50 border border-slate-700/50 p-4 rounded-xl relative group">
                          <button onClick={() => copyToClipboard(dm, i+500)} className="absolute top-4 right-4 text-slate-600 hover:text-indigo-400"><Copy size={14}/></button>
                          <p className="text-xs text-slate-300 leading-relaxed pr-6 italic">"{dm}"</p>
                       </div>
                    ))}
                 </div>
                 <div className="space-y-4">
                    <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-4">Nurture Flow</h4>
                    {emailSeq.map((e, i) => (
                       <Card key={i} className="bg-slate-900/50 border-slate-700/50 p-5">
                          <div className="flex justify-between items-start mb-3 border-b border-slate-800 pb-3">
                             <div className="font-bold text-white text-xs">{e.subject}</div>
                             <button onClick={() => copyToClipboard(e.body, i+1000)} className="p-1.5 text-slate-600 hover:text-indigo-400 bg-slate-800 rounded"><Copy size={12}/></button>
                          </div>
                          <div className="text-[11px] text-slate-400 leading-relaxed whitespace-pre-wrap italic">{e.body}</div>
                       </Card>
                    ))}
                 </div>
              </div>
           </div>
        )}

        {activeTab === 'simulator' && (
           <div className="h-full flex flex-col animate-fadeIn">
              <div className="bg-slate-900 p-4 border-b border-slate-800 flex justify-between items-center shadow-lg">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-xl ring-2 ring-indigo-500/20"><UserIcon size={20}/></div>
                    <div>
                        <h3 className="font-bold text-white text-sm">{persona.jobTitle}</h3>
                        <div className="text-[10px] text-emerald-400 uppercase tracking-widest flex items-center gap-1.5 font-bold">
                           <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                           Simulation Online
                        </div>
                    </div>
                 </div>
                 <div className="flex gap-2">
                    {messages.length === 0 && <Button size="sm" onClick={startSimulation} className="bg-indigo-600 text-[10px] font-bold uppercase tracking-widest px-6">Initialize</Button>}
                    {messages.length > 0 && <Button size="sm" variant="secondary" onClick={() => { setMessages([]); setCurrentSources([]); }} className="text-[10px] uppercase font-bold tracking-widest">Reset</Button>}
                 </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-950/50 custom-scrollbar">
                 {messages.map((msg, i) => (
                    <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                       <div className={`max-w-[80%] rounded-2xl px-5 py-3 text-sm shadow-xl ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700'}`}>
                          {msg.text || (chatLoading && i === messages.length - 1 ? '...' : '')}
                       </div>
                       {msg.role === 'model' && i === messages.length - 1 && currentSources.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2 animate-fadeIn">
                             <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1"><Search size={10}/> Market Grounding:</div>
                             {currentSources.map((source, idx) => (
                                <a key={idx} href={source.web?.uri} target="_blank" className="text-[9px] font-bold text-indigo-400 bg-indigo-900/30 px-2 py-0.5 rounded border border-indigo-500/20 flex items-center gap-1 hover:bg-indigo-900/50 transition-colors">
                                   <ExternalLink size={8}/> {new URL(source.web?.uri).hostname.replace('www.', '')}
                                </a>
                             ))}
                          </div>
                       )}
                    </div>
                 ))}
                 {chatLoading && messages[messages.length-1]?.text === '' && (
                    <div className="flex justify-start">
                        <div className="bg-slate-800 border border-slate-700 px-4 py-2 rounded-2xl flex gap-1.5 items-center">
                            <span className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce"></span>
                            <span className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce delay-75"></span>
                            <span className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce delay-150"></span>
                        </div>
                    </div>
                 )}
                 <div ref={messagesEndRef} />
              </div>
              <div className="p-4 bg-slate-900 border-t border-slate-800 flex flex-col gap-2">
                 <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={inputMessage} 
                      onChange={e => setInputMessage(e.target.value)} 
                      onKeyDown={(e) => e.key === 'Enter' && !chatLoading && handleSendMessage()} 
                      placeholder={messages.length === 0 ? "Initialize roleplay above..." : "Type your pitch response..."} 
                      className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-5 py-2.5 text-white outline-none focus:border-indigo-500 transition-all text-sm" 
                      disabled={messages.length === 0 || chatLoading} 
                    />
                    <Button onClick={handleSendMessage} disabled={messages.length === 0 || chatLoading || !inputMessage.trim()} className="rounded-xl px-6 bg-indigo-600">
                        <Send size={18}/>
                    </Button>
                 </div>
                 <p className="text-[9px] text-slate-500 text-center uppercase tracking-widest">Persona-calibration active • Grounding enabled</p>
              </div>
           </div>
        )}
      </div>
    </div>
  );
};
