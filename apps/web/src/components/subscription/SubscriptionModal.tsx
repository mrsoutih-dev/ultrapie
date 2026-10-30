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
  Copy,
  Coins,
  QrCode,
  ExternalLink,
} from 'lucide-react';

type PaymentMethodType = 'CRYPTO' | 'CARD';
type CryptoCurrencyType = 'USDT-TRC20' | 'USDT-BEP20' | 'USDT-ERC20' | 'BTC' | 'ETH' | 'SOL';

const CRYPTO_CONFIG: Record<
  CryptoCurrencyType,
  {
    name: string;
    network: string;
    address: string;
    badge: string;
    tagColor: string;
    rateMultiplier: number;
    symbol: string;
  }
> = {
  'USDT-TRC20': {
    name: 'USDT (TRC-20)',
    network: 'Tron Network',
    address: 'TJv7SgK2s4h8gR9yY4cWzE5x1bQ9wM3pKL',
    badge: 'Recommended • Fast & Low Gas ($1)',
    tagColor: 'text-emerald-400 border-emerald-500/40 bg-emerald-950/40',
    rateMultiplier: 1.0,
    symbol: 'USDT',
  },
  'USDT-BEP20': {
    name: 'USDT (BEP-20)',
    network: 'BNB Smart Chain (BSC)',
    address: '0x71C56816D3E2eF2D513f568a0f8b375b47285Fa6',
    badge: 'Low Gas ($0.20)',
    tagColor: 'text-amber-400 border-amber-500/40 bg-amber-950/40',
    rateMultiplier: 1.0,
    symbol: 'USDT',
  },
  'USDT-ERC20': {
    name: 'USDT (ERC-20)',
    network: 'Ethereum Mainnet',
    address: '0x71C56816D3E2eF2D513f568a0f8b375b47285Fa6',
    badge: 'Ethereum Native',
    tagColor: 'text-indigo-400 border-indigo-500/40 bg-indigo-950/40',
    rateMultiplier: 1.0,
    symbol: 'USDT',
  },
  'BTC': {
    name: 'Bitcoin (BTC)',
    network: 'Bitcoin Core',
    address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    badge: 'Native BTC',
    tagColor: 'text-orange-400 border-orange-500/40 bg-orange-950/40',
    rateMultiplier: 0.000011, // calculated approx
    symbol: 'BTC',
  },
  'ETH': {
    name: 'Ethereum (ETH)',
    network: 'Ethereum Layer 1',
    address: '0x71C56816D3E2eF2D513f568a0f8b375b47285Fa6',
    badge: 'Layer 1 Native',
    tagColor: 'text-cyan-400 border-cyan-500/40 bg-cyan-950/40',
    rateMultiplier: 0.00035, // calculated approx
    symbol: 'ETH',
  },
  'SOL': {
    name: 'Solana (SOL)',
    network: 'Solana Mainnet',
    address: '9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin',
    badge: 'Ultra Fast (400ms)',
    tagColor: 'text-purple-400 border-purple-500/40 bg-purple-950/40',
    rateMultiplier: 0.0064, // calculated approx
    symbol: 'SOL',
  },
};

export function SubscriptionModal() {
  const { isSubscriptionModalOpen, closeSubscriptionModal, user, subscribe } = useAuth();

  const [selectedPlan, setSelectedPlan] = useState<'STARTER' | 'PRO' | 'BUSINESS'>('PRO');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('CRYPTO');
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoCurrencyType>('USDT-TRC20');
  const [txHash, setTxHash] = useState('');
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('888');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isSubscriptionModalOpen) return null;

  const PLANS = [
    {
      id: 'STARTER' as const,
      name: 'Starter Plan',
      price: '$19',
      numericPrice: 19,
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
      numericPrice: 49,
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
      numericPrice: 99,
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

  const currentPlanObj = PLANS.find((p) => p.id === selectedPlan) || PLANS[1];
  const activeCrypto = CRYPTO_CONFIG[selectedCrypto];

  // Calculate crypto price
  const calculateCryptoAmount = () => {
    if (activeCrypto.symbol === 'USDT') {
      return `${currentPlanObj.numericPrice}.00 USDT`;
    }
    const val = (currentPlanObj.numericPrice * activeCrypto.rateMultiplier).toFixed(
      activeCrypto.symbol === 'BTC' ? 6 : activeCrypto.symbol === 'ETH' ? 5 : 3
    );
    return `${val} ${activeCrypto.symbol}`;
  };

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(activeCrypto.address);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      if (paymentMethod === 'CRYPTO') {
        if (!txHash.trim()) {
          setErrorMessage('Please enter your Transaction Hash / TxID after sending payment.');
          setIsProcessing(false);
          return;
        }

        const res = await subscribe(selectedPlan, {
          paymentMethod: 'CRYPTO',
          cryptoCurrency: selectedCrypto,
          cryptoTxHash: txHash.trim(),
        });

        if (res.success) {
          setSuccessMessage(`Crypto payment received! Your ${selectedPlan} subscription is now verified & active.`);
          setTimeout(() => {
            closeSubscriptionModal();
            setSuccessMessage(null);
          }, 2000);
        } else {
          setErrorMessage(res.error || 'Crypto payment activation failed');
        }
      } else {
        const res = await subscribe(selectedPlan, { paymentMethod: 'CARD' });
        if (res.success) {
          setSuccessMessage(`Card payment confirmed! Your ${selectedPlan} monthly subscription is now active.`);
          setTimeout(() => {
            closeSubscriptionModal();
            setSuccessMessage(null);
          }, 2000);
        } else {
          setErrorMessage(res.error || 'Payment failed');
        }
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(
    activeCrypto.address
  )}&format=svg&qzone=2&bgcolor=020617&color=38bdf8`;

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
              Select Your Subscription & Payment Method
            </h2>
            <p className="text-xs md:text-sm text-slate-400">
              {user ? `Logged in as ${user.email}.` : 'Account setup.'} Choose a plan below and pay with Crypto (USDT, BTC, ETH, SOL) or Card for instant activation.
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

        {/* Payment Method Selector Tabs */}
        <div className="px-6 md:px-8 pt-4 pb-0 bg-slate-900 border-t border-slate-800">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setPaymentMethod('CRYPTO')}
              className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition-all ${
                paymentMethod === 'CRYPTO'
                  ? 'bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-yellow-500/20 border-amber-500/80 text-amber-300 shadow-lg shadow-amber-500/10'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Coins className="h-4 w-4 text-amber-400" />
              <span>🪙 Pay with Crypto (USDT / BTC / ETH / SOL)</span>
              <span className="text-[10px] bg-amber-500/30 text-amber-200 px-2 py-0.5 rounded-full font-extrabold uppercase">
                Instant
              </span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('CARD')}
              className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition-all ${
                paymentMethod === 'CARD'
                  ? 'bg-cyan-500/20 border-cyan-500/80 text-cyan-300 shadow-lg shadow-cyan-500/10'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <CreditCard className="h-4 w-4 text-cyan-400" />
              <span>Credit / Debit Card</span>
            </button>
          </div>
        </div>

        {/* Checkout Form */}
        <div className="p-6 md:p-8 bg-slate-900">
          <form onSubmit={handleCheckout} className="max-w-xl mx-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
              <span className="text-slate-400">Selected Plan:</span>
              <span className="font-bold text-white flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>
                  {currentPlanObj.name} ({currentPlanObj.price}
                  {currentPlanObj.period})
                </span>
              </span>
            </div>

            {successMessage && (
              <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-200 text-xs font-semibold flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-400" />
                <span>{successMessage}</span>
              </div>
            )}

            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-800 text-red-200 text-xs font-semibold flex items-center gap-2">
                <X className="h-4 w-4 text-red-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {paymentMethod === 'CRYPTO' ? (
              <div className="space-y-4 pt-1">
                {/* Crypto Currencies Selector */}
                <div>
                  <label className="text-slate-300 font-semibold mb-2 block text-xs">
                    Choose Cryptocurrency
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {(Object.keys(CRYPTO_CONFIG) as CryptoCurrencyType[]).map((coinKey) => {
                      const coin = CRYPTO_CONFIG[coinKey];
                      const isSelected = selectedCrypto === coinKey;
                      return (
                        <button
                          key={coinKey}
                          type="button"
                          onClick={() => setSelectedCrypto(coinKey)}
                          className={`p-2.5 rounded-xl border text-left transition-all ${
                            isSelected
                              ? 'border-amber-400 bg-amber-950/30 ring-1 ring-amber-400/50'
                              : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-white text-xs">{coin.name}</span>
                            {isSelected && <Check className="h-3.5 w-3.5 text-amber-400" />}
                          </div>
                          <div className="text-[10px] text-slate-400">{coin.network}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Amount to send */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-400 block">Total Amount to Send:</span>
                    <span className="text-lg font-black text-amber-400">{calculateCryptoAmount()}</span>
                  </div>
                  <div className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold ${activeCrypto.tagColor}`}>
                    {activeCrypto.badge}
                  </div>
                </div>

                {/* QR Code and Address */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row items-center gap-4">
                  <div className="p-2 bg-slate-900 border border-slate-800 rounded-xl shrink-0">
                    <img
                      src={qrImageUrl}
                      alt="Deposit QR"
                      className="w-28 h-28 rounded-lg"
                    />
                  </div>
                  <div className="space-y-2 flex-1 w-full">
                    <div className="text-[11px] text-slate-400 flex items-center justify-between">
                      <span>Deposit Address ({activeCrypto.network}):</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs text-cyan-300 break-all select-all flex items-center justify-between gap-2">
                      <span>{activeCrypto.address}</span>
                      <button
                        type="button"
                        onClick={handleCopyAddress}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold shrink-0 transition-colors flex items-center gap-1"
                      >
                        {copiedAddress ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-500">
                      Send only {activeCrypto.name} on {activeCrypto.network}. Funds will be credited after 1 network confirmation.
                    </p>
                  </div>
                </div>

                {/* Transaction Hash Input */}
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-semibold block text-xs">
                    Transaction ID / TxHash (After sending payment)
                  </label>
                  <input
                    type="text"
                    required
                    value={txHash}
                    onChange={(e) => setTxHash(e.target.value)}
                    placeholder="e.g. 5f8d2b... or 0x9a3e..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 font-mono text-xs focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs pt-1">
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
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={isProcessing}
                className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${
                  paymentMethod === 'CRYPTO'
                    ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 hover:brightness-110 text-slate-950 shadow-amber-500/20 font-black'
                    : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 hover:brightness-110 text-white shadow-emerald-500/20'
                }`}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Verifying {paymentMethod === 'CRYPTO' ? 'Crypto' : 'Card'} Payment...</span>
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    <span>
                      {paymentMethod === 'CRYPTO'
                        ? `Confirm ${calculateCryptoAmount()} & Activate Instantly`
                        : `Pay ${currentPlanObj.price} / Month & Activate Instantly`}
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>

            <p className="text-[11px] text-slate-500 text-center flex items-center justify-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>
                {paymentMethod === 'CRYPTO'
                  ? 'Decentralized crypto settlement with instant account authorization.'
                  : 'Billed monthly. Cancel anytime with 1-click in account settings.'}
              </span>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
