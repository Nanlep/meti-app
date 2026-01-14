
import React from 'react';
import { SectionTitle, Card } from './Shared';
import { Layers, Target, Users, Magnet, UserPlus, Zap, LayoutTemplate, Crown, Code, Briefcase, Megaphone, CheckSquare, Mail, FileText } from 'lucide-react';

export const StepGuide: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto animate-fadeIn pb-12">
      <SectionTitle 
        title="Platform Guide" 
        subtitle="Master the Meti Marketing Engine workflow from start to finish."
      />

      <div className="space-y-12">
        
        {/* Phase 1: Strategy */}
        <section>
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2 border-b border-slate-800 pb-2">
            <span className="bg-indigo-500/10 text-indigo-400 w-8 h-8 rounded-full flex items-center justify-center text-sm border border-indigo-500/20">1</span>
            Phase I: Strategic Foundation
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-slate-800/50 hover:border-indigo-500/50 transition-colors">
              <div className="text-indigo-400 mb-3"><Layers size={24} /></div>
              <h4 className="font-bold text-white mb-2">Setup</h4>
              <p className="text-sm text-slate-400">Define your product, price, and URL. This context is used by the AI for every subsequent step to ensure consistency.</p>
            </Card>
            <Card className="bg-slate-800/50 hover:border-indigo-500/50 transition-colors">
              <div className="text-indigo-400 mb-3"><Target size={24} /></div>
              <h4 className="font-bold text-white mb-2">Niche</h4>
              <p className="text-sm text-slate-400">Identify profitable sub-markets. Select the one with the highest "Profitability Score" to dominate a specific segment.</p>
            </Card>
            <Card className="bg-slate-800/50 hover:border-indigo-500/50 transition-colors">
              <div className="text-indigo-400 mb-3"><Users size={24} /></div>
              <h4 className="font-bold text-white mb-2">Persona (ICP)</h4>
              <p className="text-sm text-slate-400">Generate a psychological profile of your buyer (Pain points, triggers). Use the "Refine" tool to tweak the AI's understanding.</p>
            </Card>
          </div>
        </section>

        {/* Phase 2: Content & Assets */}
        <section>
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2 border-b border-slate-800 pb-2">
            <span className="bg-emerald-500/10 text-emerald-400 w-8 h-8 rounded-full flex items-center justify-center text-sm border border-emerald-500/20">2</span>
            Phase II: Asset Creation
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-slate-800/50 hover:border-emerald-500/50 transition-colors">
              <div className="text-emerald-400 mb-3"><Magnet size={24} /></div>
              <h4 className="font-bold text-white mb-2">Lead Magnets</h4>
              <p className="text-sm text-slate-400">
                Generate ideas (Ebooks, Webinars). <br/>
                <strong>Draft Content:</strong> AI writes the chapters/scripts.<br/>
                <strong>Smart Publish:</strong> Post directly to social with an email capture link.
              </p>
            </Card>
            <Card className="bg-slate-800/50 hover:border-emerald-500/50 transition-colors">
              <div className="text-emerald-400 mb-3"><LayoutTemplate size={24} /></div>
              <h4 className="font-bold text-white mb-2">Landing Page</h4>
              <p className="text-sm text-slate-400">Create high-converting sales copy. Toggle "Preview" to see a wireframe and use "Export HTML" to download the code.</p>
            </Card>
            <Card className="bg-slate-800/50 hover:border-emerald-500/50 transition-colors">
              <div className="text-emerald-400 mb-3"><Megaphone size={24} /></div>
              <h4 className="font-bold text-white mb-2">Ad Engine</h4>
              <p className="text-sm text-slate-400">
                <strong>Creative Hub:</strong> Generate copy & visuals for LinkedIn, Twitter, etc.<br/>
                <strong>Real-time Posting:</strong> Publish directly to connected accounts.<br/>
                <strong>Analytics:</strong> Track Spend, ROI, and performance per channel.
              </p>
            </Card>
          </div>
        </section>

        {/* Phase 3: Execution & Sales */}
        <section>
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2 border-b border-slate-800 pb-2">
            <span className="bg-purple-500/10 text-purple-400 w-8 h-8 rounded-full flex items-center justify-center text-sm border border-purple-500/20">3</span>
            Phase III: Execution & Conversion
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-slate-800/50 hover:border-purple-500/50 transition-colors">
              <div className="text-purple-400 mb-3"><UserPlus size={24} /></div>
              <h4 className="font-bold text-white mb-2">Lead Gen</h4>
              <p className="text-sm text-slate-400">
                <strong>Local:</strong> Scans Google Maps for real businesses. <br/>
                <strong>Social:</strong> Generates Boolean strings for LinkedIn prospecting.
              </p>
            </Card>
            <Card className="bg-slate-800/50 hover:border-purple-500/50 transition-colors">
              <div className="text-purple-400 mb-3"><Zap size={24} /></div>
              <h4 className="font-bold text-white mb-2">Sales Simulator</h4>
              <p className="text-sm text-slate-400">
                <strong>Roleplay:</strong> Chat with an AI simulating your persona.<br/>
                <strong>Objection Crusher:</strong> Get instant rebuttals.<br/>
                <strong>Cold DMs:</strong> Generate outreach scripts.
              </p>
            </Card>
            <Card className="bg-slate-800/50 hover:border-purple-500/50 transition-colors">
              <div className="text-purple-400 mb-3"><CheckSquare size={24} /></div>
              <h4 className="font-bold text-white mb-2">Qualification</h4>
              <p className="text-sm text-slate-400">
                Generate a custom BANT framework (Budget, Authority, Need, Timing) to score leads efficiently.
              </p>
            </Card>
            <Card className="bg-slate-800/50 hover:border-purple-500/50 transition-colors">
              <div className="text-purple-400 mb-3"><Mail size={24} /></div>
              <h4 className="font-bold text-white mb-2">Follow Up</h4>
              <p className="text-sm text-slate-400">
                Create a 3-part email nurture sequence designed to unstick cold leads and book meetings.
              </p>
            </Card>
          </div>
        </section>

        {/* Phase 4: Agency & Admin */}
        <section>
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2 border-b border-slate-800 pb-2">
            <span className="bg-amber-500/10 text-amber-400 w-8 h-8 rounded-full flex items-center justify-center text-sm border border-amber-500/20">4</span>
            Agency & Developer Tools
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
             <Card className="bg-slate-800/50 hover:border-amber-500/50 transition-colors">
              <div className="text-amber-400 mb-3"><Briefcase size={24} /></div>
              <h4 className="font-bold text-white mb-2">Client CRM</h4>
              <p className="text-sm text-slate-400">Organize projects by Client. Track status and contact details in the "Clients" tab on the dashboard.</p>
            </Card>
            <Card className="bg-slate-800/50 hover:border-amber-500/50 transition-colors">
              <div className="text-amber-400 mb-3"><Crown size={24} /></div>
              <h4 className="font-bold text-white mb-2">White-Labeling</h4>
              <p className="text-sm text-slate-400">Remove Meti branding from Strategy Reports. Add your own agency name to exports.</p>
            </Card>
            <Card className="bg-slate-800/50 hover:border-amber-500/50 transition-colors">
              <div className="text-amber-400 mb-3"><FileText size={24} /></div>
              <h4 className="font-bold text-white mb-2">Strategy Report</h4>
              <p className="text-sm text-slate-400">Compile every generated asset into a master Markdown document for your team or clients.</p>
            </Card>
             <Card className="bg-slate-800/50 hover:border-amber-500/50 transition-colors">
              <div className="text-amber-400 mb-3"><Code size={24} /></div>
              <h4 className="font-bold text-white mb-2">Developer API</h4>
              <p className="text-sm text-slate-400">Generate API Keys to build your own tools on top of the Meti Engine. Access via Dashboard.</p>
            </Card>
          </div>
        </section>

      </div>
    </div>
  );
};
