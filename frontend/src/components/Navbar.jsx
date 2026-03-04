import React, { useState, useEffect } from 'react';
import { LogOut, User, Zap, Crown, Sparkles, Home, LayoutDashboard } from 'lucide-react';
import toast from 'react-hot-toast';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';

const PLAN_BADGES = {
    free: { label: 'Free', color: 'bg-white/5 border-white/10 text-white/40', Icon: Sparkles },
    pro: { label: 'Pro', color: 'bg-blue-500/20 border-blue-400/40 text-blue-300', Icon: Zap },
    founder: { label: 'Founder', color: 'bg-amber-500/20 border-amber-400/40 text-amber-300', Icon: Crown },
};

const Navbar = ({ onStartQuiz, user, onSignIn, userPlan = 'free', onChangePlan, onGoHome, onGoToSection, onGoDashboard, currentView }) => {
    const [profileAvatar, setProfileAvatar] = useState(null);

    // Fetch the latest avatar from users collection
    useEffect(() => {
        if (!user?.uid) { setProfileAvatar(null); return; }

        const fetchAvatar = async () => {
            try {
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                if (userDoc.exists() && userDoc.data().avatar_url) {
                    setProfileAvatar(userDoc.data().avatar_url);
                } else {
                    setProfileAvatar(user.photoURL || null);
                }
            } catch (error) {
                console.error('Error fetching avatar:', error);
                setProfileAvatar(user.photoURL || null);
            }
        };

        fetchAvatar();
    }, [user]);

    const handleComingSoon = (e) => {
        e.preventDefault();
        toast('🚀 Feature coming soon!', { icon: '✨' });
    };

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            toast.success('Signed out successfully');
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleSectionLink = (sectionId) => (e) => {
        e.preventDefault();
        if (onGoToSection) onGoToSection(sectionId);
    };

    const planBadge = PLAN_BADGES[userPlan] || PLAN_BADGES.free;
    const PlanIcon = planBadge.Icon;
    const isOnLanding = currentView === 'landing';

    const displayName = user?.displayName || user?.email?.split('@')[0] || 'User';
    const avatarUrl = profileAvatar;

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-xl border-b border-white/5">
            <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">

                {/* Logo */}
                <div className="flex items-center gap-2 cursor-pointer group" onClick={onGoHome}>
                    <img src="/logo.png" alt="logo" className="w-8 h-8 rounded-lg object-contain transition-transform group-hover:scale-105" />
                    <span className="text-xl font-bold tracking-tighter">aistartupidea</span>
                </div>

                {/* Nav Links */}
                <div className="hidden md:flex items-center gap-8">
                    <button onClick={onGoHome}
                        className={`text-sm font-medium transition-colors flex items-center gap-1.5 ${isOnLanding ? 'text-white' : 'text-white/60 hover:text-white'}`}>
                        <Home className="w-3.5 h-3.5" /> Home
                    </button>
                    <a href="#features" onClick={handleSectionLink('features')} className="text-sm font-medium text-white/60 hover:text-white transition-colors">Features</a>
                    <a href="#process" onClick={handleSectionLink('process')} className="text-sm font-medium text-white/60 hover:text-white transition-colors">Process</a>
                    <a href="#pricing" onClick={(e) => { e.preventDefault(); onChangePlan?.(); }} className="text-sm font-medium text-white/60 hover:text-white transition-colors">Pricing</a>
                    <a href="#blog" onClick={handleComingSoon} className="text-sm font-medium text-white/60 hover:text-white transition-colors">Blog</a>
                </div>

                {/* Right Side */}
                <div className="flex items-center gap-3">
                    {user ? (
                        <div className="flex items-center gap-2">
                            {/* Plan Badge */}
                            <button onClick={onChangePlan} title="Change plan"
                                className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider transition-all hover:opacity-80 ${planBadge.color}`}>
                                <PlanIcon className="w-3 h-3" />{planBadge.label}
                            </button>

                            {/* Dashboard button */}
                            <button onClick={onGoDashboard}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-full border text-xs font-bold transition-all ${currentView === 'dashboard' ? 'bg-white text-black border-white' : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'}`}>
                                <LayoutDashboard className="w-4 h-4" />
                                <span className="hidden sm:inline">Dashboard</span>
                            </button>

                            {/* Avatar + Name */}
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt="avatar" className="w-6 h-6 rounded-full object-cover ring-1 ring-white/20" />
                                ) : (
                                    <User className="w-4 h-4 text-white/40" />
                                )}
                                <span className="text-xs font-medium text-white/70 max-w-[80px] truncate hidden sm:inline">{displayName}</span>
                            </div>

                            {/* Sign out */}
                            <button onClick={handleSignOut} className="p-2 hover:bg-white/5 rounded-full text-white/40 hover:text-white transition-all" title="Sign Out">
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    ) : (
                        <button onClick={() => onSignIn()} className="text-sm font-medium text-white/70 hover:text-white transition-colors">
                            Sign In
                        </button>
                    )}
                    <button onClick={onStartQuiz}
                        className="bg-white text-black px-6 py-2.5 rounded-full text-sm font-bold hover:bg-white/90 transition-all active:scale-95 shadow-lg">
                        Get My Idea
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
