import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Target, Rocket } from 'lucide-react';

const Process = () => {
    const steps = [
        {
            icon: Zap,
            title: "Answer Questions",
            desc: "Spend just 2 minutes sharing your journey, skills, and budget constraints."
        },
        {
            icon: Target,
            title: "AI Analysis",
            desc: "Our model cross-references your profile with current market opportunities."
        },
        {
            icon: Rocket,
            title: "Launch Idea",
            desc: "Receive 5 hyper-tailored business models with step-by-step guides."
        }
    ];

    return (
        <section id="process" className="py-32">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-24">
                    <h2 className="text-4xl md:text-5xl font-bold tracking-tighter mb-4">From spark to venture.</h2>
                    <p className="text-white/40 text-lg max-w-2xl mx-auto">
                        A modern approach that transforms your personal traits into ready-to-launch
                        business ideas with precise precision.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-12">
                    {steps.map((step, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                            className="relative"
                        >
                            <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center mb-6">
                                <step.icon className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                            <p className="text-white/50 leading-relaxed font-medium">
                                {step.desc}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Process;
