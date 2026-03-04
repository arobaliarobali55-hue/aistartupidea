import React from 'react';
import { motion } from 'framer-motion';

const Marquee = () => {
    return (
        <section className="py-20 border-y border-white/5 overflow-hidden">
            <div className="flex whitespace-nowrap">
                <motion.div
                    animate={{ x: [0, -1000] }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="flex items-center gap-12 text-6xl md:text-8xl font-black uppercase tracking-tighter text-white/5"
                >
                    <span className="text-accent underline decoration-4 underline-offset-8">aistartupidea</span>
                    <span>Features</span>
                    <span>Precision</span>
                    <span>AI Analysis</span>
                    <span className="text-accent">aistartupidea</span>
                    <span>Features</span>
                    <span>Precision</span>
                    <span>AI Analysis</span>
                </motion.div>
                <motion.div
                    animate={{ x: [0, -1000] }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="flex items-center gap-12 text-6xl md:text-8xl font-black uppercase tracking-tighter text-white/5"
                >
                    <span className="text-accent">aistartupidea</span>
                    <span>Features</span>
                    <span>Precision</span>
                    <span>AI Analysis</span>
                    <span className="text-accent">aistartupidea</span>
                    <span>Features</span>
                    <span>Precision</span>
                    <span>AI Analysis</span>
                </motion.div>
            </div>
        </section>
    );
};

export default Marquee;
