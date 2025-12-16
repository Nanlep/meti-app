
import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button, Card, Spinner } from './Shared';
import { MessageSquare, Plus, CheckCircle2, Clock, XCircle, Send, ChevronLeft, AlertCircle, FileText, User as UserIcon } from 'lucide-react';
import { User, Ticket, TicketCategory, TicketPriority } from '../types';
import { supportService } from '../services/supportService';
import { notify } from '../services/notificationService';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
}

export const SupportModal: React.FC<SupportModalProps> = ({ isOpen, onClose, user }) => {
  const [view, setView] = useState<'list' | 'create' | 'detail'>('list');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);

  // Create Form State
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<TicketCategory>('technical');
  const [priority, setPriority] = useState<TicketPriority>('medium');
  const [message, setMessage] = useState('');
  const [creating, setCreating] = useState(false);

  // Reply State
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadTickets();
      setView('list');
    }
  }, [isOpen]);

  useEffect(() => {
    if (view === 'detail') {
        scrollToBottom();
    }
  }, [activeTicket?.messages, view]);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const data = await supportService.getUserTickets();
      setTickets(data);
    } catch (e) {
      console.error(e);
      notify.error("Failed to load support tickets");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !message) return;
    setCreating(true);
    try {
      await supportService.createTicket({
        subject,
        category,
        priority,
        initialMessage: message
      });
      notify.success("Ticket created successfully");
      setSubject('');
      setMessage('');
      setCategory('technical');
      setPriority('medium');
      loadTickets();
      setView('list');
    } catch (e) {
      notify.error("Failed to submit ticket");
    } finally {
      setCreating(false);
    }
  };

  const handleOpenTicket = async (ticketId: string) => {
      // Optimistic UI: find from local list first
      const local = tickets.find(t => t.id === ticketId);
      if (local) setActiveTicket(local);
      setView('detail');
      
      try {
          // Fetch fresh data including messages
          const fresh = await supportService.getTicketDetails(ticketId);
          setActiveTicket(fresh);
      } catch (e) {
          notify.error("Failed to load ticket details");
      }
  };

  const handleReply = async () => {
      if (!activeTicket || !replyText.trim()) return;
      setSendingReply(true);
      try {
          const updated = await supportService.replyToTicket(activeTicket.id, replyText);
          setActiveTicket(updated);
          setReplyText('');
          // Update list view cache
          setTickets(tickets.map(t => t.id === updated.id ? updated : t));
      } catch (e) {
          notify.error("Failed to send reply");
      } finally {
          setSendingReply(false);
      }
  };

  const handleCloseTicket = async () => {
      if (!activeTicket) return;
      if (!confirm("Are you sure you want to mark this issue as resolved?")) return;
      try {
          const updated = await supportService.closeTicket(activeTicket.id);
          setActiveTicket(updated);
          setTickets(tickets.map(t => t.id === updated.id ? updated : t));
          notify.success("Ticket closed");
      } catch (e) {
          notify.error("Failed to close ticket");
      }
  };

  const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Helpers
  const getStatusColor = (status: string) => {
      switch(status) {
          case 'open': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
          case 'in_progress': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
          case 'resolved': return 'bg-slate-700 text-slate-300 border-slate-600';
          case 'closed': return 'bg-slate-800 text-slate-500 border-slate-700';
          default: return 'bg-slate-800 text-slate-400';
      }
  };

  const getPriorityIcon = (p: string) => {
      if (p === 'critical' || p === 'high') return <AlertCircle size={14} className="text-red-400" />;
      return <Clock size={14} className="text-slate-500" />;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Support Center">
      <div className="min-h-[500px] flex flex-col">
        
        {/* VIEW: LIST */}
        {view === 'list' && (
            <div className="flex flex-col h-full animate-fadeIn">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h4 className="font-bold text-white text-lg">My Tickets</h4>
                        <p className="text-slate-400 text-sm">Track your requests and issues.</p>
                    </div>
                    <Button onClick={() => setView('create')}>
                        <Plus size={16} className="mr-2" /> New Ticket
                    </Button>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20"><Spinner /></div>
                ) : tickets.length === 0 ? (
                    <div className="text-center py-20 bg-slate-800/30 rounded-xl border border-dashed border-slate-700">
                        <MessageSquare size={48} className="mx-auto text-slate-600 mb-4" />
                        <h3 className="text-white font-medium mb-1">No tickets yet</h3>
                        <p className="text-slate-400 text-sm mb-4">Need help? Start a conversation.</p>
                        <Button variant="secondary" onClick={() => setView('create')}>Create Ticket</Button>
                    </div>
                ) : (
                    <div className="space-y-3 overflow-y-auto custom-scrollbar flex-1 max-h-[500px] pr-2">
                        {tickets.map(ticket => (
                            <div 
                                key={ticket.id} 
                                onClick={() => handleOpenTicket(ticket.id)}
                                className="bg-slate-800 p-4 rounded-lg border border-slate-700 hover:border-indigo-500/50 cursor-pointer transition-all group"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="font-bold text-white group-hover:text-indigo-400 transition-colors">{ticket.subject}</div>
                                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${getStatusColor(ticket.status)}`}>
                                        {ticket.status.replace('_', ' ')}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-xs text-slate-500">
                                    <div className="flex items-center gap-3">
                                        <span className="flex items-center gap-1">
                                            {getPriorityIcon(ticket.priority)} {ticket.priority.toUpperCase()}
                                        </span>
                                        <span>•</span>
                                        <span>{new Date(ticket.updatedAt).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-slate-400">
                                        <MessageSquare size={12} /> {ticket.messages.length}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}

        {/* VIEW: CREATE */}
        {view === 'create' && (
            <form onSubmit={handleCreateTicket} className="flex flex-col h-full animate-fadeIn">
                <button type="button" onClick={() => setView('list')} className="text-slate-400 hover:text-white flex items-center gap-1 text-sm mb-4">
                    <ChevronLeft size={16} /> Back to List
                </button>
                
                <h3 className="font-bold text-white text-xl mb-6">Submit a Request</h3>
                
                <div className="space-y-4 flex-1">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Subject</label>
                        <input 
                            type="text" 
                            required
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white outline-none focus:border-indigo-500"
                            placeholder="Brief summary of the issue"
                        />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Category</label>
                            <select 
                                value={category}
                                onChange={(e) => setCategory(e.target.value as TicketCategory)}
                                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white outline-none focus:border-indigo-500"
                            >
                                <option value="technical">Technical Issue</option>
                                <option value="billing">Billing & Account</option>
                                <option value="feature">Feature Request</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Priority</label>
                            <select 
                                value={priority}
                                onChange={(e) => setPriority(e.target.value as TicketPriority)}
                                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white outline-none focus:border-indigo-500"
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="critical">Critical</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Description</label>
                        <textarea 
                            required
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="w-full h-40 bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white outline-none focus:border-indigo-500 resize-none"
                            placeholder="Please provide details..."
                        />
                    </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end gap-3">
                    <Button type="button" variant="secondary" onClick={() => setView('list')}>Cancel</Button>
                    <Button type="submit" disabled={creating}>
                        {creating ? 'Submitting...' : 'Submit Request'}
                    </Button>
                </div>
            </form>
        )}

        {/* VIEW: DETAIL */}
        {view === 'detail' && activeTicket && (
            <div className="flex flex-col h-[600px] animate-fadeIn -mx-6 -my-6">
                {/* Header */}
                <div className="bg-slate-900 p-4 border-b border-slate-800 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setView('list')} className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800">
                            <ChevronLeft size={20} />
                        </button>
                        <div>
                            <h4 className="font-bold text-white text-sm truncate max-w-[200px] md:max-w-xs">{activeTicket.subject}</h4>
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                <span>#{activeTicket.id.substring(0, 6)}</span>
                                <span>•</span>
                                <span className={`uppercase font-bold ${activeTicket.status === 'open' ? 'text-emerald-400' : 'text-slate-400'}`}>
                                    {activeTicket.status.replace('_', ' ')}
                                </span>
                            </div>
                        </div>
                    </div>
                    {activeTicket.status !== 'closed' && activeTicket.status !== 'resolved' && (
                        <Button size="sm" variant="outline" onClick={handleCloseTicket} className="text-xs h-8">
                            <CheckCircle2 size={14} className="mr-1" /> Mark Resolved
                        </Button>
                    )}
                </div>

                {/* Chat Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950 custom-scrollbar">
                    <div className="flex justify-center">
                        <span className="text-[10px] text-slate-500 bg-slate-900 px-2 py-1 rounded-full">
                            Ticket Opened {new Date(activeTicket.createdAt).toLocaleDateString()}
                        </span>
                    </div>
                    
                    {activeTicket.messages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] rounded-xl p-3 text-sm ${
                                msg.role === 'user' 
                                ? 'bg-indigo-600 text-white rounded-br-none' 
                                : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-none'
                            }`}>
                                <div className="flex justify-between items-center gap-4 mb-1">
                                    <span className="font-bold text-xs opacity-80">{msg.senderName}</span>
                                    <span className="text-[10px] opacity-50">{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                </div>
                                <div className="whitespace-pre-wrap">{msg.text}</div>
                            </div>
                        </div>
                    ))}
                    
                    {(activeTicket.status === 'closed' || activeTicket.status === 'resolved') && (
                        <div className="flex justify-center mt-4">
                            <span className="text-xs text-slate-500 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded flex items-center gap-2">
                                <CheckCircle2 size={12} className="text-emerald-500" /> This ticket is resolved.
                            </span>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                {(activeTicket.status !== 'closed' && activeTicket.status !== 'resolved') ? (
                    <div className="p-4 bg-slate-900 border-t border-slate-800">
                        <div className="flex gap-2">
                            <textarea 
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-indigo-500 resize-none h-12"
                                placeholder="Type a reply..."
                                onKeyDown={(e) => {
                                    if(e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleReply();
                                    }
                                }}
                            />
                            <Button onClick={handleReply} disabled={sendingReply || !replyText.trim()} className="h-12 w-12 flex items-center justify-center p-0">
                                {sendingReply ? <Spinner /> : <Send size={18} />}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="p-4 bg-slate-900 border-t border-slate-800 text-center">
                        <Button variant="secondary" onClick={() => handleReply()} className="w-full opacity-50 cursor-not-allowed">
                            Ticket Closed
                        </Button>
                    </div>
                )}
            </div>
        )}

      </div>
    </Modal>
  );
};
