
import React, { useState, useEffect } from 'react';
import { Modal, Button, Card } from './Shared';
import { ApiKey, User } from '../types';
import { developerService } from '../services/developerService';
import { Terminal, Key, Trash2, Copy, Check, Plus, AlertCircle } from 'lucide-react';

interface DeveloperPortalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
}

export const DeveloperPortal: React.FC<DeveloperPortalProps> = ({ isOpen, onClose, user }) => {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setKeys(developerService.getKeys());
    }
  }, [isOpen]);

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName) return;
    setLoading(true);
    try {
      const { apiKey, secret } = await developerService.createKey(newKeyName);
      setKeys([...keys, apiKey]);
      setCreatedSecret(secret);
      setNewKeyName('');
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this key? Any applications using it will stop working immediately.')) return;
    await developerService.revokeKey(id);
    setKeys(keys.filter(k => k.id !== id));
  };

  const copySecret = () => {
    if (createdSecret) {
      navigator.clipboard.writeText(createdSecret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Developer API Access">
      <div className="space-y-8">
        
        <div className="bg-indigo-900/20 border border-indigo-500/20 p-4 rounded-lg">
          <h4 className="text-white font-medium flex items-center gap-2 mb-2">
            <Terminal size={18} className="text-indigo-400" /> Meti API
          </h4>
          <p className="text-sm text-slate-400 mb-4">
            Programmatically access Meti's generative engine to build your own marketing tools. 
            Authenticate using the <code>Authorization: Bearer</code> header.
          </p>
          <div className="bg-slate-950 p-3 rounded border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto">
            curl -X POST https://api.meti.app/v1/persona \<br/>
            &nbsp;&nbsp;-H "Authorization: Bearer sk_live_..." \<br/>
            &nbsp;&nbsp;-H "Content-Type: application/json" \<br/>
            &nbsp;&nbsp;-d '{"product": "CRM", "niche": "Real Estate"}'
          </div>
        </div>

        {/* Create Key */}
        {!createdSecret ? (
          <form onSubmit={handleCreateKey} className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="text-xs text-slate-400 font-medium uppercase mb-1 block">New API Key Name</label>
              <input 
                type="text" 
                placeholder="e.g. Production Server, Zapier Integration" 
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none"
              />
            </div>
            <Button type="submit" disabled={loading || !newKeyName} className="h-[38px]">
              <Plus size={16} className="mr-1" /> Generate Key
            </Button>
          </form>
        ) : (
          <div className="bg-emerald-900/10 border border-emerald-500/20 p-4 rounded-lg animate-fadeIn">
             <div className="flex items-start gap-3">
               <div className="bg-emerald-500/20 p-2 rounded-full text-emerald-400 mt-1">
                 <Key size={20} />
               </div>
               <div className="flex-1">
                 <h4 className="text-emerald-400 font-bold text-sm mb-1">API Key Generated</h4>
                 <p className="text-xs text-slate-400 mb-3">
                   This is the only time we will show you the full key. Please copy it now.
                 </p>
                 <div className="flex gap-2">
                   <code className="flex-1 bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-emerald-300 font-mono break-all">
                     {createdSecret}
                   </code>
                   <Button onClick={copySecret} variant="secondary">
                     {copied ? <Check size={16} /> : <Copy size={16} />}
                   </Button>
                 </div>
                 <button 
                   onClick={() => setCreatedSecret(null)}
                   className="mt-3 text-xs text-slate-500 hover:text-white underline"
                 >
                   Done, I've saved it
                 </button>
               </div>
             </div>
          </div>
        )}

        {/* Key List */}
        <div>
          <h4 className="text-sm font-semibold text-white mb-3">Active API Keys</h4>
          <div className="space-y-2">
            {keys.length > 0 ? (
              keys.map(key => (
                <div key={key.id} className="flex items-center justify-between p-3 bg-slate-800 rounded border border-slate-700">
                   <div>
                     <div className="text-white font-medium text-sm">{key.name}</div>
                     <div className="text-xs text-slate-500 font-mono">Prefix: {key.prefix} • Created: {new Date(key.createdAt).toLocaleDateString()}</div>
                   </div>
                   <button 
                     onClick={() => handleRevoke(key.id)}
                     className="text-slate-500 hover:text-red-400 p-2 transition-colors"
                     title="Revoke Key"
                   >
                     <Trash2 size={16} />
                   </button>
                </div>
              ))
            ) : (
              <div className="text-center py-6 border border-dashed border-slate-700 rounded bg-slate-800/30 text-slate-500 text-sm">
                No active API keys. Generate one to get started.
              </div>
            )}
          </div>
        </div>

      </div>
    </Modal>
  );
};
