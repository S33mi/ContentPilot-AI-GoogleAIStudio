import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Sparkles, Zap, Shield, Crown, Flame, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { PlanTier } from '../types';
import { useLanguage } from '../i18n/LanguageContext';
import { openPaddleCheckout, BillingCycle } from '../lib/paddle';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string) => void;
  titleOverride?: string;
  subtitleOverride?: string;
}

export const PricingModal: React.FC<PricingModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
  titleOverride,
  subtitleOverride,
}) => {
  const { user, userProfile, signInWithGoogle, updatePlan } = useAuth();
  const { t } = useLanguage();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [loadingPlan, setLoadingPlan] = useState<PlanTier | null>(null);

  const currentPlan: PlanTier = userProfile ? userProfile.plan : 'guest';
  const currentCycle: BillingCycle = userProfile?.billingCycle || 'monthly';

  // Formatted active plan label
  const getFormattedActivePlan = () => {
    if (!userProfile || userProfile.plan === 'guest') return 'Guest';
    if (userProfile.plan === 'free') return 'Free Plan';
    const tierName = userProfile.plan.charAt(0).toUpperCase() + userProfile.plan.slice(1);
    const cycleName = userProfile.billingCycle === 'yearly' ? 'Yearly' : 'Monthly';
    return `${tierName} ${cycleName}`;
  };

  const handleSelectPlan = async (plan: PlanTier) => {
    if (!user) {
      try {
        await signInWithGoogle();
        onShowToast('Signed in successfully with Google!');
      } catch (e) {
        onShowToast('Failed to sign in. Please try again.');
      }
      return;
    }

    // If exactly same plan and billing cycle, do nothing
    if (currentPlan === plan && (plan === 'free' || currentCycle === billingCycle)) {
      return;
    }

    if (plan === 'free') {
      if (currentPlan === 'free') return;
      try {
        await updatePlan('free');
        onShowToast('Downgraded to Free Plan.');
        onClose();
      } catch (e) {
        onShowToast('Error updating plan. Please try again.');
      }
      return;
    }

    // Open Paddle checkout for Starter, Pro, or Unlimited
    setLoadingPlan(plan);

    openPaddleCheckout({
      plan,
      billingCycle,
      userEmail: user.email,
      userId: user.uid,
      onSuccess: async (selectedPlan) => {
        try {
          await updatePlan(selectedPlan);
          const formattedPlan = selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1);
          const cycleLabel = billingCycle === 'yearly' ? 'Yearly' : 'Monthly';
          onShowToast(`🎉 Payment successful! You are now subscribed to ${formattedPlan} ${cycleLabel}.`);
          onClose();
        } catch (e) {
          onShowToast('Payment processed, but error updating user profile. Please contact support.');
        } finally {
          setLoadingPlan(null);
        }
      },
      onError: (errMessage) => {
        onShowToast(`Checkout Error: ${errMessage}`);
        setLoadingPlan(null);
      },
      onCancel: () => {
        onShowToast('Payment cancelled or window closed.');
        setLoadingPlan(null);
      },
    });
  };

  const plans = [
    {
      id: 'free' as PlanTier,
      name: 'Free Plan',
      price: '$0',
      period: 'forever',
      originalPrice: null,
      subtext: 'Free account tier',
      savings: null,
      description: 'Ideal for trying out AI copy generation with basic daily usage.',
      badge: null,
      highlight: false,
      features: [
        '3 Welcome Bonus generations',
        '2 Free generations per day',
        'Local browser library storage',
        '3 AI tools (Social, Product, Reply)',
        '11 Global languages support',
      ],
      icon: Sparkles,
      iconBg: 'bg-slate-100 text-slate-700',
    },
    {
      id: 'starter' as PlanTier,
      name: billingCycle === 'yearly' ? 'Starter Yearly' : 'Starter Monthly',
      price: billingCycle === 'yearly' ? '$90' : '$9',
      period: billingCycle === 'yearly' ? 'year' : 'month',
      originalPrice: billingCycle === 'yearly' ? '$108/yr' : null,
      subtext: billingCycle === 'yearly' ? '$7.50/mo (billed annually)' : 'Billed monthly',
      savings: billingCycle === 'yearly' ? 'Save 2 Months ($18 off)' : null,
      description: 'Great for small business owners posting multiple times a week.',
      badge: billingCycle === 'yearly' ? '🎁 Save 2 Months' : 'Starter Tier',
      highlight: false,
      features: [
        '60 Generations per month',
        'Cloud Library sync across devices',
        'Full access to all 3 AI copy generators',
        'Weekly strategy & hashtag suites',
        'Export content in PDF, Word & Excel',
      ],
      icon: Zap,
      iconBg: 'bg-indigo-100 text-indigo-700',
    },
    {
      id: 'pro' as PlanTier,
      name: billingCycle === 'yearly' ? 'Pro Yearly' : 'Pro Monthly',
      price: billingCycle === 'yearly' ? '$190' : '$19',
      period: billingCycle === 'yearly' ? 'year' : 'month',
      originalPrice: billingCycle === 'yearly' ? '$228/yr' : null,
      subtext: billingCycle === 'yearly' ? '$15.83/mo (billed annually)' : 'Billed monthly',
      savings: billingCycle === 'yearly' ? 'Save 2 Months ($38 off)' : null,
      description: 'For active merchants, agencies, and busy content creators.',
      badge: billingCycle === 'yearly' ? '🔥 Most Popular • Save 2 Months' : '🔥 Most Popular',
      highlight: true,
      features: [
        '200 Generations per month',
        'Cloud Library with instant sync',
        'Priority Gemini 3.6 AI processing speed',
        'Unlimited local library backup',
        'Multi-language RTL copy tools',
      ],
      icon: Crown,
      iconBg: 'bg-amber-100 text-amber-700',
    },
    {
      id: 'unlimited' as PlanTier,
      name: billingCycle === 'yearly' ? 'Unlimited Yearly' : 'Unlimited Monthly',
      price: billingCycle === 'yearly' ? '$290' : '$29',
      period: billingCycle === 'yearly' ? 'year' : 'month',
      originalPrice: billingCycle === 'yearly' ? '$348/yr' : null,
      subtext: billingCycle === 'yearly' ? '$24.16/mo (billed annually)' : 'Billed monthly',
      savings: billingCycle === 'yearly' ? 'Save 2 Months ($58 off)' : null,
      description: 'Zero restrictions for power users and scaling marketing teams.',
      badge: billingCycle === 'yearly' ? '⚡ 2 Months Free ($58 off)' : 'Unlimited Power',
      highlight: false,
      features: [
        'Unlimited AI generations',
        'Cloud Library with auto-backup',
        'Priority Gemini AI response time',
        'VIP customer support',
        'Access to future upcoming AI tools',
      ],
      icon: Flame,
      iconBg: 'bg-rose-100 text-rose-700',
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden my-8 border border-slate-200"
          >
            {/* Modal Header */}
            <div className="p-6 sm:p-8 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white relative flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/30 text-amber-300 text-xs font-bold uppercase tracking-wider">
                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                    Upgrade Your Content Engine
                  </div>
                  {user && (
                    <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-indigo-200 text-xs font-semibold">
                      <span>Active Plan:</span>
                      <strong className="text-white font-bold">{getFormattedActivePlan()}</strong>
                    </div>
                  )}
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  {titleOverride || 'Choose the Perfect Plan for Your Business'}
                </h2>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {subtitleOverride || 'Unlock higher generation limits, cloud library backup, and priority AI content creation.'}
                </p>
              </div>

              <button
                onClick={onClose}
                className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Prominent Billing Cycle Toggle Bar */}
            <div className="bg-gradient-to-r from-indigo-50 via-slate-50 to-indigo-50 px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-center gap-4">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-indigo-600" /> Billing Option:
              </span>
              <div className="inline-flex items-center p-1.5 rounded-2xl bg-white border-2 border-indigo-200/80 shadow-md">
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                    billingCycle === 'monthly'
                      ? 'bg-slate-900 text-white shadow-md'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  Monthly Billing
                </button>
                <button
                  onClick={() => setBillingCycle('yearly')}
                  className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                    billingCycle === 'yearly'
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/30 ring-2 ring-indigo-400'
                      : 'text-indigo-900 hover:bg-indigo-50 font-bold'
                  }`}
                >
                  <span>Yearly Billing</span>
                  <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider shadow-xs animate-pulse">
                    Save 2 Months (17% OFF)
                  </span>
                </button>
              </div>
            </div>

            {/* Yearly Savings Banner */}
            {billingCycle === 'yearly' && (
              <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2.5 text-center text-xs font-bold text-emerald-900 flex items-center justify-center gap-2">
                <span className="text-base">🎉</span>
                <span>Annual Discount Applied: Pay for 10 months, get 12 full months of AI access!</span>
              </div>
            )}

            {/* Plans Grid */}
            <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 bg-slate-50/50">
              {plans.map((plan) => {
                const isExactCurrent = currentPlan === plan.id && (plan.id === 'free' || currentCycle === billingCycle);
                const isSameTierDiffCycle = currentPlan === plan.id && plan.id !== 'free' && currentCycle !== billingCycle;
                const isLoadingThis = loadingPlan === plan.id;
                const IconComponent = plan.icon;

                return (
                  <div
                    key={plan.id}
                    className={`relative rounded-2xl p-5 flex flex-col justify-between transition-all ${
                      isExactCurrent
                        ? 'bg-white border-2 border-emerald-500 shadow-lg ring-4 ring-emerald-500/10'
                        : plan.highlight
                        ? 'bg-white border-2 border-indigo-600 shadow-xl ring-4 ring-indigo-600/10'
                        : 'bg-white border border-slate-200 shadow-sm hover:border-indigo-300'
                    }`}
                  >
                    {plan.badge && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-indigo-600 text-white text-[11px] font-bold tracking-wide shadow-xs whitespace-nowrap">
                        {plan.badge}
                      </div>
                    )}

                    <div className="space-y-4">
                      {/* Top Header */}
                      <div className="flex items-center justify-between">
                        <div className={`p-2.5 rounded-xl ${plan.iconBg}`}>
                          <IconComponent className="w-5 h-5" />
                        </div>
                        {isExactCurrent && (
                          <span className="text-[11px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                            <Check className="w-3 h-3 text-emerald-700" /> Active Plan
                          </span>
                        )}
                      </div>

                      <div>
                        <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
                        <p className="text-xs text-slate-500 mt-1 min-h-[32px] leading-relaxed">
                          {plan.description}
                        </p>
                      </div>

                      {/* Price & Savings */}
                      <div className="pt-1 border-t border-slate-100">
                        <div className="flex items-baseline gap-1.5 flex-wrap">
                          <span className="text-3xl font-extrabold text-slate-900">{plan.price}</span>
                          <span className="text-xs text-slate-500 font-medium">/{plan.period}</span>
                          {plan.originalPrice && (
                            <span className="text-xs text-slate-400 line-through font-semibold">
                              {plan.originalPrice}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] font-semibold text-indigo-600 mt-0.5">{plan.subtext}</p>
                        {plan.savings && (
                          <span className="inline-block mt-1 text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                            {plan.savings}
                          </span>
                        )}
                      </div>

                      {/* Features */}
                      <ul className="space-y-2 pt-2 text-xs text-slate-700">
                        {plan.features.map((feat, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Action Button */}
                    <div className="pt-6 mt-4 border-t border-slate-100">
                      <button
                        onClick={() => handleSelectPlan(plan.id)}
                        disabled={isExactCurrent || isLoadingThis}
                        className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 ${
                          isExactCurrent
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-400 cursor-default opacity-90 font-extrabold'
                            : isLoadingThis
                            ? 'bg-indigo-500 text-white cursor-wait'
                            : isSameTierDiffCycle
                            ? 'bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 text-white shadow-md ring-2 ring-amber-400/50 cursor-pointer'
                            : plan.highlight
                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20 shadow-md cursor-pointer'
                            : 'bg-slate-900 hover:bg-indigo-900 text-white cursor-pointer'
                        }`}
                      >
                        {isLoadingThis ? (
                          <span className="inline-flex items-center gap-1.5">
                            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Opening Paddle...
                          </span>
                        ) : isExactCurrent ? (
                          <span className="inline-flex items-center gap-1">
                            <Check className="w-4 h-4 text-emerald-700" /> Subscribed
                          </span>
                        ) : isSameTierDiffCycle ? (
                          billingCycle === 'yearly' ? 'Upgrade to Yearly (Save 2 Mo)' : 'Switch to Monthly'
                        ) : !user ? (
                          'Sign in to Subscribe'
                        ) : plan.id === 'free' ? (
                          'Downgrade to Free'
                        ) : (
                          `Subscribe to ${plan.name}`
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-100 border-t border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-slate-600 font-medium">
                <Lock className="w-4 h-4 text-indigo-600 shrink-0" />
                <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Secured by Paddle • Instant activation & cancel anytime</span>
              </div>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
