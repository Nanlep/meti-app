
import React, { useState } from 'react';
import { User } from '../types';
import { Button, Card, SectionTitle } from './Shared';
import { authService } from '../services/authService';
import { User as UserIcon, Lock, CreditCard, Save, CheckCircle2, Shield, Crown, Image as ImageIcon, Megaphone } from 'lucide-react';
import { compressImage } from '../utils/core';

interface StepSettingsProps {
  user: User;
  onUserUpdate: (updatedUser: User) => void;
}

export const StepSettings: React.FC<StepSettingsProps> = ({ user, onUserUpdate }) => {
  const [name, setName] = useState(user.name);
  const [password, setPassword] = useState('');
  
  // Agency Branding State
  const [agencyLogo, setAgencyLogo] = useState(user.agencyLogoUrl || '');
  const [agencyName, setAgencyName] = useState(user.agencyName || '');

  // Ad Branding State (All Users)
  const [adBrandLogo, setAdBrandLogo] = useState(user.adBrandLogoUrl || '');

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { // Limit brand logo to 2MB
        setError("Logo must be under 2MB");
        return;
    }
    
    try {
        const base64 = await compressImage(file);
        setAdBrandLogo(base64);
    } catch (e) {
        setError("Failed to process image");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // In a real app, this calls the backend. 
      // For now, we update the local session and simulate the API call via authService
      
      const dataToUpdate: any = { name, password, adBrandLogoUrl: adBrandLogo };
      
      // Merge branding data if agency
      if (user.subscription === 'agency') {
          dataToUpdate.agencyLogoUrl = agencyLogo;
          dataToUpdate.agencyName = agencyName;
      }

      const updated = await authService.updateProfile(user.id, dataToUpdate);
      onUserUpdate(updated);
      setSuccess('Profile updated successfully.');
      setPassword(''); // Clear password field for security
    } catch (e: any) {
      setError(e.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-fadeIn">
      <SectionTitle title="Account Settings" subtitle="Manage your profile, security, and subscription preferences." />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Profile Form */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <UserIcon size={20} className="text-indigo-400" /> Personal Information
            </h3>
            
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1 uppercase">Full Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1 uppercase">Email Address</label>
                <input 
                  type="email" 
                  value={user.email}
                  disabled
                  className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-slate-500 cursor-not-allowed"
                />
                <p className="text-[10px] text-slate-500 mt-1">Email cannot be changed directly. Contact support.</p>
              </div>

              <div className="pt-4 border-t border-slate-800 mt-4">
                <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                  <Lock size={16} className="text-slate-400" /> Security
                </h4>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1 uppercase">New Password</label>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Leave blank to keep current password"
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              {/* AGENCY WHITE LABELING */}
              {user.subscription === 'agency' && (
                <div className="pt-4 border-t border-slate-800 mt-4 bg-amber-500/5 -mx-6 px-6 pb-4">
                   <div className="flex items-center gap-2 mb-4 mt-4">
                      <div className="bg-amber-500/20 p-1.5 rounded text-amber-400">
                        <Crown size={16} />
                      </div>
                      <h4 className="text-white font-bold text-sm">Agency White-labeling</h4>
                   </div>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1 uppercase">Agency Name</label>
                        <input 
                          type="text" 
                          value={agencyName}
                          onChange={(e) => setAgencyName(e.target.value)}
                          placeholder="My Marketing Agency"
                          className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1 uppercase">Custom Logo URL</label>
                        <div className="relative">
                          <input 
                            type="text" 
                            value={agencyLogo}
                            onChange={(e) => setAgencyLogo(e.target.value)}
                            placeholder="https://mysite.com/logo.png"
                            className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 pl-8 text-white outline-none focus:border-amber-500"
                          />
                          <ImageIcon className="absolute left-2.5 top-2.5 text-slate-500" size={14} />
                        </div>
                      </div>
                   </div>
                   <p className="text-[10px] text-slate-500 mt-2">
                     This logo will replace the Meti branding in the sidebar for you and your team members.
                   </p>
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded text-emerald-400 text-sm flex items-center gap-2">
                  <CheckCircle2 size={16} /> {success}
                </div>
              )}

              <div className="pt-2">
                <Button type="submit" disabled={loading} className="w-full md:w-auto">
                  {loading ? 'Saving...' : 'Save Changes'} <Save size={16} className="ml-2" />
                </Button>
              </div>
            </form>
          </Card>

          {/* Ad Brand Assets Card - Accessible to All */}
          <Card>
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Megaphone size={20} className="text-pink-400" /> Brand Assets
            </h3>
            <div className="space-y-4">
              <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2 uppercase">Brand Logo for Ads</label>
                  <div className="flex items-center gap-4">
                      <div className="w-20 h-20 bg-slate-900 border border-slate-700 rounded-lg flex items-center justify-center overflow-hidden relative group">
                          {adBrandLogo ? (
                              <img src={adBrandLogo} alt="Brand" className="w-full h-full object-contain p-2" />
                          ) : (
                              <ImageIcon className="text-slate-600" size={32} />
                          )}
                          <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                              <span className="text-[10px] text-white font-bold">Upload</span>
                              <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                          </label>
                      </div>
                      <div className="flex-1">
                          <p className="text-sm text-slate-300 mb-1">Automatically applied to ad previews and mockups.</p>
                          <p className="text-xs text-slate-500">Recommended: Square PNG, transparent background. Max 2MB.</p>
                          {adBrandLogo && (
                              <button onClick={() => setAdBrandLogo('')} className="text-xs text-red-400 hover:text-red-300 mt-2 block">Remove Logo</button>
                          )}
                      </div>
                  </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Subscription Info */}
        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-indigo-900/20 to-slate-900 border-indigo-500/20">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <CreditCard size={18} className="text-indigo-400" /> Subscription
            </h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                <span className="text-slate-400 text-sm">Current Plan</span>
                <span className="text-emerald-400 font-bold uppercase">{user.subscription === 'hobby' ? 'STARTER' : user.subscription}</span>
              </div>
              
              <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                <span className="text-slate-400 text-sm">Status</span>
                <span className={`text-xs px-2 py-1 rounded font-bold ${user.subscriptionStatus === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                  {user.subscriptionStatus.toUpperCase()}
                </span>
              </div>

              <Button variant="outline" className="w-full text-xs">
                Manage Billing in Stripe
              </Button>
            </div>
          </Card>

          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
             <div className="flex items-start gap-3">
               <Shield size={20} className="text-slate-500 mt-1" />
               <div>
                 <h4 className="text-slate-300 font-medium text-sm">Organization ID</h4>
                 <code className="text-xs text-slate-500 font-mono block mt-1 bg-slate-950 p-1.5 rounded">
                   {user.organizationId}
                 </code>
               </div>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
};
