
import React from 'react';
import { User } from '../types';
import { permissionService, SubscriptionTier } from '../services/permissionService';
import { PremiumLock } from './Shared';

interface FeatureGuardProps {
  user: User;
  requiredTier: SubscriptionTier;
  featureName: string;
  children: React.ReactNode;
  onUpgrade: () => void;
}

export const FeatureGuard: React.FC<FeatureGuardProps> = ({ 
  user, 
  requiredTier, 
  featureName, 
  children, 
  onUpgrade 
}) => {
  const hasAccess = permissionService.hasAccess(user, requiredTier);

  if (hasAccess) {
    return <>{children}</>;
  }

  return (
    <div className="relative min-h-[600px] w-full bg-slate-900/20 rounded-xl overflow-hidden border border-slate-800/50">
      {/* Blurry Background Preview (Optional visual effect) */}
      <div className="absolute inset-0 filter blur-sm opacity-20 pointer-events-none select-none">
        {children}
      </div>
      
      {/* The Lock Overlay */}
      <PremiumLock onUpgrade={onUpgrade} featureName={featureName} />
    </div>
  );
};
