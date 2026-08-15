// Paddle Integration Helper for ContentPilot AI
import { PlanTier } from '../types';

declare global {
  interface Window {
    Paddle?: any;
  }
}

const getEnvVar = (key: string): string | undefined => {
  try {
    return (import.meta as any).env?.[key];
  } catch {
    return undefined;
  }
};

export type BillingCycle = 'monthly' | 'yearly';

export interface PaddlePlanConfig {
  id: PlanTier;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  monthlyPriceId?: string;
  yearlyPriceId?: string;
}

export const PADDLE_PLANS: Record<Exclude<PlanTier, 'guest' | 'free'>, PaddlePlanConfig> = {
  starter: {
    id: 'starter',
    name: 'Starter Plan',
    monthlyPrice: 9,
    yearlyPrice: 90,
    monthlyPriceId: getEnvVar('VITE_PADDLE_PRICE_STARTER_MONTHLY'),
    yearlyPriceId: getEnvVar('VITE_PADDLE_PRICE_STARTER_YEARLY'),
  },
  pro: {
    id: 'pro',
    name: 'Pro Plan',
    monthlyPrice: 19,
    yearlyPrice: 190,
    monthlyPriceId: getEnvVar('VITE_PADDLE_PRICE_PRO_MONTHLY'),
    yearlyPriceId: getEnvVar('VITE_PADDLE_PRICE_PRO_YEARLY'),
  },
  unlimited: {
    id: 'unlimited',
    name: 'Unlimited Plan',
    monthlyPrice: 29,
    yearlyPrice: 290,
    monthlyPriceId: getEnvVar('VITE_PADDLE_PRICE_UNLIMITED_MONTHLY'),
    yearlyPriceId: getEnvVar('VITE_PADDLE_PRICE_UNLIMITED_YEARLY'),
  },
};

let paddleInitialized = false;

export function initPaddle(): boolean {
  if (typeof window === 'undefined') return false;

  const clientToken = getEnvVar('VITE_PADDLE_CLIENT_TOKEN');
  const env = getEnvVar('VITE_PADDLE_ENVIRONMENT') || 'sandbox';

  if (window.Paddle) {
    try {
      if (clientToken) {
        if (window.Paddle.Environment) {
          window.Paddle.Environment.set(env);
        }
        window.Paddle.Initialize({
          token: clientToken,
          eventCallback: (event: any) => {
            console.log('Paddle Global Event:', event);
          },
        });
        paddleInitialized = true;
        return true;
      }
    } catch (e) {
      console.warn('Paddle SDK Initialization warning:', e);
    }
  }
  return false;
}

export interface CheckoutOptions {
  plan: PlanTier;
  billingCycle: BillingCycle;
  userEmail?: string | null;
  userId?: string | null;
  onSuccess: (plan: PlanTier) => void;
  onError?: (errMessage: string) => void;
  onCancel?: () => void;
}

export function openPaddleCheckout(options: CheckoutOptions) {
  const { plan, billingCycle, userEmail, userId, onSuccess, onError, onCancel } = options;

  if (plan === 'free' || plan === 'guest') {
    onSuccess(plan);
    return;
  }

  const planConfig = PADDLE_PLANS[plan as keyof typeof PADDLE_PLANS];
  if (!planConfig) {
    onError?.('Invalid plan selected');
    return;
  }

  const priceId = billingCycle === 'yearly' ? planConfig.yearlyPriceId : planConfig.monthlyPriceId;
  const clientToken = getEnvVar('VITE_PADDLE_CLIENT_TOKEN');

  // If live Paddle token and price ID exist, call Paddle.Checkout.open
  if (clientToken && priceId && window.Paddle?.Checkout) {
    try {
      if (!paddleInitialized) {
        initPaddle();
      }

      window.Paddle.Checkout.open({
        items: [{ priceId, quantity: 1 }],
        customer: userEmail ? { email: userEmail } : undefined,
        customData: {
          userId: userId || 'anonymous',
          userEmail: userEmail || undefined,
          plan: plan,
          billingCycle: billingCycle,
        },
        eventCallback: async (event: any) => {
          if (event.name === 'checkout.completed') {
            try {
              // Immediate sync with backend fulfillment endpoint
              const customerId = event.data?.customer?.id || event.data?.customer_id;
              const subscriptionId = event.data?.subscription_id || event.data?.id;
              await fetch('/api/paddle/sync-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  userId,
                  email: userEmail,
                  plan,
                  billingCycle,
                  priceId,
                  customerId,
                  subscriptionId,
                }),
              });
            } catch (syncErr) {
              console.warn('[Paddle Sync Warning]', syncErr);
            }
            onSuccess(plan);
          } else if (event.name === 'checkout.closed') {
            onCancel?.();
          } else if (event.name === 'checkout.error') {
            onError?.(event.data?.message || 'Payment processing error');
          }
        },
      });
      return;
    } catch (err: any) {
      console.warn('Failed to open native Paddle checkout, using fallback handler:', err);
    }
  }

  // Fallback / Demo sandbox handler when live Paddle credentials are not yet set
  return simulatePaddleCheckout(options);
}

// Fallback Checkout Simulator for Sandbox & Local Testing
function simulatePaddleCheckout(options: CheckoutOptions) {
  const { plan, billingCycle, userEmail, onSuccess, onCancel } = options;
  const planConfig = PADDLE_PLANS[plan as keyof typeof PADDLE_PLANS];
  const price = billingCycle === 'yearly' ? planConfig.yearlyPrice : planConfig.monthlyPrice;

  // Create an overlay element styled like Paddle Checkout
  const overlay = document.createElement('div');
  overlay.id = 'paddle-sandbox-checkout-overlay';
  overlay.className = 'fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200';

  overlay.innerHTML = `
    <div class="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
      <div class="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-6 relative">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white text-sm">
              P
            </div>
            <div>
              <h3 class="font-bold text-base">Paddle Checkout</h3>
              <p class="text-[11px] text-slate-300">Secure Payment for ContentPilot AI</p>
            </div>
          </div>
          <button id="paddle-sim-close" class="text-slate-400 hover:text-white text-xl font-bold p-1 cursor-pointer">&times;</button>
        </div>
      </div>

      <div class="p-6 space-y-5 bg-slate-50/50">
        <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div class="flex justify-between items-center text-sm font-bold text-slate-900">
            <span>${planConfig.name} (${billingCycle === 'yearly' ? 'Annual' : 'Monthly'})</span>
            <span class="text-indigo-600">$${price} ${billingCycle === 'yearly' ? '/yr' : '/mo'}</span>
          </div>
          <p class="text-xs text-slate-500">Billed securely via Paddle. Cancel anytime from your account dashboard.</p>
          ${userEmail ? `<p class="text-xs text-slate-600 font-medium pt-1 border-t border-slate-100">Customer: <span class="font-bold text-slate-900">${userEmail}</span></p>` : ''}
        </div>

        <div class="space-y-3">
          <div class="text-[11px] text-slate-500 bg-amber-50 border border-amber-200/80 p-2.5 rounded-xl flex items-start gap-2">
            <span class="text-amber-600 font-bold">ℹ️</span>
            <span><strong>Sandbox Mode:</strong> Paddle API credentials can be set in <code>.env</code> (VITE_PADDLE_CLIENT_TOKEN). Click below to confirm test payment and unlock your plan!</span>
          </div>

          <button id="paddle-sim-submit" class="w-full py-3 px-4 rounded-xl text-sm font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all cursor-pointer flex items-center justify-center gap-2">
            🔒 Pay $${price} via Paddle
          </button>
          
          <button id="paddle-sim-cancel" class="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 cursor-pointer">
            Cancel
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const cleanup = () => {
    const existing = document.getElementById('paddle-sandbox-checkout-overlay');
    if (existing) existing.remove();
  };

  document.getElementById('paddle-sim-close')?.addEventListener('click', () => {
    cleanup();
    onCancel?.();
  });

  document.getElementById('paddle-sim-cancel')?.addEventListener('click', () => {
    cleanup();
    onCancel?.();
  });

  document.getElementById('paddle-sim-submit')?.addEventListener('click', async () => {
    cleanup();
    try {
      await fetch('/api/paddle/sync-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: options.userId,
          email: userEmail,
          plan,
          customerId: 'ctm_sandbox_sim',
          subscriptionId: 'sub_sandbox_sim',
        }),
      });
    } catch (e) {
      console.warn('[Simulator Sync Warning]', e);
    }
    onSuccess(plan);
  });
}
