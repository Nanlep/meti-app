
import React, { useState } from 'react';
import { Modal, Button } from './Shared';
import { Project, User } from '../types';
import { storageService } from '../services/storageService';
import { UserPlus, Users, Trash2, User as UserIcon, AlertCircle, Shield } from 'lucide-react';

interface TeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  currentUser: User;
  onUpdate: () => void;
}

export const TeamModal: React.FC<TeamModalProps> = ({ isOpen, onClose, project, currentUser, onUpdate }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isOwner = project.userId === currentUser.id;

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const result = await storageService.addTeamMember(project.id, email);
      if (result.success) {
        setSuccess(result.message);
        setEmail('');
        onUpdate();
      } else {
        setError(result.message);
      }
    } catch (e) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("Are you sure you want to remove this user?")) return;
    const result = await storageService.removeTeamMember(project.id, memberId);
    if (result.success) {
      onUpdate();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manage Team Access">
      <div className="space-y-6">
        <div className="flex items-center gap-3 p-4 bg-indigo-900/20 border border-indigo-500/20 rounded-lg">
           <div className="bg-indigo-500/20 p-2 rounded-full text-indigo-400">
             <Users size={20} />
           </div>
           <div>
             <h4 className="text-white font-medium">Project: {project.name}</h4>
             <p className="text-sm text-slate-400">
               {isOwner ? "You are the Owner. Invite others to collaborate." : "You are a Team Member. You can view and edit."}
             </p>
           </div>
        </div>

        {isOwner && (
          <form onSubmit={handleAddMember} className="bg-slate-800 p-4 rounded-lg border border-slate-700">
            <h5 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <UserPlus size={16} className="text-emerald-400" /> Add Team Member
            </h5>
            <div className="flex gap-2">
              <input 
                type="email" 
                placeholder="colleague@company.com" 
                className="flex-1 bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button type="submit" disabled={loading} className="py-2 px-4 text-sm">
                {loading ? 'Adding...' : 'Invite'}
              </Button>
            </div>
            {error && <p className="text-xs text-red-400 mt-2 flex items-center gap-1"><AlertCircle size={12} /> {error}</p>}
            {success && <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1"><Shield size={12} /> {success}</p>}
          </form>
        )}

        <div className="space-y-3">
          <h5 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Current Access</h5>
          
          <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded border border-slate-700">
            <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                 OW
               </div>
               <div>
                 <div className="text-sm text-white font-medium">Project Owner</div>
                 <div className="text-xs text-slate-500">ID: {project.userId.substring(0,8)}...</div>
               </div>
            </div>
            <span className="text-xs bg-indigo-500/10 text-indigo-400 px-2 py-1 rounded border border-indigo-500/20">Admin</span>
          </div>

          {project.teamMembers.length > 0 ? (
            project.teamMembers.map(memberId => (
              <div key={memberId} className="flex items-center justify-between p-3 bg-slate-800/50 rounded border border-slate-700">
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 text-xs font-bold">
                     <UserIcon size={14} />
                   </div>
                   <div>
                     <div className="text-sm text-white font-medium">Team Member</div>
                     <div className="text-xs text-slate-500">ID: {memberId.substring(0,8)}...</div>
                   </div>
                </div>
                {isOwner && (
                  <button 
                    onClick={() => handleRemoveMember(memberId)}
                    className="p-1.5 hover:bg-red-500/10 text-slate-500 hover:text-red-400 rounded transition-colors"
                    title="Remove User"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))
          ) : (
             <div className="text-center py-4 text-xs text-slate-500 italic">No additional team members.</div>
          )}
        </div>
      </div>
    </Modal>
  );
};
