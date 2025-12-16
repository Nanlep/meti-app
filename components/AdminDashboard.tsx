
import React, { useState, useEffect } from 'react';
import { adminService, AdminStats } from '../services/adminService';
import { User, Ticket } from '../types';
import { Button, Card, Modal, Spinner } from './Shared';
import { Users, LayoutGrid, Activity, DollarSign, Shield, Search, Lock, Unlock, TrendingUp, Server, AlertTriangle, UserPlus, Mail, Download, UserCog, Power, AlertOctagon, MessageSquare, Clock, CheckCircle2, Send, ChevronLeft, Filter } from 'lucide-react';
import { InviteUserModal } from './InviteUserModal';
import { AssignManagerModal } from './AssignManagerModal';
import { notify } from '../services/notificationService';
import { supportService } from '../services/supportService';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'system' | 'support'>('overview');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  
  // Assign Manager State
  const [assignManagerUser, setAssignManagerUser] = useState<User | null>(null);

  // Support State
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketFilter, setTicketFilter] = useState<'all' | 'open' | 'closed'>('open');
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [supportReply, setSupportReply] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
      if (activeTab === 'support') {
          loadTickets();
      }
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, usersData, maintenanceStatus] = await Promise.all([
        adminService.getStats(),
        adminService.getAllUsers(),
        adminService.getMaintenanceStatus()
      ]);
      setStats(statsData);
      setUsers(usersData);
      setMaintenanceMode(maintenanceStatus);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadTickets = async () => {
      try {
          const data = await supportService.getAllTickets();
          setTickets(data);
      } catch (e) {
          notify.error("Failed to load tickets");
      }
  };

  const handleToggleStatus = async (userId: string, currentStatus: string | undefined) => {
    const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    await adminService.updateUserStatus(userId, newStatus);
    setUsers(users.map(u => u.id === userId ? { ...u, status: newStatus } : u));
  };

  const handleToggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    if (!confirm(`Are you sure you want to change this user's role to ${newRole.toUpperCase()}?`)) return;
    
    await adminService.updateUserRole(userId, newRole);
    setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
  };

  const handleToggleMaintenance = async () => {
      const newState = !maintenanceMode;
      const msg = newState 
        ? "Are you sure you want to enable Maintenance Mode? This will lock out all non-admin users." 
        : "Disable Maintenance Mode and restore access?";
      
      if (confirm(msg)) {
          await adminService.toggleMaintenanceMode(newState);
          setMaintenanceMode(newState);
          notify.info(newState ? "System Locked: Maintenance Mode Active" : "System Restored: Maintenance Mode Off");
      }
  };

  const handleExportUsers = () => {
    const headers = ['User ID', 'Full Name', 'Email Address', 'Role', 'Status', 'Plan', 'Last Login'];
    const rows = users.map(u => [u.id, `"${u.name}"`, u.email, u.role, u.status, u.subscription, `"${new Date(u.lastLogin).toLocaleString()}"`]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Meti_Users_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Support Handlers
  const handleSupportReply = async () => {
      if (!activeTicket || !supportReply.trim()) return;
      setIsSendingReply(true);
      try {
          const updated = await supportService.replyToTicket(activeTicket.id, supportReply);
          setActiveTicket(updated);
          setTickets(tickets.map(t => t.id === updated.id ? updated : t));
          setSupportReply('');
          notify.success("Reply sent");
      } catch (e) {
          notify.error("Failed to send reply");
      } finally {
          setIsSendingReply(false);
      }
  };

  const handleStatusChange = async (status: 'open' | 'in_progress' | 'resolved' | 'closed') => {
      if (!activeTicket) return;
      try {
          const updated = await supportService.updateTicketStatus(activeTicket.id, status);
          setActiveTicket(updated);
          setTickets(tickets.map(t => t.id === updated.id ? updated : t));
          notify.success(`Ticket marked as ${status}`);
      } catch (e) {
          notify.error("Failed to update status");
      }
  };

  // Safe Filtering to prevent crash on missing properties
  const filteredUsers = users.filter(u => 
    (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase())) || 
    (u.name && u.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredTickets = tickets.filter(t => {
      if (ticketFilter === 'all') return true;
      if (ticketFilter === 'open') return t.status === 'open' || t.status === 'in_progress';
      if (ticketFilter === 'closed') return t.status === 'closed' || t.status === 'resolved';
      return true;
  });

  return (
    <div className="max-w-7xl mx-auto p-8 animate-fadeIn">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 border-b border-slate-800 pb-6 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-red-500/10 p-2 rounded text-red-500">
               <Shield size={24} />
            </div>
            <h1 className="text-3xl font-bold text-white">Platform Controller</h1>
          </div>
          <p className="text-slate-400">Master control panel for user management, system performance, and support.</p>
        </div>
        <div className="flex gap-2 bg-slate-800/50 p-1 rounded-lg border border-slate-700">
           {['overview', 'users', 'support', 'system'].map(tab => (
               <button 
                 key={tab}
                 onClick={() => setActiveTab(tab as any)}
                 className={`px-4 py-2 rounded-md text-sm font-medium transition-all capitalize ${activeTab === tab ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'}`}
               >
                 {tab}
               </button>
           ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin w-12 h-12 border-4 border-slate-600 border-t-white rounded-full"></div>
        </div>
      ) : (
        <>
          {activeTab === 'overview' && stats && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="bg-slate-800 border-slate-700">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-slate-400 text-sm font-medium">Total Users</span>
                    <Users size={20} className="text-indigo-400" />
                  </div>
                  <div className="text-3xl font-bold text-white">{stats.totalUsers}</div>
                  <div className="text-xs text-emerald-400 mt-2 flex items-center gap-1">
                    <TrendingUp size={12} /> +12% this week
                  </div>
                </Card>
                <Card className="bg-slate-800 border-slate-700">
                   <div className="flex items-center justify-between mb-4">
                    <span className="text-slate-400 text-sm font-medium">Open Tickets</span>
                    <MessageSquare size={20} className="text-amber-400" />
                   </div>
                   <div className="text-3xl font-bold text-white">{tickets.filter(t => t.status === 'open').length}</div>
                   <div className="text-xs text-slate-500 mt-2">Requires attention</div>
                </Card>
                <Card className="bg-slate-800 border-slate-700">
                   <div className="flex items-center justify-between mb-4">
                    <span className="text-slate-400 text-sm font-medium">API Usage (24h)</span>
                    <Activity size={20} className="text-blue-400" />
                  </div>
                  <div className="text-3xl font-bold text-white">{stats.apiCallsToday.toLocaleString()}</div>
                  <div className="text-xs text-slate-500 mt-2">
                    Requests processed
                  </div>
                </Card>
                <Card className="bg-slate-800 border-slate-700">
                   <div className="flex items-center justify-between mb-4">
                    <span className="text-slate-400 text-sm font-medium">Est. MRR</span>
                    <DollarSign size={20} className="text-emerald-400" />
                  </div>
                  <div className="text-3xl font-bold text-white">${stats.revenueMRR.toLocaleString()}</div>
                  <div className="text-xs text-emerald-400 mt-2 flex items-center gap-1">
                    <TrendingUp size={12} /> +4% this month
                  </div>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <Card className="bg-slate-800 border-slate-700 overflow-hidden p-0">
              <div className="p-4 border-b border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4">
                 <h3 className="font-bold text-white">User Directory</h3>
                 <div className="flex items-center gap-3 w-full md:w-auto">
                   <div className="relative flex-1 md:flex-none">
                     <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
                     <input 
                        type="text" 
                        placeholder="Search users..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-slate-900 border border-slate-600 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:ring-1 focus:ring-indigo-500 outline-none w-full md:w-64"
                     />
                   </div>
                   <Button onClick={handleExportUsers} variant="secondary" className="text-sm px-3 h-[38px]" title="Export to CSV">
                     <Download size={16} /> Export Data
                   </Button>
                   <Button onClick={() => setIsInviteModalOpen(true)} className="text-sm px-3 h-[38px]">
                     <Mail size={16} className="mr-2" /> Invite User
                   </Button>
                 </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-900/50 text-slate-400 font-medium uppercase text-xs">
                    <tr>
                      <th className="px-6 py-4">User</th>
                      <th className="px-6 py-4">Role</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Plan / Manager</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {filteredUsers.map(user => (
                      <tr key={user.id} className="hover:bg-slate-700/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-white font-bold">
                              {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                            </div>
                            <div>
                              <div className="font-medium text-white">{user.name || 'Unknown User'}</div>
                              <div className="text-xs text-slate-500">{user.email || 'No Email'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${user.role === 'admin' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-slate-700 text-slate-300 border-slate-600'}`}>
                            {user.role ? user.role.toUpperCase() : 'USER'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                           <span className={`flex items-center gap-1.5 text-xs font-medium ${user.status === 'suspended' ? 'text-red-400' : 'text-emerald-400'}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'suspended' ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
                              {user.status === 'suspended' ? 'Suspended' : 'Active'}
                           </span>
                        </td>
                        <td className="px-6 py-4">
                           <div className="flex flex-col gap-1">
                            <span className={`text-xs uppercase font-bold w-fit ${
                                user.subscription === 'agency' ? 'text-amber-400' : 
                                user.subscription === 'growth' ? 'text-emerald-400' : 'text-slate-400'
                            }`}>
                                {user.subscription || 'Starter'}
                            </span>
                            {user.accountManager && user.subscription === 'agency' && (
                                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                                  Mgr: {user.accountManager.name.split(' ')[0]}
                                </span>
                            )}
                           </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                             {user.subscription === 'agency' && (
                                 <button
                                    onClick={() => setAssignManagerUser(user)}
                                    className="p-1.5 text-amber-400 hover:text-white rounded hover:bg-slate-600 transition-colors"
                                    title="Assign Account Officer"
                                 >
                                     <UserCog size={16} />
                                 </button>
                             )}
                             <button 
                               onClick={() => handleToggleRole(user.id, user.role)}
                               className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-600"
                               title={user.role === 'admin' ? "Demote to User" : "Promote to Admin"}
                             >
                               <Shield size={16} />
                             </button>
                             <button 
                               onClick={() => handleToggleStatus(user.id, user.status)}
                               className={`p-1.5 rounded hover:bg-slate-600 ${user.status === 'suspended' ? 'text-emerald-400' : 'text-slate-400 hover:text-red-400'}`}
                               title={user.status === 'suspended' ? "Reactivate User" : "Suspend User"}
                             >
                               {user.status === 'suspended' ? <Unlock size={16} /> : <Lock size={16} />}
                             </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {activeTab === 'support' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
                  {/* Ticket List */}
                  <Card className="lg:col-span-1 flex flex-col p-0 bg-slate-800 border-slate-700 h-full">
                      <div className="p-4 border-b border-slate-700 flex justify-between items-center">
                          <h3 className="font-bold text-white">Support Queue</h3>
                          <div className="flex bg-slate-900 rounded p-1">
                              <button onClick={() => setTicketFilter('open')} className={`text-xs px-2 py-1 rounded ${ticketFilter === 'open' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}>Open</button>
                              <button onClick={() => setTicketFilter('closed')} className={`text-xs px-2 py-1 rounded ${ticketFilter === 'closed' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}>Closed</button>
                              <button onClick={() => setTicketFilter('all')} className={`text-xs px-2 py-1 rounded ${ticketFilter === 'all' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}>All</button>
                          </div>
                      </div>
                      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
                          {filteredTickets.map(ticket => (
                              <div 
                                  key={ticket.id}
                                  onClick={() => setActiveTicket(ticket)}
                                  className={`p-3 rounded-lg border cursor-pointer transition-all ${activeTicket?.id === ticket.id ? 'bg-indigo-900/20 border-indigo-500/50' : 'bg-slate-900/50 border-slate-700 hover:border-slate-600'}`}
                              >
                                  <div className="flex justify-between mb-1">
                                      <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${ticket.status === 'open' ? 'bg-emerald-900/50 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>{ticket.status}</span>
                                      <span className="text-[10px] text-slate-500">{new Date(ticket.updatedAt).toLocaleDateString()}</span>
                                  </div>
                                  <div className="font-medium text-white text-sm truncate">{ticket.subject}</div>
                                  <div className="text-xs text-slate-400 mt-1">{ticket.userName}</div>
                              </div>
                          ))}
                          {filteredTickets.length === 0 && <div className="text-center p-8 text-slate-500 text-sm">No tickets found.</div>}
                      </div>
                  </Card>

                  {/* Ticket Detail */}
                  <Card className="lg:col-span-2 flex flex-col p-0 bg-slate-900 border-slate-700 h-full overflow-hidden">
                      {activeTicket ? (
                          <>
                              <div className="p-4 border-b border-slate-800 bg-slate-800 flex justify-between items-center">
                                  <div>
                                      <h3 className="font-bold text-white">{activeTicket.subject}</h3>
                                      <div className="text-xs text-slate-400 flex gap-2">
                                          <span>User: {activeTicket.userName} ({activeTicket.userEmail})</span>
                                          <span>•</span>
                                          <span>ID: {activeTicket.id}</span>
                                      </div>
                                  </div>
                                  <div className="flex gap-2">
                                      <Button size="sm" variant="outline" onClick={() => handleStatusChange('in_progress')} disabled={activeTicket.status === 'in_progress'} className="text-xs h-8">Take</Button>
                                      <Button size="sm" onClick={() => handleStatusChange('resolved')} className="bg-emerald-600 hover:bg-emerald-500 text-xs h-8">Resolve</Button>
                                  </div>
                              </div>
                              
                              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950 custom-scrollbar">
                                  {activeTicket.messages.map((msg, i) => (
                                      <div key={i} className={`flex ${msg.role === 'admin' ? 'justify-end' : 'justify-start'}`}>
                                          <div className={`max-w-[80%] rounded-xl p-3 text-sm ${msg.role === 'admin' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 border border-slate-700'}`}>
                                              <div className="text-xs opacity-70 mb-1 flex justify-between gap-4">
                                                  <span className="font-bold">{msg.senderName}</span>
                                                  <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                                              </div>
                                              <div className="whitespace-pre-wrap">{msg.text}</div>
                                          </div>
                                      </div>
                                  ))}
                              </div>

                              <div className="p-4 bg-slate-800 border-t border-slate-700">
                                  <div className="flex gap-2">
                                      <textarea 
                                          value={supportReply}
                                          onChange={(e) => setSupportReply(e.target.value)}
                                          className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-indigo-500 resize-none h-20"
                                          placeholder="Type your reply..."
                                      />
                                      <Button onClick={handleSupportReply} disabled={isSendingReply || !supportReply.trim()} className="h-20 w-20 flex flex-col items-center justify-center">
                                          {isSendingReply ? <Spinner /> : <><Send size={18} className="mb-1"/> Send</>}
                                      </Button>
                                  </div>
                              </div>
                          </>
                      ) : (
                          <div className="h-full flex flex-col items-center justify-center text-slate-500">
                              <MessageSquare size={48} className="mb-4 opacity-20" />
                              <p>Select a ticket to view details</p>
                          </div>
                      )}
                  </Card>
              </div>
          )}

          {activeTab === 'system' && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className={`border ${maintenanceMode ? 'bg-red-900/10 border-red-500/50' : 'bg-slate-800 border-slate-700'}`}>
                   <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                     <AlertOctagon size={20} className={maintenanceMode ? "text-red-500" : "text-slate-400"} /> 
                     System Controls
                   </h3>
                   <div className="flex items-center justify-between p-4 bg-slate-900 rounded border border-slate-800">
                      <div>
                        <div className="text-white font-bold mb-1">Maintenance Mode</div>
                        <p className="text-xs text-slate-400 max-w-[200px]">
                          Locks out all non-admin users. Use during database migrations.
                        </p>
                      </div>
                      <button 
                        onClick={handleToggleMaintenance}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${maintenanceMode ? 'bg-red-500' : 'bg-slate-700'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${maintenanceMode ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                   </div>
                   {maintenanceMode && (
                     <div className="mt-4 p-2 bg-red-500/10 text-red-400 text-xs text-center rounded border border-red-500/20 font-bold">
                       SYSTEM LOCKED: ONLY ADMINS CAN LOGIN
                     </div>
                   )}
                </Card>

                <Card className="bg-slate-800 border-slate-700">
                   <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                     <Server size={20} className="text-indigo-400" /> Infrastructure Status
                   </h3>
                   <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-slate-900 rounded border border-slate-700">
                         <span className="text-slate-300 text-sm">Main Database</span>
                         <span className="text-emerald-400 text-xs font-bold px-2 py-1 bg-emerald-500/10 rounded">OPERATIONAL</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-slate-900 rounded border border-slate-700">
                         <span className="text-slate-300 text-sm">AI Inference Engine</span>
                         <span className="text-emerald-400 text-xs font-bold px-2 py-1 bg-emerald-500/10 rounded">OPERATIONAL</span>
                      </div>
                   </div>
                </Card>
             </div>
          )}
        </>
      )}
      
      {/* Modals */}
      {isInviteModalOpen && (
          <InviteUserModal 
            isOpen={isInviteModalOpen} 
            onClose={() => setIsInviteModalOpen(false)} 
            onSuccess={() => {
                loadData();
                setIsInviteModalOpen(false);
            }} 
          />
      )}
      
      {assignManagerUser && (
          <AssignManagerModal
            isOpen={!!assignManagerUser}
            onClose={() => setAssignManagerUser(null)}
            user={assignManagerUser}
            onSuccess={() => {
                loadData();
                setAssignManagerUser(null);
            }}
          />
      )}
    </div>
  );
};
