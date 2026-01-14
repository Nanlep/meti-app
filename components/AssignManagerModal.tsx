
import React, { useState } from 'react';
import { Modal, Button } from './Shared';
import { User, AccountManager } from '../types';
import { adminService } from '../services/adminService';
import { UserCog, Phone, Mail, CheckCircle2 } from 'lucide-react';

interface AssignManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onSuccess: () => void;
}

export const AssignManagerModal: React.FC<AssignManagerModalProps> = ({ isOpen, onClose, user, onSuccess }) => {
  const [name, setName] = useState(user.accountManager?.name || '');
  const [email, setEmail] = useState(user.accountManager?.email || '');
  const [phone, setPhone] = useState(user.accountManager?.phone || '');
  
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const manager: AccountManager = {
        name,
        email,
        phone,
        avatarInitials: name.substring(0,2).toUpperCase()
    };

    try {
        await adminService.assignAccountManager(user.id, manager);
        onSuccess();
        onClose();
    } catch (e) {
        console.error(e);
        alert("Failed to assign manager");
    } finally {
        setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Assign Account Officer">
      <div className="space-y-6">
        <div className="bg-amber-900/20 border border-amber-500/20 p-4 rounded-lg flex items-center gap-3">
             <div className="bg-amber-500/20 p-2 rounded-full text-amber-400">
               <UserCog size={20} />
             </div>
             <div>
               <h4 className="text-white font-medium">Assigning to: {user.name}</h4>
               <p className="text-sm text-slate-400">
                 This Agency User will see these details on their dashboard.
               </p>
             </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1 uppercase">Officer Name</label>
              <input 
                type="text" 
                required 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sarah Connor"
                className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white outline-none focus:border-indigo-500"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1 uppercase">Email</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-2.5 text-slate-500" size={14} />
                        <input 
                            type="email" 
                            required 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="officer@meti.pro"
                            className="w-full bg-slate-950 border border-slate-700 rounded pl-9 pr-3 py-2 text-white outline-none focus:border-indigo-500"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1 uppercase">Phone</label>
                    <div className="relative">
                        <Phone className="absolute left-3 top-2.5 text-slate-500" size={14} />
                        <input 
                            type="tel" 
                            required 
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+1 (555) 000-0000"
                            className="w-full bg-slate-950 border border-slate-700 rounded pl-9 pr-3 py-2 text-white outline-none focus:border-indigo-500"
                        />
                    </div>
                </div>
            </div>

            <div className="pt-4 flex gap-3">
               <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
               <Button type="submit" disabled={loading} className="flex-1">
                   {loading ? 'Assigning...' : 'Assign Officer'}
               </Button>
            </div>
        </form>
      </div>
    </Modal>
  );
};
