
import React, { useState } from 'react';
import { authService } from '../services/authService';
import { Button, Card } from './Shared';
import { Shield, Lock, Mail, AlertTriangle, ArrowLeft, Terminal } from 'lucide-react';
import { LegalDocs } from './LegalDocs';
import { Logo } from './Logo';

interface AuthProps {
  onLogin: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [view, setView] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showLegal, setShowLegal] = useState<'privacy' | 'terms' | null>(null);

  // Safe check for dev environment
  // @ts-ignore
  const isDev = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (view === 'forgot') {
          await new Promise(resolve => setTimeout(resolve, 1000));
          setSuccess('If an account exists, a reset link has been sent.');
          return;
      }

      if (view === 'login') {
        await authService.login(email, password);
      } else {
        await authService.register(email, password);
      }
      onLogin();
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const useDevCreds = (type: 'admin' | 'user') => {
      setEmail(type === 'admin' ? 'admin@meti.app' : 'user@meti.app');
      setPassword('password');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-slate-950">
      <div className="absolute top-0 left-0 w-full h-full bg-grid-slate-900/[0.04] -z-10"></div>
      <div className="absolute w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -top-20 -left-20"></div>

      <div className="text-center mb-8">
        <div className="flex justify-center mb-4"><Logo size="xl" showText={false} /></div>
        <h1 className="text-4xl font-bold text-white tracking-tight mb-1">meti</h1>
        <div className="text-xs font-bold text-indigo-400 tracking-[0.2em] uppercase mb-2">Marketing Intelligence</div>
        <p className="text-slate-400 text-sm">Secure Enterprise Access</p>
      </div>

      <Card className="w-full max-w-md backdrop-blur-xl bg-slate-900/80 border-slate-800 shadow-2xl relative">
        {/* Dev Hints - Automatically removed in Prod */}
        {isDev && view === 'login' && (
            <div className="mb-6 p-3 bg-indigo-900/30 border border-indigo-500/30 rounded-lg">
                <div className="text-[10px] font-bold text-indigo-300 uppercase flex items-center gap-1 mb-2">
                    <Terminal size={12} /> Local Dev Bypass
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => useDevCreds('admin')} className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white py-1 px-2 rounded transition-colors">
                        Admin Mode
                    </button>
                    <button onClick={() => useDevCreds('user')} className="text-xs bg-slate-700 hover:bg-slate-600 text-white py-1 px-2 rounded transition-colors">
                        User Mode
                    </button>
                </div>
            </div>
        )}

        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold text-white">
            {view === 'login' ? 'Sign In' : view === 'register' ? 'Create Account' : 'Reset Password'}
          </h2>
          <p className="text-xs text-slate-500 mt-1 flex items-center justify-center gap-1">
             <Lock size={10} /> ISO 27001 Secured
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1 uppercase">Work Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-slate-500" size={16} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                placeholder="name@company.com"
                required
              />
            </div>
          </div>

          {view !== 'forgot' && (
            <div>
                <label className="block text-xs font-medium text-slate-400 mb-1 uppercase">Password</label>
                <div className="relative">
                <Lock className="absolute left-3 top-3 text-slate-500" size={16} />
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                    placeholder="••••••••••••"
                    required
                />
                </div>
            </div>
          )}

          {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-xs text-red-400"><AlertTriangle size={14} /> {error}</div>}
          {success && <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs text-emerald-400 text-center">{success}</div>}

          <Button type="submit" className="w-full py-3 mt-2" isLoading={loading}>
            {view === 'login' ? 'Sign In' : view === 'register' ? 'Create Account' : 'Send Reset Link'}
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-800 text-center space-y-3">
            {view === 'login' && (
                <>
                    <button onClick={() => setView('forgot')} className="text-xs text-slate-500 hover:text-white block mx-auto">Forgot password?</button>
                    <p className="text-sm text-slate-400">
                        Don't have an account? <button onClick={() => { setView('register'); setError(''); }} className="ml-2 text-indigo-400 hover:text-white font-medium">Sign up</button>
                    </p>
                </>
            )}
            {view === 'register' && (
                <p className="text-sm text-slate-400">
                    Already have an account? <button onClick={() => { setView('login'); setError(''); }} className="ml-2 text-indigo-400 hover:text-white font-medium">Log in</button>
                </p>
            )}
            {view === 'forgot' && (
                <button onClick={() => { setView('login'); setError(''); }} className="flex items-center justify-center gap-2 mx-auto text-sm text-indigo-400 hover:text-white"><ArrowLeft size={14} /> Back to Login</button>
            )}
        </div>
      </Card>
      
      <div className="mt-8 text-center space-y-4">
        <div className="flex justify-center gap-4 text-xs text-slate-500">
          <button onClick={() => setShowLegal('terms')} className="hover:text-slate-300">Terms</button>
          <span>•</span>
          <button onClick={() => setShowLegal('privacy')} className="hover:text-slate-300">Privacy</button>
        </div>
      </div>

      {showLegal && <LegalDocs isOpen={!!showLegal} onClose={() => setShowLegal(null)} type={showLegal} />}
    </div>
  );
};
