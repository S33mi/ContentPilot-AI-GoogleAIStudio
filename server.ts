import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { paddleWebhookHandler, paddleWebhookProbeHandler } from './server/paddleWebhook';
import { updateUserSubscription } from './server/firestore';

dotenv.config();

const app = express();
const PORT = 3000;

// Enable trust proxy for Cloud Run / reverse proxy environments
app.set('trust proxy', true);

// Disable x-powered-by header
app.disable('x-powered-by');

// ------------------- PADDLE WEBHOOK ROUTING (ZERO REDIRECTS) -------------------
// Match all variants of /api/paddle-webhook and /api/paddle/webhook (with or without trailing slash)
const webhookRouteRegex = /^\/api\/paddle[-_/]webhook\/?$/i;

// Preflight CORS handler
app.options(webhookRouteRegex, (_req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Paddle-Signature, Authorization');
  return res.status(200).end();
});

// GET / HEAD probe handler (returns 200 OK so web tests or uptime checks never 302 or 404)
app.get(webhookRouteRegex, paddleWebhookProbeHandler);
app.head(webhookRouteRegex, (_req, res) => res.status(200).end());

// POST Paddle Webhook Handler with dedicated raw body parsing
app.post(
  webhookRouteRegex,
  express.raw({ type: '*/*', limit: '10mb' }),
  (req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Paddle-Signature');

    // Extract exact raw string for HMAC verification
    if (Buffer.isBuffer(req.body)) {
      (req as any).rawBody = req.body.toString('utf8');
      try {
        req.body = JSON.parse((req as any).rawBody);
      } catch (parseErr) {
        console.warn('[Paddle Webhook] Body is raw string, not standard JSON');
      }
    } else if (typeof req.body === 'string') {
      (req as any).rawBody = req.body;
      try {
        req.body = JSON.parse(req.body);
      } catch {}
    } else if (typeof req.body === 'object' && req.body !== null) {
      (req as any).rawBody = JSON.stringify(req.body);
    }
    next();
  },
  paddleWebhookHandler
);

// ------------------- STANDARD BODY PARSER FOR OTHER API ROUTES -------------------
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Helper to safely get GoogleGenAI client lazily
function getGenAIClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not configured. Please add it in Settings > Secrets.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// ------------------- API ROUTES -------------------

// 1. Generate Social Media Content (7-day content pack)
app.post('/api/generate/social', async (req, res) => {
  try {
    const { business, customGoal, language } = req.body;
    if (!business || !business.name) {
      return res.status(400).json({ error: 'Business details (name, type, tone, etc.) are required.' });
    }

    const ai = getGenAIClient();
    const targetLanguage = language || 'English';

    const prompt = `You are an expert social media content strategist specializing in local small businesses and freelancers.
Create a complete 7-day social media content pack (Instagram, Facebook, X / Twitter, and LinkedIn) for the following business:

BUSINESS PROFILE:
- Business Name: ${business.name}
- Industry/Type: ${business.type || 'Small Business'}
- Location: ${business.location || 'Local'}
- Description: ${business.description || 'Quality local business'}
- Target Audience: ${business.targetAudience || 'Local customers'}
- Brand Tone: ${business.brandTone || 'Friendly and professional'}
- Working Hours: ${business.workingHours || 'Standard hours'}
${customGoal ? `- Special Focus / Campaign Goal: ${customGoal}` : ''}

CRITICAL LANGUAGE REQUIREMENT:
You MUST generate ALL output text values (weeklyTheme, dayLabel, theme, caption, hashtags, callToAction, visualIdea) strictly and fluently in ${targetLanguage}.
Ensure authentic grammar, natural phrasing, and local cultural context in ${targetLanguage}. Keep JSON field keys in English.

REQUIREMENTS:
1. Provide an overall "weeklyTheme" summary title in ${targetLanguage}.
2. Return exactly 7 posts (Day 1 through Day 7).
3. Each post must include:
   - dayNumber: 1 to 7
   - dayLabel: Day label in ${targetLanguage} (e.g., "Day 1", "Day 2", etc.)
   - theme: Catchy topic for the day in ${targetLanguage}.
   - postType: One of: "Single Photo", "Reel / Short Video", "Carousel Post", "Story & Poll", "Behind The Scenes", "Customer Review Spotlight".
   - caption: Natural, engaging, human caption (2-4 sentences) matched to the brand tone in ${targetLanguage}. Include emojis naturally where appropriate.
   - hashtags: Array of 5 to 7 relevant hashtags in ${targetLanguage} (starting with #).
   - callToAction: Clear call to action in ${targetLanguage}.
   - visualIdea: Specific creative recommendation for what image or video clip to post in ${targetLanguage}.

Ensure the content sounds authentic and engaging in ${targetLanguage}.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            weeklyTheme: { type: Type.STRING },
            posts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  dayNumber: { type: Type.INTEGER },
                  dayLabel: { type: Type.STRING },
                  theme: { type: Type.STRING },
                  postType: { type: Type.STRING },
                  caption: { type: Type.STRING },
                  hashtags: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  callToAction: { type: Type.STRING },
                  visualIdea: { type: Type.STRING },
                },
                required: ['dayNumber', 'dayLabel', 'theme', 'postType', 'caption', 'hashtags', 'callToAction', 'visualIdea'],
              },
            },
          },
          required: ['weeklyTheme', 'posts'],
        },
      },
    });

    const rawText = response.text || '{}';
    const data = JSON.parse(rawText);
    return res.json(data);
  } catch (err: any) {
    console.error('Error in /api/generate/social:', err);
    return res.status(500).json({ error: err.message || 'Failed to generate social media content.' });
  }
});

// 2. Generate Product / Service Description
app.post('/api/generate/product', async (req, res) => {
  try {
    const { business, product, language } = req.body;
    if (!business || !product || !product.productName) {
      return res.status(400).json({ error: 'Business details and product/service name are required.' });
    }

    const ai = getGenAIClient();
    const targetLanguage = language || 'English';

    const prompt = `You are a high-converting copywriter for local businesses and independent creators.
Write a compelling product/service description for:

BUSINESS:
- Business Name: ${business.name}
- Industry/Type: ${business.type}
- Brand Tone: ${business.brandTone}
- Target Audience: ${business.targetAudience}

PRODUCT / SERVICE DETAILS:
- Name: ${product.productName}
- Key Features / Ingredients / Highlights: ${product.keyFeatures || 'High quality'}
- Price / Special Offer (optional): ${product.priceOrPromo || 'N/A'}

CRITICAL LANGUAGE REQUIREMENT:
You MUST generate ALL output text values (title, tagline, description, bulletBenefits, suggestedCallToAction) strictly and fluently in ${targetLanguage}.
Ensure authentic grammar, natural phrasing, and high-converting marketing tone in ${targetLanguage}. Keep JSON keys in English.

REQUIREMENTS:
1. title: Catchy product headline or title in ${targetLanguage}.
2. tagline: Memorable 1-line hook/tagline in ${targetLanguage}.
3. description: Compelling description of strictly 60 to 100 words in ${targetLanguage}, focusing on benefits and experience.
4. bulletBenefits: Array of 3 to 4 clear, punchy benefit bullet points in ${targetLanguage}.
5. suggestedCallToAction: Action line in ${targetLanguage}.

Return valid JSON.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            tagline: { type: Type.STRING },
            description: { type: Type.STRING },
            bulletBenefits: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            suggestedCallToAction: { type: Type.STRING },
          },
          required: ['title', 'tagline', 'description', 'bulletBenefits', 'suggestedCallToAction'],
        },
      },
    });

    const rawText = response.text || '{}';
    const data = JSON.parse(rawText);
    return res.json(data);
  } catch (err: any) {
    console.error('Error in /api/generate/product:', err);
    return res.status(500).json({ error: err.message || 'Failed to generate product description.' });
  }
});

// 3. Generate Customer Reply Suggestions
app.post('/api/generate/reply', async (req, res) => {
  try {
    const { business, customerRequest, language } = req.body;
    if (!business || !customerRequest || !customerRequest.customerMessage) {
      return res.status(400).json({ error: 'Business details and customer message are required.' });
    }

    const ai = getGenAIClient();
    const targetLanguage = language || 'English';
    const category = customerRequest.messageType || 'General Message';

    const prompt = `You are a professional customer relations consultant for local small businesses.
Generate 3 distinct reply options for a business responding to a customer message in the category: "${category}".

BUSINESS PROFILE:
- Business Name: ${business.name}
- Industry/Type: ${business.type}
- Location: ${business.location}
- Working Hours: ${business.workingHours}
- Brand Tone: ${business.brandTone}

CUSTOMER MESSAGE DETAILS:
- Selected Category: ${category}
- Customer's Message/Review/Text: "${customerRequest.customerMessage}"

CATEGORY SPECIFIC GUIDELINES:
Ensure all 3 reply options specifically address the customer message according to the selected category ("${category}"):
- If "Review": Address the public review, express appreciation for feedback, and reinforce brand reputation.
- If "Inquiry / Question": Answer the question directly using business details (or polite placeholders if info is missing) and offer next steps.
- If "Complaint": Express sincere empathy, apologize professionally, take ownership, and provide a resolution or direct contact method.
- If "Compliment": Express enthusiastic gratitude, highlight team/brand dedication, and invite them back.
- If "Custom message": Address the specific user-entered text attentively and appropriately according to brand tone.

CRITICAL LANGUAGE REQUIREMENT:
You MUST generate ALL output text values (originalMessageSummary, replyText, whenToUse) strictly and fluently in ${targetLanguage}.
Ensure polite, respectful, and culturally appropriate phrasing in ${targetLanguage}. Keep JSON keys in English.

REQUIREMENTS:
Generate EXACTLY 3 reply options with different tones/styles:
1. "Short & Friendly": Concise, warm, direct response in ${targetLanguage}.
2. "Professional & Polished": Formal, respectful, structured response in ${targetLanguage}.
3. "Warm & Personal": Empathetic, conversational response showing care in ${targetLanguage}.

For each option provide:
- id: unique string key ("short", "professional", "warm")
- style: exact string ("Short & Friendly", "Professional & Polished", "Warm & Personal")
- replyText: complete ready-to-copy response text in ${targetLanguage}.
- whenToUse: 1 sentence advice on when this specific option works best in ${targetLanguage}.

Return valid JSON.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            originalMessageSummary: { type: Type.STRING },
            replies: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  style: { type: Type.STRING },
                  replyText: { type: Type.STRING },
                  whenToUse: { type: Type.STRING },
                },
                required: ['id', 'style', 'replyText', 'whenToUse'],
              },
            },
          },
          required: ['originalMessageSummary', 'replies'],
        },
      },
    });

    const rawText = response.text || '{}';
    const data = JSON.parse(rawText);
    return res.json(data);
  } catch (err: any) {
    console.error('Error in /api/generate/reply:', err);
    return res.status(500).json({ error: err.message || 'Failed to generate customer replies.' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// ------------------- PADDLE CLIENT-SIDE SESSION SYNC -------------------
// Client-side checkout confirmation & synchronization fallback for instant updates
app.post('/api/paddle/sync-session', async (req, res) => {
  try {
    const { userId, email, plan, billingCycle, priceId, customerId, subscriptionId } = req.body;
    if (!userId && !email) {
      return res.status(400).json({ error: 'userId or email is required' });
    }

    const validatedPlan = (['starter', 'pro', 'unlimited', 'free'].includes(plan) ? plan : 'pro') as any;
    const validatedCycle = (['monthly', 'yearly'].includes(billingCycle) ? billingCycle : 'monthly') as any;
    console.log(`[Paddle Sync Session] Updating plan for user ${userId || email} -> ${validatedPlan.toUpperCase()} (${validatedCycle.toUpperCase()})`);

    const result = await updateUserSubscription({
      userId,
      email,
      customerId,
      subscriptionId,
      status: 'active',
      plan: validatedPlan,
      billingCycle: validatedCycle,
      priceId,
    });

    return res.json({ success: true, result });
  } catch (err: any) {
    console.error('[Paddle Sync Session Error]', err);
    return res.status(500).json({ error: err.message || 'Failed to sync session' });
  }
});

// ------------------- VITE / STATIC SERVING -------------------
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ContentPilot AI server running on http://0.0.0.0:${PORT}`);
  });
}

start();
