
import React, { useState, useEffect } from 'react';
import { generateAdCreatives } from '../services/geminiService';
import { NicheSuggestion, PersonaProfile, AdCreative, AdPlatform, User } from '../types';
import { Button, Card, SectionTitle, Modal } from './Shared';
import { FeatureGuard } from './FeatureGuard';
import { Megaphone, BarChart2, Linkedin, Facebook, Twitter, Instagram, Rocket, RefreshCw, Loader, Send, Plug } from 'lucide-react';
import { permissionService } from '../services/permissionService';
import { notify } from '../services/notificationService';
import { getApiUrl, authService } from '../services/authService';

interface StepAdsProps {
  productName: string;
  niche: NicheSuggestion;
  persona: PersonaProfile;
  ads: AdCreative[];
  onUpdateAds: (ads: AdCreative[]) => void;
  connectedPlatforms: AdPlatform[];
  onUpdateConnectedPlatforms: (platforms: AdPlatform[]) => void;
  productUrl?: string; 
  user?: User; 
  onUpgrade?: () => void; 
}

export const StepAds: React.FC<StepAdsProps> = ({
  productName,
  niche,
  persona,
  ads,
  onUpdateAds,
  connectedPlatforms,
  onUpdateConnectedPlatforms,
  productUrl,
  user,
  onUpgrade
}) => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'create' | 'analytics'>('create');
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [selectedAdIndex, setSelectedAdIndex] = useState<number | null>(null);
  const [posting, setPosting] = useState<Record<number, boolean>>({});

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const newAds = await generateAdCreatives(productName, niche, persona, productUrl);
      onUpdateAds(newAds);
      notify.success("Ad campaign generated");
      if (newAds.length > 0) setSelectedAdIndex(0);
    } catch (e) {
      notify.error("Generation failed");
    } finally {
      setLoading(false);
    }
  };

  const handlePostNow = async (index: number) => {
      const ad = ads[index];
      if (!connectedPlatforms.includes(ad.platform)) {
          setShowConnectModal(true);
          return;
      }
      setPosting(p => ({...p, [index]: true}));
      
      try {
          const response = await fetch(`${getApiUrl()}/api/social/post`, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  ...authService.getAuthHeader()
              },
              body: JSON.stringify({
                  platforms: [ad.platform],
                  content: ad.adCopy,
                  mediaUrl: ad.imageUrl
              })
          });

          if (!response.ok) throw new Error("Posting failed via API");

          const updated = [...ads];
          updated[index] = { ...updated[index], status: 'posted', postedAt: Date.now() };
          onUpdateAds(updated);
          notify.success(`Posted to ${ad.platform}`);
      } catch (e) {
          notify.error("Failed to post. Check integrations.");
      } finally {
          setPosting(p => ({...p, [index]: false}));
      }
  };

  const togglePlatformConnection = (platform: AdPlatform) => {
    // In production, this would redirect to OAuth flow via backend
    if (connectedPlatforms.includes(platform)) {
        onUpdateConnectedPlatforms(connectedPlatforms.filter(p => p !== platform));
    } else {
        // Simulating the callback for now, but requiring the backend route to exist
        onUpdateConnectedPlatforms([...connectedPlatforms, platform]);
        notify.success("Connected (Simulated)");
    }
  };

  const getPlatformIcon = (p: AdPlatform) => {
    switch(p) {
      case 'LinkedIn': return <Linkedin size={16} />;
      case 'Twitter': return <Twitter size={16} />;
      case 'Facebook': return <Facebook size={16} />;
      case 'Instagram': return <Instagram size={16} />;
      default: return <Megaphone size={16} />;
    }
  };

  const selectedAd = selectedAdIndex !== null ? ads[selectedAdIndex] : null;

  if (user && !permissionService.hasAccess(user, 'pro')) {
    return <FeatureGuard user={user} requiredTier="pro" featureName="Ad Campaign Engine" onUpgrade={onUpgrade}>{null}</FeatureGuard>;
  }

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-140px)] flex flex-col">
      <div className="flex-shrink-0 mb-6 flex justify-between items-end">
        <SectionTitle title="Ad Command Center" subtitle="Multi-channel campaign orchestration." />
        <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setShowConnectModal(true)}>
                <Plug size={16} className="mr-2" /> Integrations
            </Button>
            <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800">
                <button onClick={() => setActiveTab('create')} className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === 'create' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>
                    Campaigns
                </button>
            </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        <div className="h-full flex gap-6">
            <div className="w-80 flex flex-col gap-4 overflow-y-auto custom-scrollbar pb-4">
                {ads.length === 0 && !loading && (
                    <div className="p-6 border border-dashed border-slate-700 rounded-xl text-center bg-slate-800/30">
                        <Rocket className="mx-auto text-slate-500 mb-3" size={32} />
                        <Button onClick={handleGenerate} className="w-full">Generate Ads</Button>
                    </div>
                )}
                {ads.map((ad, idx) => (
                    <div key={idx} onClick={() => setSelectedAdIndex(idx)} className={`p-4 rounded-xl border cursor-pointer ${selectedAdIndex === idx ? 'bg-indigo-900/20 border-indigo-500' : 'bg-slate-800 border-slate-700'}`}>
                        <div className="flex items-center gap-2 mb-2 text-white font-bold">{getPlatformIcon(ad.platform)} {ad.platform}</div>
                        <div className="text-xs text-slate-400 line-clamp-2">{ad.headline}</div>
                    </div>
                ))}
            </div>

            {selectedAd && (
                <div className="flex-1 flex flex-col bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <h3 className="text-white font-bold mb-4">Edit & Publish</h3>
                    <textarea 
                        className="w-full h-32 bg-slate-800 border border-slate-700 rounded p-3 text-white mb-4"
                        value={selectedAd.adCopy}
                        onChange={(e) => {
                            const updated = [...ads];
                            updated[selectedAdIndex!] = { ...selectedAd, adCopy: e.target.value };
                            onUpdateAds(updated);
                        }}
                    />
                    <Button onClick={() => handlePostNow(selectedAdIndex!)} disabled={posting[selectedAdIndex!] || !connectedPlatforms.includes(selectedAd.platform)}>
                        {posting[selectedAdIndex!] ? <Loader className="animate-spin" /> : <Send size={16} className="mr-2" />}
                        Post to {selectedAd.platform}
                    </Button>
                </div>
            )}
        </div>
      </div>

      <Modal isOpen={showConnectModal} onClose={() => setShowConnectModal(false)} title="Integration Hub">
          <div className="space-y-4">
              <p className="text-sm text-slate-400">Connect your accounts via Ayrshare API.</p>
              {['LinkedIn', 'Twitter', 'Facebook', 'Instagram'].map(p => (
                  <div key={p} className="flex justify-between items-center p-4 bg-slate-800 rounded-lg border border-slate-700">
                      <div className="flex items-center gap-3">
                          {getPlatformIcon(p as AdPlatform)}
                          <span className="font-bold text-white">{p}</span>
                      </div>
                      <Button size="sm" variant={connectedPlatforms.includes(p as AdPlatform) ? 'outline' : 'primary'} onClick={() => togglePlatformConnection(p as AdPlatform)}>
                          {connectedPlatforms.includes(p as AdPlatform) ? 'Disconnect' : 'Connect'}
                      </Button>
                  </div>
              ))}
          </div>
      </Modal>
    </div>
  );
};
