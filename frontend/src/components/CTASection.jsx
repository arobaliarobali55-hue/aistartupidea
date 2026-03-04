import React from 'react';
import { ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

const CTASection = ({ onStartQuiz }) => {
    return (
        <section className="py-40">
            <div className="max-w-7xl mx-auto px-6">
                <div className="relative bg-[#0A0A0A] border border-white/5 rounded-[40px] p-20 overflow-hidden text-center">
                    {/* Background Glow */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl aspect-square bg-accent/5 blur-[120px] pointer-events-none" />

                    <div className="relative z-10 max-w-2xl mx-auto">
                        <h2 className="text-5xl md:text-6xl font-bold tracking-tighter mb-8 italic">
                            Build your next empire.
                        </h2>
                        <p className="text-xl text-white/50 mb-12 font-medium">
                            Join 10,000+ entrepreneurs who found their winning business
                            model using our AI analysis toolkit.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                            <button
                                onClick={onStartQuiz}
                                className="w-full sm:w-auto bg-white text-black px-10 py-5 rounded-full text-lg font-bold hover:bg-white/90 transition-all shadow-xl shadow-white/5"
                            >
                                Get Started Now
                            </button>
                            <button
                                onClick={() => toast('✨ Examples gallery coming soon!', { icon: '🖼️' })}
                                className="text-sm font-bold border-b border-white/20 pb-1 hover:border-white transition-all uppercase tracking-widest"
                            >
                                See Examples
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default CTASection;
