import { Firestore } from '@google-cloud/firestore';
import fs from 'fs';
import path from 'path';

let firestoreAdmin: Firestore | null = null;
let firebaseConfig: any = null;

function loadFirebaseConfig() {
  if (firebaseConfig) return firebaseConfig;
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    try {
      firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch (err) {
      console.error('[Firebase Config Error]', err);
    }
  }
  return firebaseConfig;
}

export function getFirestoreAdmin(): Firestore | null {
  if (firestoreAdmin) return firestoreAdmin;
  const cfg = loadFirebaseConfig();
  const projectId = process.env.FIREBASE_PROJECT_ID || cfg?.projectId || 'resonant-elixir-sr6mz';
  const databaseId = process.env.FIREBASE_DATABASE_ID || cfg?.firestoreDatabaseId || 'ai-studio-v2contentpilotai-1c1dbe18-f890-46fb-8323-888630be48cf';

  try {
    firestoreAdmin = new Firestore({
      projectId,
      databaseId,
    });
    return firestoreAdmin;
  } catch (err) {
    console.warn('[Server Firestore Warning] Native Firestore admin client not available, using REST API:', err);
    return null;
  }
}

export interface UserPlanUpdateParams {
  userId?: string | null;
  email?: string | null;
  customerId?: string | null;
  subscriptionId?: string | null;
  status?: string | null;
  billingCycle?: 'monthly' | 'yearly';
  priceId?: string | null;
  plan: 'starter' | 'pro' | 'unlimited' | 'free';
}

/**
 * Check if a Paddle event was already processed (Idempotency)
 */
export async function isPaddleEventProcessed(eventId: string): Promise<boolean> {
  if (!eventId) return false;
  const adminDb = getFirestoreAdmin();
  if (adminDb) {
    try {
      const docSnap = await adminDb.collection('paddle_events').doc(eventId).get();
      return docSnap.exists;
    } catch (err) {
      console.warn('[Idempotency Check Warning - Admin DB]', err);
    }
  }

  // Fallback REST check
  const cfg = loadFirebaseConfig();
  if (!cfg?.apiKey || !cfg?.projectId) return false;
  const dbId = cfg.firestoreDatabaseId || '(default)';
  const url = `https://firestore.googleapis.com/v1/projects/${cfg.projectId}/databases/${dbId}/documents/paddle_events/${eventId}?key=${cfg.apiKey}`;
  try {
    const res = await fetch(url);
    return res.status === 200;
  } catch {
    return false;
  }
}

/**
 * Record a processed Paddle event (Idempotency)
 */
export async function recordPaddleEvent(eventId: string, eventData: any) {
  if (!eventId) return;
  const adminDb = getFirestoreAdmin();
  const record = {
    eventId,
    eventType: eventData.eventType || eventData.event_type || 'unknown',
    occurredAt: eventData.occurredAt || eventData.occurred_at || new Date().toISOString(),
    processedAt: new Date().toISOString(),
    userId: eventData.userId || null,
    plan: eventData.plan || null,
    status: 'completed',
  };

  if (adminDb) {
    try {
      await adminDb.collection('paddle_events').doc(eventId).set(record);
      return;
    } catch (err) {
      console.warn('[Record Event Warning - Admin DB]', err);
    }
  }

  // Fallback REST write
  const cfg = loadFirebaseConfig();
  if (!cfg?.apiKey || !cfg?.projectId) return;
  const dbId = cfg.firestoreDatabaseId || '(default)';
  const url = `https://firestore.googleapis.com/v1/projects/${cfg.projectId}/databases/${dbId}/documents/paddle_events/${eventId}?key=${cfg.apiKey}`;
  try {
    await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          eventId: { stringValue: record.eventId },
          eventType: { stringValue: record.eventType },
          occurredAt: { stringValue: record.occurredAt },
          processedAt: { stringValue: record.processedAt },
          userId: { stringValue: record.userId || '' },
          plan: { stringValue: record.plan || '' },
          status: { stringValue: record.status },
        },
      }),
    });
  } catch (err) {
    console.error('[Record Event Fallback Error]', err);
  }
}

/**
 * Find user document ID by userId, email, or paddleCustomerId
 */
export async function findUserDocId(params: { userId?: string | null; email?: string | null; customerId?: string | null }): Promise<string | null> {
  const { userId, email, customerId } = params;
  const adminDb = getFirestoreAdmin();

  if (adminDb) {
    // 1. Direct ID check
    if (userId) {
      try {
        const directDoc = await adminDb.collection('users').doc(userId).get();
        if (directDoc.exists) return userId;
      } catch (e) {
        console.warn('[Admin DB directDoc check error]', e);
      }
    }

    // 2. Query by email
    if (email) {
      try {
        const emailSnap = await adminDb.collection('users').where('email', '==', email.toLowerCase().trim()).limit(1).get();
        if (!emailSnap.empty) {
          return emailSnap.docs[0].id;
        }
      } catch (e) {
        console.warn('[Admin DB email query error]', e);
      }
    }

    // 3. Query by paddleCustomerId
    if (customerId) {
      try {
        const custSnap = await adminDb.collection('users').where('paddleCustomerId', '==', customerId).limit(1).get();
        if (!custSnap.empty) {
          return custSnap.docs[0].id;
        }
      } catch (e) {
        console.warn('[Admin DB customerId query error]', e);
      }
    }
  }

  // REST API Fallback Query
  const cfg = loadFirebaseConfig();
  if (cfg?.apiKey && cfg?.projectId) {
    const dbId = cfg.firestoreDatabaseId || '(default)';

    // Direct check by userId
    if (userId) {
      const getUrl = `https://firestore.googleapis.com/v1/projects/${cfg.projectId}/databases/${dbId}/documents/users/${userId}?key=${cfg.apiKey}`;
      try {
        const res = await fetch(getUrl);
        if (res.status === 200) return userId;
      } catch {}
    }

    // Query by email
    if (email) {
      const queryUrl = `https://firestore.googleapis.com/v1/projects/${cfg.projectId}/databases/${dbId}/documents:runQuery?key=${cfg.apiKey}`;
      try {
        const res = await fetch(queryUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            structuredQuery: {
              from: [{ collectionId: 'users' }],
              where: {
                fieldFilter: {
                  field: { fieldPath: 'email' },
                  op: 'EQUAL',
                  value: { stringValue: email.toLowerCase().trim() },
                },
              },
              limit: 1,
            },
          }),
        });
        if (res.ok) {
          const results = await res.json();
          if (Array.isArray(results) && results[0]?.document?.name) {
            const parts = results[0].document.name.split('/');
            return parts[parts.length - 1];
          }
        }
      } catch (e) {
        console.warn('[REST runQuery email error]', e);
      }
    }

    // Query by customerId
    if (customerId) {
      const queryUrl = `https://firestore.googleapis.com/v1/projects/${cfg.projectId}/databases/${dbId}/documents:runQuery?key=${cfg.apiKey}`;
      try {
        const res = await fetch(queryUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            structuredQuery: {
              from: [{ collectionId: 'users' }],
              where: {
                fieldFilter: {
                  field: { fieldPath: 'paddleCustomerId' },
                  op: 'EQUAL',
                  value: { stringValue: customerId },
                },
              },
              limit: 1,
            },
          }),
        });
        if (res.ok) {
          const results = await res.json();
          if (Array.isArray(results) && results[0]?.document?.name) {
            const parts = results[0].document.name.split('/');
            return parts[parts.length - 1];
          }
        }
      } catch (e) {
        console.warn('[REST runQuery customerId error]', e);
      }
    }
  }

  // Fallback direct check if userId provided
  if (userId) return userId;
  return null;
}

/**
 * Link Paddle Customer ID to Firebase User profile
 */
export async function linkPaddleCustomer(params: {
  userId?: string | null;
  email?: string | null;
  customerId: string;
}): Promise<boolean> {
  const { userId, email, customerId } = params;
  if (!customerId) return false;

  const targetUid = await findUserDocId({ userId, email, customerId });
  if (!targetUid) {
    console.log(`[Paddle Customer Link] No matching Firebase user yet for customer ${customerId} (${email || userId})`);
    return false;
  }

  console.log(`[Paddle Customer Link] Linking paddleCustomerId ${customerId} to Firebase User ${targetUid}`);
  const nowIso = new Date().toISOString();
  const adminDb = getFirestoreAdmin();

  if (adminDb) {
    try {
      await adminDb.collection('users').doc(targetUid).update({
        paddleCustomerId: customerId,
        updatedAt: nowIso,
      });
      return true;
    } catch (err) {
      console.warn('[Admin DB Link Customer Error]', err);
    }
  }

  // REST Fallback
  const cfg = loadFirebaseConfig();
  if (cfg?.apiKey && cfg?.projectId) {
    const dbId = cfg.firestoreDatabaseId || '(default)';
    const url = `https://firestore.googleapis.com/v1/projects/${cfg.projectId}/databases/${dbId}/documents/users/${targetUid}?updateMask.fieldPaths=paddleCustomerId&updateMask.fieldPaths=updatedAt&key=${cfg.apiKey}`;
    try {
      const res = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: {
            paddleCustomerId: { stringValue: customerId },
            updatedAt: { stringValue: nowIso },
          },
        }),
      });
      return res.ok;
    } catch (e) {
      console.error('[REST Link Customer Error]', e);
    }
  }
  return false;
}

/**
 * Update user plan and Paddle metadata in Firestore
 */
export async function updateUserSubscription(params: UserPlanUpdateParams): Promise<{ success: boolean; targetUserId?: string; plan: string; message: string }> {
  const { userId, email, customerId, subscriptionId, status, billingCycle, priceId, plan } = params;
  const adminDb = getFirestoreAdmin();

  let targetUid = await findUserDocId({ userId, email, customerId });
  if (!targetUid && userId) targetUid = userId;

  console.log(`[Fulfillment] Processing user subscription update:`, {
    targetUid,
    email,
    customerId,
    subscriptionId,
    plan,
    billingCycle: billingCycle || 'monthly',
    priceId,
    status,
  });

  const nowIso = new Date().toISOString();
  const updatePayload: Record<string, any> = {
    plan,
    billingCycle: billingCycle || 'monthly',
    updatedAt: nowIso,
  };

  if (customerId) updatePayload.paddleCustomerId = customerId;
  if (subscriptionId) updatePayload.paddleSubscriptionId = subscriptionId;
  if (status) updatePayload.subscriptionStatus = status;
  if (priceId) updatePayload.paddlePriceId = priceId;

  if (adminDb && targetUid) {
    try {
      const userRef = adminDb.collection('users').doc(targetUid);
      const userSnap = await userRef.get();

      if (userSnap.exists) {
        await userRef.update(updatePayload);
      } else {
        // Create initial record
        const todayStr = new Date().toISOString().split('T')[0];
        const currentMonthStr = new Date().toISOString().slice(0, 7);
        await userRef.set({
          uid: targetUid,
          email: email || '',
          displayName: email ? email.split('@')[0] : 'User',
          photoURL: null,
          plan,
          billingCycle: billingCycle || 'monthly',
          bonusGenerations: plan === 'free' ? 3 : 0,
          dailyGenerationsCount: 0,
          lastGenerationDate: todayStr,
          monthlyGenerationsCount: 0,
          lastGenerationMonth: currentMonthStr,
          createdAt: nowIso,
          ...updatePayload,
        });
      }

      console.log(`[Fulfillment Success] Updated Firestore user document ${targetUid} -> Plan: ${plan.toUpperCase()} (${(billingCycle || 'monthly').toUpperCase()})`);
      return { success: true, targetUserId: targetUid, plan, message: `Successfully updated user ${targetUid} to ${plan} (${billingCycle || 'monthly'})` };
    } catch (err: any) {
      console.error('[Fulfillment Admin DB Error]', err);
    }
  }

  // REST API Fallback
  const cfg = loadFirebaseConfig();
  if (cfg?.apiKey && cfg?.projectId && targetUid) {
    const dbId = cfg.firestoreDatabaseId || '(default)';
    const fieldPaths = ['plan', 'billingCycle', 'paddleCustomerId', 'paddleSubscriptionId', 'paddlePriceId', 'subscriptionStatus', 'updatedAt']
      .map(p => `updateMask.fieldPaths=${p}`)
      .join('&');
    const url = `https://firestore.googleapis.com/v1/projects/${cfg.projectId}/databases/${dbId}/documents/users/${targetUid}?${fieldPaths}&key=${cfg.apiKey}`;

    try {
      const fields: Record<string, any> = {
        plan: { stringValue: plan },
        billingCycle: { stringValue: billingCycle || 'monthly' },
        updatedAt: { stringValue: nowIso },
      };
      if (customerId) fields.paddleCustomerId = { stringValue: customerId };
      if (subscriptionId) fields.paddleSubscriptionId = { stringValue: subscriptionId };
      if (status) fields.subscriptionStatus = { stringValue: status };
      if (priceId) fields.paddlePriceId = { stringValue: priceId };

      const res = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields }),
      });

      if (res.ok) {
        console.log(`[Fulfillment REST Success] Updated user ${targetUid} to plan: ${plan.toUpperCase()} (${(billingCycle || 'monthly').toUpperCase()})`);
        return { success: true, targetUserId: targetUid, plan, message: `Updated user ${targetUid} to ${plan} via REST` };
      } else {
        const errText = await res.text();
        console.error('[Fulfillment REST Error Response]', res.status, errText);
      }
    } catch (restErr) {
      console.error('[Fulfillment REST Fetch Error]', restErr);
    }
  }

  if (!targetUid) {
    const msg = `Could not find existing Firebase user for email: ${email} / customer: ${customerId} / userId: ${userId}`;
    console.warn(`[Fulfillment Warning] ${msg}`);
    return { success: false, plan, message: msg };
  }

  return { success: false, targetUserId: targetUid, plan, message: 'Failed to update Firestore user document' };
}

