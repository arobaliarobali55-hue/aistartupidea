import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Shield, Users, Layers } from 'lucide-react';

const FeaturesGrid = () => {
    return (
        <section id="features" className="py-32">
            <div className="max-w-7xl mx-auto px-6">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-20">
                    <div>
                        <div className="text-accent text-xs font-bold uppercase tracking-widest mb-4">Core Framework</div>
                        <h2 className="text-4xl md:text-5xl font-bold tracking-tighter leading-none">
                            Engineered for precise <br /> execution.
                        </h2>
                    </div>
                    <a href="#" className="text-sm font-bold border-b border-white/20 pb-1 hover:border-white transition-all">Team of Authors →</a>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Main Feature Card */}
                    <div className="md:col-span-2 bg-[#0A0A0A] border border-white/5 rounded-3xl p-10 overflow-hidden relative group">
                        <div className="relative z-10 h-full flex flex-col justify-between">
                            <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center mb-8">
                                <Layers className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold mb-4">Likelihood of Profitability</h3>
                                <p className="text-white/40 max-w-sm mb-8">
                                    Our proprietary algorithm predicts your success rate based on historical data and
                                    current market saturation levels.
                                </p>
                                <div className="space-y-4">
                                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full w-4/5 bg-accent" />
                                    </div>
                                    <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                                        <span className="text-white/20">Success Probability</span>
                                        <span className="text-accent">82%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Decorative Gradient */}
                        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>

                    {/* Secondary Card */}
                    <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-10 flex flex-col justify-between">
                        <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center mb-8">
                            <Shield className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold mb-4">Risk Monitoring</h3>
                            <p className="text-white/40 mb-6">
                                Track every potential pitfall and market risk associated with your
                                business model.
                            </p>
                            <div className="flex gap-2">
                                <div className="px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold uppercase tracking-widest">Low Risk</div>
                                <div className="px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-500 text-[10px] font-bold uppercase tracking-widest">Scalable</div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Row */}
                    <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-10">
                        <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center mb-8">
                            <BarChart3 className="w-5 h-5" />
                        </div>
                        <h3 className="text-xl font-bold mb-4">Market Insights</h3>
                        <p className="text-white/40 mb-8">
                            Get direct access to competitor data and user behavior trends for your niche.
                        </p>
                        <div className="flex items-end gap-1 h-12">
                            {[0.4, 0.7, 0.5, 0.9, 0.6, 0.8].map((h, i) => (
                                <div key={i} className="flex-1 bg-white/10 rounded-t-sm" style={{ height: `${h * 100}%` }} />
                            ))}
                        </div>
                    </div>

                    <div className="md:col-span-2 bg-[#0A0A0A] border border-white/5 rounded-3xl p-10 relative overflow-hidden group">
                        <div className="relative z-10">
                            <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center mb-8">
                                <Users className="w-5 h-5" />
                            </div>
                            <h3 className="text-2xl font-bold mb-4">Build your next <br /> venture.</h3>
                            <p className="text-white/40 max-w-sm">
                                Connect with co-founders and early adopters who are looking for
                                exactly what you're building.
                            </p>
                        </div>
                        {/* Circle Element */}
                        <div className="absolute bottom-[-50px] right-[-50px] w-64 h-64 border border-white/5 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                            <div className="w-32 h-32 border border-accent/20 rounded-full flex items-center justify-center">
                                <div className="w-16 h-16 bg-accent/20 border border-accent/40 rounded-full flex items-center justify-center">
                                    <div className="w-8 h-8 bg-accent rounded-full animate-pulse" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default FeaturesGrid;
