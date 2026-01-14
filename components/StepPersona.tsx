import React, { useState, useEffect } from 'react';
import { generatePersona } from '../services/geminiService';
import { NicheSuggestion, PersonaProfile } from '../types';
import { Button, Card, SectionTitle } from './Shared';
import { User, AlertCircle, Heart, Zap, RefreshCw, MessageSquare } from 'lucide-react';
import { notify } from '../services/notificationService';

interface StepPersonaProps {
  productName: string;
  niche: NicheSuggestion | null;
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

  useEffect(() => {
    if (!existingPersona && !loading && !persona && niche) {
      handleGenerate();
    }
  }, [niche]);

  const handleGenerate = async (refine?: string) => {
    if (!niche) return;
    setLoading(true);
    setError(null);
    try {
      const data = await generatePersona(productName, niche, refine);
      setPersona(data);
      onPersonaGenerated(data);
      setRefinementText("");
      setShowRefineInput(false);
      notify.success("Persona profile ready");
    } catch (e: any) {
      const msg = e.message || "Failed to generate Persona profile.";
      setError(msg);
      notify.error("Generation Error");
    } finally {
      setLoading(false);
    }
  };

  if (!niche) return <div className="text-center p-20 text-slate-500">Please select a niche first.</div>;

  if (loading && !persona) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20 animate-pulse">
        <div className="animate-spin w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-6"></div>
        <h3 className="text-xl text-white font-bold">Forensic Psychological Profiling...</h3>
        <p className="text-slate-400 mt-2">Meti is analyzing behavioral triggers for your target audience.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto relative">
      <SectionTitle title="Ideal Customer Profile" subtitle={`Behavioral analysis for the "${niche.name}" segment.`} />

      {error && !persona && (
        <Card className="bg-red-900/10 border-red-500/30 mb-8 p-6 text-center">
          <AlertCircle className="mx-auto text-red-500 mb-4" size={40} />
          <h4 className="text-red-400 font-bold mb-2">Generation Failed</h4>
          <p className="text-slate-400 text-sm mb-6">{error}</p>
          <Button onClick={() => handleGenerate()} className="bg-red-600 hover:bg-red-700">Retry Analysis</Button>
        </Card>
      )}

      {persona && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-fadeIn">
          <Card className="md:col-span-1 bg-indigo-900/10 border-indigo-500/20 flex flex-col items-center text-center p-8">
            <div className="w-24 h-24 bg-indigo-500 rounded-full flex items-center justify-center mb-4 text-white shadow-xl">
              <User size={48} />
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">{persona.jobTitle}</h3>
            <span className="text-indigo-400 text-sm font-medium">{persona.ageRange}</span>
            <div className="w-full h-px bg-slate-800 my-6"></div>
            <div className="text-left w-full space-y-2">
              {persona.psychographics?.slice(0, 4).map((item, i) => (
                <div key={i} className="text-xs text-slate-400 flex items-start gap-2">
                  <span className="text-indigo-500 font-bold">•</span> {item}
                </div>
              ))}
            </div>
          </Card>

          <div className="md:col-span-2 space-y-4">
            <Card className="border-red-500/10"><h4 className="text-red-400 font-bold text-sm uppercase mb-3 flex items-center gap-2"><AlertCircle size={16}/> Pain Points</h4><div className="flex flex-wrap gap-2">{persona.painPoints?.map((p,i) => <span key={i} className="bg-red-500/5 text-red-200/70 text-xs px-3 py-1.5 rounded-lg border border-red-500/10">{p}</span>)}</div></Card>
            <Card className="border-emerald-500/10"><h4 className="text-emerald-400 font-bold text-sm uppercase mb-3 flex items-center gap-2"><Heart size={16}/> Core Aspirations</h4><div className="space-y-2">{persona.goals?.map((g,i) => <div key={i} className="flex items-center gap-2 text-xs text-slate-300"><span className="text-emerald-500">✓</span> {g}</div>)}</div></Card>
            <Card className="border-amber-500/10"><h4 className="text-amber-400 font-bold text-sm uppercase mb-3 flex items-center gap-2"><Zap size={16}/> Purchase Triggers</h4><ul className="list-disc list-inside text-xs text-slate-400 space-y-1">{persona.buyingTriggers?.map((t,i) => <li key={i}>{t}</li>)}</ul></Card>
          </div>
        </div>
      )}

      {persona && (
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between gap-4">
          <div className="flex-1">
            {showRefineInput ? (
               <div className="flex gap-2 w-full animate-slideIn">
                 <input value={refinementText} onChange={e => setRefinementText(e.target.value)} placeholder="e.g. 'Make them more technical'..." className="flex-1 bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-white" />
                 <Button size="sm" onClick={() => handleGenerate(refinementText)} disabled={loading}>Apply</Button>
                 <Button size="sm" variant="secondary" onClick={() => setShowRefineInput(false)}>Cancel</Button>
               </div>
            ) : (
              <p className="text-sm text-slate-500 italic flex items-center gap-2"><MessageSquare size={14}/> Not exactly right? Use AI to refine this persona.</p>
            )}
          </div>
          {!showRefineInput && <div className="flex gap-2"><Button size="sm" variant="secondary" onClick={() => setShowRefineInput(true)}>Refine</Button><Button size="sm" variant="outline" onClick={() => handleGenerate()} disabled={loading}>{loading ? <RefreshCw className="animate-spin"/> : <RefreshCw size={14}/>}</Button></div>}
        </div>
      )}
    </div>
  );
};