import React, { useState, useEffect, useRef } from 'react';
import { sendChatMessage, handleObjection, generateColdDMs } from '../services/geminiService';
import { PersonaProfile, ChatMessage, User } from '../types';
import { Button, Card, SectionTitle } from './Shared';
import { FeatureGuard } from './FeatureGuard';
import { MessageCircle, ShieldAlert, Send, User as UserIcon, Zap, Copy, Check, Mail } from 'lucide-react';
import { permissionService } from '../services/permissionService';
import { notify } from '../services/notificationService';

interface StepSalesProps {
  productName: string;
  persona: PersonaProfile;
  user: User;
  onUpgrade: () => void;
}

export const StepSales: React.FC<StepSalesProps> = ({ productName, persona, user, onUpgrade }) => {
  const [activeTab, setActiveTab] = useState<'roleplay' | 'objections' | 'dms'>('roleplay');

  // Roleplay State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Other States
  const [objectionInput, setObjectionInput] = useState('');
  const [rebuttals, setRebuttals] = useState<string[]>([]);
  const [objectionLoading, setObjectionLoading] = useState(false);
  const [dms, setDms] = useState<string[]>([]);
  const [dmsLoading, setDmsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initial Greeting
  useEffect(() => {
      if (messages.length === 0 && activeTab === 'roleplay') {
          setMessages([{ role: 'model', text: `Hi there. I'm a ${persona.jobTitle}. I'm listening, but I'm busy. What do you have?` }]);
      }
  }, [activeTab]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    
    const userMsg: ChatMessage = { role: 'user', text: inputMessage };
    // Optimistic Update
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInputMessage('');
    setChatLoading(true);

    try {
      // Stateless Call: Send entire history to backend
      const responseText = await sendChatMessage(newHistory, productName, persona);
      const aiMsg: ChatMessage = { role: 'model', text: responseText };
      setMessages(prev => [...prev, aiMsg]);
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { role: 'model', text: "Connection error. Please try again." }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleObjectionSubmit = async () => {
      if(!objectionInput.trim()) return;
      setObjectionLoading(true);
      try {
          const res = await handleObjection(objectionInput, productName, persona);
          setRebuttals(res);
      } catch(e) {
          notify.error("Failed to generate rebuttals");
      } finally {
          setObjectionLoading(false);
      }
  };

  const handleGenerateDMs = async () => {
      setDmsLoading(true);
      try {
          const res = await generateColdDMs(productName, persona);
          setDms(res);
      } catch(e) {
          notify.error("Failed to generate DMs");
      } finally {
          setDmsLoading(false);
      }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (!permissionService.hasAccess(user, 'pro')) {
      return <FeatureGuard user={user} requiredTier="pro" featureName="Sales Accelerator" onUpgrade={onUpgrade}>{null}</FeatureGuard>;
  }

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-140px)] flex flex-col relative animate-fadeIn">
      <div className="flex justify-between items-center mb-6">
          <SectionTitle title="Sales Simulator" subtitle="Practice your pitch against an AI persona." />
          <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800">
              <button onClick={() => setActiveTab('roleplay')} className={`px-4 py-2 rounded text-sm font-medium ${activeTab === 'roleplay' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>Roleplay</button>
              <button onClick={() => setActiveTab('objections')} className={`px-4 py-2 rounded text-sm font-medium ${activeTab === 'objections' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>Objections</button>
              <button onClick={() => setActiveTab('dms')} className={`px-4 py-2 rounded text-sm font-medium ${activeTab === 'dms' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>Outreach</button>
          </div>
      </div>
      
      {activeTab === 'roleplay' && (
        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col shadow-2xl">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center text-white"><UserIcon size={20}/></div>
                <div>
                    <div className="text-white font-bold">{persona.jobTitle}</div>
                    <div className="text-xs text-slate-400 flex items-center gap-1"><span className="w-2 h-2 bg-emerald-500 rounded-full"></span> Online</div>
                </div>
                <Button size="sm" variant="secondary" className="ml-auto" onClick={() => setMessages([])}>Reset</Button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`p-3 rounded-2xl max-w-[80%] text-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-bl-none'}`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                {chatLoading && <div className="text-slate-500 text-xs animate-pulse ml-4">Typing...</div>}
                <div ref={messagesEndRef} />
            </div>
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex gap-2">
                <input 
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-indigo-500 outline-none"
                    placeholder="Type your response..."
                    value={inputMessage}
                    onChange={e => setInputMessage(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                    disabled={chatLoading}
                />
                <Button onClick={handleSendMessage} disabled={chatLoading} className="px-4"><Send size={18}/></Button>
            </div>
        </div>
      )}

      {activeTab === 'objections' && (
          <div className="space-y-6">
              <Card className="bg-slate-800 border-slate-700">
                  <h4 className="text-white font-bold mb-4 flex items-center gap-2"><ShieldAlert className="text-red-400"/> Objection Crusher</h4>
                  <div className="flex gap-2">
                      <input 
                          value={objectionInput}
                          onChange={e => setObjectionInput(e.target.value)}
                          placeholder="e.g. 'It's too expensive'"
                          className="flex-1 bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white"
                      />
                      <Button onClick={handleObjectionSubmit} disabled={objectionLoading}>{objectionLoading ? 'Analyzing...' : 'Crush It'}</Button>
                  </div>
              </Card>
              <div className="space-y-3">
                  {rebuttals.map((r, i) => (
                      <div key={i} className="bg-slate-800 p-4 rounded-xl border border-slate-700 hover:border-indigo-500 cursor-pointer group" onClick={() => copyToClipboard(r, i)}>
                          <div className="flex justify-between text-xs text-slate-500 mb-2 uppercase font-bold">
                              <span>Rebuttal {i+1}</span>
                              <span className="group-hover:text-white transition-colors">{copiedIndex === i ? 'Copied!' : 'Click to Copy'}</span>
                          </div>
                          <p className="text-slate-300">{r}</p>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {activeTab === 'dms' && (
          <div className="h-full flex flex-col">
              {dms.length === 0 && (
                  <div className="text-center py-12">
                      <Button onClick={handleGenerateDMs} disabled={dmsLoading}>{dmsLoading ? 'Writing...' : 'Generate Cold DMs'}</Button>
                  </div>
              )}
              <div className="grid grid-cols-1 gap-4 overflow-y-auto custom-scrollbar">
                  {dms.map((dm, i) => (
                      <Card key={i} className="bg-slate-800 border-slate-700 relative">
                          <button onClick={() => copyToClipboard(dm, i+10)} className="absolute top-4 right-4 text-slate-500 hover:text-white">
                              {copiedIndex === i+10 ? <Check size={16} /> : <Copy size={16} />}
                          </button>
                          <div className="text-xs text-indigo-400 font-bold mb-2 flex items-center gap-2"><Mail size={12}/> Script {i+1}</div>
                          <p className="text-sm text-slate-300 whitespace-pre-wrap">{dm}</p>
                      </Card>
                  ))}
              </div>
          </div>
      )}
    </div>
  );
};