import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Marquee from './components/Marquee';
import Process from './components/Process';
import FeaturesGrid from './components/FeaturesGrid';
import CTASection from './components/CTASection';
import Footer from './components/Footer';
import Questionnaire from './components/Questionnaire';
import Results from './components/Results';
import Pricing from './components/Pricing';
import Dashboard from './components/Dashboard';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import { auth, db } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, writeBatch, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import AuthComponent from './components/Auth';

// Plan limits map (Daily)
const PLAN_LIMITS = {
  free: 2,
  pro: 20,
  founder: 999999,
};

const App = () => {
  const [view, setView] = useState('landing'); // landing, quiz, loading, results, error, auth, plan-select, dashboard
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState([]);
  const [generateError, setGenerateError] = useState('');
  const [user, setUser] = useState(null);
  const [pendingAutoStart, setPendingAutoStart] = useState(false);
  const [userPlan, setUserPlan] = useState('free'); // free | pro | founder
  const [ideaLimit, setIdeaLimit] = useState(2);
  const [dailyUsage, setDailyUsage] = useState(0);
  const [lastUsageDate, setLastUsageDate] = useState('');
  const pendingScrollSection = useRef(null); // section ID to scroll to after landing mounts

  // Refs so the auth listener can read latest values without being a dependency
  const pendingAutoStartRef = useRef(false);
  const viewRef = useRef('landing');

  // Keep refs in sync with state
  useEffect(() => { pendingAutoStartRef.current = pendingAutoStart; }, [pendingAutoStart]);
  useEffect(() => { viewRef.current = view; }, [view]);

  useEffect(() => {
    // Subscribe ONCE — reads latest pendingAutoStart/view via refs to avoid re-subscribing
    const unsubscribe = onAuthStateChanged(auth, async (newUser) => {
      setUser(newUser);

      if (newUser) {
        // Fetch user plan and limits from Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', newUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const userPlan = userData.plan || 'free';
            const limit = userData.plan_limit || PLAN_LIMITS[userPlan] || 2;
            const usage = userData.daily_usage || 0;
            const usageDate = userData.last_usage_date || '';
            setUserPlan(userPlan);
            setIdeaLimit(limit);
            setDailyUsage(usage);
            setLastUsageDate(usageDate);
          } else {
            setUserPlan('free');
            setIdeaLimit(2);
            setDailyUsage(0);
            setLastUsageDate('');
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }

        // Read the latest pendingAutoStart value from ref (not state)
        if (pendingAutoStartRef.current) {
          setPendingAutoStart(false);
          pendingAutoStartRef.current = false;
          const userDoc = await getDoc(doc(db, 'users', newUser.uid));
          if (!userDoc.exists() || !userDoc.data().plan) {
            setView('plan-select');
          } else {
            setView('quiz');
          }
        } else if (viewRef.current === 'auth' || viewRef.current === 'landing') {
          setView('dashboard');
        }
      } else {
        // User signed out — go to landing
        setView('landing');
      }
    });

    return () => unsubscribe();
  }, []); // Empty deps — subscribe only once on mount

  const handleStartQuiz = async () => {
    console.log('handleStartQuiz triggered. User:', !!user);
    if (!user) {
      setPendingAutoStart(true);
      setView('auth');
    } else {
      // Preemptive limit check
      const { allowed, upgradeMsg } = await checkDailyLimit(user.uid, userPlan);
      if (!allowed) {
        toast.error(upgradeMsg, { duration: 6000 });
        setView('plan-select');
        return;
      }
      setView('quiz');
    }
  };

  const handleAuthSuccess = async () => {
    if (pendingAutoStart) {
      // Came from 'Get My Idea' — continue to plan or quiz
      if (auth.currentUser) {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (!userDoc.exists() || !userDoc.data().plan) {
          setView('plan-select');
        } else {
          const userData = userDoc.data();
          const plan = userData.plan || 'free';
          const { allowed, upgradeMsg } = await checkDailyLimit(auth.currentUser.uid, plan);
          if (!allowed) {
            toast.error(upgradeMsg, { duration: 6000 });
            setView('plan-select');
          } else {
            setPendingAutoStart(false);
            setView('quiz');
          }
        }
      }
    } else {
      // Normal login/signup → go to dashboard
      setView('dashboard');
    }
  };

  const handlePlanSelect = (planId, limit) => {
    setUserPlan(planId);
    setIdeaLimit(limit === 999999 ? 999999 : limit);
    setPendingAutoStart(false);
    setView('quiz');
  };

  // Navigate back to landing page (from any view)
  const handleGoHome = () => {
    setView('landing');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoDashboard = () => {
    if (!user) {
      setPendingAutoStart(false);
      setView('auth');
    } else {
      setView('dashboard');
    }
  };

  // Navigate to landing and then scroll to a specific section
  const handleGoToSection = (sectionId) => {
    if (view === 'landing') {
      // Already on landing, just scroll
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else {
      // Navigate to landing first, scroll after mount
      pendingScrollSection.current = sectionId;
      setView('landing');
    }
  };

  // Check if user has reached their daily limit
  const checkDailyLimit = async (userId, plan) => {
    if (plan === 'founder') return { allowed: true, count: 0 };

    const limit = PLAN_LIMITS[plan] || 2;
    const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const lastDate = userData.last_usage_date || '';
        const dailyUsage = userData.daily_usage || 0;

        // If it's a new day, usage is effectively 0
        const currentUsage = lastDate === todayStr ? dailyUsage : 0;
        const isAllowed = currentUsage < limit;

        let upgradeMsg = '';
        if (!isAllowed) {
          if (plan === 'free') {
            upgradeMsg = `Limit reached! You've used your ${limit} free generations today. Upgrade to the Pro plan ($5) for 20 ideas/day!`;
          } else if (plan === 'pro') {
            upgradeMsg = `Daily limit reached! You've used your 20 Pro generations today. Upgrade to the Founder plan ($25) for Unlimited generations!`;
          } else {
            upgradeMsg = `Daily limit reached! Please try again tomorrow.`;
          }
        }

        return {
          allowed: isAllowed,
          count: currentUsage,
          limit: limit,
          upgradeMsg
        };
      }
      return { allowed: true, count: 0, limit: limit };
    } catch (err) {
      console.error('Error checking daily limit:', err);
      return { allowed: true, count: 0, limit: limit };
    }
  };

  // After landing view mounts, perform any pending scroll
  useEffect(() => {
    if (view === 'landing' && pendingScrollSection.current) {
      const id = pendingScrollSection.current;
      pendingScrollSection.current = null;
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 400); // wait for landing animation to start
    }
  }, [view]);

  const handleQuizComplete = async (quizAnswers) => {
    setAnswers(quizAnswers);
    setGenerateError('');
    setView('loading');

    try {
      // Check daily limit first
      if (user?.uid) {
        const { allowed, upgradeMsg } = await checkDailyLimit(user.uid, userPlan);
        if (!allowed) {
          toast.error(upgradeMsg, { duration: 6000 });
          setGenerateError(upgradeMsg);
          setView('plan-select'); // Fix: pricing -> plan-select
          return;
        }
      }

      let headers = {};
      if (user) {
        const idToken = await user.getIdToken();
        headers = { Authorization: `Bearer ${idToken}` };
      }

      const response = await axios.post('https://aistartupidea.onrender.com/api/generate', {
        answers: quizAnswers,
        plan: userPlan,
        limit: ideaLimit,
      }, { headers, timeout: 30000 });

      const ideas = response.data;
      if (!ideas || ideas.length === 0) {
        setGenerateError('The AI returned no ideas. Please try again.');
        setView('error');
      } else {
        // Save to Firestore if user is logged in
        if (user?.uid) {
          try {
            const batch = writeBatch(db);
            ideas.forEach((idea) => {
              const newDocRef = doc(collection(db, 'business_ideas'));
              batch.set(newDocRef, {
                title: idea.title || '',
                description: idea.description || '',
                difficulty: idea.difficulty || 'Medium',
                budget: idea.budget || '',
                time: idea.time || '',
                category: 'AI Generated',
                user_id: user.uid,
                plan: userPlan,
                created_at: serverTimestamp(),
              });
            });

            // Increment daily usage counter strictly in the user doc
            const todayStr = new Date().toISOString().split('T')[0];
            const userDocRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);

            let newUsage = ideas.length; // Increment by many ideas
            if (userDoc.exists()) {
              const userData = userDoc.data();
              if (userData.last_usage_date === todayStr) {
                newUsage = (userData.daily_usage || 0) + ideas.length;
              }
            }

            batch.set(userDocRef, {
              daily_usage: newUsage,
              last_usage_date: todayStr
            }, { merge: true });

            await batch.commit();
            setDailyUsage(newUsage);
            setLastUsageDate(todayStr);
            console.log(`✅ Saved ${ideas.length} ideas and updated usage to ${newUsage}`);
          } catch (dbError) {
            console.error('Error saving ideas or updating usage:', dbError);
          }
        }

        setResults(ideas);
        setView('results');
      }
    } catch (error) {
      console.error('Error generating ideas:', error);
      
      let msg = 'Something went wrong.';
      
      if (error.code === 'ECONNABORTED') {
        msg = 'Request timeout. The AI service is taking too long to respond. Please try again.';
      } else if (error.response) {
        // Server responded with error
        msg = error.response.data?.error || `Server error: ${error.response.status}`;
      } else if (error.request) {
        // Request made but no response - likely CORS or network issue
        console.error('Network/CORS error detected:', error.request);
        msg = 'Network error. Unable to connect to the AI service. Please check your internet connection or try again later.';
      } else {
        msg = error.message || 'Something went wrong.';
      }
      
      setGenerateError(msg);
      setView('error');
    }
  };

  return (
    <div className="min-h-screen bg-background text-primary selection:bg-accent/30">
      <Toaster position="bottom-right" toastOptions={{ style: { background: '#0A0A0A', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' } }} />
      <Navbar
        onStartQuiz={handleStartQuiz}
        onSignIn={() => setView('auth')}
        user={user}
        userPlan={userPlan}
        onChangePlan={() => setView('plan-select')}
        onGoHome={handleGoHome}
        onGoToSection={handleGoToSection}
        onGoDashboard={handleGoDashboard}
        currentView={view}
      />

      <main>
        <AnimatePresence mode="wait">
          {view === 'landing' && (
            <motion.div
              key="landing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
            >
              <Hero onStartQuiz={handleStartQuiz} />
              <Marquee />
              <Process />
              <FeaturesGrid />
              <CTASection onStartQuiz={handleStartQuiz} />
              <Footer />
            </motion.div>
          )}

          {view === 'auth' && (
            <motion.div
              key="auth"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="pt-32 pb-20 px-6"
            >
              <AuthComponent onAuthSuccess={handleAuthSuccess} />
            </motion.div>
          )}

          {view === 'plan-select' && (
            <motion.div
              key="plan-select"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="pt-20"
            >
              <Pricing onSelectPlan={handlePlanSelect} user={user} />
            </motion.div>
          )}

          {view === 'quiz' && (
            <motion.div
              key="quiz"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="pt-32"
            >
              <Questionnaire onComplete={handleQuizComplete} />
            </motion.div>
          )}

          {view === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 flex flex-col items-center justify-center bg-black z-50 px-6 text-center"
            >
              <div className="relative w-24 h-24 mb-8">
                <div className="absolute inset-0 border-4 border-accent/20 rounded-full" />
                <motion.div
                  className="absolute inset-0 border-4 border-t-accent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
              </div>
              <h2 className="text-3xl font-bold tracking-tight mb-4">Analyzing your profile...</h2>
              <p className="text-white/40 max-w-sm mx-auto">
                Our AI is scanning thousands of business models to find your perfect match.
              </p>
              <div className="mt-6 inline-flex items-center gap-2 text-xs text-white/20 bg-white/5 border border-white/5 rounded-full px-4 py-2">
                Generating up to <span className="text-white/50 font-bold">{ideaLimit >= 999999 ? '∞' : ideaLimit}</span> ideas
                <span className="capitalize text-accent font-bold">{userPlan}</span> plan
              </div>
            </motion.div>
          )}

          {view === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 flex flex-col items-center justify-center bg-black z-50 px-6 text-center"
            >
              <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-6">
                <span className="text-3xl">⚠️</span>
              </div>
              <h2 className="text-3xl font-bold tracking-tight mb-3">Generation Failed</h2>
              <p className="text-white/40 max-w-sm mx-auto mb-2">
                The AI couldn't generate ideas right now.
              </p>
              {generateError && (
                <p className="text-red-400/70 text-sm max-w-md mx-auto mb-8 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                  {generateError}
                </p>
              )}
              <div className="flex flex-col sm:flex-row gap-3 mt-4">
                <button
                  onClick={() => handleQuizComplete(answers)}
                  className="bg-accent hover:bg-accent/90 text-white px-8 py-3 rounded-xl font-bold transition-all"
                >
                  🔄 Try Again
                </button>
                <button
                  onClick={handleGoHome}
                  className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-8 py-3 rounded-xl font-bold transition-all"
                >
                  Go Home
                </button>
              </div>
            </motion.div>
          )}

          {view === 'results' && (
            <motion.div
              key="results"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="pt-32 pb-20"
            >
              <Results results={results} onRestart={() => setView('landing')} userPlan={userPlan} ideaLimit={ideaLimit} />
            </motion.div>
          )}

          {view === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Dashboard
                user={user}
                userPlan={userPlan}
                onGoHome={handleGoHome}
                onChangePlan={() => setView('plan-select')}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default App;
