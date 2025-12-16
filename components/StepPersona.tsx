
import React, { useState, useEffect } from 'react';
import { generatePersona } from '../services/geminiService';
import { NicheSuggestion, PersonaProfile } from '../types';
import { Button, Card, SectionTitle } from './Shared';
import { User, AlertCircle, Heart, Zap, RefreshCw, MessageSquare } from 'lucide-react';

interface StepPersonaProps {
  productName: string;
  niche: NicheSuggestion;
  onPersonaGenerated: (persona: PersonaProfile) => void;
  existingPersona: PersonaProfile | null;
}

export const StepPersona: React.FC<StepPersonaProps> = ({
  productName,
  niche,
  onPersonaGenerated,
  existingPersona
}) => {
  const [loading, setLoading] = useState(false);
  const [persona, setPersona] = useState<PersonaProfile | null>(existingPersona);
  const [error, setError] = useState<string | null>(null);
  const [showRefineInput, setShowRefineInput] = useState(false);
  const [refinementText, setRefinementText] = useState("");

  // Auto-generate if not exists when entering this step
  useEffect(() => {
    if (!existingPersona && !loading && !persona) {
      handleGenerate();
    }
  }, []);

  const handleGenerate = async (refine?: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await generatePersona(productName, niche, refine);
      setPersona(data);
      onPersonaGenerated(data);
      setRefinementText("");
      setShowRefineInput(false);
    } catch (e) {
      setError("Failed to generate Persona.");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !persona) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <div className="animate-spin w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-6"></div>
        <h3 className="text-xl text-white">Analyzing Psychological Triggers...</h3>
        <p className="text-slate-400">Building the profile of your perfect buyer.</p>
      </div>
    );
  }

  if (error && !persona) {
    return (
      <div className="text-center py-12">
        <div className="text-red-400 mb-4">{error}</div>
        <Button onClick={() => handleGenerate()}>Retry Generation</Button>
      </div>
    );
  }

  if (!persona) return null;

  return (
    <div className="max-w-4xl mx-auto relative">
      {/* Loading Overlay for Regeneration */}
      {loading && (
        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center rounded-xl">
           <div className="animate-spin w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full mb-4"></div>
           <p className="text-white font-medium">Refining Persona Profile...</p>
        </div>
      )}

      <SectionTitle 
        title="Ideal Customer Profile (ICP)" 
        subtitle={`Targeting the decision maker in the "${niche.name}" niche.`}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="md:col-span-1 bg-gradient-to-br from-indigo-900/40 to-slate-900 border-indigo-500/30">
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-indigo-500 rounded-full flex items-center justify-center mb-4 text-white shadow-lg shadow-indigo-500/25">
              <User size={40} />
            </div>
            <h3 className="text-xl font-bold text-white">{persona.jobTitle}</h3>
            <p className="text-indigo-300 text-sm mb-4">{persona.ageRange}</p>
            <div className="w-full h-px bg-indigo-500/20 mb-4"></div>
            <div className="text-left w-full space-y-2">
              {persona.psychographics?.slice(0, 3).map((item, i) => (
                <div key={i} className="text-xs text-slate-300 flex items-start gap-2">
                  <span className="text-indigo-400 mt-0.5">•</span> {item}
                </div>
              ))}
            </div>
          </div>
        </Card>

        <div className="md:col-span-2 space-y-6">
          <Card>
            <h4 className="flex items-center gap-2 text-red-400 font-medium mb-3">
              <AlertCircle size={18} /> Major Pain Points
            </h4>
            <div className="flex flex-wrap gap-2">
              {persona.painPoints?.map((point, i) => (
                <span key={i} className="bg-red-500/10 text-red-200 text-sm px-3 py-1.5 rounded-lg border border-red-500/20">
                  {point}
                </span>
              ))}
            </div>
          </Card>

          <Card>
            <h4 className="flex items-center gap-2 text-emerald-400 font-medium mb-3">
              <Heart size={18} /> Goals & Aspirations
            </h4>
            <div className="space-y-2">
              {persona.goals?.map((goal, i) => (
                <div key={i} className="flex items-start gap-2 text-slate-300 text-sm">
                  <span className="text-emerald-500">✓</span> {goal}
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h4 className="flex items-center gap-2 text-amber-400 font-medium mb-3">
              <Zap size={18} /> Buying Triggers
            </h4>
             <ul className="list-disc list-inside text-slate-300 text-sm space-y-1">
              {persona.buyingTriggers?.map((trigger, i) => (
                <li key={i}>{trigger}</li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
      
      {/* Regeneration UI */}
      <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex-1 w-full">
            {showRefineInput ? (
               <div className="animate-fadeIn w-full">
                 <label className="text-xs text-slate-400 block mb-1">Feedback / Refinement Instructions:</label>
                 <div className="flex gap-2">
                   <input 
                     type="text" 
                     value={refinementText}
                     onChange={(e) => setRefinementText(e.target.value)}
                     placeholder="e.g. 'Make them more technical' or 'Focus on small business owners'"
                     className="flex-1 bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none"
                     onKeyDown={(e) => e.key === 'Enter' && handleGenerate(refinementText)}
                   />
                   <Button onClick={() => handleGenerate(refinementText)} variant="primary" className="py-2 px-3">
                     Apply
                   </Button>
                   <Button onClick={() => setShowRefineInput(false)} variant="secondary" className="py-2 px-3">
                     Cancel
                   </Button>
                 </div>
               </div>
            ) : (
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <MessageSquare size={16} />
                <span>Is this persona not quite right?</span>
              </div>
            )}
          </div>
          
          {!showRefineInput && (
            <div className="flex gap-2">
              <Button onClick={() => setShowRefineInput(true)} variant="secondary">
                 Refine Persona
              </Button>
              <Button onClick={() => handleGenerate()} variant="outline">
                 <RefreshCw size={16} className="mr-2" /> Regenerate
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
