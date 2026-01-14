import React, { useState } from 'react';
import { generateQualification } from '../services/geminiService';
import { PersonaProfile, QualificationQuestion } from '../types';
import { Button, Card, SectionTitle } from './Shared';
import { CheckCircle, HelpCircle } from 'lucide-react';

interface StepQualifyProps {
  productName: string;
  persona: PersonaProfile;
}

export const StepQualify: React.FC<StepQualifyProps> = ({ productName, persona }) => {
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<QualificationQuestion[]>([]);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const data = await generateQualification(productName, persona);
      setQuestions(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <SectionTitle 
        title="Sales Qualification Framework" 
        subtitle="Ensure your sales team spends time on the right leads."
      />

      {questions.length === 0 && !loading && (
        <div className="text-center py-12">
          <Button onClick={handleGenerate}>Create Qualification Script</Button>
        </div>
      )}

      {loading && <div className="text-center text-slate-400 py-12">Designing sales rubric...</div>}

      <div className="space-y-4">
        {questions.map((q, idx) => (
          <Card key={idx} className="flex gap-4">
            <div className="flex-shrink-0 mt-1">
              <div className="w-8 h-8 rounded-full bg-slate-700 text-white flex items-center justify-center font-bold text-sm">
                {idx + 1}
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium text-white mb-2">{q.question}</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="bg-slate-900/50 p-3 rounded border border-slate-700/50">
                  <div className="flex items-center gap-2 text-xs text-slate-500 uppercase font-bold mb-1">
                    <HelpCircle size={12} /> Intent
                  </div>
                  <p className="text-sm text-slate-300">{q.intent}</p>
                </div>
                
                <div className="bg-emerald-900/10 p-3 rounded border border-emerald-500/20">
                   <div className="flex items-center gap-2 text-xs text-emerald-500 uppercase font-bold mb-1">
                    <CheckCircle size={12} /> Ideal Answer
                  </div>
                  <p className="text-sm text-emerald-200/80">{q.idealAnswer}</p>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
