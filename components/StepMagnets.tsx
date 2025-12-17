
import React, { useState } from 'react';
import { generateLeadMagnets, generateMagnetContent, generateMagnetPromo } from '../services/geminiService';
import { PersonaProfile, LeadMagnet, AdPlatform } from '../types';
import { Button, Card, SectionTitle, Modal } from './Shared';
import { Magnet, Download, BookOpen, Video, FileText, PenTool, Loader, Share2, CheckCircle2, Link, Globe, Send } from 'lucide-react';

interface StepMagnetsProps {
  productName: string;
  nicheName: string;
  persona: PersonaProfile;
  onUpdateMagnets: (magnets: LeadMagnet[]) => void;
  magnets: LeadMagnet[];
  connectedPlatforms: AdPlatform[];
}

export const StepMagnets: React.FC<StepMagnetsProps> = ({
  productName,
  nicheName,
  persona,
  onUpdateMagnets,
  magnets,
  connectedPlatforms
}) => {
  const [loading, setLoading] = useState(false);
  const [draftingId, setDraftingId] = useState<number | null>(null);
  const [viewingMagnet, setViewingMagnet] = useState<LeadMagnet | null>(null);
  
  // Publishing State
  const [publishingMagnet, setPublishingMagnet] = useState<{item: LeadMagnet, index: number} | null>(null);
  const [publishStep, setPublishStep] = useState<1|2|3>(1);
  const [generatedLink, setGeneratedLink] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<AdPlatform[]>([]);
  const [promoContent, setPromoContent] = useState<Record<string, string>>({});
  const [isGeneratingPromo, setIsGeneratingPromo] = useState(false);
  const [isPosting, setIsPosting] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const data = await generateLeadMagnets(productName, nicheName, persona);
      onUpdateMagnets(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDraftContent = async (magnet: LeadMagnet, index: number) => {
    setDraftingId(index);
    try {
      const content = await generateMagnetContent(magnet, persona);
      const updatedMagnets = [...magnets];
      updatedMagnets[index] = { ...magnet, contentDraft: content };
      onUpdateMagnets(updatedMagnets);
      setViewingMagnet(updatedMagnets[index]);
    } catch (e) {
      console.error(e);
    } finally {
      setDraftingId(null);
    }
  };

  // --- PUBLISHING WORKFLOW ---

  const startPublishing = (magnet: LeadMagnet, index: number) => {
    setPublishingMagnet({ item: magnet, index });
    setPublishStep(1);
    // Simulate Smart Link Generation
    const slug = magnet.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    setGeneratedLink(`https://meti.pro/dl/${slug}`);
    setSelectedPlatforms([]);
    setPromoContent({});
  };

  const handlePlatformToggle = (platform: AdPlatform) => {
    if (selectedPlatforms.includes(platform)) {
      setSelectedPlatforms(selectedPlatforms.filter(p => p !== platform));
    } else {
      setSelectedPlatforms([...selectedPlatforms, platform]);
    }
  };

  const generatePromos = async () => {
    if (!publishingMagnet) return;
    setPublishStep(2);
    setIsGeneratingPromo(true);
    
    const promos: Record<string, string> = {};
    
    // Generate for each selected platform
    try {
      for (const platform of selectedPlatforms) {
        const content = await generateMagnetPromo(publishingMagnet.item, persona, platform, generatedLink);
        promos[platform] = content;
      }
      setPromoContent(promos);
      setPublishStep(3); // Move to review step
    } catch (e) {
      console.error("Promo Gen Error", e);
      alert("Failed to generate promo content.");
    } finally {
      setIsGeneratingPromo(false);
    }
  };

  const finalizePublishing = async () => {
    if (!publishingMagnet) return;
    setIsPosting(true);
    
    try {
      // Simulate API calls
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const updatedMagnets = [...magnets];
      updatedMagnets[publishingMagnet.index] = { 
        ...publishingMagnet.item, 
        status: 'published',
        smartLink: generatedLink,
        publishedAt: Date.now(),
        publishedPlatforms: selectedPlatforms
      };
      
      onUpdateMagnets(updatedMagnets);
      setPublishingMagnet(null); // Close modal
      alert(`Successfully published to ${selectedPlatforms.length} platforms!`);
    } catch (e) {
      alert("Failed to post.");
    } finally {
      setIsPosting(false);
    }
  };

  const getIcon = (type: string) => {
    switch(type) {
      case 'Video_Course': return <Video size={20} />;
      case 'Ebook': return <BookOpen size={20} />;
      default: return <FileText size={20} />;
    }
  };

  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="bg-slate-800/50 rounded-xl p-6 h-64 flex flex-col gap-4 border border-slate-700/50">
           <div className="flex justify-between">
             <div className="h-6 w-24 bg-slate-700 rounded-full"></div>
             <div className="h-6 w-6 bg-slate-700 rounded"></div>
           </div>
           <div className="h-6 w-3/4 bg-slate-700 rounded"></div>
           <div className="h-4 w-full bg-slate-700 rounded"></div>
           <div className="h-4 w-5/6 bg-slate-700 rounded"></div>
           <div className="mt-auto h-20 bg-slate-900/50 rounded-lg p-3">
             <div className="h-3 w-16 bg-slate-700 rounded mb-2"></div>
             <div className="h-4 w-full bg-slate-700 rounded"></div>
           </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      <SectionTitle 
        title="Lead Generation Assets" 
        subtitle="High-value assets to capture email addresses and start the conversation."
      />

      {magnets.length === 0 && !loading && (
        <div className="text-center py-12">
          <Button onClick={handleGenerate} className="px-8 py-4 text-lg">
             <Magnet className="mr-2" /> Generate Lead Magnets
          </Button>
        </div>
      )}

      {loading && (
        <>
          <div className="text-center text-slate-400 mb-8">Crafting irresistible offers specifically for {persona.jobTitle}...</div>
          <LoadingSkeleton />
        </>
      )}

      {!loading && magnets.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {magnets.map((magnet, idx) => (
            <Card key={idx} className="group hover:bg-slate-800 transition-colors flex flex-col h-full">
              <div className="flex justify-between items-start mb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {getIcon(magnet.type)} {magnet.type.replace('_', ' ')}
                </span>
                {magnet.status === 'published' ? (
                   <span className="text-xs text-emerald-400 font-bold flex items-center gap-1 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                     <CheckCircle2 size={12}/> Published
                   </span>
                ) : magnet.contentDraft ? (
                   <span className="text-xs text-emerald-400 font-medium flex items-center gap-1"><PenTool size={12}/> Drafted</span>
                ) : null}
              </div>
              
              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-indigo-400 transition-colors">
                {magnet.title}
              </h3>
              
              <p className="text-sm text-slate-300 mb-4 line-clamp-2">
                {magnet.description}
              </p>
              
              <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/50 mb-4">
                <div className="text-xs text-slate-500 uppercase font-semibold mb-1">The Hook</div>
                <p className="text-sm text-indigo-300 italic">"{magnet.hook}"</p>
              </div>

              {magnet.smartLink && (
                <div className="mb-4 text-xs bg-slate-950 p-2 rounded border border-slate-800 flex items-center gap-2 text-slate-400 overflow-hidden">
                   <Link size={12} className="flex-shrink-0" />
                   <span className="truncate">{magnet.smartLink}</span>
                </div>
              )}

              <div className="mt-auto pt-4 flex flex-col gap-2">
                <div className="flex gap-2">
                  {magnet.contentDraft ? (
                    <Button variant="secondary" className="w-full text-sm" onClick={() => setViewingMagnet(magnet)}>
                      View Content
                    </Button>
                  ) : (
                    <Button 
                      variant="outline" 
                      className="w-full text-sm" 
                      onClick={() => handleDraftContent(magnet, idx)}
                      disabled={draftingId === idx}
                    >
                      {draftingId === idx ? <Loader className="animate-spin" size={16} /> : <PenTool size={16} />}
                      {draftingId === idx ? 'Drafting...' : 'Draft Content'}
                    </Button>
                  )}
                  
                  {magnet.contentDraft && (
                    <Button 
                       variant="primary" 
                       className="w-full text-sm"
                       onClick={() => startPublishing(magnet, idx)}
                       disabled={magnet.status === 'published'}
                    >
                       <Share2 size={16} className="mr-1" />
                       {magnet.status === 'published' ? 'Posted' : 'Publish'}
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Content Viewer Modal */}
      <Modal 
        isOpen={!!viewingMagnet} 
        onClose={() => setViewingMagnet(null)} 
        title={viewingMagnet?.title || 'Lead Magnet Content'}
      >
        <div className="prose prose-invert prose-lg max-w-none">
          <div className="bg-slate-950 p-6 rounded-lg border border-slate-800 mb-6">
            <h4 className="text-indigo-400 text-sm font-bold uppercase mb-2">Structure</h4>
            <p className="text-slate-300">{viewingMagnet?.description}</p>
          </div>
          <div className="whitespace-pre-wrap text-slate-200 leading-relaxed font-serif">
            {viewingMagnet?.contentDraft}
          </div>
        </div>
      </Modal>

      {/* Smart Publish Modal */}
      {publishingMagnet && (
        <Modal 
          isOpen={!!publishingMagnet} 
          onClose={() => setPublishingMagnet(null)} 
          title="Smart Publish & Capture"
        >
          <div className="space-y-8 min-h-[400px]">
            
            {/* Step 1: Capture Link */}
            <div className={`transition-all duration-300 ${publishStep === 1 ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
               <div className="flex items-center gap-3 mb-4">
                 <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">1</div>
                 <h3 className="font-bold text-white">Email Capture Magnet</h3>
               </div>
               <div className="ml-11">
                 <p className="text-sm text-slate-400 mb-3">
                   We have automatically generated a secure download gate for your magnet. Users must enter their email to access the file.
                 </p>
                 <div className="bg-slate-950 p-4 rounded border border-slate-800 flex items-center gap-3">
                   <Globe className="text-indigo-400" size={20} />
                   <div className="flex-1 font-mono text-sm text-emerald-400 truncate">
                     {generatedLink}
                   </div>
                   <div className="text-xs text-slate-500 uppercase font-bold border border-slate-700 px-2 py-1 rounded">Active</div>
                 </div>
               </div>
            </div>

            {/* Step 2: Select Channels */}
            <div className={`transition-all duration-300 ${publishStep === 1 ? 'opacity-100' : publishStep > 1 ? 'opacity-40 pointer-events-none' : 'opacity-50'}`}>
               <div className="flex items-center gap-3 mb-4 mt-8">
                 <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">2</div>
                 <h3 className="font-bold text-white">Select Distribution Channels</h3>
               </div>
               <div className="ml-11">
                 {publishStep === 1 && (
                   <>
                     {connectedPlatforms.length > 0 ? (
                       <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                         {connectedPlatforms.map(platform => (
                           <button 
                             key={platform}
                             onClick={() => handlePlatformToggle(platform)}
                             className={`p-3 rounded-lg border text-sm font-medium transition-all ${selectedPlatforms.includes(platform) ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'}`}
                           >
                             {platform}
                           </button>
                         ))}
                       </div>
                     ) : (
                       <div className="text-amber-400 text-sm bg-amber-500/10 p-3 rounded border border-amber-500/20">
                         No social accounts connected. Please go to the Ad Engine to connect your accounts first.
                       </div>
                     )}
                     
                     {connectedPlatforms.length > 0 && (
                       <Button 
                         onClick={generatePromos} 
                         disabled={selectedPlatforms.length === 0 || isGeneratingPromo} 
                         className="mt-4 w-full"
                       >
                         {isGeneratingPromo ? 'AI Generating Copy...' : 'Generate Promo Content'}
                       </Button>
                     )}
                   </>
                 )}
               </div>
            </div>

            {/* Step 3: Review & Post */}
            {publishStep === 3 && (
               <div className="animate-fadeIn">
                  <div className="flex items-center gap-3 mb-4 mt-8">
                    <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">3</div>
                    <h3 className="font-bold text-white">Review & Launch</h3>
                  </div>
                  <div className="ml-11 space-y-4">
                     {Object.entries(promoContent).map(([platform, content]) => (
                       <div key={platform} className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                         <div className="text-xs font-bold text-slate-500 uppercase mb-2">{platform} Post Draft</div>
                         <textarea 
                           className="w-full bg-slate-900 border border-slate-600 rounded p-3 text-sm text-slate-200 focus:border-indigo-500 outline-none min-h-[100px]"
                           value={content}
                           onChange={(e) => setPromoContent({...promoContent, [platform]: e.target.value})}
                         />
                       </div>
                     ))}
                     
                     <Button onClick={finalizePublishing} disabled={isPosting} className="w-full py-4 text-lg">
                       {isPosting ? <Loader className="animate-spin mr-2" /> : <Send className="mr-2" />}
                       {isPosting ? 'Publishing Live...' : 'Publish Campaign Now'}
                     </Button>
                  </div>
               </div>
            )}

          </div>
        </Modal>
      )}
    </div>
  );
};
