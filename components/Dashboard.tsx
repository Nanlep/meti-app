
import React, { useState, useEffect } from 'react';
import { Project, User } from '../types';
import { storageService } from '../services/storageService';
import { authService } from '../services/authService';
import { Button, Card, Modal, Spinner } from './Shared';
import { Plus, FolderOpen, Clock, Trash2, ArrowRight, LayoutGrid, Shield, Users, Terminal, Briefcase, Crown, Phone, Mail, Building2, Zap, AlertCircle, Lock, CreditCard, Loader } from 'lucide-react';
import { SecurityModal } from './SecurityModal';
import { TeamModal } from './TeamModal';
import { DeveloperPortal } from './DeveloperPortal';
import { permissionService } from '../services/permissionService';
import { notify } from '../services/notificationService';
import useCheckout from 'bani-react';

interface DashboardProps {
  onSelectProject: (project: Project) => void;
  onCreateNew: () => void;
  onOpenAdmin: () => void;
  onUpgrade?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onSelectProject, onCreateNew, onOpenAdmin, onUpgrade }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [isSecurityOpen, setIsSecurityOpen] = useState(false);
  const [isDevPortalOpen, setIsDevPortalOpen] = useState(false);
  const [teamModalProject, setTeamModalProject] = useState<Project | null>(null);
  
  // Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  
  const [user, setUser] = useState<User | null>(authService.getCurrentUser());
  const { BaniPopUp } = useCheckout();
  
  const isAgency = user?.subscription === 'agency';
  const hasApiAccess = permissionService.hasAccess(user, 'agency');

  useEffect(() => {
    loadProjects();
    const updatedUser = authService.refreshSession();
    if (updatedUser) setUser(updatedUser);
  }, []);

  const loadProjects = async () => {
    setLoadingProjects(true);
    try {
      const data = await storageService.getAll();
      // Ensure date sorting is robust
      setProjects(data.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
    } catch (e) {
      console.error("Failed to load projects", e);
    } finally {
      setLoadingProjects(false);
    }
  };

  const refreshProjects = () => {
    loadProjects();
    if (teamModalProject) {
      storageService.getById(teamModalProject.id).then(updated => {
          if (updated) setTeamModalProject(updated);
      });
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this project?')) {
      await storageService.delete(id);
      refreshProjects();
    }
  };

  const handleTeamClick = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    setTeamModalProject(project);
  };

  const handleCreateClick = () => {
    const ownedProjects = projects.filter(p => p.userId === user?.id).length;
    const isWithinLimit = permissionService.isWithinProjectLimit(user, ownedProjects);
    
    if (isWithinLimit) {
      onCreateNew();
    } else {
      setShowPaymentModal(true);
    }
  };

  const confirmPaymentAndCreate = async () => {
      setProcessingPayment(true);
      
      const additionalCost = permissionService.getAdditionalProjectCost(user?.subscription || 'hobby');
      const reference = `METI_${user?.id}_project_${Date.now()}`;
      
      const customerEmail = user?.email || "";
      const nameParts = (user?.name || "User").split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || "User";

      try {
        BaniPopUp({
            amount: additionalCost.toString(),
            phoneNumber: "08021234567",
            email: customerEmail,
            firstName: firstName,
            lastName: lastName,
            merchantKey: import.meta.env.VITE_BANI_PUBLIC_KEY || "pub_test_placeholder",
            metadata: {
                custom_ref: reference,
                order_ref: reference,
                type: 'one_time_project'
            },
            onClose: (response: any) => {
                setProcessingPayment(false);
                notify.info("Payment cancelled.");
            },
            callback: (response: any) => {
                notify.success("Payment Successful! Creating project...");
                setProcessingPayment(false);
                setShowPaymentModal(false);
                onCreateNew();
            }
        } as any);
      } catch (e) {
          console.error("Payment init failed", e);
          notify.error("Could not initialize payment.");
          setProcessingPayment(false);
      }
  };

  const ownedCount = projects.filter(p => p.userId === user?.id).length;
  // Pass user to getProjectLimit so it can return Infinity for test accounts
  const projectLimit = permissionService.getProjectLimit(user?.subscription || 'hobby', user);
  
  // Explicitly check for isTestAccount to override limit display logic
  const isLimitReached = ownedCount >= projectLimit && user?.role !== 'admin' && !user?.isTestAccount;
  const additionalCost = permissionService.getAdditionalProjectCost(user?.subscription || 'hobby');

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-12 animate-fadeIn">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8">
        <div>
           <div className="flex items-center gap-3 mb-2">
             <h1 className="text-3xl font-bold text-white">
               {isAgency ? 'Agency Dashboard' : 'Projects'}
             </h1>
             {isAgency ? (
               <div className="bg-gradient-to-r from-amber-500/20 to-indigo-500/20 border border-amber-500/40 text-amber-400 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                 <Crown size={12} /> AGENCY OWNER
               </div>
             ) : (
                <div className={`text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border ${isLimitReached ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-slate-700 text-slate-300 border-slate-600'}`}>
                  {isLimitReached ? <Zap size={12} /> : <LayoutGrid size={12} />}
                  {ownedCount} / {projectLimit === Infinity ? '∞' : projectLimit} Included
                </div>
             )}
           </div>
           <p className="text-slate-400">Manage your marketing strategies and campaigns.</p>
        </div>
        <div className="flex flex-wrap gap-3 mt-4 md:mt-0">
          <Button 
            variant="outline" 
            onClick={() => hasApiAccess ? setIsDevPortalOpen(true) : onUpgrade?.()}
          >
            {hasApiAccess ? <Terminal size={18} className="mr-2" /> : <Lock size={16} className="mr-2 text-amber-500" />} 
            API Access
          </Button>
          <Button variant="secondary" onClick={() => setIsSecurityOpen(true)}>
            <Shield size={18} className="mr-2 text-emerald-400" /> Security
          </Button>
          <Button onClick={handleCreateClick} className={isLimitReached ? "bg-indigo-600 hover:bg-indigo-700" : ""}>
             {isLimitReached ? <CreditCard size={18} className="mr-2" /> : <Plus size={18} className="mr-2" />}
             {isLimitReached ? `New Project` : 'New Project'}
          </Button>
        </div>
      </div>
      
      {!loadingProjects && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <ProjectCard 
              key={project.id} 
              project={project} 
              user={user} 
              onSelect={onSelectProject} 
              onTeamClick={handleTeamClick} 
              onDelete={handleDelete} 
            />
          ))}
          {projects.length === 0 && (
              <div className="col-span-full text-center py-20 bg-slate-900/30 border border-dashed border-slate-700 rounded-2xl">
                  <FolderOpen size={48} className="mx-auto text-slate-600 mb-4" />
                  <h3 className="text-white font-medium mb-1">No projects yet</h3>
                  <p className="text-slate-400 text-sm mb-6">Create your first strategy to get started.</p>
                  <Button onClick={handleCreateClick}>Create Project</Button>
              </div>
          )}
        </div>
      )}

      {/* Payment Modal */}
      <Modal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)} title="Add Extra Project">
         <div className="space-y-6">
            <div className="bg-indigo-900/20 border border-indigo-500/20 p-4 rounded-lg flex gap-3">
               <CreditCard size={20} className="text-indigo-400" />
               <div>
                  <h4 className="text-white font-bold text-sm">Plan Limit Reached</h4>
                  <p className="text-xs text-slate-400 mt-1">
                     You have used all included projects for your <strong>{user?.subscription === 'hobby' ? 'STARTER' : user?.subscription.toUpperCase()}</strong> plan.
                  </p>
               </div>
            </div>
            <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 flex justify-between items-center">
               <span className="text-slate-300">One-time Project Fee</span>
               <span className="text-xl font-bold text-white">₦{additionalCost.toLocaleString()}</span>
            </div>
            <Button onClick={confirmPaymentAndCreate} disabled={processingPayment} className="w-full py-3">
                {processingPayment ? <Loader className="animate-spin mr-2" /> : `Pay ₦${additionalCost.toLocaleString()} & Create`}
            </Button>
         </div>
      </Modal>

      {user && <SecurityModal isOpen={isSecurityOpen} onClose={() => setIsSecurityOpen(false)} user={user} />}
      {user && <DeveloperPortal isOpen={isDevPortalOpen} onClose={() => setIsDevPortalOpen(false)} user={user} />}
      
      {user && teamModalProject && (
        <TeamModal 
          isOpen={!!teamModalProject} 
          onClose={() => setTeamModalProject(null)} 
          project={teamModalProject} 
          currentUser={user}
          onUpdate={refreshProjects}
        />
      )}
    </div>
  );
};

const ProjectCard: React.FC<{
  project: Project;
  user: any;
  onSelect: (p: Project) => void;
  onTeamClick: (e: React.MouseEvent, p: Project) => void;
  onDelete: (e: React.MouseEvent, id: string) => void;
}> = ({ project, user, onSelect, onTeamClick, onDelete }) => {
  const isOwner = user && project.userId === user.id;
  
  // Use createdAt as fallback if updatedAt is missing or invalid
  const dateToDisplay = project.updatedAt || project.createdAt || Date.now();

  return (
    <Card 
      className="group cursor-pointer hover:border-indigo-500/50 transition-all relative flex flex-col h-full"
      onClick={() => onSelect(project)}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
          <FolderOpen size={20} />
        </div>
        <div className="flex items-center gap-1">
            <button onClick={(e) => onTeamClick(e, project)} className="text-slate-600 hover:text-indigo-400 p-2">
              <Users size={16} />
            </button>
            {isOwner && (
              <button onClick={(e) => onDelete(e, project.id)} className="text-slate-600 hover:text-red-400 p-2">
                <Trash2 size={16} />
              </button>
            )}
        </div>
      </div>
      <h3 className="text-lg font-bold text-white mb-2 truncate">{project.name}</h3>
      <p className="text-sm text-slate-400 mb-6 line-clamp-2 flex-1">
        {project.data.productDescription || "No description provided."}
      </p>
      <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-700/50 pt-4 mt-auto">
        <div className="flex items-center gap-1">
          <Clock size={12} /> {new Date(dateToDisplay).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
          {!isOwner && <span className="ml-2 bg-slate-700 px-1.5 py-0.5 rounded text-[10px] text-white">SHARED</span>}
        </div>
        <div className="flex items-center gap-1 text-indigo-400 font-medium group-hover:translate-x-1 transition-transform">
          Open <ArrowRight size={12} />
        </div>
      </div>
    </Card>
  );
};
