import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Bookmark, RefreshCcw, Check, X } from 'lucide-react';

const ResultCard = ({ idea, onSwipe }) => {
    const [exitX, setExitX] = useState(0);

    return (
        <motion.div
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={(e, info) => {
                if (info.offset.x > 100) {
                    setExitX(500);
                    onSwipe(idea.id, 'right');
                } else if (info.offset.x < -100) {
                    setExitX(-500);
                    onSwipe(idea.id, 'left');
                }
            }}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1, x: 0 }}
            exit={{ x: exitX, opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
            className="absolute inset-0 bg-white/5 border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl backdrop-blur-xl touch-none cursor-grab active:cursor-grabbing"
        >
            <div className="h-48 bg-gradient-to-br from-accent to-blue-900 flex items-center justify-center p-8">
                <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20">
                    <Bookmark className="w-10 h-10 text-white" />
                </div>
            </div>

            <div className="p-8">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-2xl font-bold tracking-tight">{idea.title}</h3>
                    <span className="bg-accent/20 text-accent text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest border border-accent/30">
                        {idea.difficulty}
                    </span>
                </div>

                <p className="text-white/60 text-lg leading-relaxed mb-8">{idea.description}</p>

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 border border-white/5 p-4 rounded-2xl">
                        <span className="block text-white/30 text-xs font-bold uppercase tracking-widest mb-1">Budget</span>
                        <span className="text-lg font-bold">{idea.budget}</span>
                    </div>
                    <div className="bg-white/5 border border-white/5 p-4 rounded-2xl">
                        <span className="block text-white/30 text-xs font-bold uppercase tracking-widest mb-1">Time</span>
                        <span className="text-lg font-bold">{idea.time}</span>
                    </div>
                </div>
            </div>

            {/* Swipe Indicators overlay */}
            <div className="absolute top-4 left-4 pointer-events-none opacity-0 group-drag-right:opacity-100 transition-opacity">
                <div className="bg-green-500/20 border border-green-500 text-green-500 px-4 py-1 rounded-lg font-bold uppercase rotate-[-15deg]">Save</div>
            </div>
            <div className="absolute top-4 right-4 pointer-events-none opacity-0 group-drag-left:opacity-100 transition-opacity">
                <div className="bg-red-500/20 border border-red-500 text-red-500 px-4 py-1 rounded-lg font-bold uppercase rotate-[15deg]">Skip</div>
            </div>
        </motion.div>
    );
};

const Results = ({ results, onRestart, userPlan = 'free', ideaLimit = 2 }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [saved, setSaved] = useState([]);

    const handleSwipe = (id, direction) => {
        if (direction === 'right') {
            setSaved([...saved, results.find(r => r.id === id)]);
        }

        setTimeout(() => {
            setCurrentIndex(prev => prev + 1);
        }, 200);
    };

    if (currentIndex >= results.length) {
        return (
            <div className="max-w-2xl mx-auto px-6 text-center">
                <div className="mb-12">
                    <div className="w-20 h-20 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-accent/30 shadow-lg shadow-accent/20">
                        <Check className="w-10 h-10 text-accent" />
                    </div>
                    <h2 className="text-4xl font-bold mb-4">You're All Set!</h2>
                    <p className="text-white/60 text-lg">We've found {saved.length} business ideas that match your profile.</p>
                </div>

                <div className="space-y-4 mb-12">
                    {saved.map(idea => (
                        <div key={idea.id} className="bg-white/5 border border-white/10 p-6 rounded-2xl flex items-center justify-between text-left group hover:bg-white/10 transition-all cursor-pointer">
                            <div>
                                <h4 className="font-bold text-lg mb-1">{idea.title}</h4>
                                <p className="text-white/40 text-sm italic">{idea.difficulty} • {idea.budget}</p>
                            </div>
                            <ArrowRight className="w-6 h-6 text-accent group-hover:translate-x-1 transition-transform" />
                        </div>
                    ))}
                    {saved.length === 0 && (
                        <p className="text-white/20 italic">No ideas saved. Try swiping right on ideas you like!</p>
                    )}
                </div>

                <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
                    <button
                        onClick={onRestart}
                        className="w-full sm:w-auto bg-white/5 hover:bg-white/10 border border-white/10 text-white px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
                    >
                        <RefreshCcw className="w-5 h-5" />
                        Retake Quiz
                    </button>
                    <button className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-white px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-accent/20">
                        <Share2 className="w-5 h-5" />
                        Share Analysis
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto px-6 h-[600px] relative">
            <div className="absolute top-0 left-0 right-0 -translate-y-14 text-center flex flex-col items-center gap-2">
                <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-white/5 border border-white/10 rounded-full px-3 py-1 text-white/30">
                    <span className="capitalize text-accent">{userPlan}</span> plan
                    · {results.length} ideas generated
                </span>
                <span className="text-white/20 text-xs font-bold uppercase tracking-[0.2em]">Swipe right to save • left to skip</span>
            </div>

            <div className="relative w-full h-full">
                <AnimatePresence mode="popLayout">
                    {results.slice(currentIndex, currentIndex + 2).reverse().map((idea, idx) => (
                        <ResultCard key={idea.id} idea={idea} onSwipe={handleSwipe} />
                    ))}
                </AnimatePresence>
            </div>

            <div className="absolute bottom-[-80px] left-0 right-0 flex justify-center gap-6">
                <button
                    className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-red-500 hover:bg-red-500/10 hover:border-red-500/50 transition-all active:scale-90"
                    onClick={() => handleSwipe(results[currentIndex].id, 'left')}
                >
                    <X className="w-8 h-8" />
                </button>
                <button
                    className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-accent hover:bg-accent/10 hover:border-accent/50 transition-all active:scale-90"
                    onClick={() => handleSwipe(results[currentIndex].id, 'right')}
                >
                    <Check className="w-8 h-8" />
                </button>
            </div>
        </div>
    );
};

const ArrowRight = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
)

export default Results;
