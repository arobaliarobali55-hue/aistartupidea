const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const admin = require('firebase-admin');
const rateLimit = require('express-rate-limit');
const { verifyToken } = require('./authMiddleware');

const app = express();
const PORT = process.env.PORT || 5000;

// --- Firebase Admin Initialization ---
if (!admin.apps.length) {
    admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID
    });
}

// --- Rate Limiting ---
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATELIMIT_WINDOW_MS) || 60000, // 1 minute
    max: parseInt(process.env.RATELIMIT_MAX) || 100, // Limit each IP to 100 requests per windowMs
    message: { error: 'Too many requests, please try again later.' },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// --- CORS Configuration ---
const DEFAULT_ORIGINS = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://aistartupidea-seven.vercel.app', // production frontend
];

const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : DEFAULT_ORIGINS;

console.log('--- CORS Configuration ---');
console.log('Allowed Origins:', allowedOrigins);

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, Postman)
        if (!origin) return callback(null, true);

        // Check exact match first
        if (allowedOrigins.includes(origin)) return callback(null, true);

        // Allow any *.vercel.app subdomain (covers preview deployments)
        if (/^https:\/\/[a-zA-Z0-9-]+-[a-zA-Z0-9-]+\.vercel\.app$/.test(origin) ||
            origin.endsWith('.vercel.app')) {
            return callback(null, true);
        }

        console.warn(`[CORS Blocked] Origin: ${origin}`);
        console.log(`[CORS Debug] Allowed list: ${JSON.stringify(allowedOrigins)}`);
        callback(null, false);
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}));

app.use(express.json());
app.use('/api/', limiter); // Apply rate limiting to all /api routes

// --- NVIDIA NIM (OpenAI-compatible) API Setup ---
const openai = new OpenAI({
    apiKey: process.env.NVIDIA_API_KEY,
    baseURL: process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1',
});

const NVIDIA_MODEL = process.env.NVIDIA_MODEL_NAME || 'meta/llama-3.1-70b-instruct';

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

app.post('/api/generate', verifyToken, async (req, res) => {
    const { answers, plan, limit } = req.body;
    const userId = req.user.uid; // Securely get UID from verified token

    if (!answers) {
        return res.status(400).json({ error: 'Answers are required' });
    }

    try {
        console.log('--- New Generation Request ---');
        console.log(`Plan: ${plan || 'free'}, Limit: ${limit || 2}, User: ${userId || 'anonymous'}`);

        // Prepare context from answers
        const profileData = Object.entries(answers)
            .map(([q, a]) => `${q}: ${a}`)
            .join('\n');

        const generateCount = Math.min(limit || 2, 20); // Limit AI cost, max 20 per request

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

        // --- Retry Logic for AI Model ---
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
                    timeout: 60000 // 60 second timeout for each AI request
                });
            } catch (error) {
                // OpenAI error codes handling
                const isRetryable = error.status === 503 || error.status === 429 ||
                    error.message.includes('busy') || error.message.includes('timeout');

                if (isRetryable && retryCount < MAX_RETRIES) {
                    const delay = Math.pow(2, retryCount) * 2000; // Increased base delay to 2s
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
    console.log(`🌐 CORS Enabled for origins: ${JSON.stringify(allowedOrigins)}`);
});
