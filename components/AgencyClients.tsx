
import React, { useState, useEffect } from 'react';
import { Client, User } from '../types';
import { storageService } from '../services/storageService';
import { authService } from '../services/authService';
import { Button, Card, Modal, Spinner } from './Shared';
import { FeatureGuard } from './FeatureGuard';
import { Briefcase, User as UserIcon, Mail, Plus, Edit2, Trash2, Calendar } from 'lucide-react';
import { permissionService } from '../services/permissionService';

interface AgencyClientsProps {
  onSelectClient?: (client: Client) => void;
  onUpgrade?: () => void;
}

export const AgencyClients: React.FC<AgencyClientsProps> = ({ onSelectClient, onUpgrade }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const user = authService.getCurrentUser();

  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');

  useEffect(() => {
    if (user && permissionService.hasAccess(user, 'agency')) {
        loadClients();
    }
  }, [user]);

  const loadClients = async () => {
    setLoading(true);
    const data = await storageService.getClients();
    setClients(data);
    setLoading(false);
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setName(client.name);
    setIndustry(client.industry || '');
    setContactPerson(client.contactPerson || '');
    setEmail(client.email || '');
    setStatus(client.status);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingClient(null);
    setName('');
    setIndustry('');
    setContactPerson('');
    setEmail('');
    setStatus('active');
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this client?")) {
      await storageService.deleteClient(id);
      loadClients();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    const clientData = { name, industry, contactPerson, email, status };

    if (editingClient) {
      await storageService.updateClient(editingClient.id, clientData);
    } else {
      await storageService.addClient(clientData);
    }

    setIsModalOpen(false);
    loadClients();
  };

  if (user && onUpgrade && !permissionService.hasAccess(user, 'agency')) {
    return <FeatureGuard user={user} requiredTier="agency" featureName="Client Management CRM" onUpgrade={onUpgrade}>{null}</FeatureGuard>;
  }

  return (
    <div className="animate-fadeIn">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Client Management</h2>
          <p className="text-slate-400">Manage your agency's book of business.</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus size={18} className="mr-2" /> Add Client
        </Button>
      </div>

      {loading ? <div className="flex justify-center py-20"><Spinner /></div> : clients.length === 0 ? (
        <div className="text-center py-20 bg-slate-800/30 rounded-2xl border border-dashed border-slate-700">
           <Briefcase size={48} className="mx-auto text-slate-500 mb-4" />
           <h3 className="text-xl font-medium text-white mb-2">No Clients Yet</h3>
           <Button onClick={handleAdd}>Add First Client</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients.map(client => (
            <Card key={client.id} className="relative group hover:border-indigo-500/50 transition-colors">
              <div className="flex justify-between items-start mb-4">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-lg">
                      {client.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">{client.name}</h3>
                      <div className="text-xs text-slate-500">{client.industry || 'General'}</div>
                    </div>
                 </div>
                 <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${client.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-700 text-slate-400 border-slate-600'}`}>
                   {client.status}
                 </span>
              </div>
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <UserIcon size={14} className="text-slate-500" /> {client.contactPerson || 'No contact info'}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <Mail size={14} className="text-slate-500" /> {client.email || 'No email'}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <Calendar size={14} className="text-slate-500" /> Onboarded {new Date(client.onboardingDate).toLocaleDateString()}
                </div>
              </div>
              <div className="flex items-center gap-2 pt-4 border-t border-slate-700">
                <button onClick={() => handleEdit(client)} className="flex-1 py-2 rounded hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-medium flex items-center justify-center gap-2 transition-colors">
                  <Edit2 size={14} /> Edit
                </button>
                <button onClick={() => handleDelete(client.id)} className="p-2 rounded hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingClient ? 'Edit Client' : 'Add New Client'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1 uppercase">Client Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white outline-none focus:border-indigo-500" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="block text-xs font-medium text-slate-400 mb-1 uppercase">Industry</label>
               <input type="text" value={industry} onChange={(e) => setIndustry(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white outline-none focus:border-indigo-500" />
             </div>
             <div>
               <label className="block text-xs font-medium text-slate-400 mb-1 uppercase">Status</label>
               <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white outline-none focus:border-indigo-500">
                 <option value="active">Active</option>
                 <option value="inactive">Inactive</option>
               </select>
             </div>
          </div>
          <div>
             <label className="block text-xs font-medium text-slate-400 mb-1 uppercase">Primary Contact</label>
             <input type="text" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white outline-none focus:border-indigo-500" />
          </div>
          <div>
             <label className="block text-xs font-medium text-slate-400 mb-1 uppercase">Email Address</label>
             <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white outline-none focus:border-indigo-500" />
          </div>
          <div className="pt-4 flex gap-3">
             <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)} className="flex-1">Cancel</Button>
             <Button type="submit" className="flex-1">{editingClient ? 'Update Client' : 'Create Client'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
