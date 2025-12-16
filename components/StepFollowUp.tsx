import React, { useState } from 'react';
import { generateFollowUp } from '../services/geminiService';
import { PersonaProfile, FollowUpEmail } from '../types';
import { Button, Card, SectionTitle } from './Shared';
import { Mail, Clock, Copy, Check } from 'lucide-react';

interface StepFollowUpProps {
  productName: string;
  persona: PersonaProfile;
}

export const StepFollowUp: React.FC<StepFollowUpProps> = ({ productName, persona }) => {
  const [loading, setLoading] = useState(false);
  const [emails, setEmails] = useState<FollowUpEmail[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const data = await generateFollowUp(productName, persona, null);
      setEmails(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <SectionTitle 
        title="Nurture Sequence" 
        subtitle="Automated follow-ups to convert cold leads into booked meetings."
      />

      {emails.length === 0 && !loading && (
        <div className="text-center py-12">
          <Button onClick={handleGenerate}>Draft Email Sequence</Button>
        </div>
      )}

      {loading && <div className="text-center text-slate-400 py-12">Writing persuasive copy...</div>}

      <div className="space-y-8">
        {emails.map((email, idx) => (
          <div key={idx} className="relative pl-8 border-l-2 border-slate-700 last:border-0 pb-8 last:pb-0">
            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-indigo-500 ring-4 ring-slate-900"></div>
            
            <div className="flex items-center gap-2 mb-4 text-sm text-indigo-400 font-medium">
              <Clock size={14} /> {email.sendDelay}
            </div>

            <Card className="bg-slate-800">
              <div className="border-b border-slate-700 pb-4 mb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-white font-medium mb-1"><span className="text-slate-500">Subject:</span> {email.subject}</h3>
                    <p className="text-slate-400 text-sm"><span className="text-slate-600">Preview:</span> {email.previewText}</p>
                  </div>
                  <button 
                    className={`transition-all duration-200 ${copiedIndex === idx ? 'text-emerald-400' : 'text-slate-500 hover:text-white'}`}
                    title="Copy to clipboard" 
                    onClick={() => handleCopy(email.body, idx)}
                  >
                    {copiedIndex === idx ? <Check size={20} /> : <Copy size={18} />}
                  </button>
                </div>
              </div>
              
              <div className="prose prose-invert prose-sm max-w-none text-slate-300 whitespace-pre-line leading-relaxed">
                {email.body}
              </div>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
};