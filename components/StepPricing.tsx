
import React, { useState } from 'react';
import { Button, Card } from './Shared';
import { Check, X, Star, Zap, Crown, Loader, CreditCard, PlusCircle } from 'lucide-react';
import { notify } from '../services/notificationService';
import { getApiUrl, authService } from '../services/authService';

export const StepPricing: React.FC = () => {
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);

  const handleSubscribe = async (planName: string) => {
    setProcessingPlan(planName);
    
    try {
      const BASE_URL = getApiUrl();
      const API_URL = `${BASE_URL}/api/create-checkout-session`;
      
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            ...authService.getAuthHeader()
        },
        body: JSON.stringify({ planName }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Payment initialization failed');
      }

      const { url } = await response.json();
      
      if (url) {
        window.location.href = url;
      } else {
        throw new Error("No payment URL returned");
      }
    } catch (error: any) {
      notify.error(error.message || "Payment Gateway Error");
      setProcessingPlan(null);
    }
  };

  const plans = [
    {
      name: 'Starter', 
      price: '₦0',
      period: '/ month',
      description: 'Pay-as-you-go. No monthly commitment.',
      features: ['Pay Per Project Session', 'AI Persona & Niche Analysis', 'Basic Lead Magnets', 'Ad Engine (Lite)', 'Sales Simulator'],
      extraInfo: 'Single Session: ₦14,700',
      notIncluded: ['Advanced SEO Suite', 'Lead Scout (Real-time Maps)', 'Agency Features', 'Team Collaboration'],
      cta: 'Current Plan',
      variant: 'outline' as const,
      icon: Star,
      disabled: true
    },
    {
      name: 'Pro',
      price: '₦44,700',
      period: '/ month',
      popular: true,
      description: 'For power users launching multiple campaigns monthly.',
      features: ['5 Projects Included', 'Full SEO Suite (Audits, Keywords)', 'Real-time Google Maps Leads', 'Live Content Optimization', 'Multi-Channel Ad Engine', 'Landing Page Generator'],
      extraInfo: 'Additional projects: ₦14,700 / each',
      notIncluded: ['White-label Reports', 'Client Management CRM', 'Team Collaboration'],
      cta: 'Get Pro Access',
      variant: 'primary' as const,
      icon: Zap,
      action: () => handleSubscribe('Pro')
    },
    {
      name: 'Agency',
      price: '₦298,350',
      period: '/ month',
      description: 'The ultimate OS for scaling agencies managing multiple clients.',
      features: ['25 Projects Included', 'Client Management Dashboard', 'White-label SEO & Strategy Reports', 'CMS Integrations', '5 Team Member Seats Included', 'Developer API Access'],
      extraInfo: 'Additional projects: ₦11,000 / each',
      notIncluded: [],
      cta: 'Get Agency Access',
      variant: 'secondary' as const,
      icon: Crown,
      action: () => handleSubscribe('Agency')
    }
  ];

  return (
    <div className="max-w-6xl mx-auto animate-fadeIn">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h2 className="text-3xl font-bold text-white mb-4">Choose Your Growth Engine</h2>
        <p className="text-slate-400 text-lg">Flexible pricing. Secure payments via Paystack.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
        {plans.map((plan, idx) => (
          <div key={idx} className={`relative flex flex-col ${plan.popular ? 'z-10 md:-mt-4 md:mb-4' : ''}`}>
            {plan.popular && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg uppercase tracking-wide">
                Most Popular
              </div>
            )}
            
            <Card className={`h-full flex flex-col p-8 ${plan.popular ? 'border-indigo-500 ring-1 ring-indigo-500/50 bg-slate-800' : 'bg-slate-800/50'}`}>
              <div className="mb-6">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${plan.popular ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-300'}`}>
                  <plan.icon size={24} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-4xl font-bold text-white">{plan.price}</span>
                  <span className="text-slate-500 text-sm">{plan.period}</span>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed">{plan.description}</p>
              </div>

              <div className="flex-1 space-y-4 mb-8">
                {plan.extraInfo && (
                   <div className="flex items-center gap-2 bg-indigo-900/20 border border-indigo-500/30 p-2 rounded-lg text-sm text-indigo-300 font-medium mb-4">
                     <PlusCircle size={16} className="flex-shrink-0" />
                     <span>{plan.extraInfo}</span>
                   </div>
                )}
                {plan.features.map((feature, fIdx) => (
                  <div key={fIdx} className="flex items-start gap-3 text-sm text-slate-300">
                    <Check size={16} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <Button 
                variant={plan.variant} 
                className={`w-full ${plan.popular ? 'shadow-indigo-500/25' : ''}`}
                onClick={plan.action}
                disabled={plan.disabled || processingPlan !== null}
              >
                {processingPlan === plan.name ? <><Loader className="animate-spin mr-2" size={16} /> Processing...</> : plan.cta}
              </Button>
              
              <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-slate-500">
                 <div className="flex items-center gap-1"><CreditCard size={10} /> Secured by Paystack</div>
              </div>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
};
