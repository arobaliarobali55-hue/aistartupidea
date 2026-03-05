const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const admin = require('firebase-admin');
const rateLimit = require('express-rate-limit');
const { verifyToken } = require('./authMiddleware');
const DodoPayments = require('dodopayments').default;

const app = express();
const PORT = process.env.PORT || 5000;

// --- Firebase Admin Initialization ---
if (!admin.apps.length) {
    admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID
    });
}

// --- Dodo Payments Client ---
const dodo = new DodoPayments({
    bearerToken: process.env.DODO_API_KEY,
    environment: 'live_mode', // Use 'test_mode' for sandbox
});

// Map plan IDs to Dodo product IDs
const PLAN_PRODUCT_MAP = {
    pro: process.env.DODO_PRO_PRODUCT_ID,
    founder: process.env.DODO_FOUNDER_PRODUCT_ID,
};

// Plan limits
const PLAN_LIMITS = {
    free: 2,
    pro: 20,
    founder: 999999,
};

// --- Rate Limiting ---
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATELIMIT_WINDOW_MS) || 60000,
    max: parseInt(process.env.RATELIMIT_MAX) || 100,
    message: { error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// --- CORS Configuration ---
const DEFAULT_ORIGINS = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://aistartupidea-seven.vercel.app',
];

const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : DEFAULT_ORIGINS;

console.log('--- CORS Configuration ---');
console.log('Allowed Origins:', allowedOrigins);

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        if (/^https:\/\/[a-zA-Z0-9-]+-[a-zA-Z0-9-]+\.vercel\.app$/.test(origin) ||
            origin.endsWith('.vercel.app')) {
            return callback(null, true);
        }
        console.warn(`[CORS Blocked] Origin: ${origin}`);
        callback(null, false);
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}));

// --- IMPORTANT: Webhook route must use raw body BEFORE express.json() ---
// We handle this by using express.raw() specifically for the webhook route.
app.use('/api/webhook/dodo', express.raw({ type: 'application/json' }));

app.use(express.json());
app.use('/api/', limiter);

// --- NVIDIA NIM (OpenAI-compatible) API Setup ---
const openai = new OpenAI({
    apiKey: process.env.NVIDIA_API_KEY,
    baseURL: process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1',
});

const NVIDIA_MODEL = process.env.NVIDIA_MODEL_NAME || 'meta/llama-3.1-70b-instruct';

// ─────────────────────────────────────────────
// BASIC ROUTES
// ─────────────────────────────────────────────

app.get('/', (req, res) => {
    res.send('🚀 aistartupidea API is running! Use /api/health for status.');
});

app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        model: NVIDIA_MODEL,
        timestamp: new Date().toISOString()
    });
});

// ─────────────────────────────────────────────
// DODO PAYMENTS: Create Checkout Session
// ─────────────────────────────────────────────

app.post('/api/payments/create-checkout', verifyToken, async (req, res) => {
    const { planId } = req.body;
    const userId = req.user.uid;
    const userEmail = req.user.email;

    if (!planId || !['pro', 'founder'].includes(planId)) {
        return res.status(400).json({ error: 'Invalid plan. Must be "pro" or "founder".' });
    }

    const productId = PLAN_PRODUCT_MAP[planId];
    if (!productId) {
        return res.status(500).json({ error: 'Product ID not configured for this plan.' });
    }

    const frontendUrl = process.env.FRONTEND_URL || 'https://aistartupidea-seven.vercel.app';

    try {
        console.log(`💳 Creating Dodo checkout for user ${userId} (${userEmail}), plan: ${planId}`);

        const payment = await dodo.payments.create({
            billing: {
                city: 'N/A',
                country: 'US',
                state: 'N/A',
                street: 'N/A',
                zipcode: '00000',
            },
            customer: {
                email: userEmail,
                name: req.user.name || userEmail,
            },
            metadata: {
                userId: userId,
                planId: planId,
            },
            payment_link: true,
            product_cart: [
                {
                    product_id: productId,
                    quantity: 1,
                },
            ],
            return_url: `${frontendUrl}/?payment=success&plan=${planId}`,
        });

        const checkoutUrl = payment.payment_link;

        if (!checkoutUrl) {
            throw new Error('Dodo did not return a checkout URL.');
        }

        console.log(`✅ Checkout URL generated for ${planId}: ${checkoutUrl}`);
        res.json({ checkoutUrl });

    } catch (err) {
        console.error('❌ Dodo checkout error:', err);
        res.status(500).json({ error: err.message || 'Failed to create checkout session.' });
    }
});

// ─────────────────────────────────────────────
// DODO PAYMENTS: Webhook Handler
// ─────────────────────────────────────────────

app.post('/api/webhook/dodo', async (req, res) => {
    const webhookSecret = process.env.DODO_WEBHOOK_SECRET;
    const signatureHeader = req.headers['webhook-signature'];

    if (!signatureHeader) {
        console.warn('⚠️ Webhook received with no signature header');
        return res.status(400).json({ error: 'Missing webhook-signature header' });
    }

    // Dodo sends signature as: "t=<timestamp>,v1=<hmac>"
    let timestamp = '';
    let receivedSig = '';
    try {
        const parts = signatureHeader.split(',');
        for (const part of parts) {
            const [key, value] = part.split('=');
            if (key === 't') timestamp = value;
            if (key === 'v1') receivedSig = value;
        }
    } catch (e) {
        console.warn('⚠️ Failed to parse webhook-signature header');
        return res.status(400).json({ error: 'Invalid signature header format' });
    }

    // Build the signed payload: "<timestamp>.<rawBody>"
    const rawBody = req.body; // Buffer, because of express.raw()
    const signedPayload = `${timestamp}.${rawBody.toString('utf8')}`;

    // Strip the "whsec_" prefix and base64-decode the secret
    const secretBase64 = webhookSecret.replace(/^whsec_/, '');
    const secretBytes = Buffer.from(secretBase64, 'base64');

    // Compute expected HMAC-SHA256
    const expectedSig = crypto
        .createHmac('sha256', secretBytes)
        .update(signedPayload)
        .digest('hex');

    if (expectedSig !== receivedSig) {
        console.warn('⚠️ Webhook signature mismatch — request rejected');
        return res.status(401).json({ error: 'Invalid webhook signature' });
    }

    // Parse the verified event
    let event;
    try {
        event = JSON.parse(rawBody.toString('utf8'));
    } catch (e) {
        return res.status(400).json({ error: 'Invalid JSON body' });
    }

    console.log(`📩 Dodo Webhook received: ${event.type}`);

    // Handle successful payment
    if (event.type === 'payment.succeeded') {
        const data = event.data;
        const metadata = data?.metadata || {};
        const userId = metadata.userId;
        const planId = metadata.planId;
        const customerEmail = data?.customer?.email;

        console.log(`💰 Payment succeeded — userId: ${userId}, planId: ${planId}, email: ${customerEmail}`);

        if (!planId || !PLAN_LIMITS[planId]) {
            console.warn('⚠️ Unknown planId in webhook metadata:', planId);
            return res.status(200).json({ received: true }); // still 200 to avoid retries
        }

        try {
            const db = admin.firestore();
            let userRef = null;

            // Prefer userId from metadata (most reliable)
            if (userId) {
                userRef = db.collection('users').doc(userId);
            } else if (customerEmail) {
                // Fallback: look up by email via Firebase Auth
                const userRecord = await admin.auth().getUserByEmail(customerEmail);
                userRef = db.collection('users').doc(userRecord.uid);
            }

            if (!userRef) {
                console.error('❌ Could not resolve user from webhook payload');
                return res.status(200).json({ received: true });
            }

            const planLimit = PLAN_LIMITS[planId];
            await userRef.set({
                plan: planId,
                plan_limit: planLimit,
                plan_activated_at: admin.firestore.FieldValue.serverTimestamp(),
                payment_provider: 'dodopayments',
            }, { merge: true });

            console.log(`✅ Webhook: plan updated to "${planId}" (limit: ${planLimit}) for user ${userId || customerEmail}`);
        } catch (err) {
            console.error('❌ Firestore update failed in webhook:', err.message);
            // Return 200 so Dodo doesn't retry — log the failure separately
        }
    }

    // Always return 200 quickly to acknowledge receipt
    res.status(200).json({ received: true });
});

// ─────────────────────────────────────────────
// AI IDEA GENERATION
// ─────────────────────────────────────────────

app.post('/api/generate', verifyToken, async (req, res) => {
    const { answers, plan, limit } = req.body;
    const userId = req.user.uid;

    if (!answers) {
        return res.status(400).json({ error: 'Answers are required' });
    }

    try {
        console.log('--- New Generation Request ---');
        console.log(`Plan: ${plan || 'free'}, Limit: ${limit || 2}, User: ${userId || 'anonymous'}`);

        const profileData = Object.entries(answers)
            .map(([q, a]) => `${q}: ${a}`)
            .join('\n');

        const generateCount = Math.min(limit || 2, 20);

        const prompt = `You are an expert business consultant. Based on the following user profile, generate ${generateCount} unique and personalized business ideas.

User Profile:
${profileData}

Return the response as a JSON object with key "ideas" containing an array of objects with these fields:
- id (incremental number)
- title (catchy business name)
- description (2-3 sentences max)
- budget (estimated starting cost, e.g., "$500")
- time (estimated weekly commitment, e.g., "10h/week")
- difficulty (one of: "Easy", "Medium", "Hard")

CRITICAL: Heavily weigh the user's interests, experience, and vision to ensure the ideas are deeply personal and not generic.`;

        const generateWithRetry = async (retryCount = 0) => {
            const MAX_RETRIES = 3;
            try {
                return await openai.chat.completions.create({
                    model: NVIDIA_MODEL,
                    messages: [
                        { role: 'system', content: "You are a business idea generator. Return only valid JSON array of business ideas. Follow the requested format exactly." },
                        { role: 'user', content: prompt }
                    ],
                    response_format: { type: "json_object" },
                    timeout: 60000
                });
            } catch (error) {
                const isRetryable = error.status === 503 || error.status === 429 ||
                    error.message.includes('busy') || error.message.includes('timeout');

                if (isRetryable && retryCount < MAX_RETRIES) {
                    const delay = Math.pow(2, retryCount) * 2000;
                    console.log(`⚠️ AI Busy/Rate Limited (${error.status || 'timeout'}). Retrying in ${delay / 1000}s... (Attempt ${retryCount + 1}/${MAX_RETRIES})`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    return generateWithRetry(retryCount + 1);
                }
                throw error;
            }
        };

        const completion = await generateWithRetry();
        const text = completion.choices[0].message.content;
        console.log('✅ AI Response received');

        if (!text || text.trim() === '') {
            throw new Error('AI returned an empty response');
        }

        let ideasJson;
        try {
            ideasJson = JSON.parse(text);
        } catch (e) {
            console.warn('⚠️ JSON Parse Error, attempting recovery...');
            const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
            if (match) {
                try {
                    ideasJson = JSON.parse(match[0]);
                } catch (innerE) {
                    throw new Error('AI returned invalid JSON format and recovery failed');
                }
            } else {
                throw new Error('AI returned non-JSON response');
            }
        }

        const rawIdeas = ideasJson.ideas || ideasJson.business_ideas || (Array.isArray(ideasJson) ? ideasJson : Object.values(ideasJson)[0]) || [];
        const ideas = Array.isArray(rawIdeas) ? rawIdeas : [];

        if (ideas.length === 0) {
            console.warn('⚠️ No ideas found in AI response');
        }

        console.log(`✅ Final count: ${ideas.length} ideas`);
        res.json(ideas);
    } catch (error) {
        console.error('❌ Generator Failure:', error.message);

        let errorMessage = error.message || 'Failed to generate ideas.';
        let statusCode = 500;

        if (error.status === 503 || error.message.includes('503')) {
            errorMessage = 'The AI model is currently under very high demand. Please wait a moment and try again.';
            statusCode = 503;
        } else if (error.status === 429 || error.message.includes('429')) {
            errorMessage = 'Too many requests. Please wait a moment.';
            statusCode = 429;
        }

        res.status(statusCode).json({ error: errorMessage });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 aistartupidea Backend running on port ${PORT}`);
    console.log(`✨ NVIDIA NIM AI Engine Initialized (${NVIDIA_MODEL})`);
    console.log(`🔒 Security: Rate Limiting and Firebase Auth enabled`);
    console.log(`💳 Dodo Payments: Checkout + Webhook handlers active`);
    console.log(`🌐 CORS Enabled for origins: ${JSON.stringify(allowedOrigins)}`);
});
