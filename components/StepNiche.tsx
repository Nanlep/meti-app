import React, { useState } from 'react';
import { generateNiches } from '../services/geminiService';
import { NicheSuggestion } from '../types';
import { Button, Card, SectionTitle } from './Shared';
import { Target, TrendingUp, Users, Filter, RefreshCw } from 'lucide-react';

interface StepNicheProps {
  productName: string;
  productDescription: string;
  onSelect: (niche: NicheSuggestion) => void;
  selectedNiche: NicheSuggestion | null;
}

export const StepNiche: React.FC<StepNicheProps> = ({
  productName,
  productDescription,
  onSelect,
  selectedNiche
}) => {
  const [loading, setLoading] = useState(false);
  const [niches, setNiches] = useState<NicheSuggestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Advanced Filter State
  const [showFilters, setShowFilters] = useState(false);
  const [marketFocus, setMarketFocus] = useState("");

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await generateNiches(productName, productDescription, {
        focus: marketFocus
      });
      setNiches(data);
    } catch (e) {
      setError("Failed to generate niches. Please check your API key.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <SectionTitle 
        title="Market Segmentation" 
        subtitle="Identify the most profitable sub-niches for your product to dominate."
      />

      <div className="mb-8 bg-slate-800/40 rounded-xl p-4 border border-slate-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide flex items-center gap-2">
            <Filter size={16} /> Analysis Settings
          </h3>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="text-xs text-indigo-400 hover:text-indigo-300"
          >
            {showFilters ? 'Hide Advanced Options' : 'Show Advanced Options'}
          </button>
        </div>

        {showFilters && (
          <div className="mb-4 animate-fadeIn">
            <label className="block text-sm font-medium text-slate-400 mb-2">
              Market Focus / Constraints
            </label>
            <input 
              type="text" 
              placeholder="e.g. B2B SaaS only, High Ticket, US Market..." 
              value={marketFocus}
              onChange={(e) => setMarketFocus(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-indigo-500 outline-none"
            />
          </div>
        )}

        <div className="flex justify-between items-center">
          <p className="text-xs text-slate-500">
            {niches.length > 0 ? "Refine settings and regenerate if needed." : "Configure settings before analysis."}
          </p>
          <Button onClick={handleGenerate} disabled={loading} className="px-6">
            {loading ? 'Analyzing...' : niches.length > 0 ? 'Regenerate Analysis' : 'Analyze Market Opportunities'}
            {!loading && <RefreshCw size={16} className={niches.length > 0 ? "ml-2" : "hidden"} />}
          </Button>
        </div>
      </div>

      {niches.length === 0 && !loading && (
        <div className="text-center py-12 bg-slate-800/30 rounded-xl border border-dashed border-slate-700">
          <Target className="w-12 h-12 text-slate-500 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-white mb-2">Ready to Analyze</h3>
          <p className="text-slate-400 mb-6 max-w-md mx-auto">
            Our AI will scan market data to find your ideal entry point.
          </p>
        </div>
      )}

      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-slate-800/50 rounded-xl animate-pulse"></div>
          ))}
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {niches.map((niche, idx) => (
          <Card 
            key={idx} 
            onClick={() => onSelect(niche)}
            selected={selectedNiche?.name === niche.name}
            className="relative overflow-hidden group"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                  {niche.name}
                  {selectedNiche?.name === niche.name && (
                    <span className="text-xs bg-indigo-500 text-white px-2 py-0.5 rounded-full">Selected</span>
                  )}
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed mb-3">
                  {niche.reasoning}
                </p>
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Users size={14} /> {niche.marketSizeEstimate}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-slate-700 pt-4 md:pt-0 md:pl-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-indigo-400">{niche.profitabilityScore}</div>
                  <div className="text-xs text-slate-500 uppercase tracking-wide">Profit Score</div>
                </div>
                <div className="hidden md:block text-slate-600">
                  <TrendingUp size={24} />
                </div>
              </div>
            </div>
            
            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="bg-indigo-600 text-white text-xs px-3 py-1 rounded-full">
                Click to Select
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};