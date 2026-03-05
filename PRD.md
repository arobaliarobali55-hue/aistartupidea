# 📄 Product Requirements Document (PRD)
# aistartupidea — AI-Powered Business Idea Generator

**Version:** 1.1 (Current / Live)
**Last Updated:** March 2026
**Status:** 🟢 Live in Production

---

## 1. Product Overview

**aistartupidea** (internally: *TemOS*) is an AI-powered SaaS web application that helps aspiring entrepreneurs discover personalized business ideas in under 2 minutes.

Users answer a structured quiz about their skills, budget, availability, and goals. The system feeds those answers into an LLM and returns a set of highly tailored business ideas presented as interactive cards.

> **Tagline:** *"The operating system for your next billion-dollar idea."*

---

## 2. Problem Statement

Aspiring entrepreneurs face three core obstacles:

| Problem | Impact |
|---|---|
| Too many generic ideas online | Information overload, no personalization |
| No clear match to budget or skills | Users pursue unrealistic opportunities |
| No structured starting point | High drop-off before taking action |

**aistartupidea** solves this by generating 2–∞ focused, personalized suggestions based on the user's actual profile — in one sitting.

---

## 3. Target Audience

### Primary Users
- Students aged 16–25 looking for side income
- Aspiring entrepreneurs with no clear direction
- Freelancers seeking new service offerings
- Side-hustle seekers with limited time or capital

### Secondary Users
- Working professionals wanting a second income stream
- Career changers exploring new industries

---

## 4. Current Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React (Vite), Tailwind CSS, Framer Motion |
| **Backend** | Node.js / Express, deployed on **Render** |
| **AI Engine** | NVIDIA NIM API — `meta/llama-3.1-70b-instruct` |
| **Auth** | Firebase Authentication (Email/Password, Google) |
| **Database** | Cloud Firestore |
| **Storage** | Firebase Storage |
| **Hosting** | Vercel (Frontend), Render (Backend) |
| **Rate Limiting** | express-rate-limit |

---

## 5. Core Features (Current MVP — Live)

### 5.1 Landing Page (SaaS Style)
- Hero section with animated CTA
- Social proof / marquee logos
- "How It Works" process section
- Features grid
- Pricing cards with FAQ
- Full footer

### 5.2 Authentication
- Email/Password signup & login
- Google OAuth sign-in
- Firebase Auth state persisted across sessions
- User document auto-created in Firestore on first login

### 5.3 Plan Selection (Onboarding Gate)
New users are routed through a plan selection screen before taking the quiz.

| Plan | Price | Daily Idea Limit |
|---|---|---|
| **Free** | $0 | 2 ideas / day |
| **Pro** | $5 / month | 20 ideas / day |
| **Founder** | $25 / month | Unlimited |

Plan is stored in Firestore (`users/{uid}.plan`). Daily usage is tracked with a `daily_usage` counter and `last_usage_date` field that resets each day.

### 5.4 AI Idea Generation Quiz
- Structured questionnaire (one question per screen)
- Progress indicator
- Answers sent to `/api/generate` endpoint
- Backend verifies Firebase ID token before processing
- Retry logic (up to 3 attempts) for AI model errors

### 5.5 Results View
- Displays generated business ideas as cards
- Each card shows: **title**, **description**, **budget**, **time commitment**, **difficulty**
- Ideas saved automatically to Firestore (`business_ideas` collection)

### 5.6 User Dashboard
- View history of all generated business ideas
- Edit profile details (display name, photo)
- See current plan and daily usage stats
- Option to change plan or retake quiz

---

## 6. User Flow

```
Landing Page
    ↓
"Get My Idea" → [Not logged in? → Auth Screen] → [No plan? → Plan Selection]
    ↓
Quiz (structured questions)
    ↓
Loading Screen ("Analyzing your profile...")
    ↓
Results (AI-generated idea cards)
    ↓
Ideas saved to Dashboard → User can review, upgrade, or retake
```

---

## 7. API Design

### `POST /api/generate`
| Field | Details |
|---|---|
| **Auth** | Bearer token (Firebase ID token) required |
| **Body** | `{ answers, plan, limit }` |
| **Response** | Array of idea objects |
| **Error handling** | 503 (AI busy), 429 (rate limit), 500 (general) |

### `GET /api/health`
Returns `{ status: "ok", model, timestamp }` — used for uptime monitoring.

---

## 8. Security & Compliance

- **Auth middleware** verifies Firebase ID tokens on all protected routes
- **CORS** restricted to production Vercel domain + `*.vercel.app` preview deployments
- **Rate limiting** — 100 requests/minute per IP on all `/api/*` routes
- **Firestore Security Rules** — users can only read/write their own documents
- **`.env` files are gitignored** — secrets are set via environment variables on Render/Vercel

---

## 9. Success Metrics (KPIs)

| Metric | Goal |
|---|---|
| Landing page → quiz start conversion | > 20% |
| Quiz completion rate | > 70% |
| Free → Pro upgrade rate | > 5% |
| Average session duration | > 3 minutes |
| Saved idea rate | > 40% |
| Daily active users (MAU) | Growing MoM |

---

## 10. Known Limitations (Current)

- Payment processing not yet integrated (plans are selected manually / no Stripe)
- No email notifications or drip campaigns
- No idea sharing / social features
- Mobile UI can be improved (quiz flow not fully optimized for small screens)

---

## 11. Phase 2 Roadmap

| Feature | Priority | Notes |
|---|---|---|
| **Stripe payment integration** | 🔴 High | Required for actual revenue |
| **Swipeable Tinder-style idea cards** | 🔴 High | Original design concept |
| **AI-generated step-by-step roadmap** | 🟡 Medium | Per-idea launch plan |
| **Budget calculator** | 🟡 Medium | Help users estimate startup costs |
| **Market competition analysis** | 🟡 Medium | Show competitors per idea |
| **PDF export** | 🟡 Medium | Downloadable idea report |
| **AI mentor chatbot** | 🟢 Low | Follow-up Q&A per idea |
| **Community / sharing** | 🟢 Low | Share ideas publicly |
| **Email drip campaigns** | 🟢 Low | Onboarding & re-engagement |
| **Mobile app (React Native)** | 🟢 Low | Phase 3 |

---

## 12. Out of Scope (MVP)

- Real-time collaboration
- Multi-language support
- Native mobile app
- Stripe / billing (Phase 2)
- Admin panel / analytics dashboard