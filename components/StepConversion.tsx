
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ProjectData, User, LeadItem, LocalBusinessResult, SocialSearchQuery, ChatMessage, QualificationQuestion, FollowUpEmail } from '../types';
import { searchLocalBusinesses, generateSocialSearchQueries, createSalesChat, handleObjection, generateColdDMs, generateQualification, generateFollowUp } from '../services/geminiService';
import { Button, Card, SectionTitle } from './Shared';
import { FeatureGuard } from './FeatureGuard';
import { 
  MapPin, RefreshCw, Star, ExternalLink, 
  MessageCircle, ShieldAlert, Zap, Send, User as UserIcon, 
  Copy, Check, BookOpen, Mail, Target,
  CheckCircle2, PlusCircle, Download, Search
} from 'lucide-react';
import { permissionService } from '../services/permissionService';
import { notify } from '../services/notificationService';
import { generateId } from '../utils/core';

// Interface matching the helper in geminiService.ts
interface SalesChatSession {
  sendMessage: (msg: { message: string }) => Promise<{ text: string }>;
}

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
  const [chatInstance, setChatInstance] = useState<SalesChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const persona = data.persona!;
  const niche = data.selectedNiche!;

  // Optimization: Memoize the set of existing company names for O(1) lookup
  const existingCompanyNames = useMemo(() => {
      return new Set((data.crmLeads || []).map(l => l.companyName.toLowerCase().trim()));
  }, [data.crmLeads]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeTab]);

  // 1. INTEL HANDLERS
  const handleLocalSearch = async () => {
    if (!location) { notify.error("Enter a location"); return; }
    setLoadingLocal(true);
    try {
      const results = await searchLocalBusinesses(niche.name, location);
      setLocalResults(results);
      onUpdate({ leadSearchResults: results });
      notify.success("Market scan complete");
    } catch (e) { notify.error("Search failed"); } finally { setLoadingLocal(false); }
  };

  const addToPipeline = (business: any) => {
      if (!business || !business.title) return;
      
      if (existingCompanyNames.has(business.title.toLowerCase().trim())) {
          notify.info(`${business.title} is already in your pipeline.`);
          return;
      }

      const existingLeads = data.crmLeads || [];
      const newLead: LeadItem = {
          id: generateId(),
          companyName: business.title,
          contactName: '', 
          source: 'Google Maps',
          stage: 'New',
          value: data.productPrice || 0,
          probability: 10,
          notes: `Lead sourced from Maps in ${location}.\nSnippet: ${business.placeAnswerSources?.reviewSnippets?.[0]?.content || 'N/A'}`,
          addedAt: Date.now()
      };

      onUpdate({ crmLeads: [...existingLeads, newLead] });
      notify.success("Added to CRM Pipeline");
  };

  const downloadLeadsCSV = () => {
    if (!localResults?.mapChunks) return;
    
    const headers = ['Business Name', 'Verified Status', 'Snippet/Review', 'Maps URL', 'Website URL'];
    
    const rows = localResults.mapChunks
        .filter(c => c.maps)
        .map(c => {
            const m = c.maps!;
            const website = (c as any).web?.uri || '';
            const snippet = m.placeAnswerSources?.reviewSnippets?.[0]?.content?.replace(/"/g, '""') || '';
            
            return [
                `"${m.title.replace(/"/g, '""')}"`,
                'Verified',
                `"${snippet}"`,
                m.uri,
                website
            ];
        });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Meti_Leads_${niche.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    notify.success("Leads exported to CSV");
  };

  const handleSocialGeneration = async () => {
    setLoadingSocial(true);
    try {
      const results = await generateSocialSearchQueries(persona, niche.name);
      setSocialQueries(results);
      onUpdate({ socialSearchQueries: results });
      notify.success("Search agents deployed");
    } catch (e) { notify.error("Agent deployment failed"); } finally { setLoadingSocial(false); }
  };

  // 2. PLAYBOOK HANDLERS
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

  // 3. OUTREACH HANDLERS
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
      notify.success("Outreach assets generated");
    } catch (e) { notify.error("Generation failed"); } finally { setLoadingOutreach(false); }
  };

  // 4. SIMULATOR HANDLERS
  const startSimulation = () => {
    if (!chatInstance) {
        const chat = createSalesChat(data.productName, persona);
        setChatInstance(chat);
        setChatLoading(true);
        chat.sendMessage({ message: "Start the conversation." }).then((res) => {
            setMessages([{ role: 'model', text: res.text || "Hello." }]);
            setChatLoading(false);
        });
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !chatInstance) return;
    const userMsg: ChatMessage = { role: 'user', text: inputMessage };
    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setChatLoading(true);
    try {
      const result = await chatInstance.sendMessage({ message: userMsg.text });
      setMessages(prev => [...prev, { role: 'model', text: result.text || "..." }]);
    } catch (e) { console.error(e); } finally { setChatLoading(false); }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (user && !permissionService.hasAccess(user, 'pro') && onUpgrade) {
    return <FeatureGuard user={user} requiredTier="pro" featureName="Conversion Engine" onUpgrade={onUpgrade}>{null}</FeatureGuard>;
  }

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-140px)] flex flex-col">
      <div className="flex-shrink-0 mb-6 flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <SectionTitle 
            title="Conversion Engine" 
            subtitle="Unified command center for finding, engaging, and closing leads."
          />
        </div>
        
        <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 shadow-sm overflow-x-auto">
          {[
            { id: 'intel', icon: MapPin, label: 'Intel & Scout' },
            { id: 'playbook', icon: BookOpen, label: 'Playbook' },
            { id: 'outreach', icon: Send, label: 'Outreach' },
            { id: 'simulator', icon: MessageCircle, label: 'Simulator' }
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
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden bg-slate-900/50 border border-slate-800 rounded-xl relative">
        
        {/* TAB 1: INTEL */}
        {activeTab === 'intel' && (
          <div className="h-full flex flex-col md:flex-row">
             <div className="w-full md:w-80 border-r border-slate-800 flex flex-col bg-slate-900">
                <div className="p-4 border-b border-slate-800">
                   <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Map Scout</label>
                   <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="City, State" 
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="flex-1 bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white text-sm focus:border-indigo-500 outline-none"
                        onKeyDown={(e) => e.key === 'Enter' && handleLocalSearch()}
                      />
                      <Button size="sm" onClick={handleLocalSearch} disabled={loadingLocal} className="px-3">
                        {loadingLocal ? <RefreshCw className="animate-spin" size={16} /> : <Search size={16} />}
                      </Button>
                   </div>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
                   <div className="flex justify-between items-center">
                      <h4 className="text-sm font-bold text-white">Social Agents</h4>
                      <button onClick={handleSocialGeneration} disabled={loadingSocial} className="text-indigo-400 hover:text-indigo-300 text-xs">
                         {loadingSocial ? 'Running...' : 'Run Agents'}
                      </button>
                   </div>
                   {socialQueries.map((q, idx) => (
                      <div key={idx} className="p-3 bg-slate-800 rounded-lg border border-slate-700 text-xs">
                         <div className="flex justify-between mb-2">
                            <span className="font-bold text-white">{q.platform}</span>
                            <a href={q.directUrl} target="_blank" className="text-indigo-400 hover:text-white"><ExternalLink size={12}/></a>
                         </div>
                         <div className="font-mono text-slate-400 break-all bg-slate-900 p-2 rounded">{q.query}</div>
                      </div>
                   ))}
                   {socialQueries.length === 0 && (
                      <div className="text-center text-slate-500 py-4 text-xs italic">No social agents active. Run scan.</div>
                   )}
                </div>
             </div>

             <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Target size={20} className="text-emerald-400" /> Live Targets
                    </h3>
                    {localResults?.mapChunks && localResults.mapChunks.length > 0 && (
                        <Button onClick={downloadLeadsCSV} variant="secondary" className="text-xs h-8">
                            <Download size={14} className="mr-2" /> Export CSV
                        </Button>
                    )}
                </div>
                
                {localResults?.mapChunks && localResults.mapChunks.length > 0 ? (
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {localResults.mapChunks.filter(c => c.maps).map((c, i) => {
                         const isAdded = existingCompanyNames.has(c.maps?.title.toLowerCase().trim() || '');
                         return (
                            <div key={i} className={`bg-slate-800 p-4 rounded-xl border transition-colors group flex flex-col h-full ${isAdded ? 'border-emerald-500/30 bg-emerald-900/5' : 'border-slate-700 hover:border-indigo-500'}`}>
                                <div className="flex justify-between items-start mb-2">
                                <h4 className="font-bold text-white truncate">{c.maps?.title}</h4>
                                {c.maps?.placeAnswerSources?.reviewSnippets && <Star size={14} className="text-amber-400 fill-amber-400" />}
                                </div>
                                <div className="text-xs text-slate-400 mb-4 line-clamp-2 flex-1">
                                {c.maps?.placeAnswerSources?.reviewSnippets?.[0]?.content || "Verified Business Entity found on Google Maps."}
                                </div>
                                <div className="flex gap-2 mt-auto">
                                <a href={c.maps?.uri} target="_blank" className="flex-1 bg-slate-700 hover:bg-slate-600 text-white text-xs py-2 rounded text-center transition-colors flex items-center justify-center gap-1">
                                    <MapPin size={12}/> View Map
                                </a>
                                <button 
                                    onClick={() => addToPipeline(c.maps)}
                                    disabled={isAdded}
                                    className={`flex-1 text-white text-xs py-2 rounded text-center transition-colors flex items-center justify-center gap-1 ${isAdded ? 'bg-emerald-600 cursor-default opacity-80' : 'bg-indigo-600 hover:bg-indigo-500'}`}
                                >
                                    {isAdded ? <><Check size={12}/> Added</> : <><PlusCircle size={12}/> Pipeline</>}
                                </button>
                                </div>
                            </div>
                         );
                      })}
                   </div>
                ) : (
                   <div className="h-64 flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-800 rounded-xl">
                      <MapPin size={48} className="mb-4 opacity-20" />
                      <p>Run a local scan to identify targets.</p>
                   </div>
                )}
             </div>
          </div>
        )}

        {/* TAB 2: PLAYBOOK */}
        {activeTab === 'playbook' && (
           <div className="h-full flex flex-col md:flex-row">
              <div className="flex-1 border-r border-slate-800 p-6 overflow-y-auto custom-scrollbar">
                 <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-white flex items-center gap-2"><CheckCircle2 size={18} className="text-emerald-400" /> Qualification (BANT)</h3>
                    {qualQuestions.length === 0 && <Button size="sm" onClick={handleGeneratePlaybook} disabled={loadingPlaybook}>{loadingPlaybook ? 'Generating...' : 'Create'}</Button>}
                 </div>
                 {qualQuestions.length > 0 ? (
                    <div className="space-y-4">
                       {qualQuestions.map((q, i) => (
                          <div key={i} className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                             <div className="flex gap-3 mb-2">
                                <span className="bg-slate-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0">{i+1}</span>
                                <div className="font-medium text-white">{q.question}</div>
                             </div>
                             <div className="pl-9">
                                <div className="text-xs text-slate-400 uppercase font-bold mb-1">Look For:</div>
                                <div className="text-sm text-emerald-300/80 bg-emerald-900/10 p-2 rounded border border-emerald-500/20">{q.idealAnswer}</div>
                             </div>
                          </div>
                       ))}
                    </div>
                 ) : (
                    <div className="text-center py-12 text-slate-500">No framework generated yet.</div>
                 )}
              </div>

              <div className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-slate-900/30">
                 <h3 className="font-bold text-white flex items-center gap-2 mb-6"><ShieldAlert size={18} className="text-red-400" /> Objection Crusher</h3>
                 
                 <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 mb-6">
                    <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Live Rebuttal Generator</label>
                    <div className="flex gap-2">
                       <input 
                         type="text" 
                         value={objectionInput}
                         onChange={(e) => setObjectionInput(e.target.value)}
                         placeholder="e.g. 'Your price is too high'"
                         className="flex-1 bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:border-indigo-500 outline-none"
                         onKeyDown={(e) => e.key === 'Enter' && handleObjectionSubmit()}
                       />
                       <Button size="sm" onClick={handleObjectionSubmit} disabled={analyzingObjection} className={analyzingObjection ? "opacity-50" : ""}>
                          <Zap size={16} />
                       </Button>
                    </div>
                 </div>

                 {currentRebuttals.length > 0 && (
                    <div className="space-y-3 animate-fadeIn">
                       {currentRebuttals.map((r, i) => (
                          <div key={i} className="bg-slate-800 border border-slate-600 p-4 rounded-lg hover:border-indigo-500 transition-colors cursor-pointer group" onClick={() => copyToClipboard(r, i)}>
                             <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Option {i+1}</div>
                             <p className="text-sm text-slate-200">{r}</p>
                             <div className="text-indigo-400 text-xs mt-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                {copiedIndex === i ? <Check size={12} /> : <Copy size={12} />} {copiedIndex === i ? 'Copied' : 'Click to Copy'}
                             </div>
                          </div>
                       ))}
                    </div>
                 )}
              </div>
           </div>
        )}

        {/* TAB 3: OUTREACH */}
        {activeTab === 'outreach' && (
           <div className="h-full flex flex-col p-6 overflow-y-auto custom-scrollbar">
              <div className="flex justify-between items-center mb-6">
                 <div>
                    <h3 className="font-bold text-white text-lg">Communication Assets</h3>
                    <p className="text-sm text-slate-400">Cold DMs and Email Sequences tailored to {persona.jobTitle}.</p>
                 </div>
                 {coldDms.length === 0 && <Button onClick={handleGenerateOutreach} disabled={loadingOutreach}>{loadingOutreach ? 'Generating...' : 'Generate Assets'}</Button>}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 {/* Cold DMs */}
                 <section>
                    <h4 className="text-sm font-bold text-indigo-400 uppercase mb-4 flex items-center gap-2"><MessageCircle size={16}/> LinkedIn / Twitter DMs</h4>
                    <div className="space-y-4">
                       {coldDms.length > 0 ? coldDms.map((dm, i) => (
                          <Card key={i} className="bg-slate-800 border-slate-700 relative">
                             <div className="absolute top-4 right-4">
                                <button onClick={() => copyToClipboard(dm, i + 100)} className="text-slate-500 hover:text-white">
                                   {copiedIndex === i + 100 ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                                </button>
                             </div>
                             <div className="text-xs text-slate-500 mb-2 font-bold">Variation {i+1}</div>
                             <p className="text-sm text-slate-300 whitespace-pre-wrap">{dm}</p>
                          </Card>
                       )) : (
                          <div className="p-8 border border-dashed border-slate-700 rounded-xl text-center text-slate-500 text-sm">No DMs generated.</div>
                       )}
                    </div>
                 </section>

                 {/* Email Sequence */}
                 <section>
                    <h4 className="text-sm font-bold text-indigo-400 uppercase mb-4 flex items-center gap-2"><Mail size={16}/> Nurture Sequence</h4>
                    <div className="space-y-6">
                       {emailSeq.length > 0 ? emailSeq.map((email, i) => (
                          <div key={i} className="relative pl-6 border-l-2 border-slate-700">
                             <div className="absolute -left-[9px] top-0 w-4 h-4 bg-indigo-600 rounded-full ring-4 ring-slate-900"></div>
                             <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                                <div className="bg-slate-900/50 p-3 border-b border-slate-700 flex justify-between items-center">
                                   <div className="text-xs font-bold text-white">Email {i+1}</div>
                                   <div className="text-[10px] bg-slate-700 px-2 py-1 rounded text-slate-300">{email.sendDelay}</div>
                                </div>
                                <div className="p-4">
                                   <div className="text-sm font-bold text-white mb-1"><span className="text-slate-500 font-normal">Subject:</span> {email.subject}</div>
                                   <div className="text-xs text-slate-400 mb-3 border-b border-slate-700/50 pb-2">{email.previewText}</div>
                                   <div className="text-sm text-slate-300 whitespace-pre-line">{email.body}</div>
                                </div>
                             </div>
                          </div>
                       )) : (
                          <div className="p-8 border border-dashed border-slate-700 rounded-xl text-center text-slate-500 text-sm">No email sequence generated.</div>
                       )}
                    </div>
                 </section>
              </div>
           </div>
        )}

        {/* TAB 4: SIMULATOR */}
        {activeTab === 'simulator' && (
           <div className="h-full flex flex-col">
              <div className="bg-slate-800 p-4 border-b border-slate-700 flex justify-between items-center">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center text-white"><UserIcon size={20} /></div>
                    <div>
                       <h3 className="font-bold text-white">{persona.jobTitle}</h3>
                       <div className="flex items-center gap-1.5 text-xs text-slate-400">
                          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span> Online
                       </div>
                    </div>
                 </div>
                 {!chatInstance && <Button size="sm" onClick={startSimulation}>Start Roleplay</Button>}
                 {chatInstance && <Button size="sm" variant="secondary" onClick={() => { setChatInstance(null); setMessages([]); }}>Reset</Button>}
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-950">
                 {messages.length === 0 && !chatLoading && (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50">
                       <MessageCircle size={48} className="mb-4" />
                       <p>Start a roleplay session to practice your pitch.</p>
                    </div>
                 )}
                 {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                       <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-none'}`}>
                          {msg.text}
                       </div>
                    </div>
                 ))}
                 {chatLoading && <div className="text-xs text-slate-500 ml-4 animate-pulse">Typing...</div>}
                 <div ref={messagesEndRef} />
              </div>

              <div className="p-4 bg-slate-800 border-t border-slate-700">
                 <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Type your response..."
                      className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                      disabled={!chatInstance}
                    />
                    <Button onClick={handleSendMessage} disabled={!chatInstance || chatLoading} className="px-4">
                       <Send size={20} />
                    </Button>
                 </div>
              </div>
           </div>
        )}

      </div>
    </div>
  );
};
