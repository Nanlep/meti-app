
import React from 'react';
import { X, Lock, Zap } from 'lucide-react';

export const Spinner: React.FC = () => (
  <div className="flex justify-center items-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
  </div>
);

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading, 
  className = '', 
  ...props 
}) => {
  const baseStyles = "px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 border border-transparent",
    secondary: "bg-slate-700 hover:bg-slate-600 text-white border border-slate-600",
    outline: "bg-transparent border border-slate-600 text-slate-300 hover:border-indigo-400 hover:text-indigo-400"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? <Spinner /> : children}
    </button>
  );
};

export const Card: React.FC<{ children: React.ReactNode; className?: string; onClick?: () => void; selected?: boolean }> = ({ 
  children, 
  className = '', 
  onClick,
  selected = false
}) => {
  return (
    <div 
      onClick={onClick}
      className={`
        bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border transition-all duration-300
        ${onClick ? 'cursor-pointer hover:bg-slate-800' : ''}
        ${selected ? 'border-indigo-500 ring-1 ring-indigo-500/50 shadow-lg shadow-indigo-500/10' : 'border-slate-700 hover:border-slate-600'}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export const SectionTitle: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => (
  <div className="mb-8">
    <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
    {subtitle && <p className="text-slate-400">{subtitle}</p>}
  </div>
);

export const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl">
        <div className="flex justify-between items-center p-6 border-b border-slate-800">
          <h3 className="text-xl font-bold text-white">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};

export const PremiumLock: React.FC<{ onUpgrade: () => void, featureName: string }> = ({ onUpgrade, featureName }) => (
  <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-900/60 backdrop-blur-md rounded-xl">
    <div className="text-center p-8 bg-slate-900 border border-indigo-500/50 rounded-2xl shadow-2xl max-w-sm mx-auto transform scale-100 hover:scale-105 transition-transform">
      <div className="w-16 h-16 bg-indigo-500 rounded-full flex items-center justify-center mx-auto mb-6 text-white shadow-lg shadow-indigo-500/40">
        <Lock size={32} />
      </div>
      <h3 className="text-2xl font-bold text-white mb-2">{featureName}</h3>
      <p className="text-slate-400 mb-6">
        Upgrade to the <strong>Growth Plan</strong> to unlock this feature and 10x your marketing results.
      </p>
      <Button onClick={onUpgrade} className="w-full py-3 text-lg group">
        <Zap className="mr-2 group-hover:text-yellow-300 transition-colors" size={20} /> Upgrade Now
      </Button>
    </div>
  </div>
);
