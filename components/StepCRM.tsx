
import React, { useState, useMemo } from 'react';
import { ProjectData, LeadItem, CRMStage, User } from '../types';
import { Button, Card, SectionTitle, Modal } from './Shared';
import { Columns, FileSpreadsheet, Plus, MoveRight, MoveLeft, Trash2, Database, Search, Edit2, ArrowRight, User as UserIcon } from 'lucide-react';
import confetti from 'canvas-confetti';
import { generateId } from '../utils/core';
import { FeatureGuard } from './FeatureGuard';
import { permissionService } from '../services/permissionService';

interface StepCRMProps {
  data: ProjectData;
  onUpdateLeads: (leads: LeadItem[]) => void;
  onUpdateConnections: (crms: string[]) => void;
  user?: User;
  onUpgrade?: () => void;
}

export const StepCRM: React.FC<StepCRMProps> = ({ data, onUpdateLeads, onUpdateConnections, user, onUpgrade }) => {
  const [activeView, setActiveView] = useState<'pipeline' | 'integrations'>('pipeline');
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [newLeadName, setNewLeadName] = useState('');
  const [newLeadCompany, setNewLeadCompany] = useState('');
  const [newLeadValue, setNewLeadValue] = useState(0);

  const leads = useMemo(() => Array.isArray(data.crmLeads) ? data.crmLeads : [], [data.crmLeads]);
  const connectedCrms = Array.isArray(data.connectedCrms) ? data.connectedCrms : [];
  const stages: CRMStage[] = ['New', 'Qualified', 'Proposal', 'Negotiation', 'Closed Won', 'Retention'];

  const filteredLeads = leads.filter(l => 
    l.companyName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (l.contactName || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = useMemo(() => {
    return leads.reduce((acc, l) => {
      acc.total += (Number(l.value) || 0);
      acc.weighted += (Number(l.value) || 0) * ((Number(l.probability) || 0) / 100);
      return acc;
    }, { total: 0, weighted: 0 });
  }, [leads]);

  const moveLead = (id: string, direction: 'next' | 'prev') => {
    const lead = leads.find(l => l.id === id);
    if (!lead) return;

    const currentIdx = stages.indexOf(lead.stage);
    let nextIdx = direction === 'next' ? currentIdx + 1 : currentIdx - 1;
    if (nextIdx < 0) nextIdx = 0;
    if (nextIdx >= stages.length) nextIdx = stages.length - 1;

    const newStage = stages[nextIdx];
    if (newStage === 'Closed Won' && lead.stage !== 'Closed Won') {
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    }

    const updated = leads.map(l => l.id === id ? { ...l, stage: newStage, probability: newStage === 'Closed Won' ? 100 : l.probability } : l);
    onUpdateLeads(updated);
  };

  const handleAddLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadCompany) return;
    const lead: LeadItem = {
      id: generateId(),
      companyName: newLeadCompany,
      contactName: newLeadName,
      source: 'Manual',
      stage: 'New',
      value: Number(newLeadValue) || 0,
      probability: 10,
      notes: '',
      addedAt: Date.now()
    };
    onUpdateLeads([...leads, lead]);
    setNewLeadCompany('');
    setNewLeadName('');
    setNewLeadValue(0);
    setShowAddModal(false);
  };

  if (user && !permissionService.hasAccess(user, 'pro') && onUpgrade) {
    return <FeatureGuard user={user} requiredTier="pro" featureName="CRM Pipeline" onUpgrade={onUpgrade}>{null}</FeatureGuard>;
  }

  return (
    <div className="max-w-[1600px] mx-auto h-[calc(100vh-140px)] flex flex-col">
      <div className="flex-shrink-0 mb-6 flex justify-between items-end">
        <SectionTitle title="Sales & Retention CRM" subtitle="Manage your pipeline from initial lead to closed won." />
        <div className="flex gap-4 items-center">
            <div className="text-right">
                <div className="text-xs text-slate-500 uppercase font-bold">Weighted Pipe</div>
                <div className="text-xl font-bold text-emerald-400">₦{stats.weighted.toLocaleString()}</div>
            </div>
            <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setShowAddModal(true)}><Plus size={16} /> Add Deal</Button>
            </div>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto min-h-0 pb-4">
        <div className="flex gap-4 h-full min-w-[1400px]">
          {stages.map(stage => (
            <div key={stage} className="flex-1 min-w-[250px] bg-slate-900/50 rounded-xl border border-slate-800 flex flex-col">
              <div className="p-3 border-b border-slate-800 flex justify-between items-center bg-slate-900/80">
                <h3 className="text-xs font-bold text-white uppercase">{stage}</h3>
                <span className="text-[10px] text-slate-500">{leads.filter(l => l.stage === stage).length}</span>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                {filteredLeads.filter(l => l.stage === stage).map(lead => (
                  <Card key={lead.id} className="p-3 hover:border-indigo-500 transition-colors cursor-default relative group">
                    <div className="font-bold text-white text-sm mb-1 truncate pr-6">{lead.companyName}</div>
                    <div className="text-[10px] text-slate-400 mb-2">Value: ₦{lead.value.toLocaleString()}</div>
                    <div className="flex justify-between items-center mt-2 border-t border-slate-700/50 pt-2">
                      <button onClick={() => moveLead(lead.id, 'prev')} className="p-1 hover:text-white text-slate-500"><MoveLeft size={12}/></button>
                      <button onClick={() => moveLead(lead.id, 'next')} className="p-1 hover:text-white text-slate-500"><MoveRight size={12}/></button>
                    </div>
                    <button onClick={() => onUpdateLeads(leads.filter(l => l.id !== lead.id))} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-red-500 transition-opacity"><Trash2 size={12}/></button>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="New Deal">
         <form onSubmit={handleAddLead} className="space-y-4">
            <input placeholder="Company Name" value={newLeadCompany} onChange={e => setNewLeadCompany(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" required />
            <input placeholder="Contact Name" value={newLeadName} onChange={e => setNewLeadName(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" />
            <input type="number" placeholder="Deal Value" value={newLeadValue} onChange={e => setNewLeadValue(Number(e.target.value))} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" />
            <Button type="submit" className="w-full">Create Lead</Button>
         </form>
      </Modal>
    </div>
  );
};
