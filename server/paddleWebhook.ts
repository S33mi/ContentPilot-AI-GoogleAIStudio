import { Request, Response } from 'express';
import crypto from 'crypto';
import { isPaddleEventProcessed, recordPaddleEvent, updateUserSubscription, linkPaddleCustomer } from './firestore';

/**
 * Probe handler for GET / HEAD / OPTIONS requests to webhook URL
 * Ensures dashboard pings, uptime monitors, or browsers receive a clean 200 OK
 */
export function paddleWebhookProbeHandler(_req: Request, res: Response) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Content-Type', 'application/json');
  return res.status(200).json({
    status: 'ok',
    message: 'ContentPilot AI Paddle Webhook Endpoint is active and listening for POST events.',
    endpoint: '/api/paddle-webhook',
    timestamp: new Date().toISOString(),
  });
}

/**
 * Verifies Paddle Billing (v2) webhook signature
 * Header format: ts=1671552777;h1=eb38799c4e99f075b...
 */
export function verifyPaddleWebhookSignature(
  rawBody: string,
  signatureHeader: string | undefined,
  secretKey: string | undefined
): { isValid: boolean; reason?: string } {
  if (!secretKey) {
    console.warn('[Paddle Webhook] PADDLE_WEBHOOK_SECRET_KEY is not configured in .env. Skipping signature check in sandbox/development.');
    return { isValid: true, reason: 'Secret key not set (sandbox/dev mode)' };
  }

  if (!signatureHeader) {
    return { isValid: false, reason: 'Missing Paddle-Signature header' };
  }

  try {
    const parts = signatureHeader.split(';');
    let ts = '';
    const hashes: string[] = [];

    for (const part of parts) {
      const [k, v] = part.split('=');
      if (k?.trim() === 'ts') ts = v?.trim();
      if (k?.trim() === 'h1') hashes.push(v?.trim());
    }

    if (!ts || hashes.length === 0) {
      return { isValid: false, reason: 'Malformed Paddle-Signature header (missing ts or h1)' };
    }

    // Check timestamp freshness (within 1 hour / 3600 seconds)
    const timestampSec = parseInt(ts, 10);
    const nowSec = Math.floor(Date.now() / 1000);
    if (isNaN(timestampSec) || Math.abs(nowSec - timestampSec) > 3600) {
      console.warn(`[Paddle Webhook] Timestamp delta notice: ts=${timestampSec}, now=${nowSec}`);
    }

    const payloadToSign = `${ts}:${rawBody}`;
    const expectedHash = crypto
      .createHmac('sha256', secretKey)
      .update(payloadToSign)
      .digest('hex');

    const matches = hashes.some((h) => {
      if (h.length !== expectedHash.length) return false;
      return crypto.timingSafeEqual(Buffer.from(h, 'utf8'), Buffer.from(expectedHash, 'utf8'));
    });

    if (!matches) {
      console.error('[Paddle Webhook] Signature mismatch.', {
        providedHashes: hashes,
        expectedHash,
        ts,
      });
      return { isValid: false, reason: 'Signature HMAC mismatch' };
    }

    return { isValid: true };
  } catch (err: any) {
    return { isValid: false, reason: `Verification error: ${err.message}` };
  }
}

/**
 * Information extracted from Paddle event regarding plan and billing cycle
 */
export interface ResolvedPlanDetails {
  plan: 'starter' | 'pro' | 'unlimited' | 'free';
  billingCycle: 'monthly' | 'yearly';
  priceId?: string;
  monthlyLimit: number | 'unlimited';
  description: string;
}

/**
 * Resolves full plan details (plan tier, billing cycle, price ID, generation limits)
 * from Paddle event payload (transaction, subscription items, custom_data, etc.)
 */
export function resolvePlanDetailsFromPaddleEvent(data: any): ResolvedPlanDetails {
  let detectedPlan: 'starter' | 'pro' | 'unlimited' | 'free' | null = null;
  let detectedCycle: 'monthly' | 'yearly' = 'monthly';
  let matchedPriceId: string | undefined = undefined;

  // 1. Direct plan & billingCycle in custom_data
  const customPlan = data?.custom_data?.plan || data?.custom_data?.planTier;
  const customCycle = data?.custom_data?.billingCycle || data?.custom_data?.cycle || data?.custom_data?.interval;

  if (customCycle) {
    const c = String(customCycle).toLowerCase().trim();
    if (c === 'yearly' || c === 'annual' || c === 'year') {
      detectedCycle = 'yearly';
    } else if (c === 'monthly' || c === 'month') {
      detectedCycle = 'monthly';
    }
  }

  if (customPlan) {
    const p = String(customPlan).toLowerCase().trim();
    if (p === 'unlimited' || p === 'pro' || p === 'starter' || p === 'free') {
      detectedPlan = p as any;
    }
  }

  // 2. Extract Price IDs and item details from subscription or transaction items
  const items: any[] = [];
  if (Array.isArray(data?.items)) items.push(...data.items);
  if (Array.isArray(data?.details?.line_items)) items.push(...data.details.line_items);
  if (data?.item) items.push(data.item);

  // Price mappings from environment
  const starterMonthly = (process.env.VITE_PADDLE_PRICE_STARTER_MONTHLY || process.env.PADDLE_PRICE_STARTER_MONTHLY || '').trim();
  const starterYearly = (process.env.VITE_PADDLE_PRICE_STARTER_YEARLY || process.env.PADDLE_PRICE_STARTER_YEARLY || '').trim();
  const proMonthly = (process.env.VITE_PADDLE_PRICE_PRO_MONTHLY || process.env.PADDLE_PRICE_PRO_MONTHLY || '').trim();
  const proYearly = (process.env.VITE_PADDLE_PRICE_PRO_YEARLY || process.env.PADDLE_PRICE_PRO_YEARLY || '').trim();
  const unlimitedMonthly = (process.env.VITE_PADDLE_PRICE_UNLIMITED_MONTHLY || process.env.PADDLE_PRICE_UNLIMITED_MONTHLY || '').trim();
  const unlimitedYearly = (process.env.VITE_PADDLE_PRICE_UNLIMITED_YEARLY || process.env.PADDLE_PRICE_UNLIMITED_YEARLY || '').trim();

  for (const itm of items) {
    const pid = itm?.price?.id || itm?.price_id || itm?.id;
    if (pid) {
      matchedPriceId = pid;
      // Check price matching
      if (starterYearly && pid === starterYearly) {
        detectedPlan = 'starter';
        detectedCycle = 'yearly';
        break;
      }
      if (starterMonthly && pid === starterMonthly) {
        detectedPlan = 'starter';
        detectedCycle = 'monthly';
        break;
      }
      if (proYearly && pid === proYearly) {
        detectedPlan = 'pro';
        detectedCycle = 'yearly';
        break;
      }
      if (proMonthly && pid === proMonthly) {
        detectedPlan = 'pro';
        detectedCycle = 'monthly';
        break;
      }
      if (unlimitedYearly && pid === unlimitedYearly) {
        detectedPlan = 'unlimited';
        detectedCycle = 'yearly';
        break;
      }
      if (unlimitedMonthly && pid === unlimitedMonthly) {
        detectedPlan = 'unlimited';
        detectedCycle = 'monthly';
        break;
      }
    }

    // Check billing_cycle or description inside item price object
    const billingPeriod = itm?.price?.billing_cycle?.interval || itm?.billing_cycle?.interval || itm?.price?.interval;
    if (billingPeriod) {
      const interval = String(billingPeriod).toLowerCase();
      if (interval.includes('year') || interval.includes('annual')) detectedCycle = 'yearly';
      else if (interval.includes('month')) detectedCycle = 'monthly';
    }

    const itemDesc = (itm?.price?.description || itm?.price?.name || itm?.product?.name || '').toLowerCase();
    if (itemDesc.includes('year') || itemDesc.includes('annual')) detectedCycle = 'yearly';
    if (!detectedPlan) {
      if (itemDesc.includes('unlimited')) detectedPlan = 'unlimited';
      else if (itemDesc.includes('starter')) detectedPlan = 'starter';
      else if (itemDesc.includes('pro')) detectedPlan = 'pro';
    }
  }

  // 3. Check entire payload json for fallback keywords
  if (!detectedPlan) {
    const jsonStr = JSON.stringify(data).toLowerCase();
    if (jsonStr.includes('unlimited')) detectedPlan = 'unlimited';
    else if (jsonStr.includes('starter')) detectedPlan = 'starter';
    else if (jsonStr.includes('pro')) detectedPlan = 'pro';
    else detectedPlan = 'starter';
  }

  // Check recurring interval in subscription top-level object
  const topInterval = data?.billing_cycle?.interval || data?.current_billing_period?.interval;
  if (topInterval) {
    if (String(topInterval).toLowerCase().includes('year')) detectedCycle = 'yearly';
  }

  // Monthly generation limits
  let monthlyLimit: number | 'unlimited' = 60;
  if (detectedPlan === 'unlimited') monthlyLimit = 'unlimited';
  else if (detectedPlan === 'pro') monthlyLimit = 200;
  else if (detectedPlan === 'starter') monthlyLimit = 60;
  else monthlyLimit = 0;

  return {
    plan: detectedPlan,
    billingCycle: detectedCycle,
    priceId: matchedPriceId,
    monthlyLimit,
    description: `${detectedPlan.toUpperCase()} (${detectedCycle.toUpperCase()}) - ${monthlyLimit} generations/mo`,
  };
}

/**
 * Resolves plan tier (starter, pro, unlimited, free) from Paddle event payload (backward compatibility helper)
 */
export function resolvePlanFromPaddleEvent(data: any): 'starter' | 'pro' | 'unlimited' | 'free' {
  return resolvePlanDetailsFromPaddleEvent(data).plan;
}

/**
 * Paddle Webhook Request Handler
 */
export async function paddleWebhookHandler(req: Request, res: Response) {
  const signatureHeader = (req.headers['paddle-signature'] || req.headers['Paddle-Signature']) as string | undefined;
  const rawBody = (req as any).rawBody || (typeof req.body === 'string' ? req.body : JSON.stringify(req.body));
  const secretKey = process.env.PADDLE_WEBHOOK_SECRET_KEY || process.env.PADDLE_SIGNING_SECRET;

  console.log(`\n======================================================`);
  console.log(`[Paddle Webhook Received] ${new Date().toISOString()}`);
  console.log(`Headers: Paddle-Signature: ${signatureHeader ? `${signatureHeader.slice(0, 32)}...` : 'None'}`);

  // 1. Verify Signature
  const verification = verifyPaddleWebhookSignature(rawBody, signatureHeader, secretKey);
  if (!verification.isValid) {
    console.error(`[Paddle Webhook Rejected] Signature verification failed: ${verification.reason}`);
    return res.status(401).json({ error: 'Invalid webhook signature', reason: verification.reason });
  }

  console.log(`[Paddle Webhook Verified] Signature is valid.`);

  const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const eventId = payload?.event_id;
  const eventType = payload?.event_type;
  const data = payload?.data || {};

  console.log(`[Paddle Event Details] ID: ${eventId} | Type: ${eventType} | Occurred At: ${payload?.occurred_at}`);

  if (!eventId || !eventType) {
    console.warn('[Paddle Webhook] Missing event_id or event_type in payload');
    return res.status(400).json({ error: 'Missing event_id or event_type' });
  }

  // 2. Idempotency Check
  const alreadyProcessed = await isPaddleEventProcessed(eventId);
  if (alreadyProcessed) {
    console.log(`[Paddle Webhook Idempotency] Event ${eventId} was already processed. Returning 200 OK.`);
    return res.status(200).json({ status: 'success', message: 'Event already processed', eventId });
  }

  try {
    let resultMessage = 'Acknowledged event';
    let assignedPlan: 'starter' | 'pro' | 'unlimited' | 'free' = 'free';

    // 3. Event Processing
    switch (eventType) {
      case 'transaction.completed': {
        const customerId = data.customer_id;
        const subscriptionId = data.subscription_id;
        const userEmail = data.custom_data?.userEmail || data.customer?.email || data.custom_data?.email;
        const userId = data.custom_data?.userId;
        const planDetails = resolvePlanDetailsFromPaddleEvent(data);
        assignedPlan = planDetails.plan;

        console.log(`[Paddle transaction.completed] User: ${userId || userEmail || 'unknown'} | Customer: ${customerId} -> Plan: ${planDetails.description} (Txn: ${data.id})`);

        const updateRes = await updateUserSubscription({
          userId,
          email: userEmail,
          customerId,
          subscriptionId,
          status: 'active',
          plan: planDetails.plan,
          billingCycle: planDetails.billingCycle,
          priceId: planDetails.priceId,
        });

        resultMessage = updateRes.message;
        break;
      }

      case 'subscription.created':
      case 'subscription.updated':
      case 'subscription.activated':
      case 'subscription.resumed': {
        const customerId = data.customer_id;
        const subscriptionId = data.id;
        const status = data.status; // 'active', 'trialing', 'past_due', 'paused', 'canceled'
        const userEmail = data.custom_data?.userEmail || data.customer?.email || data.custom_data?.email;
        const userId = data.custom_data?.userId;

        if (status === 'canceled') {
          console.log(`[Paddle ${eventType}] Subscription status is 'canceled' -> Downgrading to FREE plan`);
          const updateRes = await updateUserSubscription({
            userId,
            email: userEmail,
            customerId,
            subscriptionId,
            status: 'canceled',
            plan: 'free',
            billingCycle: 'monthly',
          });
          assignedPlan = 'free';
          resultMessage = updateRes.message;
        } else {
          const planDetails = resolvePlanDetailsFromPaddleEvent(data);
          assignedPlan = planDetails.plan;
          console.log(`[Paddle ${eventType}] Sub ID: ${subscriptionId} | Customer: ${customerId} | Status: ${status} | Plan: ${planDetails.description}`);

          const updateRes = await updateUserSubscription({
            userId,
            email: userEmail,
            customerId,
            subscriptionId,
            status: status || 'active',
            plan: planDetails.plan,
            billingCycle: planDetails.billingCycle,
            priceId: planDetails.priceId,
          });
          resultMessage = updateRes.message;
        }
        break;
      }

      case 'subscription.past_due':
      case 'subscription.paused': {
        const customerId = data.customer_id;
        const subscriptionId = data.id;
        const status = data.status || eventType.replace('subscription.', '');
        const userEmail = data.custom_data?.userEmail || data.customer?.email || data.custom_data?.email;
        const userId = data.custom_data?.userId;
        const planDetails = resolvePlanDetailsFromPaddleEvent(data);
        assignedPlan = planDetails.plan;

        console.log(`[Paddle ${eventType}] Sub ID: ${subscriptionId} | Status: ${status} | Retaining plan: ${planDetails.description}`);

        // Retain plan access while updating status in Firestore
        const updateRes = await updateUserSubscription({
          userId,
          email: userEmail,
          customerId,
          subscriptionId,
          status,
          plan: planDetails.plan,
          billingCycle: planDetails.billingCycle,
          priceId: planDetails.priceId,
        });
        resultMessage = updateRes.message;
        break;
      }

      case 'subscription.canceled':
      case 'subscription.cancelled': {
        const customerId = data.customer_id;
        const subscriptionId = data.id;
        const userEmail = data.custom_data?.userEmail || data.customer?.email || data.custom_data?.email;
        const userId = data.custom_data?.userId;

        console.log(`[Paddle subscription.canceled] Sub ID: ${subscriptionId} | Customer: ${customerId} -> Downgrading user to FREE plan`);

        const updateRes = await updateUserSubscription({
          userId,
          email: userEmail,
          customerId,
          subscriptionId,
          status: 'canceled',
          plan: 'free',
          billingCycle: 'monthly',
        });

        assignedPlan = 'free';
        resultMessage = updateRes.message;
        break;
      }

      case 'customer.created':
      case 'customer.updated': {
        const customerId = data.id;
        const userEmail = data.email || data.custom_data?.userEmail || data.custom_data?.email;
        const userId = data.custom_data?.userId;

        console.log(`[Paddle ${eventType}] Linking customer ID ${customerId} to user (Email: ${userEmail}, UserId: ${userId})`);

        if (customerId) {
          await linkPaddleCustomer({
            customerId,
            email: userEmail,
            userId,
          });
        }
        resultMessage = `Linked customer ${customerId}`;
        break;
      }

      default:
        console.log(`[Paddle Webhook] Received event type: ${eventType} (Acknowledged with 200 OK)`);
        resultMessage = `Acknowledged event type ${eventType}`;
        break;
    }

    // 4. Mark Event as Processed (Idempotency)
    await recordPaddleEvent(eventId, {
      eventType,
      occurredAt: payload.occurred_at,
      userId: data.custom_data?.userId,
      plan: assignedPlan,
    });

    console.log(`[Paddle Webhook Completed] ${resultMessage}`);
    console.log(`======================================================\n`);

    return res.status(200).json({
      status: 'success',
      eventId,
      eventType,
      assignedPlan,
      message: resultMessage,
    });
  } catch (err: any) {
    console.error(`[Paddle Webhook Processing Error]`, err);
    return res.status(500).json({ error: 'Internal server error processing webhook', message: err.message });
  }
}

