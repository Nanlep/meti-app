
import React, { useState } from 'react';
import { Button, Card } from './Shared';
import { Check, Zap, Crown, Loader, CreditCard, PlusCircle, Star, Globe, RefreshCw, Coins } from 'lucide-react';
import { notify } from '../services/notificationService';
import { authService } from '../services/authService';
import useCheckout from 'bani-react';
import { User } from '../types';

interface StepPricingProps {
  user?: User;
}

export const StepPricing: React.FC<StepPricingProps> = ({ user }) => {
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [currency, setCurrency] = useState<'NGN' | 'USD'>('NGN');
  const { BaniPopUp } = useCheckout();

  const RATE = 1500; // $1 = N1500

  const customerEmail = user?.email || "";
  const customerName = user?.name || "";
  const nameParts = customerName.split(' ');
  const firstName = nameParts[0] || "Valued";
  const lastName = nameParts.slice(1).join(' ') || "Customer";

  const formatPrice = (ngn: number) => {
    if (currency === 'NGN') return `₦${ngn.toLocaleString()}`;
    return `$${(ngn / RATE).toFixed(2)}`;
  };

  const handleSubscribe = (planName: string, amountNGN: number) => {
    setProcessingPlan(planName);

    const amount = currency === 'NGN' ? amountNGN.toString() : (amountNGN / RATE).toFixed(2);
    const reference = `METI_${user?.id || 'GUEST'}_${planName.toLowerCase()}_${Date.now()}`;

    try {
      BaniPopUp({
        amount: amount,
        phoneNumber: "08021234567",
        email: customerEmail,
        firstName: firstName,
        lastName: lastName,
        merchantKey: import.meta.env.VITE_BANI_PUBLIC_KEY || "pub_test_placeholder",
        metadata: {
          custom_ref: reference,
          order_ref: reference,
          currency: currency
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
    notify.success(`Payment Successful! Activating ${planName}...`);
    setProcessingPlan(null);
    // Wait for webhook or refresh
    setTimeout(() => {
      window.location.reload();
    }, 3000);
  };

  const plans = [
    {
      name: 'Starter',
      price: formatPrice(0),
      period: '/ month',
      description: 'Pay-as-you-go. No monthly commitment.',
      features: ['Pay Per Project Session', 'AI Persona & Niche Analysis', 'Basic Lead Magnets', 'Ad Engine (Lite)', 'Sales Simulator', '1 Landing Page Generated'],
      extraInfo: `Single Session: ${formatPrice(53750)}`,
      cta: 'Current Plan',
      variant: 'outline' as const,
      icon: Star,
      disabled: true
    },
    {
      name: 'Pro',
      price: formatPrice(268750),
      period: '/ month',
      popular: true,
      description: 'For power users launching multiple campaigns monthly.',
      features: ['5 Projects Included', 'Basic Features', 'Full SEO Suite (Audits, Keywords)', 'Real-time Google Maps Leads', 'Multi-Channel Ad Engine', '5 Landing Page Generated', 'Email Marketing', 'Sales Simulator'],
      extraInfo: `Additional projects: ${formatPrice(53750)} / each`,
      cta: 'Get Pro Access',
      variant: 'primary' as const,
      icon: Zap,
      action: () => handleSubscribe('Pro', 268750)
    },
    {
      name: 'Agency',
      price: formatPrice(1075000),
      period: '/ month',
      description: 'The ultimate OS for scaling agencies managing multiple clients.',
      features: ['25 Projects Included', 'Pro Features', 'White-label SEO & Strategy Reports', 'CMS Integrations', 'Developer API Access', '25 Landing Page Generated', 'Priority Support', 'Dedicated Account Manager'],
      extraInfo: `Additional projects: ${formatPrice(53750)} / each`,
      cta: 'Get Agency Access',
      variant: 'secondary' as const,
      icon: Crown,
      action: () => handleSubscribe('Agency', 1075000)
    }
  ];

  return (
    <div className="max-w-7xl mx-auto animate-fadeIn pb-20">
      <div className="flex flex-col items-center mb-16 relative">
        <h2 className="text-3xl font-bold text-white mb-6">Choose Your Growth Engine</h2>

        <div className="flex items-center gap-4 bg-slate-900 p-1.5 rounded-full border border-slate-800 mb-6">
          <button
            onClick={() => setCurrency('NGN')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${currency === 'NGN' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            <RefreshCw size={12} className={currency === 'NGN' ? '' : 'opacity-0 w-0'} /> NGN (₦)
          </button>
          <button
            onClick={() => setCurrency('USD')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${currency === 'USD' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            <Globe size={12} className={currency === 'USD' ? '' : 'opacity-0 w-0'} /> USD ($)
          </button>
        </div>

        {currency === 'USD' && (
          <div className="inline-flex bg-indigo-500/10 px-4 py-2 rounded-lg border border-indigo-500/20 text-xs text-indigo-300 mb-6 items-center gap-2 animate-fadeIn">
            <Coins size={14} /> Note: USD payments are collected via Crypto (USDT/USDC).
          </div>
        )}

        <p className="text-slate-400 text-sm">Secure payments processed via Bani Africa.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative items-start">
        {plans.map((plan, idx) => (
          <div key={idx} className={`relative flex flex-col h-full ${plan.popular ? 'z-10' : ''}`}>
            <Card className={`h-full flex flex-col p-8 bg-slate-900/40 border-slate-800 ${plan.popular ? 'border-indigo-500/50 ring-1 ring-indigo-500/20' : ''}`}>
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-white mb-4">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-4xl font-extrabold text-white tracking-tight">{plan.price}</span>
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
