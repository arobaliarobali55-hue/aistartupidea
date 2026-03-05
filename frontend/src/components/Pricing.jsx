import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Zap, Crown, Sparkles, ChevronDown, ArrowRight, Loader2 } from 'lucide-react';
import { db, auth } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';

// Backend URL — works for local dev and production on Render
const API_BASE = import.meta.env.VITE_API_URL || 'https://aistartupidea.onrender.com';

const plans = [
    {
        id: 'free',
        name: 'Free',
        price: '0',
        period: '',
        tagline: 'Start exploring for free',
        icon: Sparkles,
        iconColor: 'text-white/60',
        borderColor: 'border-white/10',
        buttonStyle: 'bg-white/5 border border-white/10 text-white hover:bg-white/10',
        buttonText: 'Start Building',
        features: [
            '2 AI Ideas / day',
            'Idea Market Analysis',
            'Community Support',
        ],
        limit: 2,
    },
    {
        id: 'pro',
        name: 'Pro',
        price: '$5',
        period: '/month',
        tagline: 'Scale your vision',
        icon: Zap,
        iconColor: 'text-accent',
        borderColor: 'border-accent/40',
        buttonStyle: 'bg-white text-black hover:bg-white/90',
        buttonText: 'Go Pro',
        badge: 'MOST POPULAR',
        features: [
            '20 AI Ideas / day',
            'Advanced Market Metrics',
            'Special Support',
            'Advanced Market Analysis',
        ],
        limit: 20,
        highlight: true,
    },
    {
        id: 'founder',
        name: 'Founder',
        price: '$25',
        period: '/month',
        tagline: 'For serious builders',
        icon: Crown,
        iconColor: 'text-yellow-400',
        borderColor: 'border-white/10',
        buttonStyle: 'bg-white/5 border border-white/10 text-white hover:bg-white/10',
        buttonText: 'Join Founders',
        features: [
            'Everything in Pro',
            'Unlimited Generations',
            'Priority Support',
        ],
        limit: Infinity,
    },
];

const faqs = [
    { q: 'How does the AI work?', a: 'Our AI analyzes your profile, skills, and goals to generate hyper-personalized business ideas using advanced language models trained on thousands of successful ventures.' },
    { q: 'Is my data secure?', a: 'Absolutely. All your data is encrypted at rest and in transit. We never sell or share your information with third parties.' },
    { q: 'Can I cancel anytime?', a: 'Yes. You can cancel your subscription at any time. You will retain access until the end of your billing period.' },
    { q: 'Do you offer academic discounts?', a: 'Yes! Students and educators get 50% off any paid plan. Contact us with your institutional email to apply.' },
];

const FAQItem = ({ q, a }) => {
    const [open, setOpen] = useState(false);
    return (
        <div
            className="border-b border-white/5 py-5 cursor-pointer group"
            onClick={() => setOpen(!open)}
        >
            <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-semibold text-white/80 group-hover:text-white transition-colors">{q}</span>
                <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown className="w-4 h-4 text-white/30 flex-shrink-0" />
                </motion.div>
            </div>
            <motion.div
                initial={false}
                animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="overflow-hidden"
            >
                <p className="text-sm text-white/40 leading-relaxed pt-3">{a}</p>
            </motion.div>
        </div>
    );
};

const Pricing = ({ onSelectPlan, user }) => {
    const [loading, setLoading] = useState(null);

    const handleSelectPlan = async (plan) => {
        if (!user?.uid) {
            toast.error('Please sign in to select a plan.');
            return;
        }

        setLoading(plan.id);

        try {
            // ── Free plan: update Firestore directly (no payment needed) ──
            if (plan.id === 'free') {
                await setDoc(doc(db, 'users', user.uid), {
                    plan: 'free',
                    plan_limit: 2,
                }, { merge: true });

                toast.success('Free plan activated! Start building 🚀');
                if (onSelectPlan) onSelectPlan('free', 2);
                return;
            }

            // ── Paid plans: create a real Dodo checkout session ──
            const idToken = await auth.currentUser.getIdToken();

            const response = await fetch(`${API_BASE}/api/payments/create-checkout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`,
                },
                body: JSON.stringify({ planId: plan.id }),
            });

            const data = await response.json();

            if (!response.ok || !data.checkoutUrl) {
                throw new Error(data.error || 'Failed to create checkout session. Please try again.');
            }

            // Redirect to Dodo's hosted checkout page
            toast.success('Redirecting to secure checkout...', { duration: 2000 });
            window.location.href = data.checkoutUrl;

        } catch (err) {
            console.error('Payment error:', err);
            toast.error(err.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(null);
        }
    };



    return (
        <div className="min-h-screen bg-[#060606] text-white px-4 py-24">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-center max-w-2xl mx-auto mb-16"
            >
                <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-5 leading-tight">
                    Scale your vision.
                </h1>
                <p className="text-white/40 text-base leading-relaxed">
                    Transparent pricing for builders at all scales. Choose the operating system for your next billion-dollar idea.
                </p>
            </motion.div>

            {/* Pricing Cards */}
            <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 mb-24">
                {plans.map((plan, i) => {
                    const Icon = plan.icon;
                    return (
                        <motion.div
                            key={plan.id}
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                            className={`relative rounded-2xl border ${plan.borderColor} ${plan.highlight
                                ? 'bg-white/[0.04] shadow-[0_0_60px_rgba(19,127,236,0.08)]'
                                : 'bg-white/[0.02]'
                                } p-6 flex flex-col`}
                        >
                            {plan.badge && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                    <span className="bg-accent text-white text-[9px] font-black tracking-[0.25em] px-3 py-1 rounded-full uppercase">
                                        {plan.badge}
                                    </span>
                                </div>
                            )}

                            {/* Plan name & icon */}
                            <div className="flex items-center gap-2 mb-4">
                                <Icon className={`w-4 h-4 ${plan.iconColor}`} />
                                <span className="text-xs font-black uppercase tracking-widest text-white/50">{plan.name}</span>
                            </div>

                            {/* Price */}
                            <div className="mb-6">
                                <div className="flex items-end gap-1">
                                    <span className="text-5xl font-black tracking-tight">
                                        {plan.name === 'Free' ? '' : ''}{plan.price}
                                    </span>
                                    {plan.period && <span className="text-white/30 text-sm mb-2">{plan.period}</span>}
                                </div>
                            </div>

                            {/* Features */}
                            <ul className="space-y-2.5 mb-8 flex-1">
                                {plan.features.map((f) => (
                                    <li key={f} className="flex items-start gap-2.5">
                                        <Check className="w-4 h-4 text-white/40 mt-0.5 flex-shrink-0" />
                                        <span className="text-sm text-white/60">{f}</span>
                                    </li>
                                ))}
                            </ul>

                            {/* Idea limit chip */}
                            <div className="mb-4">
                                <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-white/30 bg-white/5 border border-white/5 rounded-full px-3 py-1">
                                    <Sparkles className="w-3 h-3" />
                                    {plan.limit === Infinity ? 'Unlimited' : plan.limit} ideas/day
                                </span>
                            </div>

                            {/* CTA Button */}
                            <button
                                onClick={() => handleSelectPlan(plan)}
                                disabled={loading === plan.id}
                                className={`w-full py-3.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${plan.buttonStyle} disabled:opacity-50`}
                            >
                                {loading === plan.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        {plan.buttonText}
                                        <ArrowRight className="w-3.5 h-3.5" />
                                    </>
                                )}
                            </button>
                        </motion.div>
                    );
                })}
            </div>

            {/* FAQ Section */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="max-w-2xl mx-auto"
            >
                <div className="text-center mb-10">
                    <h2 className="text-3xl font-black tracking-tight mb-3">Common Questions</h2>
                    <p className="text-white/30 text-sm">Everything you need to know about aistartupidea.</p>
                </div>
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl px-6">
                    {faqs.map((faq) => (
                        <FAQItem key={faq.q} q={faq.q} a={faq.a} />
                    ))}
                </div>
            </motion.div>
        </div>
    );
};

export default Pricing;
