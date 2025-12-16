
import { User } from '../types';

export type SubscriptionTier = 'hobby' | 'pro' | 'agency';

// Define the hierarchy: Higher number = more access
// NOTE: Hobby (Starter) and Pro have distinct feature sets.
const TIER_LEVELS: Record<SubscriptionTier, number> = {
  'hobby': 1,
  'pro': 2, // Pro has more features than Hobby
  'agency': 3
};

export const PROJECT_LIMITS: Record<SubscriptionTier, number> = {
  'hobby': 0, // Pay as you go, 0 included.
  'pro': 5,
  'agency': 25
};

export const OVERAGE_COSTS: Record<SubscriptionTier, number> = {
  'hobby': 9.80,
  'pro': 9.80,
  'agency': 7.80
};

export const permissionService = {
  /**
   * Checks if a user has sufficient privileges for a specific tier
   * Enforces strict paid-access logic.
   */
  hasAccess: (user: User | null, requiredTier: SubscriptionTier): boolean => {
    if (!user) return false;
    
    // Admin always has access (Master Key)
    if (user.role === 'admin') return true;

    // Check for Expired Status
    if (user.subscriptionStatus === 'expired') {
        return false;
    }

    const effectiveTier = user.subscription || 'hobby';
    const userLevel = TIER_LEVELS[effectiveTier];
    const requiredLevel = TIER_LEVELS[requiredTier];

    return userLevel >= requiredLevel;
  },

  /**
   * Returns the label for the button needed to upgrade
   */
  getUpgradeTarget: (currentTier: SubscriptionTier): 'pro' | 'agency' => {
    if (currentTier === 'hobby') return 'pro';
    return 'agency';
  },

  /**
   * Returns the project limit for a specific tier
   */
  getProjectLimit: (tier: SubscriptionTier): number => {
    return PROJECT_LIMITS[tier] || 0;
  },

  /**
   * Returns the cost for an additional project
   */
  getAdditionalProjectCost: (tier: SubscriptionTier): number => {
    return OVERAGE_COSTS[tier] || 9.80;
  },

  /**
   * Checks if the user is within their plan's included project count.
   * If false, the UI should prompt for payment.
   */
  isWithinProjectLimit: (user: User | null, currentCount: number): boolean => {
    if (!user) return false;
    if (user.role === 'admin') return true;

    // If subscription is expired, limit is effectively 0 or locked
    if (user.subscriptionStatus === 'expired') return false;

    const limit = PROJECT_LIMITS[user.subscription || 'hobby'];
    return currentCount < limit;
  },
  
  /**
   * Helper to check days remaining in trial (DEPRECATED/REMOVED functionality)
   * Keeping function signature to prevent breakage but always returning null.
   */
  getTrialDaysRemaining: (user: User): number | null => {
      return null;
  }
};
