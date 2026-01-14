

import React, { useState } from 'react';
import { generateLandingPage } from '../services/geminiService';
import { NicheSuggestion, PersonaProfile, LandingPage, User } from '../types';
import { Button, Card, SectionTitle } from './Shared';
import { FeatureGuard } from './FeatureGuard';
import { LayoutTemplate, Eye, Code, CheckCircle2, Quote, ArrowRight, Image as ImageIcon, Download } from 'lucide-react';
import { permissionService } from '../services/permissionService';

interface StepLandingProps {
  productName: string;
  niche: NicheSuggestion;
  persona: PersonaProfile;
  landingPage: LandingPage | null;
  onUpdate: (lp: LandingPage) => void;
  user?: User; // Add user prop
  onUpgrade?: () => void; // Add upgrade prop
}

export const StepLanding: React.FC<StepLandingProps> = ({
  productName,
  niche,
  persona,
  landingPage,
  onUpdate,
  user,
  onUpgrade
}) => {
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'preview' | 'data'>('preview');

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const data = await generateLandingPage(productName, niche, persona);
      onUpdate(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadHtml = () => {
    if (!landingPage) return;
    
    // Simple HTML Template wrapping the content
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${landingPage.headline}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet">
    <style>body { font-family: 'Inter', sans-serif; }</style>
</head>
<body class="bg-slate-50 text-slate-900">
    <!-- Hero -->
    <section class="bg-slate-900 text-white py-20 px-6 text-center">
        <div class="max-w-4xl mx-auto">
            <h1 class="text-4xl md:text-6xl font-bold mb-6 leading-tight">${landingPage.headline}</h1>
            <p class="text-xl text-slate-300 mb-8">${landingPage.subheadline}</p>
            <div class="flex flex-col sm:flex-row gap-4 justify-center">
                <a href="#" class="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-lg font-bold text-lg transition-all">${landingPage.ctaPrimary}</a>
                <a href="#" class="border border-slate-600 hover:bg-slate-800 text-white px-8 py-4 rounded-lg font-medium transition-all">${landingPage.ctaSecondary}</a>
            </div>
        </div>
    </section>

    <!-- Benefits -->
    <section class="py-20 px-6">
        <div class="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10">
            ${landingPage.benefits.map(b => `
            <div class="p-6 bg-white rounded-xl shadow-lg border border-slate-100">
                <h3 class="text-xl font-bold mb-3 text-indigo-600">${b.title}</h3>
                <p class="text-slate-600 leading-relaxed">${b.description}</p>
            </div>`).join('')}
        </div>
    </section>

    <!-- Social Proof -->
    <section class="bg-slate-100 py-20 px-6">
        <h2 class="text-3xl font-bold text-center mb-12">What people are saying</h2>
        <div class="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
            ${landingPage.socialProof.map(sp => `
            <div class="bg-white p-8 rounded-xl shadow-sm relative">
                <p class="text-slate-700 italic mb-6">"${sp.quote}"</p>
                <div class="font-bold text-slate-900">${sp.name}</div>
                <div class="text-sm text-slate-500">${sp.role}</div>
            </div>`).join('')}
        </div>
    </section>
    
    <!-- CTA Footer -->
    <section class="bg-indigo-600 py-20 px-6 text-center text-white">
        <h2 class="text-3xl font-bold mb-8">Ready to get started?</h2>
        <a href="#" class="bg-white text-indigo-700 px-8 py-4 rounded-lg font-bold text-lg hover:bg-slate-100 transition-all">${landingPage.ctaPrimary}</a>
    </section>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'landing_page.html';
    link.click();
  };

  if (user && onUpgrade) {
    if (!permissionService.hasAccess(user, 'pro')) {
      return <FeatureGuard user={user} requiredTier="pro" featureName="Landing Page Generator" onUpgrade={onUpgrade}>{null}</FeatureGuard>;
    }
  }

  if (!landingPage && !loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <SectionTitle title="Landing Page Builder" subtitle="Generate high-converting sales copy tailored to your persona." />
        <div className="text-center py-16 bg-slate-800/30 rounded-2xl border border-dashed border-slate-700">
           <LayoutTemplate size={48} className="mx-auto text-slate-500 mb-4" />
           <p className="text-slate-400 mb-6">Create a complete landing page structure with headers, benefits, and social proof.</p>
           <Button onClick={handleGenerate} className="px-8">Generate Landing Page</Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <div className="animate-spin w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-6"></div>
        <h3 className="text-xl text-white">Writing Sales Copy...</h3>
        <p className="text-slate-400">Optimizing headlines and calls-to-action.</p>
      </div>
    );
  }

  if (!landingPage) return null;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <SectionTitle title="Landing Page" subtitle="Live preview of your generated sales page." />
        <div className="flex gap-2">
           <button 
            onClick={handleDownloadHtml}
            className="px-4 py-2 rounded-lg text-sm flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-lg shadow-emerald-900/20"
          >
            <Download size={16} /> Export HTML
          </button>
          <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
            <button 
              onClick={() => setViewMode('preview')}
              className={`px-3 py-1.5 rounded text-sm flex items-center gap-2 ${viewMode === 'preview' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              <Eye size={16} /> Preview
            </button>
            <button 
              onClick={() => setViewMode('data')}
              className={`px-3 py-1.5 rounded text-sm flex items-center gap-2 ${viewMode === 'data' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              <Code size={16} /> Raw Copy
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'preview' ? (
        <div className="border border-slate-700 rounded-xl overflow-hidden bg-slate-950 shadow-2xl">
          {/* Fake Browser Bar */}
          <div className="bg-slate-900 px-4 py-3 flex items-center gap-2 border-b border-slate-800">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
              <div className="w-3 h-3 rounded-full bg-amber-500/50"></div>
              <div className="w-3 h-3 rounded-full bg-emerald-500/50"></div>
            </div>
            <div className="flex-1 bg-slate-800 rounded mx-4 h-6 text-xs text-slate-500 flex items-center px-3">
              yourwebsite.com/offer
            </div>
          </div>

          {/* Hero Section */}
          <div className="bg-gradient-to-b from-slate-900 to-indigo-950/20 px-8 py-20 text-center border-b border-slate-800/50">
            <div className="max-w-3xl mx-auto">
               <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">{landingPage.headline}</h1>
               <p className="text-xl text-slate-300 mb-8 leading-relaxed">{landingPage.subheadline}</p>
               <div className="flex flex-col sm:flex-row gap-4 justify-center">
                 <button className="bg-indigo-600 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/20">
                   {landingPage.ctaPrimary}
                 </button>
                 <button className="bg-slate-800 text-white border border-slate-700 px-8 py-4 rounded-lg font-medium hover:bg-slate-700 transition-colors">
                   {landingPage.ctaSecondary}
                 </button>
               </div>
               <div className="mt-12 p-4 bg-slate-900/50 border border-slate-800 border-dashed rounded-xl max-w-lg mx-auto flex items-center justify-center text-slate-500 text-sm gap-2">
                 <ImageIcon size={16} /> Image Prompt: {landingPage.heroImagePrompt}
               </div>
            </div>
          </div>

          {/* Benefits Section */}
          <div className="px-8 py-20 bg-slate-950">
            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
              {landingPage.benefits.map((b, i) => (
                <div key={i} className="bg-slate-900/50 p-6 rounded-xl border border-slate-800">
                  <div className="w-10 h-10 bg-indigo-500/10 text-indigo-400 rounded-lg flex items-center justify-center mb-4">
                    <CheckCircle2 size={20} />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{b.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{b.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Social Proof Section */}
          <div className="px-8 py-20 bg-slate-900 border-t border-slate-800">
            <h2 className="text-2xl font-bold text-center text-white mb-12">Trusted by people like you</h2>
            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
              {landingPage.socialProof.map((sp, i) => (
                <div key={i} className="bg-slate-800 p-6 rounded-xl relative">
                  <Quote className="absolute top-4 right-4 text-slate-700" size={24} />
                  <p className="text-slate-300 text-sm italic mb-4 relative z-10">"{sp.quote}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-600"></div>
                    <div>
                      <div className="text-white font-medium text-sm">{sp.name}</div>
                      <div className="text-slate-500 text-xs">{sp.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer CTA */}
          <div className="px-8 py-20 text-center bg-indigo-900/10">
            <h2 className="text-3xl font-bold text-white mb-6">Ready to get started?</h2>
            <button className="bg-white text-indigo-900 px-8 py-4 rounded-lg font-bold text-lg hover:bg-slate-200 transition-colors inline-flex items-center gap-2">
               {landingPage.ctaPrimary} <ArrowRight size={20} />
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
           <Card>
             <h3 className="text-indigo-400 text-sm font-bold uppercase mb-2">Headline</h3>
             <p className="text-white text-lg">{landingPage.headline}</p>
           </Card>
           <Card>
             <h3 className="text-indigo-400 text-sm font-bold uppercase mb-2">Subheadline</h3>
             <p className="text-white text-lg">{landingPage.subheadline}</p>
           </Card>
           <Card>
             <h3 className="text-indigo-400 text-sm font-bold uppercase mb-2">Benefits</h3>
             <ul className="space-y-4">
               {landingPage.benefits.map((b, i) => (
                 <li key={i} className="border-b border-slate-700 pb-4 last:border-0 last:pb-0">
                   <div className="font-bold text-white">{b.title}</div>
                   <div className="text-slate-400">{b.description}</div>
                 </li>
               ))}
             </ul>
           </Card>
        </div>
      )}
    </div>
  );
};