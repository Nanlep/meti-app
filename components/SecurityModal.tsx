
import React from 'react';
import { Modal } from './Shared';
import { Shield, Activity, Lock, Globe, Smartphone } from 'lucide-react';
import { AuditLog, User } from '../types';

interface SecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
}

export const SecurityModal: React.FC<SecurityModalProps> = ({ isOpen, onClose, user }) => {
  // Mock Audit Logs (In real app, fetch from backend)
  const logs: AuditLog[] = [
    { id: '1', userId: user.id, action: 'LOGIN_SUCCESS', resource: 'Auth', timestamp: Date.now(), ipAddress: '192.168.1.1', status: 'success' },
    { id: '2', userId: user.id, action: 'PROJECT_CREATE', resource: 'Project', timestamp: Date.now() - 100000, ipAddress: '192.168.1.1', status: 'success' },
    { id: '3', userId: user.id, action: 'EXPORT_DATA', resource: 'Leads', timestamp: Date.now() - 500000, ipAddress: '192.168.1.1', status: 'success' },
    { id: '4', userId: user.id, action: 'LOGIN_FAILURE', resource: 'Auth', timestamp: Date.now() - 86400000, ipAddress: '45.32.11.22', status: 'failure' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Security Center (SOC 2 Controls)">
      <div className="space-y-8">
        
        {/* Compliance Status */}
        <div className="bg-emerald-900/20 border border-emerald-500/30 p-4 rounded-lg flex items-center gap-4">
          <div className="bg-emerald-500/20 p-3 rounded-full text-emerald-400">
            <Shield size={24} />
          </div>
          <div>
            <h4 className="text-white font-bold">Account Secured</h4>
            <p className="text-sm text-slate-400">Your data is encrypted at rest (AES-256) and in transit (TLS 1.3).</p>
          </div>
        </div>

        {/* Active Sessions */}
        <div>
          <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Smartphone size={18} className="text-indigo-400" /> Active Sessions
          </h4>
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <div>
                <div className="text-white text-sm font-medium">Chrome on MacOS (Current)</div>
                <div className="text-xs text-slate-500">IP: 192.168.1.1 • Last active: Just now</div>
              </div>
            </div>
            <button className="text-xs text-red-400 hover:text-red-300">Revoke</button>
          </div>
        </div>

        {/* Audit Logs */}
        <div>
          <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Activity size={18} className="text-indigo-400" /> Audit Log
          </h4>
          <div className="bg-slate-950 rounded-lg border border-slate-800 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3 font-medium">Event</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 font-medium">IP Address</th>
                  <th className="p-3 font-medium">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {logs.map(log => (
                  <tr key={log.id} className="text-slate-300 hover:bg-slate-900/50">
                    <td className="p-3">{log.action}</td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${log.status === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                        {log.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500 font-mono text-xs">{log.ipAddress}</td>
                    <td className="p-3 text-slate-500">{new Date(log.timestamp).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-500 mt-2 text-right">
            Logs are immutable and retained for 90 days as per ISO 27001 policy.
          </p>
        </div>

      </div>
    </Modal>
  );
};
