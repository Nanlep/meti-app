
import React from 'react';
import { Button, Card } from './Shared';
import { ArrowRight, Box, Briefcase, Link as LinkIcon, Lock } from 'lucide-react';

interface StepSetupProps {
  productName: string;
  productDescription: string;
  clientName?: string;
  clientId?: string;
  productUrl?: string;
  productPrice?: number;
  setProductName: (v: string) => void;
  setProductDescription: (v: string) => void;
  setClientName: (v: string) => void;
  setClientId: (v: string) => void;
  setProductUrl: (v: string) => void;
  setProductPrice: (v: number) => void;
  onNext: () => void;
  isLocked?: boolean;
}

export const StepSetup: React.FC<StepSetupProps> = ({
  productName,
  productDescription,
  clientName,
  productUrl,
  productPrice,
  setProductName,
  setProductDescription,
  setClientName,
  setProductUrl,
  setProductPrice,
  onNext,
  isLocked = false
}) => {
  const isComplete = productName.length > 2 && productDescription.length > 10;

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
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center text-center p-8 animate-fadeIn">
             <div className="bg-slate-900 p-8 rounded-2xl border border-slate-700 shadow-2xl max-w-md w-full relative">
                {/* Glow Effect */}
                <div className="absolute -top-10 -left-10 w-20 h-20 bg-amber-500/20 blur-xl rounded-full"></div>
                
                <div className="w-14 h-14 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-5 border border-amber-500/20 shadow-lg shadow-amber-500/10">
                  <Lock size={28} />
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-3">Project Locked</h3>
                
                <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                  To prevent strategy fragmentation, product details cannot be changed once the engine has generated assets (Niche/Persona).
                </p>
                
                <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-3">
                    Want to work on a different product?
                </div>
                
                <Button 
                    onClick={() => window.location.reload()} 
                    variant="outline" 
                    className="w-full py-3 border-slate-600 hover:border-white hover:bg-slate-800 text-white transition-all"
                >
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

        {/* Client Field - Simplified to Text Input */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Client Name (Optional)
          </label>
          <div className="relative">
            <input
              type="text"
              value={clientName || ''}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Enter Client Name"
              disabled={isLocked}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 pl-10 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <Briefcase className="absolute left-3 top-3.5 text-slate-500" size={18} />
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
