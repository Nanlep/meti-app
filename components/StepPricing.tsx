
import React, { useState } from 'react';
import { Button, Card } from './Shared';
import { Check, Zap, Crown, Loader, CreditCard, PlusCircle, Star, Globe } from 'lucide-react';
import { notify } from '../services/notificationService';
import { authService } from '../services/authService';
import useCheckout from 'bani-react';
import { User } from '../types';

type Currency = 'NGN' | 'USD';

interface StepPricingProps {
  user?: User;
}

export const StepPricing: React.FC<StepPricingProps> = ({ user }) => {
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [currency, setCurrency] = useState<Currency>('NGN');
  const { BaniPopUp } = useCheckout();

  const customerEmail = user?.email || "";
  const customerName = user?.name || "";
  
  const nameParts = customerName.split(' ');
  const firstName = nameParts[0] || "Valued";
  const lastName = nameParts.slice(1).join(' ') || "Customer";

  const handleSubscribe = (planName: string, amountNGN: string, amountUSD: string) => {
    setProcessingPlan(planName);
    
    // Determine payment amount based on selected currency
    // NOTE: For this implementation, we pass the appropriate string value. 
    // If Bani only supports NGN natively, this would need conversion logic, but assuming multi-currency support or strictly display toggle per request.
    const payAmount = currency === 'NGN' ? amountNGN : amountUSD; 
    
    const reference = `METI_${user?.id || 'GUEST'}_${planName.toLowerCase()}_${Date.now()}`;

    try {
      BaniPopUp({
        amount: payAmount,
        phoneNumber: "08021234567",
        email: customerEmail,
        firstName: firstName,
        lastName: lastName,
        merchantKey: import.meta.env.VITE_BANI_PUBLIC_KEY || "pub_test_placeholder",
        metadata: { 
            custom_ref: reference, 
            order_ref: reference,
            currency: currency // Pass currency info in metadata
        },
        onClose: handleOnClose,
        callback: (response: any) => handleOnSuccess(response, planName, reference)
      } as any);
    } catch (e: any) {
        console.error("Bani Widget Error", e);
        notify.error("Failed to load payment widget. Please check configuration.");
        setProcessingPlan(null);
    }
  };

  const handleOnClose = (response: any) => {
      setProcessingPlan(null);
      notify.info("Payment window closed.");
  };

  const handleOnSuccess = (response: any, planName: string, reference: string) => {
      // Optimistic Update
      const planKey = planName.toLowerCase() === 'agency' ? 'agency' : 'pro';
      const updatedUser = authService.updateSubscription(planKey as any);
      notify.success(`Payment Successful! upgrading to ${planName}...`);
      setProcessingPlan(null);
      setTimeout(() => {
          window.location.reload(); 
      }, 2000);
  };

  const plans = [
    {
      name: 'Starter', 
      price: currency === 'NGN' ? '₦0' : '$0',
      period: '/ month',
      description: 'Pay-as-you-go. No monthly commitment.',
      features: ['Pay Per Project Session', 'AI Persona & Niche Analysis', 'Basic Lead Magnets', 'Ad Engine (Lite)', 'Sales Simulator'],
      extraInfo: currency === 'NGN' ? 'Single Session: ₦14,700' : 'Single Session: $9.80',
      cta: 'Current Plan',
      variant: 'outline' as const,
      icon: Star,
      disabled: true
    },
    {
      name: 'Pro',
      price: currency === 'NGN' ? '₦44,700' : '$29.80',
      period: '/ month',
      popular: true,
      description: 'For power users launching multiple campaigns monthly.',
      features: ['5 Projects Included', 'Full SEO Suite (Audits, Keywords)', 'Real-time Google Maps Leads', 'Live Content Optimization', 'Multi-Channel Ad Engine', 'Landing Page Generator'],
      extraInfo: currency === 'NGN' ? 'Additional projects: ₦14,700 / each' : 'Additional projects: $9.80 / each',
      cta: 'Get Pro Access',
      variant: 'primary' as const,
      icon: Zap,
      action: () => handleSubscribe('Pro', "44700", "29.80")
    },
    {
      name: 'Agency',
      price: currency === 'NGN' ? '₦298,350' : '$198.90',
      period: '/ month',
      description: 'The ultimate OS for scaling agencies managing multiple clients.',
      features: ['25 Projects Included', 'Client Management Dashboard', 'White-label SEO & Strategy Reports', 'CMS Integrations', '5 Team Member Seats Included', 'Developer API Access'],
      extraInfo: currency === 'NGN' ? 'Additional projects: ₦11,000 / each' : 'Additional projects: $7.30 / each',
      cta: 'Get Agency Access',
      variant: 'secondary' as const,
      icon: Crown,
      action: () => handleSubscribe('Agency', "298350", "198.90")
    }
  ];

  return (
    <div className="max-w-7xl mx-auto animate-fadeIn pb-20">
      <div className="flex flex-col items-center mb-16 relative">
        <h2 className="text-3xl font-bold text-white mb-6">Choose Your Growth Engine</h2>
        <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700 mb-6">
            <button 
                onClick={() => setCurrency('NGN')} 
                className={`px-4 py-2 rounded text-sm font-bold transition-all ${currency === 'NGN' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
                NGN
            </button>
            <button 
                onClick={() => setCurrency('USD')} 
                className={`px-4 py-2 rounded text-sm font-bold transition-all ${currency === 'USD' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
                USD
            </button>
        </div>
        <p className="text-slate-400">Secure payments processed via Bani Africa.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative items-start">
        {plans.map((plan, idx) => (
          <div key={idx} className={`relative flex flex-col h-full ${plan.popular ? 'z-10' : ''}`}>
            <Card className={`h-full flex flex-col p-8 bg-slate-900/40 border-slate-800 ${plan.popular ? 'border-indigo-500/50 ring-1 ring-indigo-500/20' : ''}`}>
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-white mb-4">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-5xl font-extrabold text-white tracking-tight">{plan.price}</span>
                  <span className="text-slate-500 text-sm font-medium">{plan.period}</span>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed mb-6 h-10">{plan.description}</p>
                
                {plan.extraInfo && (
                   <div className="flex items-center gap-3 bg-indigo-500/5 border border-indigo-500/20 p-4 rounded-xl mb-8 group hover:border-indigo-500/40 transition-colors">
                     <div className="bg-indigo-500/10 p-1.5 rounded-full text-indigo-400">
                        <PlusCircle size={18} />
                     </div>
                     <span className="text-sm text-indigo-100 font-semibold">{plan.extraInfo}</span>
                   </div>
                )}
              </div>

              <div className="flex-1 space-y-5 mb-10">
                {plan.features.map((feature, fIdx) => (
                  <div key={fIdx} className="flex items-start gap-3 text-sm text-slate-300">
                    <div className="mt-1 bg-emerald-500/10 p-0.5 rounded">
                        <Check size={14} className="text-emerald-400" />
                    </div>
                    <span className="font-medium">{feature}</span>
                  </div>
                ))}
              </div>

              <Button 
                variant={plan.variant} 
                className={`w-full py-4 text-base font-bold tracking-wide rounded-xl ${plan.popular ? 'bg-indigo-600 hover:bg-indigo-500 shadow-xl shadow-indigo-600/20' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}
                onClick={plan.action}
                disabled={plan.disabled || processingPlan !== null}
              >
                {processingPlan === plan.name ? <><Loader className="animate-spin mr-2" size={18} /> Opening Payment...</> : plan.cta}
              </Button>
              
              <div className="mt-6 flex flex-col items-center gap-2">
                 <div className="flex items-center gap-2 text-[11px] text-slate-500 font-bold uppercase tracking-widest">
                    <Globe size={12} className="text-indigo-400" /> Secure Cloud Payment
                 </div>
                 <div className="flex items-center gap-1.5 text-[10px] text-slate-600">
                    <CreditCard size={10} /> Secured by Bani Africa
                 </div>
              </div>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
};
