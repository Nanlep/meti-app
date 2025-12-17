
import React, { useState } from 'react';
import { Button, Card } from './Shared';
import { Logo } from './Logo';
import { ArrowRight, Target, Zap, Users, CheckCircle2, Globe, Shield, Briefcase, TrendingUp, Mail, Search, Megaphone, LayoutTemplate, Layers, ArrowDown, Database, Cpu, Rocket, BarChart2, Calculator, PlayCircle, ChevronDown, HelpCircle } from 'lucide-react';
import { LegalDocs } from './LegalDocs';
import { ProductDemo } from './ProductDemo';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onLogin }) => {
  const [legalType, setLegalType] = useState<'privacy' | 'terms' | 'security' | null>(null);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans overflow-x-hidden selection:bg-indigo-500/30">
      
      {/* Background Gradients */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[120px]"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
      </div>

      {/* Navbar */}
      <nav className="relative z-50 border-b border-slate-800/50 backdrop-blur-md bg-slate-950/50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Logo size="md" />
          <div className="flex items-center gap-4">
            <button 
              onClick={onLogin} 
              className="text-sm font-medium text-slate-400 hover:text-white transition-colors hidden sm:block"
            >
              Sign In
            </button>
            <Button onClick={onGetStarted} className="h-10 px-6">
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative z-10 pt-24 pb-20 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-medium text-indigo-400 mb-8 animate-fadeIn">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            The Marketing Industry Machine
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight mb-8 leading-tight">
            From <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Strategy</span> to <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">Execution</span> <br/>
            in Seconds.
          </h1>
          
          <p className="text-xl text-slate-400 mb-10 max-w-3xl mx-auto leading-relaxed">
            Meti isn't just a tool; it's an autonomous growth engine. Define your <strong>Niche & Persona</strong>, generate <strong>High-Converting Assets</strong>, and automate <strong>Lead Generation</strong> in one unified workflow.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-24">
            <Button onClick={onGetStarted} className="h-14 px-10 text-lg w-full sm:w-auto shadow-xl shadow-indigo-500/20 transform hover:scale-105 transition-all">
              Start Growth Engine <ArrowRight className="ml-2" />
            </Button>
            <p className="text-sm text-slate-500 sm:hidden">Enterprise-grade architecture</p>
          </div>

          {/* Product Demo Simulation */}
          <div className="relative mx-auto max-w-5xl perspective-1000 animate-slideUp">
             <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-emerald-500/10 blur-3xl -z-10 rounded-full"></div>
             <ProductDemo />
          </div>
        </div>
      </header>

      {/* NEW SECTION 1: The Growth Methodology (Educational) */}
      <section className="py-24 px-6 border-t border-slate-800 bg-slate-900/20 relative z-20">
        <div className="max-w-7xl mx-auto">
           <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-white mb-4">The "3X Multiplier" Framework</h2>
              <p className="text-slate-400 max-w-2xl mx-auto">
                Most businesses fail because they skip steps. Meti forces you to follow the optimal sequence for growth. 
                <strong>Strategy × Execution = Revenue.</strong>
              </p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
              {/* Connector Line */}
              <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-indigo-500/0 via-indigo-500/30 to-indigo-500/0 -translate-y-1/2 z-0"></div>

              <MethodologyCard 
                 step="01"
                 title="Narrow The Focus"
                 icon={<Target className="text-indigo-400" />}
                 desc="Meti uses AI to scan market data and find a 'Blue Ocean' sub-niche where competition is low and demand is high."
                 impact="2x Response Rate"
              />
              <MethodologyCard 
                 step="02"
                 title="Decode The Buyer"
                 icon={<Users className="text-purple-400" />}
                 desc="We generate a forensic psychological profile of your buyer. You stop guessing what to say; you say exactly what they need to hear."
                 impact="3x Engagement"
              />
              <MethodologyCard 
                 step="03"
                 title="Automate Assets"
                 icon={<Zap className="text-amber-400" />}
                 desc="Instant generation of high-value lead magnets, landing pages, and ads that are perfectly aligned with the persona from Step 2."
                 impact="5x Speed to Market"
              />
              <MethodologyCard 
                 step="04"
                 title="Scale Outreach"
                 icon={<Rocket className="text-emerald-400" />}
                 desc="Deploy agents to find leads on Maps & Social, then use the assets to convert them. Volume meets Relevance."
                 impact="3x Revenue Growth"
                 isFinal
              />
           </div>
        </div>
      </section>

      {/* NEW SECTION 2: Interactive ROI Simulator */}
      <section className="py-24 px-6 relative overflow-hidden z-30">
         <div className="absolute inset-0 bg-indigo-900/5 skew-y-3 transform origin-bottom-left -z-10"></div>
         <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
               <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-900/30 border border-emerald-500/30 text-xs font-bold text-emerald-400 mb-6">
                    <Calculator size={14} /> GROWTH SIMULATOR
                  </div>
                  <h2 className="text-4xl font-bold text-white mb-6">
                    Do the math.<br/>
                    See the Meti Effect.
                  </h2>
                  <p className="text-lg text-slate-400 mb-8">
                    Growth isn't magic; it's a formula. Use the simulator to see how improving your <strong>Targeting (Niche)</strong> and <strong>Messaging (Persona)</strong> compounds your results.
                  </p>
                  
                  <div className="space-y-4">
                     <div className="flex items-start gap-4">
                        <div className="bg-slate-800 p-2 rounded-lg text-indigo-400"><Target size={20} /></div>
                        <div>
                           <h4 className="text-white font-bold">Better Targeting</h4>
                           <p className="text-sm text-slate-400">Targeting a specific sub-niche increases lead quality.</p>
                        </div>
                     </div>
                     <div className="flex items-start gap-4">
                        <div className="bg-slate-800 p-2 rounded-lg text-emerald-400"><TrendingUp size={20} /></div>
                        <div>
                           <h4 className="text-white font-bold">Higher Conversion</h4>
                           <p className="text-sm text-slate-400">Persona-matched copy increases close rates.</p>
                        </div>
                     </div>
                  </div>
               </div>

               <div className="relative z-40">
                  <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-2xl blur opacity-30"></div>
                  <RevenueSimulator />
               </div>
            </div>
         </div>
      </section>

      {/* Existing Social Proof & Journey Sections */}
      <section className="py-10 border-y border-slate-800/50 bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-8">Powering Growth For</p>
          <div className="flex flex-wrap justify-center gap-12 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
             {['Startup Founders', 'Digital Agencies', 'Marketing Consultants', 'Growth Teams', 'Freelancers'].map((brand, i) => (
               <span key={i} className="text-xl font-bold text-slate-300">{brand}</span>
             ))}
          </div>
        </div>
      </section>

      {/* Journey Breakdown */}
      <section className="py-32 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">The Complete Application Journey</h2>
            <p className="text-lg text-slate-400">
              Most tools handle one piece of the puzzle. Meti guides you through the entire lifecycle, ensuring your strategy informs your execution.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
             {/* Left Column: Strategy */}
             <div className="space-y-8">
                <div className="flex items-center gap-4 mb-6">
                   <div className="w-10 h-10 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-lg">1</div>
                   <h3 className="text-2xl font-bold text-white">Strategic Foundation</h3>
                </div>
                
                <FeatureRow 
                   icon={<Target className="text-indigo-400" />}
                   title="Niche Segmentation"
                   desc="Don't target everyone. AI analyzes market data to find profitable sub-niches with high demand and low competition."
                />
                <FeatureRow 
                   icon={<Users className="text-indigo-400" />}
                   title="Persona Generation (ICP)"
                   desc="Generate deep psychological profiles. Understand your buyer's pain points, goals, and buying triggers before you write a single word."
                />
                <FeatureRow 
                   icon={<Zap className="text-indigo-400" />}
                   title="Lead Magnet Strategy"
                   desc="Instant ideation and drafting of high-value assets (Ebooks, Checklists) that act as the perfect hook for your persona."
                />
             </div>

             {/* Right Column: Execution */}
             <div className="space-y-8">
                <div className="flex items-center gap-4 mb-6">
                   <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-lg">2</div>
                   <h3 className="text-2xl font-bold text-white">Execution Engine</h3>
                </div>

                <FeatureRow 
                   icon={<Search className="text-emerald-400" />}
                   title="Conversion Engine (Lead Gen)"
                   desc="Deploy Boolean Search Agents and scan Google Maps for real-time leads. Enrich data and push directly to your pipeline."
                />
                <FeatureRow 
                   icon={<Megaphone className="text-emerald-400" />}
                   title="Ad Engine & Publisher"
                   desc="Generate multi-channel ad creatives (LinkedIn, Twitter, IG). Connect your accounts to publish and track performance instantly."
                />
                <FeatureRow 
                   icon={<Mail className="text-emerald-400" />}
                   title="Growth Suite (Email & SEO)"
                   desc="Automated email nurture sequences to warm up leads, plus technical SEO audits and content optimization to drive organic traffic."
                />
             </div>
          </div>
        </div>
      </section>

      {/* Founder Use Case */}
      <section className="py-24 px-6 bg-slate-900/50 border-y border-slate-800">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-900/30 border border-indigo-500/30 text-xs font-bold text-indigo-400 mb-6">
              <Briefcase size={14} /> BUILT FOR FOUNDERS
            </div>
            <h2 className="text-4xl font-bold text-white mb-6">
              You don't need a CMO yet.<br/>
              <span className="text-slate-500">You need an Engine.</span>
            </h2>
            <p className="text-lg text-slate-400 mb-8">
              Founders wear too many hats. Meti removes the "Marketing Hat" by automating the grunt work. 
              Go from "I need more users" to "Here is my campaign" in 5 minutes.
            </p>
            <div className="space-y-6">
              <BenefitRow 
                title="Save 20+ Hours/Week" 
                desc="Stop writing generic copy and searching for leads manually. Let AI do the heavy lifting." 
              />
              <BenefitRow 
                title="Data-Backed Decisions" 
                desc="Don't launch blindly. Validate your niche and persona with data before spending ad dollars." 
              />
              <BenefitRow 
                title="Unified Operating System" 
                desc="Replace 5 different tools (CRM, Writer, SEO tool, Lead Scraper) with one cohesive platform." 
              />
            </div>
            <Button onClick={onGetStarted} className="mt-10 h-12 px-8">
              Start Building Now
            </Button>
          </div>
          
          {/* Founder Visual */}
          <div className="relative">
             <div className="absolute inset-0 bg-indigo-500/20 blur-[100px] rounded-full"></div>
             <Card className="relative bg-slate-950 border-slate-800 p-8">
                <div className="flex items-center gap-4 mb-6 border-b border-slate-800 pb-6">
                   <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-white font-bold">F</div>
                   <div>
                      <div className="text-white font-bold">The Founder's Dashboard</div>
                      <div className="text-xs text-slate-500">Real-time view</div>
                   </div>
                </div>
                <div className="space-y-4">
                   <div className="flex justify-between items-center p-4 bg-slate-900 rounded-lg border border-slate-800">
                      <span className="text-slate-400 text-sm">Strategy Status</span>
                      <span className="text-emerald-400 text-xs font-bold bg-emerald-500/10 px-2 py-1 rounded">READY</span>
                   </div>
                   <div className="flex justify-between items-center p-4 bg-slate-900 rounded-lg border border-slate-800">
                      <span className="text-slate-400 text-sm">Generated Leads</span>
                      <span className="text-white font-bold">142 Potential Clients</span>
                   </div>
                   <div className="flex justify-between items-center p-4 bg-slate-900 rounded-lg border border-slate-800">
                      <span className="text-slate-400 text-sm">Ad Campaigns</span>
                      <span className="text-white font-bold">3 Active / 12 Drafted</span>
                   </div>
                   <div className="flex justify-between items-center p-4 bg-slate-900 rounded-lg border border-slate-800">
                      <span className="text-slate-400 text-sm">Est. Revenue Impact</span>
                      <span className="text-indigo-400 font-bold">3X Growth</span>
                   </div>
                </div>
             </Card>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="py-24 px-6 border-t border-slate-800 bg-slate-950 relative z-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-bold text-slate-400 mb-6">
              <HelpCircle size={14} /> SUPPORT & CLARITY
            </div>
            <h2 className="text-4xl font-bold text-white mb-4">Frequently Asked Questions</h2>
            <p className="text-lg text-slate-400">Everything you need to know about the Meti Marketing Engine.</p>
          </div>

          <div className="space-y-4">
            <FAQItem 
              question="What exactly does Meti do?" 
              answer="Meti is your autonomous AI marketing strategist **and executioner**. It goes beyond planning to help you build and launch. From identifying your most profitable niche to generating high-converting assets and automating outreach, Meti handles the full lifecycle. Our proprietary 'Sound Project Session' model ensures strategy and execution are perfectly aligned, helping users achieve **3x growth** from a single session compared to traditional fragmented methods."
            />
            <FAQItem 
              question="How does Meti handle Go-To-Market campaigns?" 
              answer="Meti transforms GTM from a chaotic scramble into a structured science. It aligns your **Strategic Foundation** (Niche & Persona) with **Asset Creation** (Landing Pages & Lead Magnets) and **Execution** (Ads & Outreach). By unifying these typically siloed steps, Meti ensures your GTM campaign launches with product-market fit baked in from day one, significantly reducing the time to first revenue."
            />
            <FAQItem 
              question="How does the pricing model work?" 
              answer="We offer a flexible model to suit different stages. The **Starter** plan is 'Pay-As-You-Go', meaning you only pay $9.80 per project session with no monthly fees. The **Pro** ($29.80/mo) and **Agency** ($198.90/mo) plans are subscription-based, offering included project credits and advanced features."
            />
            <FAQItem 
              question="What is a 'Project Session'?" 
              answer="A project session is a high-impact workflow where Meti builds your entire marketing engine for a specific product. It covers both **Strategy** (Niche, Persona) and **Execution** (Ads, Lead Magnets, Email Sequences). A single sound project session is designed to deliver **3x results** by ensuring every asset is psychologically calibrated to your buyer. Once created, your project remains forever accessible in your dashboard."
            />
            <FAQItem 
              question="How does the 'Lead Scout' feature work?" 
              answer="The Lead Scout uses a combination of Google Maps real-time data and AI analysis. You define a niche (e.g., 'Gym Owners') and a location (e.g., 'Austin, TX'). Meti scans for verified businesses matching your criteria, extracts their public contact data, and can even enrich this data to estimate email patterns for decision makers."
            />
            <FAQItem 
              question="Can I use Meti for my clients (Agency Use)?" 
              answer="Absolutely. The Agency Plan ($198.90/mo) is designed specifically for this. It allows you to create separate 'Client' workspaces, manage up to 25 different projects, and generate White-Label Reports. You can export strategies as PDF or Markdown without the Meti branding, allowing you to resell the strategy work directly to your clients."
            />
            <FAQItem 
              question="What is the difference between Starter and Pro?" 
              answer="The Starter plan is usage-based ($9.80 per project) and ideal for solo founders launching occasionally. The Pro Plan ($29.80/mo) is for active marketers; it includes 5 projects per month and unlocks the Execution Engine: Real-time Lead Scouting on Maps, SEO Audits, and multi-channel Ad Generation."
            />
            <FAQItem 
              question="How do I start using the app?" 
              answer="It takes less than 2 minutes. 1) Click 'Get Access' and sign up for free. 2) You can start immediately on the Pay-As-You-Go plan or upgrade to a subscription. 3) Enter your product name and a short description. 4) The AI will immediately begin analyzing market segments."
            />
            <FAQItem 
              question="Is my marketing strategy secure?" 
              answer="Yes. We adhere to SOC 2 compliance standards. Your data is encrypted at rest (AES-256) and in transit (TLS 1.3). We do not use your proprietary strategy data to train our public models. Your competitive advantage remains private."
            />
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="py-32 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">Ready to automate your growth?</h2>
          <p className="text-xl text-slate-400 mb-10">Join 5,000+ founders and marketers using Meti to scale faster.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button onClick={onGetStarted} className="h-14 px-10 text-lg shadow-xl shadow-indigo-500/30">
              Get Access Now
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-800 bg-slate-950 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <Logo size="sm" showText={false} className="opacity-50 grayscale" />
            <span>© 2024 Meti Intelligence. All rights reserved.</span>
          </div>
          <div className="flex gap-6 text-sm text-slate-500">
            <button onClick={() => setLegalType('privacy')} className="hover:text-white transition-colors">Privacy</button>
            <button onClick={() => setLegalType('terms')} className="hover:text-white transition-colors">Terms</button>
            <button onClick={() => setLegalType('security')} className="hover:text-white transition-colors">Security</button>
            <a href="mailto:contact@meti.pro" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </footer>

      {legalType && (
        <LegalDocs 
          isOpen={!!legalType} 
          onClose={() => setLegalType(null)} 
          type={legalType} 
        />
      )}
    </div>
  );
};

// NEW SUB-COMPONENTS FOR LANDING PAGE

const FAQItem = ({ question, answer }: { question: string, answer: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-slate-800 bg-slate-900/30 rounded-lg overflow-hidden mb-2">
      <button 
        className="w-full py-5 px-6 flex justify-between items-center text-left focus:outline-none group hover:bg-slate-800/50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={`text-lg font-medium transition-colors ${isOpen ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>
          {question}
        </span>
        <span className={`ml-6 flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 text-indigo-400' : 'text-slate-600'}`}>
          <ChevronDown size={20} />
        </span>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-6 pb-6 pt-0">
          <p className="text-slate-400 leading-relaxed text-sm">
            {answer}
          </p>
        </div>
      </div>
    </div>
  )
}

const MethodologyCard = ({ step, title, icon, desc, impact, isFinal }: any) => (
    <div className={`relative bg-slate-950 p-6 rounded-2xl border ${isFinal ? 'border-emerald-500/50 shadow-emerald-500/10' : 'border-slate-800'} border shadow-lg z-10 h-full flex flex-col`}>
        <div className="text-xs font-bold text-slate-500 mb-4 bg-slate-900 w-fit px-2 py-1 rounded">STEP {step}</div>
        <div className="mb-4 bg-slate-900/50 w-12 h-12 rounded-xl flex items-center justify-center border border-slate-800">
            {icon}
        </div>
        <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
        <p className="text-sm text-slate-400 leading-relaxed mb-4 flex-1">
            {desc}
        </p>
        <div className={`mt-auto text-xs font-bold uppercase tracking-wide py-2 px-3 rounded-lg ${isFinal ? 'bg-emerald-500/20 text-emerald-400' : 'bg-indigo-500/10 text-indigo-400'}`}>
            <span className="opacity-70">Impact: </span>{impact}
        </div>
    </div>
);

const RevenueSimulator = () => {
    const [leads, setLeads] = useState(100);
    const [conversion, setConversion] = useState(2);
    const [price, setPrice] = useState(500);

    // Multipliers aligned with "3x" Claim
    const LEAD_MULTIPLIER = 1.8; // Better targeting = more qualified leads
    const CONVERSION_MULTIPLIER = 1.7; // Better copy = higher close rate

    const currentRevenue = Math.round(leads * (conversion/100) * price);
    
    // Meti Impact:
    const metiLeads = Math.round(leads * LEAD_MULTIPLIER);
    const metiConversion = parseFloat((conversion * CONVERSION_MULTIPLIER).toFixed(1));
    const metiRevenue = Math.round(metiLeads * (metiConversion/100) * price);
    
    const growth = metiRevenue - currentRevenue;
    // Handle division by zero
    const multiplier = currentRevenue > 0 ? (metiRevenue / currentRevenue).toFixed(1) : "0.0";

    return (
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 md:p-8 shadow-2xl relative z-20">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <BarChart2 className="text-emerald-400" /> Revenue Projector
            </h3>
            
            <div className="space-y-6 mb-8">
                {/* Leads Input */}
                <div>
                    <div className="flex justify-between text-sm mb-2">
                        <label className="text-slate-400">Monthly Leads</label>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-emerald-400 bg-emerald-500/10 px-1.5 rounded">+{((LEAD_MULTIPLIER-1)*100).toFixed(0)}% w/ Meti</span>
                            <input 
                                type="number" 
                                value={leads} 
                                onChange={e => setLeads(Math.max(0, Number(e.target.value)))}
                                className="w-16 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-right text-white font-bold text-xs outline-none focus:border-indigo-500"
                            />
                        </div>
                    </div>
                    <input 
                      type="range" 
                      min="10" 
                      max="2000" 
                      step="10" 
                      value={leads} 
                      onChange={e => setLeads(Number(e.target.value))} 
                      className="w-full accent-indigo-500 h-2 bg-slate-700 rounded-lg cursor-pointer" 
                    />
                </div>

                {/* Conversion Input */}
                <div>
                    <div className="flex justify-between text-sm mb-2">
                        <label className="text-slate-400">Close Rate (%)</label>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-emerald-400 bg-emerald-500/10 px-1.5 rounded">+{((CONVERSION_MULTIPLIER-1)*100).toFixed(0)}% w/ Meti</span>
                            <input 
                                type="number" 
                                value={conversion} 
                                onChange={e => setConversion(Math.max(0, Number(e.target.value)))}
                                className="w-16 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-right text-white font-bold text-xs outline-none focus:border-indigo-500"
                            />
                        </div>
                    </div>
                    <input 
                      type="range" 
                      min="0.1" 
                      max="10" 
                      step="0.1" 
                      value={conversion} 
                      onChange={e => setConversion(Number(e.target.value))} 
                      className="w-full accent-indigo-500 h-2 bg-slate-700 rounded-lg cursor-pointer" 
                    />
                </div>

                {/* Price Input */}
                <div>
                    <div className="flex justify-between text-sm mb-2">
                        <label className="text-slate-400">Avg Deal Size ($)</label>
                        <input 
                            type="number" 
                            value={price} 
                            onChange={e => setPrice(Math.max(0, Number(e.target.value)))}
                            className="w-24 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-right text-white font-bold text-xs outline-none focus:border-indigo-500"
                        />
                    </div>
                    <input 
                      type="range" 
                      min="50" 
                      max="10000" 
                      step="50" 
                      value={price} 
                      onChange={e => setPrice(Number(e.target.value))} 
                      className="w-full accent-indigo-500 h-2 bg-slate-700 rounded-lg cursor-pointer" 
                    />
                </div>
            </div>

            {/* Results Grid - Responsive grid-cols */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-800 pt-6">
                <div className="text-center p-3 rounded-xl bg-slate-800/30">
                    <div className="text-xs text-slate-500 font-bold uppercase mb-1">Current Revenue</div>
                    <div className="text-xl font-bold text-slate-300">${currentRevenue.toLocaleString()}</div>
                    <div className="text-[10px] text-slate-500 mt-1">{leads} leads @ {conversion}%</div>
                </div>
                <div className="text-center relative p-3 rounded-xl bg-emerald-900/10 border border-emerald-500/20">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-lg animate-pulse whitespace-nowrap">
                        {multiplier}x MULTIPLIER
                    </div>
                    <div className="text-xs text-emerald-400 font-bold uppercase mb-1">Projected Revenue</div>
                    <div className="text-2xl font-bold text-white">${metiRevenue.toLocaleString()}</div>
                    <div className="text-[10px] text-emerald-400/70 mt-1">+{growth.toLocaleString()} Growth</div>
                </div>
            </div>
        </div>
    );
}

const FeatureRow = ({ icon, title, desc }: { icon: any, title: string, desc: string }) => (
  <div className="flex gap-4">
    <div className="mt-1 bg-slate-900 p-3 rounded-xl border border-slate-800 h-fit">
      {icon}
    </div>
    <div>
      <h4 className="text-white font-bold text-lg mb-2">{title}</h4>
      <p className="text-slate-400 leading-relaxed">{desc}</p>
    </div>
  </div>
);

const BenefitRow = ({ title, desc }: { title: string, desc: string }) => (
  <div className="flex gap-4">
    <div className="mt-1">
      <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
        <CheckCircle2 size={14} />
      </div>
    </div>
    <div>
      <h4 className="text-white font-bold text-lg">{title}</h4>
      <p className="text-slate-400">{desc}</p>
    </div>
  </div>
);
