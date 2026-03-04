import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

const Hero = ({ onStartQuiz }) => {
    return (
        <section className="relative pt-40 pb-20 overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl aspect-square bg-[radial-gradient(circle_at_center,rgba(19,127,236,0.08)_0%,transparent_70%)] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    {/* Left Content */}
                    <div className="max-w-2xl">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-bold uppercase tracking-widest mb-6"
                        >
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
                            </span>
                            AI-Powered Discovery
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-6xl md:text-7xl font-bold leading-[1.1] mb-8 tracking-tighter"
                        >
                            Find Your Perfect <br />
                            <span className="text-white/40">Business Idea</span><br />
                            in 2 Minutes.
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-xl text-white/60 mb-10 leading-relaxed font-medium"
                        >
                            No more guesswork. Our specialized AI analysis identifies
                            profitable opportunities tailored to your skills, budget,
                            and lifestyle goals.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="flex flex-col sm:flex-row items-center gap-4"
                        >
                            <button
                                onClick={onStartQuiz}
                                className="w-full sm:w-auto bg-white text-black px-8 py-4 rounded-full text-lg font-bold hover:bg-white/90 transition-all flex items-center justify-center gap-2 group"
                            >
                                Build Your Business
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </button>
                            <button
                                onClick={() => toast('✨ Examples coming soon!', { icon: '📊' })}
                                className="w-full sm:w-auto px-8 py-4 rounded-full text-lg font-bold border border-white/10 hover:bg-white/5 transition-all"
                            >
                                See all examples
                            </button>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="mt-12 flex items-center gap-4 text-white/40"
                        >
                            <div className="flex -space-x-2">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="w-8 h-8 rounded-full border-2 border-background bg-zinc-800" />
                                ))}
                            </div>
                            <span className="text-sm font-medium">Trusted by 10,000+ founders worldwide</span>
                        </motion.div>
                    </div>

                    {/* Right Mockup */}
                    <div className="relative">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 }}
                            className="relative z-10 bg-[#0A0A0A] border border-white/5 rounded-3xl p-8 shadow-2xl"
                        >
                            <div className="flex items-center gap-2 mb-8">
                                <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                                <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                                <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <div className="text-xs font-bold text-white/20 uppercase tracking-widest">Question 02</div>
                                    <div className="text-lg font-bold">What is your monthly budget?</div>
                                </div>
                                <div className="space-y-3">
                                    {['<$500', '$1,000 - $5,000', '$10,000+'].map((opt, i) => (
                                        <div key={opt} className={`p-4 rounded-xl border ${i === 1 ? 'border-accent bg-accent/5' : 'border-white/5 bg-white/[0.02]'} flex items-center justify-between`}>
                                            <span className="text-sm font-medium">{opt}</span>
                                            <div className={`w-4 h-4 rounded-full border ${i === 1 ? 'bg-accent border-accent' : 'border-white/10'}`} />
                                        </div>
                                    ))}
                                </div>
                                <div className="pt-4 flex justify-end">
                                    <div className="px-6 py-2 bg-white text-black text-sm font-bold rounded-full">Next Step</div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Decor */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] aspect-square bg-accent/5 blur-[120px] rounded-full pointer-events-none" />
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Hero;
