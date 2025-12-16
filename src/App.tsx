
import React, { useState, useEffect, Suspense, lazy, ReactNode, ErrorInfo } from 'react';
import { AppStep, Project, User } from './types';
import { storageService } from './services/storageService';
import { authService } from './services/authService';
import { notify } from './services/notificationService';
import { StepSetup } from './components/StepSetup';
import { Dashboard } from './components/Dashboard';
import { Auth } from './components/Auth';
import { LandingPage } from './components/LandingPage';
import { SupportModal } from './components/SupportModal';
import { permissionService, SubscriptionTier } from './services/permissionService';
import { Layers, Target, Users, Magnet, UserPlus, Zap, LayoutTemplate, FileText, LogOut, Shield, Crown, Star, Megaphone, Lock, BookOpen, Clock, CheckSquare, Mail, Settings, HelpCircle, Save, WifiOff, Search, ArrowRight, Activity, Database } from 'lucide-react';
import { Logo } from './components/Logo';
import { ToastContainer } from './components/Toast';
import { Spinner } from './components/Shared';

const StepNiche = lazy(() => import('./components/StepNiche').then(module => ({ default: module.StepNiche })));
const StepPersona = lazy(() => import('./components/StepPersona').then(module => ({ default: module.StepPersona })));
const StepMagnets = lazy(() => import('./components/StepMagnets').then(module => ({ default: module.StepMagnets })));
const StepConversion = lazy(() => import('./components/StepConversion').then(module => ({ default: module.StepConversion })));
const StepCRM = lazy(() => import('./components/StepCRM').then(module => ({ default: module.StepCRM })));

const StepPricing = lazy(() => import('./components/StepPricing').then(module => ({ default: module.StepPricing })));
const StepLanding = lazy(() => import('./components/StepLanding').then(module => ({ default: module.StepLanding })));
const StepReport = lazy(() => import('./components/StepReport').then(module => ({ default: module.StepReport })));
const StepAds = lazy(() => import('./components/StepAds').then(module => ({ default: module.StepAds })));
const StepSEO = lazy(() => import('./components/StepSEO').then(module => ({ default: module.StepSEO })));
const StepEmail = lazy(() => import('./components/StepEmail').then(module => ({ default: module.StepEmail })));
const StepGuide = lazy(() => import('./components/StepGuide').then(module => ({ default: module.StepGuide })));
const StepSettings = lazy(() => import('./components/StepSettings').then(module => ({ default: module.StepSettings })));
const AdminDashboard = lazy(() => import('./components/AdminDashboard').then(module => ({ default: module.AdminDashboard })));

const IDLE_TIMEOUT_MS = 15 * 60 * 1000;

const PageLoader = () => (
  <div className="flex h-full items-center justify-center">
    <div className="text-center">
      <Spinner />
      <p className="text-slate-500 mt-4 text-sm">Loading Module...</p>
    </div>
  </div>
);

// Fallback component when data is missing for a step
const MissingPrereq = ({ title, message, action, actionLabel = "Go to Strategy" }: { title: string, message: string, action: () => void, actionLabel?: string }) => (
  <div className="flex flex-col items-center justify-center h-[60vh] text-center p-8 bg-slate-900/50 rounded-xl border border-slate-800 m-4 animate-fadeIn">
    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-6">
      <Target className="text-slate-500" size={32} />
    </div>
    <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
    <p className="text-slate-400 mb-8 max-w-md">{message}</p>
    <button onClick={action} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg font-bold transition-all flex items-center gap-2">
      {actionLabel} <ArrowRight size={18} />
    </button>
  </div>
);

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white p-8 text-center">
           <div className="max-w-md">
             <h1 className="text-2xl font-bold mb-4">Application Error</h1>
             <p className="text-slate-400 mb-6">Something went wrong in this section. Please try refreshing.</p>
             <button onClick={() => window.location.reload()} className="px-6 py-3 bg-indigo-600 rounded-lg font-bold">Reload App</button>
           </div>
        </div>
      );
    }
    return (this as any).props.children;
  }
}

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentStep, setCurrentStep] = useState<AppStep>(AppStep.DASHBOARD);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showAuth, setShowAuth] = useState(false); 
  
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // New Project Setup State
  const [draftName, setDraftName] = useState('');
  const [draftDesc, setDraftDesc] = useState('');
  const [draftClient, setDraftClient] = useState('');
  const [draftClientId, setDraftClientId] = useState('');
  const [draftUrl, setDraftUrl] = useState('');
  const [draftPrice, setDraftPrice] = useState(0);

  useEffect(() => {
    const handleOnline = () => { setIsOffline(false); notify.success("Back online"); };
    const handleOffline = () => { setIsOffline(true); notify.warning("You are offline. Changes may not save."); };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') {
      const plan = params.get('plan') as any;
      const updatedUser = authService.updateSubscription(plan || 'pro');
      if (updatedUser) {
        setUser(updatedUser);
        notify.success(`Welcome to ${plan || 'Pro'} Plan!`);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  useEffect(() => {
    const loadedUser = authService.getCurrentUser();
    setUser(loadedUser);
    if (loadedUser?.role === 'admin') setCurrentStep(AppStep.ADMIN);

    let idleTimer: any;
    const resetTimer = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        if (authService.getCurrentUser()) { 
          handleLogout();
          notify.info("Session expired.");
        }
      }, IDLE_TIMEOUT_MS);
    };
    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keypress', resetTimer);
    resetTimer();
    return () => { window.removeEventListener('mousemove', resetTimer); window.removeEventListener('keypress', resetTimer); clearTimeout(idleTimer); };
  }, []);

  useEffect(() => {
    if (user && currentStep === AppStep.ADMIN && user.role !== 'admin') setCurrentStep(AppStep.DASHBOARD);
  }, [currentStep, user]);

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    setCurrentProject(null);
    setCurrentStep(AppStep.DASHBOARD);
    setShowAuth(false);
  };

  const data = currentProject?.data || {
    productName: draftName,
    productDescription: draftDesc,
    productUrl: draftUrl,
    productPrice: draftPrice,
    selectedNiche: null,
    generatedNiches: [],
    persona: null,
    generatedMagnets: [],
    qualificationFramework: [],
    followUpSequence: [],
    landingPage: null,
    adCampaigns: [],
    connectedPlatforms: [],
    crmLeads: [],
    connectedCrms: [],
    seoKeywords: [],
    seoAuditResults: [],
    seoContentAnalysis: undefined,
    emailCampaigns: [],
    emailAutomations: [],
    emailSubscribers: [],
    emailSettings: undefined,
    salesObjections: [],
    salesColdDms: []
  };

  // Optimized Updater: Handles rapid updates without race conditions on the UI spinner
  const updateProject = async (updates: Partial<typeof data>) => {
    if (!currentProject) return;
    setIsSaving(true);
    try {
        const updated = await storageService.update(currentProject.id, updates);
        if (updated) {
            // Functional state update to ensure we don't overwrite concurrent changes in local state
            setCurrentProject(prev => prev ? { ...prev, data: { ...prev.data, ...updates } } : null);
        }
    } catch (e) {
        console.error("Save failed", e);
        notify.error("Failed to save changes");
    } finally {
        setIsSaving(false);
    }
  };

  const handleCreateProject = () => {
    setCurrentStep(AppStep.SETUP);
    setCurrentProject(null);
    setDraftName('');
    setDraftDesc('');
    setDraftClient('');
    setDraftClientId('');
    setDraftUrl('');
    setDraftPrice(0);
  };

  const handleSelectProject = (project: Project) => {
    setCurrentProject(project);
    setDraftName(project.data.productName);
    setDraftDesc(project.data.productDescription);
    setDraftClient(project.client || '');
    setDraftClientId(project.clientId || '');
    setDraftUrl(project.data.productUrl || '');
    setDraftPrice(project.data.productPrice || 0);
    
    if (project.data.persona) setCurrentStep(AppStep.CONVERSION);
    else if (project.data.selectedNiche) setCurrentStep(AppStep.PERSONA);
    else if (project.data.productName) setCurrentStep(AppStep.NICHE);
    else setCurrentStep(AppStep.SETUP);
  };

  const handleSetupComplete = async (name: string, desc: string, url: string, price: number) => {
    if (!currentProject) {
      try {
        let project = await storageService.create(name, desc, draftClient, draftClientId);
        if (project) {
             const updated = await storageService.update(project.id, { productUrl: url, productPrice: price });
             if (updated) project = updated;
        }
        setCurrentProject(project);
        notify.success("Project Created");
      } catch (e: any) {
        notify.error(e.message || "Failed to create project.");
        return;
      }
    } else {
      await updateProject({ productName: name, productDescription: desc, productUrl: url, productPrice: price });
      if (draftClient || draftClientId) {
        await storageService.update(currentProject.id, {}, draftClient, draftClientId);
      }
      notify.success("Project Updated");
    }
    setCurrentStep(AppStep.NICHE);
  };

  const cycleSubscription = () => {
    const tiers: ('hobby' | 'pro' | 'agency')[] = ['hobby', 'pro', 'agency'];
    const currentIndex = tiers.indexOf(user?.subscription || 'hobby');
    const nextTier = tiers[(currentIndex + 1) % tiers.length];
    
    let nextRole = user?.role || 'user';
    const updated = authService.updateSubscription(nextTier);
    if (updated) {
       updated.role = nextRole;
       authService.login(updated.email, 'password'); 
       setUser(updated);
       notify.info(`Switched to ${nextTier.toUpperCase()} Plan (Demo)`);
    }
  };

  if (!user) {
    if (!showAuth) {
      return <LandingPage onGetStarted={() => setShowAuth(true)} onLogin={() => setShowAuth(true)} />;
    }
    return (
      <>
        <ToastContainer />
        <Auth onLogin={() => {
           const u = authService.getCurrentUser();
           setUser(u);
           if (u?.role === 'admin') setCurrentStep(AppStep.ADMIN);
           notify.success(`Welcome back, ${u?.name}`);
        }} />
      </>
    );
  }

  const steps: { id: AppStep; label: string; icon: any; minTier?: SubscriptionTier }[] = [
    { id: AppStep.SETUP, label: 'Product', icon: Layers },
    { id: AppStep.NICHE, label: 'Niche', icon: Target },
    { id: AppStep.PERSONA, label: 'Persona', icon: Users },
    { id: AppStep.MAGNETS, label: 'Magnets', icon: Magnet },
    { id: AppStep.CONVERSION, label: 'Conversion Engine', icon: Activity, minTier: 'hobby' },
    { id: AppStep.CRM, label: 'CRM Pipeline', icon: Database, minTier: 'hobby' },
    { id: AppStep.ADS, label: 'Ad Engine', icon: Megaphone, minTier: 'hobby' },
    { id: AppStep.SEO, label: 'SEO Suite', icon: Search, minTier: 'hobby' },
    { id: AppStep.EMAIL, label: 'Email Marketing', icon: Mail, minTier: 'pro' },
    { id: AppStep.LANDING, label: 'Landing Page', icon: LayoutTemplate, minTier: 'hobby' },
    { id: AppStep.REPORT, label: 'Final Report', icon: FileText },
    { id: AppStep.GUIDE, label: 'Platform Guide', icon: BookOpen }, 
  ];

  const canAccessStep = (stepId: AppStep) => {
    if (stepId === AppStep.PRICING || stepId === AppStep.GUIDE || stepId === AppStep.SETTINGS) return true;
    if (stepId === AppStep.ADMIN) return user.role === 'admin'; 
    if (!currentProject && stepId !== AppStep.DASHBOARD && stepId !== AppStep.SETUP) return false;
    return true; 
  };

  if (currentStep === AppStep.ADMIN) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 font-sans">
        <ToastContainer />
        <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm fixed top-0 w-full z-20 flex items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="bg-red-500 p-1.5 rounded-lg text-white"><Shield size={20} /></div>
            <span className="font-bold text-xl text-white tracking-tight">meti <span className="text-red-500 text-xs uppercase ml-1">Controller</span></span>
          </div>
          <div className="flex items-center gap-4">
             <button onClick={() => setCurrentStep(AppStep.DASHBOARD)} className="text-sm text-slate-400 hover:text-white mr-4">Exit to App</button>
             <button onClick={handleLogout} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"><LogOut size={20} /></button>
          </div>
        </header>
        <div className="pt-20">
          <Suspense fallback={<PageLoader />}><AdminDashboard /></Suspense>
        </div>
      </div>
    );
  }

  const daysRemaining = user && permissionService.getTrialDaysRemaining(user);
  const isSetupLocked = !!currentProject && (!!currentProject.data.selectedNiche || !!currentProject.data.persona);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans flex overflow-hidden">
      <ToastContainer />
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex-shrink-0 flex flex-col fixed h-full z-10 md:relative hidden md:flex">
        <div className="p-6"><Logo size="md" customUrl={user.agencyLogoUrl} /></div>
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto custom-scrollbar">
          <button onClick={() => { setCurrentStep(AppStep.DASHBOARD); setCurrentProject(null); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all mb-6 ${currentStep === AppStep.DASHBOARD ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}>
            <LayoutTemplate size={18} /> Dashboard
          </button>
          {currentProject && (
            <>
              <div className="px-4 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 mt-2">Strategy</div>
              {steps.slice(0, 4).map(step => (
                <button key={step.id} onClick={() => canAccessStep(step.id) && setCurrentStep(step.id)} disabled={!canAccessStep(step.id)} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all ${currentStep === step.id ? 'bg-slate-800 text-white border border-slate-700' : 'text-slate-400 hover:bg-slate-800/50'} ${!canAccessStep(step.id) ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <step.icon size={18} className={currentStep === step.id ? 'text-indigo-400' : ''} /> {step.label}
                  {step.minTier && !permissionService.hasAccess(user, step.minTier) && <Lock size={12} className="ml-auto text-amber-500" />}
                </button>
              ))}
              <div className="px-4 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 mt-6">Execution</div>
              {steps.slice(4, 9).map(step => (
                <button key={step.id} onClick={() => canAccessStep(step.id) && setCurrentStep(step.id)} disabled={!canAccessStep(step.id)} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all ${currentStep === step.id ? 'bg-slate-800 text-white border border-slate-700' : 'text-slate-400 hover:bg-slate-800/50'} ${!canAccessStep(step.id) ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <step.icon size={18} className={currentStep === step.id ? 'text-indigo-400' : ''} /> {step.label}
                  {step.minTier && !permissionService.hasAccess(user, step.minTier) && <Lock size={12} className="ml-auto text-amber-500" />}
                </button>
              ))}
              <div className="px-4 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 mt-6">Export</div>
              {steps.slice(9, 11).map(step => (
                <button key={step.id} onClick={() => canAccessStep(step.id) && setCurrentStep(step.id)} disabled={!canAccessStep(step.id)} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all ${currentStep === step.id ? 'bg-slate-800 text-white border border-slate-700' : 'text-slate-400 hover:bg-slate-800/50'}`}>
                  <step.icon size={18} className={currentStep === step.id ? 'text-indigo-400' : ''} /> {step.label}
                </button>
              ))}
            </>
          )}
          <div className="mt-6 border-t border-slate-800 pt-4 space-y-1">
             <button onClick={() => setCurrentStep(AppStep.GUIDE)} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all ${currentStep === AppStep.GUIDE ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800/50'}`}><BookOpen size={18} /> Platform Guide</button>
             <button onClick={() => setCurrentStep(AppStep.SETTINGS)} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all ${currentStep === AppStep.SETTINGS ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800/50'}`}><Settings size={18} /> Settings</button>
             <button onClick={() => setIsSupportOpen(true)} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all text-slate-400 hover:bg-slate-800/50 hover:text-white"><HelpCircle size={18} /> Help & Support</button>
          </div>
           {user.role === 'admin' && <div className="mt-2"><button onClick={() => setCurrentStep(AppStep.ADMIN)} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all text-red-400 hover:bg-red-500/10"><Shield size={18} /> Platform Admin</button></div>}
        </nav>
        <div className="p-4 border-t border-slate-800">
           {daysRemaining !== null && daysRemaining <= 2 && <div className="mb-2 text-xs text-center bg-indigo-900/30 border border-indigo-500/20 rounded p-1.5 text-indigo-300 flex items-center justify-center gap-1"><Clock size={10} /> {daysRemaining} days left</div>}
           <button onClick={() => setCurrentStep(AppStep.PRICING)} className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 p-3 rounded-lg flex items-center gap-3 transition-colors mb-2">
              <div className="bg-indigo-500/20 p-1.5 rounded text-indigo-400"><Zap size={16} /></div>
              <div className="text-left"><div className="text-xs font-bold uppercase">Current Plan</div><div className="text-sm text-white font-medium capitalize flex items-center gap-1">{user.subscription}</div></div>
           </button>
           <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 text-slate-500 hover:text-slate-300 text-xs py-2"><LogOut size={14} /> Sign Out</button>
        </div>
      </aside>
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm flex items-center justify-between px-6 md:px-8 z-20 flex-shrink-0">
           <div className="flex items-center gap-4">
              {currentProject && <div className="flex items-center gap-2 text-sm text-slate-400"><span className="hidden md:inline">Project:</span><span className="text-white font-medium bg-slate-800 px-3 py-1 rounded-full border border-slate-700 flex items-center gap-2">{currentProject.name} {isSaving ? <span className="text-[10px] text-slate-500 animate-pulse">Saving...</span> : <Save size={12} className="text-emerald-500" />}</span></div>}
              {isOffline && <div className="flex items-center gap-2 text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20"><WifiOff size={12} /> OFFLINE</div>}
           </div>
           <div className="flex items-center gap-4">
              {user.role !== 'admin' && <button onClick={cycleSubscription} className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all flex items-center gap-2 ${user.subscription === 'agency' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : user.subscription === 'pro' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>{user.subscription === 'agency' && <Crown size={12} />}{user.subscription === 'pro' && <Zap size={12} />}{user.subscription === 'hobby' && <Star size={12} />}{user.subscription.toUpperCase()}</button>}
              <button onClick={() => { const newRole = user.role === 'admin' ? 'user' : 'admin'; const updated = { ...user, role: newRole as 'user' | 'admin' }; localStorage.setItem('meti_user_session', JSON.stringify(updated)); setUser(updated); if (newRole === 'admin') setCurrentStep(AppStep.ADMIN); else setCurrentStep(AppStep.DASHBOARD); notify.info(`Switched to ${newRole.toUpperCase()} View`); }} className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all flex items-center gap-2 ${user.role === 'admin' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-slate-800 text-slate-500 border-slate-700 opacity-50'}`}><Shield size={12} />{user.role === 'admin' ? 'ADMIN' : 'USER'}</button>
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 border-2 border-slate-800 shadow-lg cursor-pointer hover:scale-105 transition-transform" onClick={() => setCurrentStep(AppStep.SETTINGS)}></div>
           </div>
        </header>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8 pb-32">
           <ErrorBoundary>
             <Suspense fallback={<PageLoader />}>
               {currentStep === AppStep.DASHBOARD && <Dashboard onSelectProject={handleSelectProject} onCreateNew={handleCreateProject} onOpenAdmin={() => setCurrentStep(AppStep.ADMIN)} onUpgrade={() => setCurrentStep(AppStep.PRICING)} />}
               {currentStep === AppStep.SETUP && <StepSetup productName={draftName} productDescription={draftDesc} clientName={draftClient} clientId={draftClientId} productUrl={draftUrl} productPrice={draftPrice} setProductName={setDraftName} setProductDescription={setDraftDesc} setClientName={setDraftClient} setClientId={setDraftClientId} setProductUrl={setDraftUrl} setProductPrice={setDraftPrice} onNext={() => handleSetupComplete(draftName, draftDesc, draftUrl, draftPrice)} isLocked={isSetupLocked} />}
               {currentStep === AppStep.GUIDE && <StepGuide />}
               {currentStep === AppStep.SETTINGS && <StepSettings user={user} onUserUpdate={setUser} />}
               {currentProject && (
                 <>
                   {currentStep === AppStep.NICHE && <StepNiche productName={data.productName} productDescription={data.productDescription} onSelect={(niche) => { updateProject({ selectedNiche: niche }); setCurrentStep(AppStep.PERSONA); }} selectedNiche={data.selectedNiche} />}
                   
                   {currentStep === AppStep.PERSONA && (
                     data.selectedNiche ? 
                     <StepPersona productName={data.productName} niche={data.selectedNiche} onPersonaGenerated={(persona) => { updateProject({ persona }); }} existingPersona={data.persona} /> :
                     <MissingPrereq title="Strategy Incomplete" message="Please select a target Niche before defining a Persona." action={() => setCurrentStep(AppStep.NICHE)} actionLabel="Select Niche" />
                   )}

                   {currentStep === AppStep.MAGNETS && (
                     (data.selectedNiche && data.persona) ?
                     <StepMagnets productName={data.productName} nicheName={data.selectedNiche.name} persona={data.persona} onUpdateMagnets={(magnets) => updateProject({ generatedMagnets: magnets })} magnets={data.generatedMagnets} connectedPlatforms={data.connectedPlatforms || []} /> :
                     <MissingPrereq title="Prerequisites Missing" message="You need to select a Niche and generate a Persona first." action={() => setCurrentStep(data.selectedNiche ? AppStep.PERSONA : AppStep.NICHE)} />
                   )}

                   {currentStep === AppStep.CONVERSION && (
                     (data.selectedNiche && data.persona) ?
                     <StepConversion 
                        data={data}
                        onUpdate={updateProject}
                        user={user}
                        onUpgrade={() => setCurrentStep(AppStep.PRICING)}
                     /> :
                     <MissingPrereq title="Access Denied" message="Define your Target Audience (Niche & Persona) to enable the Conversion Engine." action={() => setCurrentStep(data.selectedNiche ? AppStep.PERSONA : AppStep.NICHE)} />
                   )}

                   {currentStep === AppStep.CRM && (
                     <StepCRM 
                        data={data}
                        onUpdateLeads={(leads) => updateProject({ crmLeads: leads })}
                        onUpdateConnections={(crms) => updateProject({ connectedCrms: crms })}
                     />
                   )}

                   {currentStep === AppStep.ADS && (
                     (data.selectedNiche && data.persona) ?
                     <StepAds productName={data.productName} niche={data.selectedNiche} persona={data.persona} ads={data.adCampaigns || []} onUpdateAds={(ads) => updateProject({ adCampaigns: ads })} connectedPlatforms={data.connectedPlatforms || []} onUpdateConnectedPlatforms={(platforms) => updateProject({ connectedPlatforms: platforms })} productUrl={data.productUrl} productPrice={data.productPrice} user={user} onUpgrade={() => setCurrentStep(AppStep.PRICING)} /> :
                     <MissingPrereq title="Ad Engine Locked" message="Define your audience to generate targeted ad campaigns." action={() => setCurrentStep(data.selectedNiche ? AppStep.PERSONA : AppStep.NICHE)} />
                   )}

                   {currentStep === AppStep.SEO && (
                     (data.selectedNiche && data.persona) ?
                     <StepSEO productName={data.productName} niche={data.selectedNiche} persona={data.persona} productUrl={data.productUrl} seoKeywords={data.seoKeywords || []} seoAuditResults={data.seoAuditResults || []} seoContentAnalysis={data.seoContentAnalysis} onUpdate={(updates) => updateProject(updates)} user={user} /> :
                     <MissingPrereq title="SEO Suite Locked" message="Target keywords depend on your Niche and Persona." action={() => setCurrentStep(data.selectedNiche ? AppStep.PERSONA : AppStep.NICHE)} />
                   )}

                   {/* Email Marketing Step */}
                   {currentStep === AppStep.EMAIL && (
                     (data.persona) ?
                     <StepEmail 
                        productName={data.productName}
                        persona={data.persona}
                        campaigns={data.emailCampaigns || []}
                        automations={data.emailAutomations || []}
                        subscribers={data.emailSubscribers || []}
                        settings={data.emailSettings}
                        crmLeads={data.crmLeads || []}
                        onUpdateCampaigns={(c) => updateProject({ emailCampaigns: c })}
                        onUpdateAutomations={(a) => updateProject({ emailAutomations: a })}
                        onUpdateSubscribers={(s) => updateProject({ emailSubscribers: s })}
                        onUpdateSettings={(s) => updateProject({ emailSettings: s })}
                        user={user}
                        onUpgrade={() => setCurrentStep(AppStep.PRICING)}
                     /> :
                     <MissingPrereq title="Email Engine Locked" message="We need a Persona to write effective email copy." action={() => setCurrentStep(data.selectedNiche ? AppStep.PERSONA : AppStep.NICHE)} />
                   )}

                   {currentStep === AppStep.LANDING && (
                     (data.selectedNiche && data.persona) ?
                     <StepLanding productName={data.productName} niche={data.selectedNiche} persona={data.persona} landingPage={data.landingPage} onUpdate={(lp) => updateProject({ landingPage: lp })} user={user} onUpgrade={() => setCurrentStep(AppStep.PRICING)} /> :
                     <MissingPrereq title="Builder Locked" message="Landing pages require a Niche and Persona context." action={() => setCurrentStep(data.selectedNiche ? AppStep.PERSONA : AppStep.NICHE)} />
                   )}

                   {currentStep === AppStep.REPORT && <StepReport data={data} />}
                 </>
               )}
               {currentStep === AppStep.PRICING && <StepPricing />}
             </Suspense>
           </ErrorBoundary>
        </div>
      </main>
      {isSupportOpen && <SupportModal isOpen={isSupportOpen} onClose={() => setIsSupportOpen(false)} user={user} />}
    </div>
  );
};

export default App;
