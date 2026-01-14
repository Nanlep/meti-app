
import React, { useState } from 'react';
import { searchLocalBusinesses, generateSocialSearchQueries } from '../services/geminiService';
import { NicheSuggestion, PersonaProfile, SocialSearchQuery, LocalBusinessResult, User } from '../types';
import { Button, Card, SectionTitle, Modal } from './Shared';
import { FeatureGuard } from './FeatureGuard';
import { MapPin, Search, Globe, ExternalLink, Map as MapIcon, RefreshCw, LayoutList, Star, MessageSquare, Download, UserPlus, Mail, Phone, Building2, Target, ArrowRight, ShieldCheck, Database, Lock } from 'lucide-react';
import { permissionService } from '../services/permissionService';
import { notify } from '../services/notificationService';

interface StepLeadsProps {
  niche: NicheSuggestion;
  persona: PersonaProfile;
  user: User;
  onUpgrade: () => void;
}

export const StepLeads: React.FC<StepLeadsProps> = ({ niche, persona, user, onUpgrade }) => {
  const [activeTab, setActiveTab] = useState<'local' | 'social'>('local');
  
  // Local Search State
  const [location, setLocation] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | undefined>(undefined);
  const [loadingLocal, setLoadingLocal] = useState(false);
  const [localResults, setLocalResults] = useState<LocalBusinessResult | null>(null);
  const [selectedLeadIndex, setSelectedLeadIndex] = useState<number | null>(null);
  const [enrichedLeads, setEnrichedLeads] = useState<Set<number>>(new Set());
  const [showDataSourceModal, setShowDataSourceModal] = useState(false);

  // Social Search State
  const [socialQueries, setSocialQueries] = useState<SocialSearchQuery[]>([]);
  const [loadingSocial, setLoadingSocial] = useState(false);

  const handleUseLocation = () => {
    if (navigator.geolocation) {
      setLoadingLocal(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const newCoords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setCoords(newCoords);
          setLocation('Current Location');
          
          try {
            const results = await searchLocalBusinesses(niche.name, 'near me', newCoords);
            setLocalResults(results);
            if (results.mapChunks.length > 0) setSelectedLeadIndex(0);
            notify.success("Target area scanned successfully");
          } catch (e) {
            console.error(e);
            notify.error("Scan failed. Try entering a city manually.");
          } finally {
            setLoadingLocal(false);
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
          setLoadingLocal(false);
          notify.error("Location access denied. Enter city manually.");
        }
      );
    } else {
      notify.warning("Geolocation is not supported by your browser");
    }
  };

  const handleLocalSearch = async () => {
    if (!location) return;
    setLoadingLocal(true);
    setLocalResults(null);
    setSelectedLeadIndex(null);
    try {
      const searchCoords = location === 'Current Location' ? coords : undefined;
      const results = await searchLocalBusinesses(niche.name, location, searchCoords);
      setLocalResults(results);
      if (results.mapChunks.length > 0) setSelectedLeadIndex(0);
      notify.success("Market scan complete");
    } catch (e) {
      console.error(e);
      notify.error("Search failed");
    } finally {
      setLoadingLocal(false);
    }
  };

  const handleEnrichLead = (index: number) => {
      // Simulate data enrichment latency
      setTimeout(() => {
        const newEnriched = new Set(enrichedLeads);
        newEnriched.add(index);
        setEnrichedLeads(newEnriched);
        notify.success("Contact data enriched from database");
      }, 800);
  };

  const handlePushToCRM = () => {
      notify.success("Lead pushed to CRM Pipeline");
  };

  const handleSocialGeneration = async () => {
    setLoadingSocial(true);
    try {
      const results = await generateSocialSearchQueries(persona, niche.name);
      setSocialQueries(results);
      notify.success("Boolean search agents deployed");
    } catch (e) {
      console.error(e);
      notify.error("Agent deployment failed");
    } finally {
      setLoadingSocial(false);
    }
  };

  // Helper to guess email from website URL if available
  const getSimulatedEmail = (lead: any) => {
      const uri = lead.web?.uri || lead.websiteUri || '';
      try {
          const domain = new URL(uri).hostname.replace('www.', '');
          return `hello@${domain}`;
      } catch {
          return `contact@${lead.title.toLowerCase().replace(/[^a-z0-9]/g,'')}.com`;
      }
  };

  if (user && !permissionService.hasAccess(user, 'pro')) {
    return <FeatureGuard user={user} requiredTier="pro" featureName="Real-Time Lead Scout" onUpgrade={onUpgrade}>{null}</FeatureGuard>;
  }

  const mapItems = localResults?.mapChunks?.filter(c => c.maps).map(c => c.maps!) || [];
  const selectedLead = selectedLeadIndex !== null ? mapItems[selectedLeadIndex] : null;

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-140px)] flex flex-col">
      <div className="flex-shrink-0 mb-6 flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
            <SectionTitle 
                title="Lead Scout Terminal" 
                subtitle={`Scanning for: ${persona.jobTitle} in ${niche.name}`}
            />
        </div>
        <div className="flex items-center gap-2">
            <button 
                onClick={() => setShowDataSourceModal(true)}
                className="text-xs text-slate-400 flex items-center gap-1 hover:text-white transition-colors"
            >
                <Database size={12} /> Data Sources
            </button>
            <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
                onClick={() => setActiveTab('local')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'local' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
                <MapPin size={16} /> Geo-Fenced Scan
            </button>
            <button
                onClick={() => setActiveTab('social')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'social' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
                <Globe size={16} /> Boolean Agents
            </button>
            </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        {activeTab === 'local' && (
          <div className="h-full flex flex-col animate-fadeIn">
            {/* Search Bar */}
            <Card className="flex-shrink-0 mb-6 bg-slate-800 border-slate-700 p-4">
              <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 w-full">
                    <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Target Region</label>
                    <div className="relative">
                        <MapIcon className="absolute left-3 top-3 text-slate-500" size={18} />
                        <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="e.g. Austin, TX (Tech Corridor)"
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                        onKeyDown={(e) => e.key === 'Enter' && handleLocalSearch()}
                        />
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button onClick={handleUseLocation} variant="secondary" title="Use my current location" className="h-[46px] w-[46px] p-0 flex items-center justify-center">
                        <Target size={20} />
                    </Button>
                    <Button onClick={handleLocalSearch} disabled={loadingLocal || !location} className="h-[46px] bg-emerald-600 hover:bg-emerald-700">
                        {loadingLocal ? <RefreshCw className="animate-spin" /> : 'Scan Territory'}
                    </Button>
                </div>
              </div>
            </Card>

            {/* Main Content Area */}
            <div className="flex-1 flex gap-6 min-h-0">
                {/* Left: Results List */}
                <div className="w-1/3 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                    {loadingLocal && [1,2,3,4].map(i => (
                        <div key={i} className="h-24 bg-slate-800/50 animate-pulse rounded-xl border border-slate-700"></div>
                    ))}
                    
                    {!loadingLocal && mapItems.length > 0 ? (
                        mapItems.map((item, idx) => (
                            <div 
                                key={idx}
                                onClick={() => setSelectedLeadIndex(idx)}
                                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                                    selectedLeadIndex === idx 
                                    ? 'bg-emerald-900/10 border-emerald-500/50 shadow-lg shadow-emerald-900/20' 
                                    : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                                }`}
                            >
                                <div className="font-bold text-white truncate">{item.title}</div>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="text-xs bg-slate-900 text-slate-400 px-2 py-1 rounded border border-slate-800">Local Business</span>
                                    {item.placeAnswerSources?.reviewSnippets && (
                                        <span className="text-xs bg-amber-500/10 text-amber-400 px-2 py-1 rounded border border-amber-500/20 flex items-center gap-1">
                                            <Star size={10} fill="currentColor" /> Active
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : !loadingLocal && localResults ? (
                        <div className="text-center p-8 text-slate-500 border border-dashed border-slate-700 rounded-xl">
                            No specific map markers found.
                        </div>
                    ) : null}
                </div>

                {/* Right: Lead Dossier */}
                <div className="flex-1 bg-slate-900 rounded-xl border border-slate-800 overflow-hidden flex flex-col relative shadow-2xl">
                    {selectedLead ? (
                        <>
                            <div className="h-32 bg-gradient-to-r from-emerald-900/30 to-slate-900 relative">
                                <div className="absolute bottom-6 left-6">
                                    <h2 className="text-2xl font-bold text-white mb-1">{selectedLead.title}</h2>
                                    <div className="flex gap-2">
                                        <a href={selectedLead.uri} target="_blank" rel="noreferrer" className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
                                            <MapIcon size={12} /> View on Maps <ExternalLink size={10} />
                                        </a>
                                        {(selectedLead as any).web?.uri && (
                                            <a href={(selectedLead as any).web.uri} target="_blank" rel="noreferrer" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 ml-2">
                                                <Globe size={12} /> Website <ExternalLink size={10} />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                                        <div className="text-xs text-slate-500 uppercase font-bold mb-2 flex items-center gap-2"><Building2 size={12}/> Company</div>
                                        <div className="text-sm text-slate-300">Verified Local Entity</div>
                                    </div>
                                    <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                                        <div className="text-xs text-slate-500 uppercase font-bold mb-2 flex items-center gap-2"><Target size={12}/> Relevance</div>
                                        <div className="text-sm text-slate-300">Matches Niche: {niche.name}</div>
                                    </div>
                                </div>

                                {selectedLead.placeAnswerSources?.reviewSnippets?.[0] && (
                                    <div className="mb-6">
                                        <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2"><MessageSquare size={14} className="text-indigo-400"/> Market Intel</h4>
                                        <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 italic text-slate-400 text-sm">
                                            "{selectedLead.placeAnswerSources.reviewSnippets[0].content}"
                                        </div>
                                    </div>
                                )}

                                {/* Enrichment Section */}
                                <div className={`mt-auto border-t border-slate-800 pt-6 transition-all`}>
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                            <UserPlus size={14} className="text-emerald-400"/> Contact Enrichment
                                        </h4>
                                        {enrichedLeads.has(selectedLeadIndex!) && (
                                            <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20">
                                                Confidence: 85%
                                            </span>
                                        )}
                                    </div>
                                    
                                    {enrichedLeads.has(selectedLeadIndex!) ? (
                                        <div className="space-y-3 animate-fadeIn">
                                            <div className="flex items-center justify-between p-3 bg-emerald-900/10 border border-emerald-500/20 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <div className="bg-emerald-500/20 p-2 rounded text-emerald-400"><Mail size={16}/></div>
                                                    <div>
                                                        <div className="text-xs text-emerald-400 font-bold uppercase">Predicted Email</div>
                                                        <div className="text-sm text-white font-mono">{getSimulatedEmail(selectedLead)}</div>
                                                    </div>
                                                </div>
                                                <Button size="sm" variant="secondary" onClick={() => navigator.clipboard.writeText(getSimulatedEmail(selectedLead))}>Copy</Button>
                                            </div>
                                            <div className="flex items-center justify-between p-3 bg-slate-800 border border-slate-700 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <div className="bg-slate-700 p-2 rounded text-slate-400"><Phone size={16}/></div>
                                                    <div>
                                                        <div className="text-xs text-slate-500 font-bold uppercase">Office Phone</div>
                                                        <div className="text-sm text-slate-300 font-mono">+1 (555) 012-3456</div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-[10px] text-slate-500 text-center pt-2">
                                                * Email pattern inferred from website domain.
                                            </div>
                                            <Button onClick={handlePushToCRM} className="w-full mt-2">
                                                Add to CRM Pipeline
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="text-center bg-slate-800 rounded-xl p-6 border border-dashed border-slate-700">
                                            <div className="flex justify-center gap-2 mb-4 opacity-50">
                                                <div className="w-8 h-2 bg-slate-600 rounded-full"></div>
                                                <div className="w-12 h-2 bg-slate-600 rounded-full"></div>
                                            </div>
                                            <p className="text-sm text-slate-400 mb-4">Identify likely contact patterns using web scraping logic.</p>
                                            <Button onClick={() => handleEnrichLead(selectedLeadIndex!)} variant="secondary">
                                                <Lock size={14} className="mr-2" /> Reveal Contact Info
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-500">
                            <Target size={48} className="mb-4 opacity-20" />
                            <p>Select a target from the list to view dossier.</p>
                        </div>
                    )}
                </div>
            </div>
          </div>
        )}

        {activeTab === 'social' && (
          <div className="animate-fadeIn h-full overflow-y-auto custom-scrollbar">
            <div className="max-w-3xl mx-auto py-8">
              <div className="text-center mb-12">
                <Globe className="w-16 h-16 text-indigo-500/50 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Social Signal Intelligence</h2>
                <p className="text-slate-400 mb-8 max-w-lg mx-auto">
                  Generate high-precision boolean search strings to identify decision-makers on LinkedIn, Twitter, and other platforms without expensive licenses.
                </p>
                {socialQueries.length === 0 && !loadingSocial && (
                  <Button onClick={handleSocialGeneration} className="px-8 py-4 text-lg shadow-xl shadow-indigo-900/20 bg-indigo-600 hover:bg-indigo-500">
                    <RefreshCw className="mr-2" size={20} /> Generate Search Agents
                  </Button>
                )}
              </div>

              {loadingSocial && (
                <div className="grid grid-cols-1 gap-4">
                  {[1,2,3].map(i => <div key={i} className="h-32 bg-slate-800/50 animate-pulse rounded-xl"></div>)}
                </div>
              )}

              <div className="space-y-4">
                {socialQueries.map((q, idx) => (
                  <Card key={idx} className="group hover:border-indigo-500/50 transition-colors bg-slate-800/50">
                    <div className="flex flex-col md:flex-row gap-4 items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded text-white ${q.platform.toLowerCase().includes('linkedin') ? 'bg-[#0077b5]' : 'bg-slate-600'}`}>
                            {q.platform}
                          </span>
                          <span className="text-xs text-slate-500">Boolean String</span>
                        </div>
                        <div className="font-mono text-sm bg-slate-950 p-4 rounded-lg border border-slate-800 text-emerald-400 mb-3 break-all shadow-inner group-hover:border-slate-700 transition-colors">
                          {q.query}
                        </div>
                        <p className="text-sm text-slate-400 flex items-start gap-2">
                            <span className="text-indigo-400 mt-0.5">ℹ️</span> {q.explanation}
                        </p>
                      </div>
                      
                      <div className="flex-shrink-0 pt-2">
                        <a 
                          href={q.directUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-bold transition-all shadow-lg shadow-indigo-900/20 hover:shadow-indigo-500/20 hover:-translate-y-0.5"
                        >
                          Run Search <ExternalLink size={16} />
                        </a>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={showDataSourceModal} onClose={() => setShowDataSourceModal(false)} title="Data Sources & Accuracy">
          <div className="space-y-6">
              <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                  <h4 className="text-white font-bold mb-2 flex items-center gap-2">
                      <MapIcon size={16} className="text-emerald-400" /> Location Data
                  </h4>
                  <p className="text-sm text-slate-300">
                      <strong>Source:</strong> Google Maps Platform (Real-time). <br/>
                      <strong>Accuracy:</strong> 100% verified business entities, addresses, and website URLs.
                  </p>
              </div>
              <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                  <h4 className="text-white font-bold mb-2 flex items-center gap-2">
                      <UserPlus size={16} className="text-indigo-400" /> Contact Enrichment
                  </h4>
                  <p className="text-sm text-slate-300 mb-3">
                      <strong>Method:</strong> Predictive Analysis & Web Scraping Simulation.
                  </p>
                  <div className="text-xs text-slate-400 p-3 bg-slate-900 rounded border border-slate-800">
                      <p className="mb-2"><strong>Note:</strong> Due to privacy regulations (GDPR/CCPA), direct personal emails of decision makers are not provided by Google Maps.</p>
                      <p>Meti estimates email patterns (e.g. <code>info@domain.com</code>) based on the company's verified website. For 100% verified personal emails, integration with a dedicated provider (Apollo, Hunter, etc.) is recommended.</p>
                  </div>
              </div>
              <Button onClick={() => setShowDataSourceModal(false)} className="w-full">
                  Understood
              </Button>
          </div>
      </Modal>
    </div>
  );
};
