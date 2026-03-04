import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';

const QUESTIONS = [
    { id: 1, text: "What's your primary goal?", options: ["Financial Freedom", "Exit Corporate", "Side Income", "Passion Project"] },
    { id: 2, text: "What's your available budget to start?", options: ["<$500", "$500 - $2k", "$2k - $10k", "$10k+"] },
    { id: 3, text: "How much time can you commit weekly?", options: ["<10 hours", "10-20 hours", "20-40 hours", "Full-time"] },
    { id: 4, text: "What's your core skill area?", options: ["Technical/Coding", "Marketing/Sales", "Design/Creative", "Writing/Content"] },
    { id: 5, text: "Do you prefer online or offline business?", options: ["Fully Online", "Brick & Mortar", "Hybrid", "No Preference"] },
    { id: 6, text: "What's your risk tolerance?", options: ["Low (Slow & Steady)", "Medium", "High (Scalable)", "Extreme"] },
    { id: 7, text: "What industry interests you most?", options: ["Tech/Software", "Health/Wellness", "Education", "E-commerce"] },
    { id: 8, text: "Are you building alone or with a team?", options: ["Solo Founder", "Have a Team", "Looking for Partner", "Not sure"] },
    { id: 9, text: "What's your personality type?", options: ["Introvert", "Extrovert", "Ambivert", "Leader"] },
    { id: 10, text: "Which business model attracts you?", options: ["SaaS", "Agency/Service", "Marketplace", "Content/Ad-based"] },
    { id: 11, text: "What is your education level?", options: ["High School", "Bachelor's", "Master's/PhD", "Self-taught"] },
    { id: 12, text: "Do you have prior business experience?", options: ["First Timer", "Failed before", "Serial Entrepreneur", "Consultant"] },
    { id: 13, text: "How do you prefer to handle marketing?", options: ["Paid Ads", "Organic/Content", "Direct Sales", "Word of Mouth"] },
    { id: 14, text: "What's your preference for customer interaction?", options: ["Low (Automated)", "Medium (Chat/Email)", "High (Calls/Meetings)", "Personalized"] },
    { id: 15, text: "How fast do you need to see profit?", options: ["Immediately (1 mo)", "Soon (3-6 mos)", "Patiently (1 yr+)", "Long-term (3 yrs+)"] },
    { id: 16, text: "What's your technical proficiency?", options: ["Non-tech", "Understand concepts", "Strong Technical", "Software Engineer"] },
    { id: 17, text: "What motivated you to start?", options: ["Personal need", "Market gap", "Trend/Hype", "Family legacy"] },
    { id: 18, text: "Where will you operate from?", options: ["Home", "Co-working", "Private Office", "Anywhere (Nomad)"] },
    { id: 19, text: "What's your stance on outside funding?", options: ["Bootstrapped only", "Open to VC", "Angel Investors", "Crowdfunding"] },
    { id: 20, text: "What's your main competitive advantage?", options: ["Low Price", "High Quality", "Speed/Agility", "Unique Innovation"] },
    { id: 21, text: "What are your specific interests or hobbies?", type: "text", placeholder: "e.g. Photography, gardening, woodworking, crypto..." },
    { id: 22, text: "Tell us about your past experience or background.", type: "text", placeholder: "e.g. 5 years in retail, student, ex-software engineer..." },
    { id: 23, text: "What is your vision or future story for your business?", type: "text", placeholder: "e.g. Building a family legacy, creating a digital nomad lifestyle..." },
];

const Questionnaire = ({ onComplete }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState({});
    const [textInputValue, setTextInputValue] = useState("");

    const handleNext = () => {
        const currentQuestion = QUESTIONS[currentStep];
        let newAnswers = { ...answers };

        if (currentQuestion.type === "text") {
            newAnswers[currentQuestion.id] = textInputValue;
            setTextInputValue("");
        }

        setAnswers(newAnswers);

        if (currentStep < QUESTIONS.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            onComplete(newAnswers);
        }
    };

    const handleSelect = (option) => {
        const newAnswers = { ...answers, [QUESTIONS[currentStep].id]: option };
        setAnswers(newAnswers);

        if (currentStep < QUESTIONS.length - 1) {
            setTimeout(() => setCurrentStep(prev => prev + 1), 300);
        } else {
            onComplete(newAnswers);
        }
    };

    const progress = ((currentStep + 1) / QUESTIONS.length) * 100;
    const currentQuestion = QUESTIONS[currentStep];

    return (
        <div className="max-w-xl mx-auto px-6">
            {/* Progress Bar */}
            <div className="mb-12">
                <div className="flex justify-between items-center mb-4">
                    <span className="text-white/40 text-sm font-medium">Question {currentStep + 1} of {QUESTIONS.length}</span>
                    <span className="text-accent text-sm font-bold">{Math.round(progress)}% Complete</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-accent"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ type: 'spring', stiffness: 50, damping: 15 }}
                    />
                </div>
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white/5 border border-white/10 p-8 rounded-3xl"
                >
                    <h2 className="text-2xl md:text-3xl font-bold mb-8 leading-tight tracking-tight">
                        {currentQuestion.text}
                    </h2>

                    {currentQuestion.type === "text" ? (
                        <div className="grid gap-6">
                            <textarea
                                value={textInputValue || answers[currentQuestion.id] || ""}
                                onChange={(e) => setTextInputValue(e.target.value)}
                                placeholder={currentQuestion.placeholder}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder:text-white/20 focus:border-accent outline-none min-h-[120px] transition-all resize-none"
                            />
                            <button
                                onClick={handleNext}
                                disabled={!textInputValue && !answers[currentQuestion.id]}
                                className="w-full bg-accent text-white py-4 rounded-2xl font-bold hover:bg-accent/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                Next Step
                                <ArrowRight className="w-5 h-5" />
                            </button>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {currentQuestion.options.map((option, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleSelect(option)}
                                    className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between group
                    ${answers[currentQuestion.id] === option
                                            ? 'bg-accent/10 border-accent text-white'
                                            : 'bg-white/5 border-white/5 hover:border-white/20 text-white/70 hover:text-white'}`}
                                >
                                    <span className="font-medium">{option}</span>
                                    <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors
                    ${answers[currentQuestion.id] === option
                                            ? 'bg-accent border-accent'
                                            : 'border-white/10 group-hover:border-white/30'}`}
                                    >
                                        {answers[currentQuestion.id] === option && <Check className="w-4 h-4 text-white" />}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="mt-8 flex justify-between items-center">
                        <button
                            disabled={currentStep === 0}
                            onClick={() => {
                                setCurrentStep(prev => prev - 1);
                                setTextInputValue("");
                            }}
                            className="flex items-center gap-2 text-white/40 hover:text-white disabled:opacity-0 transition-all font-medium"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back
                        </button>

                        {currentStep < QUESTIONS.length - 1 && currentQuestion.type !== "text" && (
                            <span className="text-white/20 text-xs tracking-widest uppercase font-bold">Autonext enabled</span>
                        )}
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default Questionnaire;
