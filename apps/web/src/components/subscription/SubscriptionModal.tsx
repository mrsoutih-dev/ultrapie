'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  X,
  Sparkles,
  Check,
  CreditCard,
  ShieldCheck,
  Zap,
  Crown,
  Building,
  ArrowRight,
  Loader2,
  Lock,
} from 'lucide-react';

export function SubscriptionModal() {
  const { isSubscriptionModalOpen, closeSubscriptionModal, user, subscribe } = useAuth();

  const [selectedPlan, setSelectedPlan] = useState<'STARTER' | 'PRO' | 'BUSINESS'>('PRO');
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('888');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isSubscriptionModalOpen) return null;

  const PLANS = [
    {
      id: 'STARTER' as const,
      name: 'Starter Plan',
      price: '$19',
      period: '/month',
      desc: 'Ideal for solo developers building fast prototypes and small web apps.',
      icon: Zap,
      features: [
        '50 AI App Builds / month',
        'Live Monaco Code Editor',
        'In-Browser Live Sandbox Preview',
        '1-Click Standalone ZIP Export',
        'Community Discord Support',
      ],
      popular: false,
    },
    {
      id: 'PRO' as const,
      name: 'Pro Unlimited',
      price: '$49',
      period: '/month',
      desc: 'Everything you need to build, iterate, and host apps with zero limits.',
      icon: Crown,
      features: [
        'Unlimited AI Code Generation (Gemini 3)',
        'Real-Time Line-by-Line Typewriter Sandbox',
        '1-Click Coolify VPS Provisioning',
        'Cloudflare Global Tunnels (ultrapie.com)',
        'Zero-Config Custom Domains & SSL',
        'High-Priority Ultra-Fast Streaming',
      ],
      popular: true,
    },
    {
      id: 'BUSINESS' as const,
      name: 'Enterprise VPS',
      price: '$99',
      period: '/month',
      desc: 'Dedicated infrastructure, high-concurrency clusters, and team access.',
      icon: Building,
      features: [
        'Unlimited Everything + Team Multi-Seat',
        'Dedicated VPS Container Engine',
        'Automated Database & Redis Backups',
        '24/7 Dedicated Priority SLA Support',
        'Custom Architecture Consulting',
      ],
      popular: false,
    },
  ];

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setSuccessMessage(null);

    try {
      const res = await subscribe(selectedPlan);
      if (res.success) {
        setSuccessMessage(`Payment confirmed! Your ${selectedPlan} monthly subscription is now active.`);
        setTimeout(() => {
          closeSubscriptionModal();
          setSuccessMessage(null);
        }, 1800);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const currentPlanObj = PLANS.find((p) => p.id === selectedPlan) || PLANS[1];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 md:p-8 border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950/30 flex items-center justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950 border border-cyan-800/80 text-cyan-400 text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
              <span>Ultrapie Platform Monthly Access</span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Select Your Monthly Subscription Plan
            </h2>
            <p className="text-xs md:text-sm text-slate-400">
              {user ? `Logged in as ${user.email}.` : 'New user registration.'} Choose a plan below to activate your account and start building live apps.
            </p>
          </div>
          <button
            onClick={closeSubscriptionModal}
            className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Pricing Cards */}
        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-950/50">
          {PLANS.map((plan) => {
            const isSelected = selectedPlan === plan.id;
            const Icon = plan.icon;
            return (
              <div
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                className={`relative rounded-2xl p-6 border cursor-pointer transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'border-cyan-500 bg-slate-900 shadow-xl shadow-cyan-500/10 ring-2 ring-cyan-500/30'
                    : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-[10px] font-bold text-white uppercase tracking-wider shadow-md">
                    Most Popular
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                        isSelected ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-black text-white">{plan.price}</div>
                      <div className="text-[11px] text-slate-400">{plan.period}</div>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-white mb-1">{plan.name}</h3>
                  <p className="text-xs text-slate-400 mb-5 leading-relaxed">{plan.desc}</p>

                  <div className="space-y-2.5 pt-4 border-t border-slate-800/80">
                    {plan.features.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                        <Check className="h-3.5 w-3.5 text-cyan-400 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-4">
                  <div
                    className={`w-full py-2 rounded-xl text-xs font-bold text-center transition-all ${
                      isSelected
                        ? 'bg-cyan-500 text-slate-950 font-black'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {isSelected ? '✓ Selected Plan' : 'Select Plan'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Checkout Form */}
        <div className="p-6 md:p-8 border-t border-slate-800 bg-slate-900">
          <form onSubmit={handleCheckout} className="max-w-xl mx-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
              <span className="text-slate-400">Selected Plan:</span>
              <span className="font-bold text-white flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>{currentPlanObj.name} ({currentPlanObj.price}{currentPlanObj.period})</span>
              </span>
            </div>

            {successMessage && (
              <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-200 text-xs font-semibold flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-400" />
                <span>{successMessage}</span>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold mb-1 block">Card Information</label>
                <div className="relative">
                  <CreditCard className="h-4 w-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="4242 4242 4242 4242"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2.5 text-white placeholder-slate-600 font-mono text-xs focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">Expiration Date</label>
                  <input
                    type="text"
                    required
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    placeholder="MM/YY"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white placeholder-slate-600 font-mono text-xs focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">Security Code (CVC)</label>
                  <input
                    type="text"
                    required
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value)}
                    placeholder="CVC"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white placeholder-slate-600 font-mono text-xs focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 hover:brightness-110 text-white font-bold text-sm shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Processing Monthly Payment...</span>
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    <span>Pay {currentPlanObj.price} / Month & Activate Instantly</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>

            <p className="text-[11px] text-slate-500 text-center flex items-center justify-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>Billed monthly. Cancel anytime with 1-click in account settings.</span>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
