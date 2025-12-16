
import React, { useState, useEffect } from 'react';
import { Modal, Button } from './Shared';
import { Project } from '../types';
import { storageService } from '../services/storageService';
import { adminService } from '../services/adminService';
import { Mail, User, Briefcase, Shield, AlertCircle, CheckCircle2 } from 'lucide-react';

interface InviteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const InviteUserModal: React.FC<InviteUserModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Load projects for the dropdown
      setProjects(storageService.getAll());
      setSuccess(false);
      setError(null);
      setEmail('');
      setName('');
      setRole('user');
      setSelectedProjectId('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name) return;
    
    setLoading(true);
    setError(null);

    try {
      await adminService.inviteUser({
        email,
        name,
        role,
        projectId: selectedProjectId || undefined
      });
      
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to invite user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Invite New User">
      {success ? (
        <div className="text-center py-8 animate-fadeIn">
          <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Invitation Sent!</h3>
          <p className="text-slate-400">
            {name} has been added to the organization<br/>
            {selectedProjectId && "and assigned to the project."}
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-indigo-900/20 border border-indigo-500/20 p-4 rounded-lg text-sm text-indigo-300">
            This user will receive an email invitation to join your <strong>Meti Organization</strong>. 
            A temporary password will be generated for them.
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1 uppercase">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 text-slate-500" size={16} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  placeholder="colleague@company.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1 uppercase">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 text-slate-500" size={16} />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1 uppercase">System Role</label>
                <div className="relative">
                  <Shield className="absolute left-3 top-2.5 text-slate-500" size={16} />
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as 'user' | 'admin')}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm appearance-none cursor-pointer"
                  >
                    <option value="user">Standard User</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1 uppercase">Assign Project (Optional)</label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-2.5 text-slate-500" size={16} />
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm appearance-none cursor-pointer"
                  >
                    <option value="">No Project Assignment</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-xs text-red-400">
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
             <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
               Cancel
             </Button>
             <Button type="submit" disabled={loading} className="flex-1">
               {loading ? 'Sending Invite...' : 'Send Invitation'}
             </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
