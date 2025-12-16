
import React, { useState, useEffect, useRef } from 'react';
import { sendChatMessage, handleObjection, generateColdDMs } from '../services/geminiService'; // New Stateless Import
import { PersonaProfile, ChatMessage, User } from '../types';
import { Button, Card, SectionTitle } from './Shared';
import { FeatureGuard } from './FeatureGuard';
import { MessageCircle, ShieldAlert, Send, User as UserIcon, Zap, Copy, Check } from 'lucide-react';
import { permissionService } from '../services/permissionService';

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

  // Other States...
  const [objectionInput, setObjectionInput] = useState('');
  const [rebuttals, setRebuttals] = useState<string[]>([]);
  const [objectionLoading, setObjectionLoading] = useState(false);
  const [dms, setDms] = useState<string[]>([]);
  const [dmsLoading, setDmsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  const resetSimulation = () => {
      setMessages([{ role: 'model', text: `Hi, I'm a ${persona.jobTitle}. What is this about?` }]);
  };

  // Initial Greeting
  useEffect(() => {
      if (messages.length === 0 && activeTab === 'roleplay') {
          resetSimulation();
      }
  }, [activeTab]);

  // ... (Rest of component remains largely similar, just rendering UI)

  if (!permissionService.hasAccess(user, 'pro')) {
      return <FeatureGuard user={user} requiredTier="pro" featureName="Sales Accelerator" onUpgrade={onUpgrade}>{null}</FeatureGuard>;
  }

  // Simplified Render for Brevity (Focusing on Logic Fixes)
  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-140px)] flex flex-col relative">
      <SectionTitle title="Sales Simulator" subtitle="Practice your pitch against an AI persona." />
      
      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`p-3 rounded-lg max-w-[80%] ${msg.role === 'user' ? 'bg-indigo-600' : 'bg-slate-800 border border-slate-700'}`}>
                        {msg.text}
                    </div>
                </div>
            ))}
            {chatLoading && <div className="text-slate-500 text-sm animate-pulse">Typing...</div>}
            <div ref={messagesEndRef} />
        </div>
        <div className="p-4 bg-slate-800 border-t border-slate-700 flex gap-2">
            <input 
                className="flex-1 bg-slate-900 border border-slate-600 rounded px-3 text-white"
                value={inputMessage}
                onChange={e => setInputMessage(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                disabled={chatLoading}
            />
            <Button onClick={handleSendMessage} disabled={chatLoading}><Send size={16}/></Button>
        </div>
      </div>
    </div>
  );
};
