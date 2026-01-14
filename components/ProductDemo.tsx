
import React, { useState, useEffect } from 'react';
import { MousePointer2, Target, Users, ArrowRight, Zap, CheckCircle2, Layers, BrainCircuit, Search, BarChart } from 'lucide-react';

export const ProductDemo: React.FC = () => {
  const [phase, setPhase] = useState(0); 
  // 0: Start
  // 1: Typing Inputs
  // 2: Cursor Move & Click
  // 3: AI Processing (Scanning Niche -> Generating ICP)
  // 4: Final Dashboard (Strategy Ready)

  const [typedName, setTypedName] = useState('');
  const [typedDesc, setTypedDesc] = useState('');
  
  // Updated for Finance App Use Case
  const targetName = "WealthWise";
  const targetDesc = "AI investment tracker for Gen Z.";

  useEffect(() => {
    let timeout: any;

    const runAnimation = async () => {
      // RESET (0s)
      setPhase(0);
      setTypedName('');
      setTypedDesc('');
      await new Promise(r => setTimeout(r, 1000));

      // TYPE (0s - 2.5s)
      setPhase(1);
      // Type Name
      for (let i = 0; i <= targetName.length; i++) {
        setTypedName(targetName.substring(0, i));
        await new Promise(r => setTimeout(r, 40));
      }
      // Type Desc
      await new Promise(r => setTimeout(r, 100));
      for (let i = 0; i <= targetDesc.length; i++) {
        setTypedDesc(targetDesc.substring(0, i));
        await new Promise(r => setTimeout(r, 20));
      }

      // CLICK (2.5s - 3.2s)
      setPhase(2);
      await new Promise(r => setTimeout(r, 700));

      // PROCESSING (3.2s - 6.0s)
      setPhase(3);
      await new Promise(r => setTimeout(r, 2800));

      // RESULTS (6.0s - 10.0s)
      setPhase(4);
      await new Promise(r => setTimeout(r, 4000));

      // Loop
      runAnimation();
    };

    runAnimation();

    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="relative w-full max-w-4xl mx-auto rounded-xl bg-slate-950 border border-slate-800 shadow-2xl overflow-hidden aspect-[16/9] md:aspect-[2.2/1] transform transition-all hover:scale-[1.01] group cursor-default">
      {/* Window Controls */}
      <div className="h-8 bg-slate-900 border-b border-slate-800 flex items-center px-4 gap-2">
        <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
        <div className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500/50"></div>
        <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/50"></div>
        <div className="ml-auto text-[10px] text-slate-500 font-mono flex items-center gap-2">
           <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span> METI ENGINE v2.1
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative p-6 h-full flex flex-col font-sans">
        
        {/* VIEW 1: SETUP FORM (Phases 0, 1, 2) */}
        <div className={`absolute inset-0 p-8 transition-all duration-500 ${phase < 3 ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10 pointer-events-none'}`}>
           <div className="max-w-lg mx-auto space-y-6 mt-2">
              <div className="flex items-center gap-3 mb-6">
                 <div className="w-10 h-10 bg-indigo-500/20 text-indigo-400 rounded-lg flex items-center justify-center border border-indigo-500/30">
                    <Layers size={20} />
                 </div>
                 <div>
                    <h3 className="text-white font-bold text-lg">New Strategy Session</h3>
                    <p className="text-slate-400 text-xs">Define your product to initialize the engine.</p>
                 </div>
              </div>

              <div className="space-y-4">
                 <div>
                    <label className="text-[10px] text-slate-500 uppercase font-bold mb-1 block">Product Name</label>
                    <div className="h-10 bg-slate-900 border border-slate-700 rounded-lg flex items-center px-3 text-white text-sm shadow-inner">
                       {typedName}<span className={`w-0.5 h-4 bg-indigo-500 ml-0.5 ${phase === 1 && typedName.length < targetName.length ? 'animate-pulse' : 'opacity-0'}`}></span>
                    </div>
                 </div>
                 <div>
                    <label className="text-[10px] text-slate-500 uppercase font-bold mb-1 block">Value Proposition</label>
                    <div className="h-14 bg-slate-900 border border-slate-700 rounded-lg p-3 text-white text-sm shadow-inner flex items-start">
                       {typedDesc}<span className={`w-0.5 h-4 bg-indigo-500 ml-0.5 ${phase === 1 && typedName.length === targetName.length ? 'animate-pulse' : 'opacity-0'}`}></span>
                    </div>
                 </div>
              </div>

              <button className={`w-full py-3 rounded-lg font-bold text-sm transition-all duration-200 mt-2 flex items-center justify-center gap-2 ${phase === 2 ? 'bg-indigo-500 text-white scale-95 ring-4 ring-indigo-500/30' : 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'}`}>
                 <Zap size={16} className={phase === 2 ? "animate-ping" : ""} /> Generate Strategy
              </button>
           </div>
        </div>

        {/* VIEW 2: AI PROCESSING (Phase 3) */}
        <div className={`absolute inset-0 flex flex-col items-center justify-center bg-slate-950 transition-all duration-500 ${phase === 3 ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
           <div className="relative w-24 h-24 mb-8">
              <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <BrainCircuit className="absolute inset-0 m-auto text-indigo-400 animate-pulse" size={32} />
           </div>
           
           <div className="w-full max-w-sm space-y-3">
              {/* Step 1: Niche */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-900 border border-slate-800 animate-fadeIn" style={{animationDelay: '0.1s'}}>
                 <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <CheckCircle2 size={14} />
                 </div>
                 <div className="text-sm text-slate-300">Scanning Financial Markets...</div>
              </div>
              
              {/* Step 2: ICP */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-900 border border-slate-800 animate-fadeIn" style={{animationDelay: '1.2s'}}>
                 <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <CheckCircle2 size={14} />
                 </div>
                 <div className="text-sm text-slate-300">Profiling Retail Investors...</div>
              </div>

              {/* Step 3: Assets */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-900 border border-slate-800 animate-fadeIn" style={{animationDelay: '2.0s'}}>
                 <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-ping"></div>
                 </div>
                 <div className="text-sm text-white font-bold">Compiling Strategy...</div>
              </div>
           </div>
        </div>

        {/* VIEW 3: RESULTS DASHBOARD (Phase 4) */}
        <div className={`absolute inset-0 p-8 transition-all duration-500 bg-slate-950 ${phase === 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
           <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                 <div className="bg-emerald-500/10 text-emerald-400 p-1.5 rounded">
                    <CheckCircle2 size={16} />
                 </div>
                 <span className="text-white font-bold">Strategy Generated</span>
              </div>
              <span className="text-xs text-slate-500">Just now</span>
           </div>

           <div className="grid grid-cols-2 gap-6 h-full pb-10">
              {/* Card 1: Niche */}
              <div className="bg-slate-900/50 rounded-xl border border-indigo-500/30 p-5 relative overflow-hidden group">
                 <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                 <div className="flex items-center gap-2 text-indigo-400 mb-2">
                    <Target size={16} />
                    <span className="text-xs font-bold uppercase">Winning Niche</span>
                 </div>
                 <div className="text-xl font-bold text-white mb-2">FIRE Enthusiasts</div>
                 <p className="text-xs text-slate-400 leading-relaxed">
                    High-net-worth Gen Z segment focused on "Financial Independence, Retire Early".
                 </p>
                 <div className="mt-4 flex items-center gap-2">
                    <div className="text-xs font-bold bg-indigo-500/10 text-indigo-300 px-2 py-1 rounded">Score: 94/100</div>
                 </div>
              </div>

              {/* Card 2: ICP */}
              <div className="bg-slate-900/50 rounded-xl border border-emerald-500/30 p-5 relative overflow-hidden group">
                 <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                 <div className="flex items-center gap-2 text-emerald-400 mb-2">
                    <Users size={16} />
                    <span className="text-xs font-bold uppercase">Ideal Persona</span>
                 </div>
                 <div className="text-xl font-bold text-white mb-2">The "Optimizing" Saver</div>
                 <p className="text-xs text-slate-400 leading-relaxed">
                    <strong>Pain Point:</strong> Fragmented data across 5+ brokerage apps.
                    <br/>
                    <strong>Goal:</strong> Unified net worth dashboard.
                 </p>
                 <div className="mt-4 flex items-center gap-2">
                    <div className="text-xs font-bold bg-emerald-500/10 text-emerald-300 px-2 py-1 rounded">Match: High</div>
                 </div>
              </div>
           </div>
        </div>

        {/* MOUSE CURSOR OVERLAY */}
        <div 
            className="absolute z-50 transition-all duration-700 ease-in-out pointer-events-none drop-shadow-2xl"
            style={{
                left: phase === 0 ? '50%' : phase === 1 ? '60%' : phase === 2 ? '50%' : '90%',
                top: phase === 0 ? '80%' : phase === 1 ? '40%' : phase === 2 ? '65%' : '90%',
                opacity: phase === 3 ? 0 : 1
            }}
        >
            <MousePointer2 
                className={`w-6 h-6 text-white fill-black ${phase === 2 ? 'scale-90 translate-y-1' : ''}`} 
            />
        </div>
      </div>
    </div>
  );
};
