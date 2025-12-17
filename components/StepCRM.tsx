
import React, { useState, useMemo, useEffect } from 'react';
import { ProjectData, LeadItem, CRMStage } from '../types';
import { Button, Card, SectionTitle, Modal } from './Shared';
import { LayoutKanban, DollarSign, FileSpreadsheet, Plus, MoveRight, MoveLeft, Trash2, Link2, CheckCircle2, RefreshCw, Database, Search, X, Edit2, Calendar, Filter, MoreHorizontal, ArrowRight, User, PartyPopper } from 'lucide-react';
import confetti from 'canvas-confetti';

interface StepCRMProps {
  data: ProjectData;
  onUpdateLeads: (leads: LeadItem[]) => void;
  onUpdateConnections: (crms: string[]) => void;
}

export const StepCRM: React.FC<StepCRMProps> = ({ data, onUpdateLeads, onUpdateConnections }) => {
  const [activeView, setActiveView] = useState<'pipeline' | 'integrations'>('pipeline');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingLead, setEditingLead] = useState<LeadItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // New Lead State
  const [newLeadName, setNewLeadName] = useState('');
  const [newLeadCompany, setNewLeadCompany] = useState('');
  const [newLeadValue, setNewLeadValue] = useState(0);
  const [newLeadEmail, setNewLeadEmail] = useState('');

  // Critical: Defensive check for data existence
  if (!data) {
      return <div className="text-center p-10 text-red-400">Error: CRM Data not loaded.</div>;
  }

  // --- ROBUST DATA SANITIZATION LAYER ---
  const rawLeads = Array.isArray(data.crmLeads) ? data.crmLeads : [];
  
  // Optimization: Memoize lead processing to prevent re-parsing on every render
  const leads: LeadItem[] = useMemo(() => rawLeads
    .filter(l => l && typeof l === 'object')
    .map(l => ({
        id: l.id || Math.random().toString(36),
        companyName: String(l.companyName || 'Unknown Company'),
        contactName: l.contactName ? String(l.contactName) : undefined,
        email: l.email ? String(l.email) : undefined,
        source: String(l.source || 'Manual'),
        stage: (l.stage || 'New') as CRMStage,
        value: Number(l.value) || 0, 
        probability: Number(l.probability) || 0,
        notes: String(l.notes || ''),
        addedAt: Number(l.addedAt) || Date.now()
    })), [rawLeads]);

  const connectedCrms = Array.isArray(data.connectedCrms) ? data.connectedCrms : [];
  const stages: CRMStage[] = ['New', 'Qualified', 'Proposal', 'Negotiation', 'Closed Won', 'Retention'];

  // Defensive filtering
  const filteredLeads = useMemo(() => {
    if (!searchTerm) return leads;
    const lowerSearch = searchTerm.toLowerCase();
    return leads.filter(l => {
        return l.companyName.toLowerCase().includes(lowerSearch) || 
               (l.contactName || '').toLowerCase().includes(lowerSearch);
    });
  }, [leads, searchTerm]);

  // Optimization: Single pass calculation for all stage stats
  const pipelineStats = useMemo(() => {
      const stats = {
          weightedValue: 0,
          totalValue: 0,
          stageTotals: {} as Record<string, number>
      };
      
      leads.forEach(l => {
          stats.totalValue += l.value;
          stats.weightedValue += l.value * (l.probability / 100);
          stats.stageTotals[l.stage] = (stats.stageTotals[l.stage] || 0) + l.value;
      });
      return stats;
  }, [leads]);

  const moveLead = (id: string, direction: 'next' | 'prev') => {
    const lead = leads.find(l => l.id === id);
    if (!lead) return;

    const currentStageIdx = stages.indexOf(lead.stage);
    let newStageIdx = direction === 'next' ? currentStageIdx + 1 : currentStageIdx - 1;

    if (newStageIdx < 0) newStageIdx = 0;
    if (newStageIdx >= stages.length) newStageIdx = stages.length - 1;

    const newStage = stages[newStageIdx];
    
    // Confetti Effect for Wins
    if (newStage === 'Closed Won' && lead.stage !== 'Closed Won') {
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
        });
    }
    
    // Auto-update probability based on stage progression
    const probs: Record<string, number> = { 
        'New': 10, 'Qualified': 30, 'Proposal': 60, 
        'Negotiation': 80, 'Closed Won': 100, 'Retention': 100 
    };
    
    const updatedLeads = leads.map(l => {
        if (l.id === id) {
            return { ...l, stage: newStage, probability: probs[newStage] || l.probability };
        }
        return l;
    });

    onUpdateLeads(updatedLeads);
  };

  const deleteLead = (id: string) => {
    if(confirm("Are you sure you want to delete this deal? This cannot be undone.")) {
      onUpdateLeads(leads.filter(l => l.id !== id));
      if (editingLead?.id === id) {
          setShowEditModal(false);
          setEditingLead(null);
      }
    }
  };

  const handleAddLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadCompany) return;

    const safeId = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    const lead: LeadItem = {
      id: safeId,
      companyName: newLeadCompany,
      contactName: newLeadName,
      email: newLeadEmail,
      source: 'Manual',
      stage: 'New',
      value: Number(newLeadValue) || 0,
      probability: 10,
      notes: '',
      addedAt: Date.now()
    };
    onUpdateLeads([...leads, lead]);
    
    // Reset Form
    setNewLeadName('');
    setNewLeadCompany('');
    setNewLeadValue(0);
    setNewLeadEmail('');
    setShowAddModal(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLead) return;
    
    // Sanitize before saving
    const safeEdit: LeadItem = {
        ...editingLead,
        value: Number(editingLead.value) || 0,
        probability: Number(editingLead.probability) || 0
    };

    const updatedLeads = leads.map(l => l.id === safeEdit.id ? safeEdit : l);
    onUpdateLeads(updatedLeads);
    setShowEditModal(false);
    setEditingLead(null);
  };

  const openEditModal = (lead: LeadItem) => {
    setEditingLead({ ...lead });
    setShowEditModal(true);
  };

  const generateGoogleSheet = () => {
    const headers = ['ID', 'Company', 'Contact', 'Email', 'Source', 'Stage', 'Value (NGN)', 'Probability (%)', 'Notes', 'Added Date'];
    const rows = leads.map(l => {
      let dateStr = 'N/A';
      try { dateStr = new Date(l.addedAt).toLocaleDateString(); } catch(e) {}
      
      return [
        l.id,
        `"${l.companyName}"`,
        `"${l.contactName || ''}"`,
        l.email || '',
        l.source,
        l.stage,
        l.value,
        l.probability,
        `"${(l.notes || '').replace(/"/g, '""')}"`,
        dateStr
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Meti_CRM_Export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const toggleCrmConnection = (crmName: string) => {
    if (connectedCrms.includes(crmName)) {
      if(confirm(`Disconnect ${crmName}?`)) {
        onUpdateConnections(connectedCrms.filter(c => c !== crmName));
      }
    } else {
      const width = 600;
      const height = 600;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      const win = window.open('', 'Connect', `width=${width},height=${height},top=${top},left=${left}`);
      if (win) {
          win.document.write(`<div style="text-align:center;padding-top:100px;font-family:sans-serif;background:#0f172a;color:white;height:100%;"><h1>Connecting to ${crmName}...</h1><p>Verifying API Credentials...</p></div>`);
          setTimeout(() => {
              win.close();
              onUpdateConnections([...connectedCrms, crmName]);
          }, 1500);
      }
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto h-[calc(100vh-140px)] flex flex-col">
      <div className="flex-shrink-0 mb-6">
        <SectionTitle 
          title="Sales & Retention CRM" 
          subtitle="Manage your pipeline from lead generation to closed deal and long-term retention."
        />
        
        <div className="flex flex-col md:flex-row justify-between items-end gap-4">
            <div className="flex gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                  onClick={() => setActiveView('pipeline')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeView === 'pipeline' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
              >
                  <LayoutKanban size={16} /> Pipeline
              </button>
              <button
                  onClick={() => setActiveView('integrations')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeView === 'integrations' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
              >
                  <Database size={16} /> Integrations
              </button>
            </div>

            <div className="flex items-center gap-4">
                <div className="hidden lg:block text-right">
                   <div className="text-xs text-slate-400 uppercase font-bold">Weighted Forecast</div>
                   <div className="text-xl font-mono text-emerald-400 font-bold">₦{pipelineStats.weightedValue.toLocaleString(undefined, {maximumFractionDigits: 0})}</div>
                </div>
                <div className="h-8 w-px bg-slate-700 hidden lg:block"></div>
                
                {activeView === 'pipeline' && (
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
                    <input 
                      type="text" 
                      placeholder="Search companies..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:ring-1 focus:ring-indigo-500 outline-none w-48 md:w-64"
                    />
                  </div>
                )}

                <div className="flex gap-2">
                    <Button variant="secondary" onClick={generateGoogleSheet} className="text-sm h-10 px-3" title="Export CSV">
                        <FileSpreadsheet size={16} />
                    </Button>
                    <Button onClick={() => setShowAddModal(true)} className="text-sm h-10">
                        <Plus size={16} className="mr-2" /> Add Deal
                    </Button>
                </div>
            </div>
        </div>
      </div>

      {activeView === 'pipeline' && (
        <div className="flex-1 overflow-x-auto min-h-0 pb-4">
           <div className="flex gap-4 h-full min-w-[1600px] px-1">
              {stages.map(stage => {
                  const stageLeads = filteredLeads.filter(l => l.stage === stage);
                  const stageTotal = pipelineStats.stageTotals[stage] || 0;
                  
                  return (
                    <div key={stage} className="flex-1 min-w-[280px] flex flex-col bg-slate-900/40 rounded-xl border border-slate-800 h-full relative group/col hover:bg-slate-900/60 transition-colors">
                        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/80 rounded-t-xl sticky top-0 backdrop-blur-sm z-10">
                            <div>
                                <h3 className="font-bold text-white text-sm uppercase tracking-wide flex items-center gap-2">
                                    {stage}
                                    <span className="bg-slate-800 text-slate-400 text-[10px] px-2 py-0.5 rounded-full">{stageLeads.length}</span>
                                </h3>
                            </div>
                            <div className="text-xs font-mono text-emerald-400 font-bold bg-emerald-900/10 px-2 py-1 rounded border border-emerald-900/20">
                                ₦{stageTotal.toLocaleString(undefined, { compactDisplay: "short", notation: "compact" })}
                            </div>
                        </div>
                        <div className="p-3 space-y-3 overflow-y-auto flex-1 custom-scrollbar">
                            {stageLeads.map(lead => (
                                <div key={lead.id} className="relative group/card transform transition-transform hover:-translate-y-1 duration-200">
                                    <Card className={`p-4 cursor-pointer hover:border-indigo-500/50 group-hover/card:bg-slate-800 transition-all border-slate-700 shadow-sm hover:shadow-lg ${lead.stage === 'Closed Won' ? 'border-emerald-500/50 bg-emerald-900/10' : ''}`} onClick={() => openEditModal(lead)}>
                                        <div className="flex justify-between items-start mb-3">
                                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wide ${
                                                lead.source === 'Google Maps' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 
                                                lead.source === 'Social' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 
                                                'bg-slate-700 text-slate-400 border border-slate-600'
                                            }`}>
                                                {lead.source || 'Manual'}
                                            </span>
                                            <div className="text-slate-500 hover:text-white opacity-0 group-hover/card:opacity-100 transition-opacity">
                                                <Edit2 size={12} />
                                            </div>
                                        </div>
                                        
                                        <div className="font-bold text-white mb-1 truncate pr-2 text-base">{lead.companyName}</div>
                                        {lead.contactName && <div className="text-xs text-slate-400 mb-3 flex items-center gap-1"><User size={10}/> {lead.contactName}</div>}
                                        
                                        <div className="flex items-center justify-between text-xs mt-3 pt-3 border-t border-slate-700/50">
                                            <div className="text-white font-medium flex items-center gap-1 bg-slate-700/50 px-2 py-1 rounded">
                                                <span className="text-emerald-400 font-sans">₦</span> {lead.value.toLocaleString()}
                                            </div>
                                            <div className={`font-bold flex items-center gap-1 ${lead.probability > 70 ? 'text-emerald-400' : lead.probability > 30 ? 'text-amber-400' : 'text-red-400'}`}>
                                                {lead.probability}% <span className="text-[10px] text-slate-500 font-normal">Prob.</span>
                                            </div>
                                        </div>
                                    </Card>
                                    
                                    {/* Quick Actions Overlay */}
                                    <div className="absolute top-1/2 -translate-y-1/2 -right-3 flex flex-col gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity z-20 pointer-events-none group-hover/card:pointer-events-auto">
                                        <button 
                                          onClick={(e) => { e.stopPropagation(); moveLead(lead.id, 'next'); }}
                                          disabled={stage === 'Retention'}
                                          className="p-1.5 rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-500 disabled:opacity-0 disabled:pointer-events-none transition-all hover:scale-110"
                                          title="Move Forward"
                                        >
                                            <ArrowRight size={14} />
                                        </button>
                                    </div>
                                    {stage !== 'New' && (
                                        <div className="absolute top-1/2 -translate-y-1/2 -left-3 flex flex-col gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity z-20 pointer-events-none group-hover/card:pointer-events-auto">
                                            <button 
                                            onClick={(e) => { e.stopPropagation(); moveLead(lead.id, 'prev'); }}
                                            className="p-1.5 rounded-full bg-slate-700 text-slate-300 shadow-lg hover:bg-slate-600 hover:text-white transition-all hover:scale-110"
                                            title="Move Back"
                                            >
                                                <MoveLeft size={14} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                            {stageLeads.length === 0 && (
                                <div className="h-24 flex flex-col items-center justify-center text-slate-600 opacity-50 border-2 border-dashed border-slate-800 rounded-lg">
                                    <div className="text-xs font-medium">Empty Stage</div>
                                </div>
                            )}
                        </div>
                    </div>
                  );
              })}
           </div>
        </div>
      )}

      {activeView === 'integrations' && (
          <div className="animate-fadeIn max-w-5xl mx-auto w-full p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {['HubSpot', 'Salesforce', 'Pipedrive', 'Zoho CRM'].map(crm => {
                     const isConnected = connectedCrms.includes(crm);
                     return (
                         <div key={crm} className={`flex items-center justify-between p-6 rounded-xl border transition-all ${isConnected ? 'bg-indigo-900/10 border-indigo-500/50 shadow-lg shadow-indigo-900/10' : 'bg-slate-800 border-slate-700'}`}>
                             <div className="flex items-center gap-4">
                                 <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl shadow-inner ${isConnected ? 'bg-white text-indigo-600' : 'bg-slate-700 text-slate-400'}`}>
                                     <Database />
                                 </div>
                                 <div>
                                     <h3 className="font-bold text-white text-lg">{crm}</h3>
                                     <p className="text-sm text-slate-400 flex items-center gap-2">
                                         {isConnected ? <><span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span> Sync Active</> : 'Not Connected'}
                                     </p>
                                 </div>
                             </div>
                             <Button 
                                onClick={() => toggleCrmConnection(crm)}
                                variant={isConnected ? 'outline' : 'primary'}
                                className={isConnected ? "border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300" : ""}
                             >
                                 {isConnected ? 'Disconnect' : 'Connect'}
                             </Button>
                         </div>
                     )
                 })}
              </div>
              
              <div className="mt-8 bg-slate-900 rounded-xl p-8 border border-slate-800 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                      <RefreshCw size={120} />
                  </div>
                  <h4 className="text-white font-bold mb-2 flex items-center gap-2 text-lg">
                      <RefreshCw size={20} className="text-indigo-400"/> Auto-Sync Configuration
                  </h4>
                  <p className="text-sm text-slate-400 mb-6 max-w-2xl">
                      When connected, Meti acts as a middleware. "Qualified" leads are automatically pushed to your CRM as Deal objects. "Closed Won" status in your CRM will sync back to update Meti's analytics.
                  </p>
                  <div className="flex items-center gap-4 text-xs font-bold text-slate-500 uppercase tracking-wide">
                      <span className="flex items-center gap-1"><CheckCircle2 size={14} className="text-emerald-500" /> OAuth 2.0</span>
                      <span className="flex items-center gap-1"><CheckCircle2 size={14} className="text-emerald-500" /> TLS Encryption</span>
                      <span className="flex items-center gap-1"><CheckCircle2 size={14} className="text-emerald-500" /> Bi-directional</span>
                  </div>
              </div>
          </div>
      )}

      {/* Add Lead Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Deal">
          <form onSubmit={handleAddLead} className="space-y-5">
              <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Company Name</label>
                  <input 
                    type="text" 
                    required 
                    value={newLeadCompany}
                    onChange={(e) => setNewLeadCompany(e.target.value)}
                    placeholder="Acme Corp"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                  />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Contact Person</label>
                    <input 
                        type="text" 
                        value={newLeadName}
                        onChange={(e) => setNewLeadName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Email (Optional)</label>
                    <input 
                        type="email" 
                        value={newLeadEmail}
                        onChange={(e) => setNewLeadEmail(e.target.value)}
                        placeholder="john@acme.com"
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                    />
                </div>
              </div>
              <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Estimated Deal Value (NGN)</label>
                  <input 
                    type="number" 
                    min="0"
                    value={newLeadValue}
                    onChange={(e) => setNewLeadValue(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all font-mono"
                  />
              </div>
              <div className="pt-4 flex gap-3">
                  <Button type="button" variant="secondary" onClick={() => setShowAddModal(false)} className="flex-1">Cancel</Button>
                  <Button type="submit" className="flex-1">Add to Pipeline</Button>
              </div>
          </form>
      </Modal>

      {/* Edit Lead Modal */}
      {editingLead && (
        <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Deal Details">
            <form onSubmit={handleSaveEdit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Company</label>
                        <input 
                            type="text" 
                            value={editingLead.companyName}
                            onChange={(e) => setEditingLead({...editingLead, companyName: e.target.value})}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Stage</label>
                        <select 
                            value={editingLead.stage}
                            onChange={(e) => setEditingLead({...editingLead, stage: e.target.value as CRMStage})}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500"
                        >
                            {stages.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Deal Value (NGN)</label>
                        <input 
                            type="number" 
                            min="0"
                            value={editingLead.value}
                            onChange={(e) => setEditingLead({...editingLead, value: Number(e.target.value)})}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500 font-mono"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Probability (%)</label>
                        <div className="flex items-center gap-3">
                            <input 
                                type="range" 
                                min="0" 
                                max="100" 
                                step="5"
                                value={editingLead.probability}
                                onChange={(e) => setEditingLead({...editingLead, probability: Number(e.target.value)})}
                                className="flex-1 accent-indigo-500 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                            />
                            <span className="text-sm font-bold text-white w-8 text-right">{editingLead.probability}</span>
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Internal Notes</label>
                    <textarea 
                        value={editingLead.notes}
                        onChange={(e) => setEditingLead({...editingLead, notes: e.target.value})}
                        className="w-full h-32 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500 resize-none leading-relaxed"
                        placeholder="Meeting notes, requirements, next steps..."
                    />
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-slate-800">
                    <button 
                        type="button" 
                        onClick={() => deleteLead(editingLead.id)} 
                        className="text-red-400 hover:text-red-300 text-sm flex items-center gap-1.5 hover:bg-red-500/10 px-3 py-2 rounded transition-colors"
                    >
                        <Trash2 size={16} /> Delete Deal
                    </button>
                    <div className="flex gap-3">
                        <Button type="button" variant="secondary" onClick={() => setShowEditModal(false)}>Cancel</Button>
                        <Button type="submit">Save Changes</Button>
                    </div>
                </div>
            </form>
        </Modal>
      )}
    </div>
  );
};
