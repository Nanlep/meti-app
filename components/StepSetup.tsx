
import React, { useState, useEffect } from 'react';
import { Button, Card, SectionTitle } from './Shared';
import { ArrowRight, Box, Briefcase, Link as LinkIcon, Plus, Lock } from 'lucide-react';
import { authService } from '../services/authService';
import { storageService } from '../services/storageService';
import { Client } from '../types';

interface StepSetupProps {
  productName: string;
  productDescription: string;
  clientName?: string;
  clientId?: string; // New
  productUrl?: string;
  productPrice?: number;
  setProductName: (v: string) => void;
  setProductDescription: (v: string) => void;
  setClientName: (v: string) => void;
  setClientId: (v: string) => void; // New
  setProductUrl: (v: string) => void;
  setProductPrice: (v: number) => void;
  onNext: () => void;
  isLocked?: boolean;
}

export const StepSetup: React.FC<StepSetupProps> = ({
  productName,
  productDescription,
  clientName,
  clientId,
  productUrl,
  productPrice,
  setProductName,
  setProductDescription,
  setClientName,
  setClientId,
  setProductUrl,
  setProductPrice,
  onNext,
  isLocked = false
}) => {
  const isComplete = productName.length > 2 && productDescription.length > 10;
  const user = authService.getCurrentUser();
  const isAgency = user?.subscription === 'agency';

  const [clients, setClients] = useState<Client[]>([]);
  const [useNewClient, setUseNewClient] = useState(false);

  useEffect(() => {
    if (isAgency) {
      setClients(storageService.getClients());
    }
  }, [isAgency]);

  const handleClientSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    if (id === 'new') {
        setUseNewClient(true);
        setClientName('');
        setClientId('');
    } else {
        setUseNewClient(false);
        const selected = clients.find(c => c.id === id);
        if (selected) {
            setClientId(selected.id);
            setClientName(selected.name);
        }
    }
  };

  return (
    <div className="max-w-2xl mx-auto animate-fadeIn">
      <div className="text-center mb-12">
        <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-indigo-400 border border-indigo-500/20">
          <Box size={32} />
        </div>
        <h1 className="text-4xl font-bold text-white mb-4">Start Your Engine</h1>
        <p className="text-lg text-slate-400">
          Define your product or service to initialize the AI marketing strategist.
        </p>
      </div>

      <Card className="space-y-6 relative overflow-hidden">
        {isLocked && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center text-center p-8">
             <div className="bg-slate-900 p-6 rounded-2xl border border-slate-700 shadow-2xl max-w-md">
                <div className="w-12 h-12 bg-amber-500/20 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock size={24} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Project Locked</h3>
                <p className="text-slate-400 text-sm mb-6">
                  To prevent strategy fragmentation, product details cannot be changed once the engine has generated assets (Niche/Persona).
                </p>
                <div className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-2">Want to work on a different product?</div>
                <Button onClick={() => window.location.reload()} variant="outline" className="w-full">
                   Create New Project
                </Button>
             </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Product/Service Name
          </label>
          <input
            type="text"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="e.g., Acme Analytics"
            disabled={isLocked}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Product URL Field */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Product Link (Optional)
            </label>
            <div className="relative">
              <input
                type="url"
                value={productUrl || ''}
                onChange={(e) => setProductUrl(e.target.value)}
                placeholder="https://acme.com"
                disabled={isLocked}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 pl-10 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              />
               <LinkIcon className="absolute left-3 top-3.5 text-slate-500" size={18} />
            </div>
          </div>

          {/* Product Price Field */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Product Value / Price
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                value={productPrice || ''}
                onChange={(e) => setProductPrice(Number(e.target.value))}
                placeholder="49000"
                disabled={isLocked}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 pl-10 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              />
               <span className="absolute left-3 top-3.5 text-slate-500 font-sans font-bold text-lg">₦</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Used to calculate potential revenue & ROI (NGN).</p>
          </div>
        </div>

        {/* Agency Client Field */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center justify-between">
            <span>Client Assignment (Optional)</span>
            {isAgency && <span className="text-xs text-indigo-400 font-bold px-2 py-0.5 bg-indigo-500/10 rounded border border-indigo-500/20">AGENCY FEATURE</span>}
          </label>
          <div className="relative">
            {isAgency && clients.length > 0 && !useNewClient ? (
              <div className="flex gap-2">
                 <select 
                   className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 pl-10 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
                   value={clientId || ''}
                   onChange={handleClientSelect}
                   disabled={isLocked}
                 >
                   <option value="">-- Select Existing Client --</option>
                   {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                   <option value="new">+ Create New Client</option>
                 </select>
                 <Briefcase className="absolute left-3 top-3.5 text-slate-500" size={18} />
              </div>
            ) : (
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <input
                        type="text"
                        value={clientName || ''}
                        onChange={(e) => setClientName(e.target.value)}
                        placeholder={isAgency ? "Enter Client Name" : "Upgrade to Agency to organize by Client"}
                        disabled={isLocked}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 pl-10 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <Briefcase className="absolute left-3 top-3.5 text-slate-500" size={18} />
                    </div>
                    {isAgency && clients.length > 0 && useNewClient && !isLocked && (
                         <Button onClick={() => setUseNewClient(false)} variant="secondary" className="px-3">
                             Cancel
                         </Button>
                    )}
                </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Description
          </label>
          <textarea
            value={productDescription}
            onChange={(e) => setProductDescription(e.target.value)}
            placeholder="What does it do? Who is it for? What is the main value proposition?"
            rows={4}
            disabled={isLocked}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        <div className="pt-4">
          <Button 
            onClick={onNext} 
            disabled={!isComplete || isLocked} 
            className="w-full py-4 text-lg"
          >
            Launch Strategy Engine <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </Card>
    </div>
  );
};
