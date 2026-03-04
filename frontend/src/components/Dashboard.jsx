import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { auth, db, storage } from '../firebase';
import {
    collection,
    query,
    where,
    orderBy,
    getDocs,
    doc,
    getDoc,
    setDoc,
    deleteDoc,
    serverTimestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { signOut, updateProfile } from 'firebase/auth';
import {
    User, Bookmark, RefreshCcw, LogOut, Crown, Zap, Sparkles,
    Globe, FileText, Camera, Check, Edit3, Loader2, LayoutDashboard,
    X, TrendingUp, Clock, DollarSign, Search, Filter, ChevronDown,
    Star, Trash2, AlertCircle, Upload, ExternalLink, Calendar,
    BarChart2, Award, Target, ArrowUpRight
} from 'lucide-react';
import toast from 'react-hot-toast';

const PLAN_LIMITS = {
    free: 2,
    pro: 20,
    founder: 999999,
};

const AVATAR_OPTIONS = [
    'https://api.dicebear.com/7.x/bottts/svg?seed=Felix',
    'https://api.dicebear.com/7.x/bottts/svg?seed=Luna',
    'https://api.dicebear.com/7.x/bottts/svg?seed=Zara',
    'https://api.dicebear.com/7.x/bottts/svg?seed=Max',
    'https://api.dicebear.com/7.x/bottts/svg?seed=Aria',
    'https://api.dicebear.com/7.x/bottts/svg?seed=Nova',
    'https://api.dicebear.com/7.x/bottts/svg?seed=Cyber',
    'https://api.dicebear.com/7.x/bottts/svg?seed=Atlas',
    'https://api.dicebear.com/7.x/bottts/svg?seed=Echo',
];

const PLAN_STYLE = {
    free: { label: 'Free', cls: 'bg-white/5  border-white/10 text-white/50', Icon: Sparkles, glow: '' },
    pro: { label: 'Pro', cls: 'bg-blue-500/20 border-blue-400/40 text-blue-300', Icon: Zap, glow: 'shadow-[0_0_16px_rgba(59,130,246,0.15)]' },
    founder: { label: 'Founder', cls: 'bg-amber-500/20 border-amber-400/40 text-amber-300', Icon: Crown, glow: 'shadow-[0_0_16px_rgba(245,158,11,0.15)]' },
};

const DIFFICULTY_STYLE = {
    Easy: { cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-400' },
    Medium: { cls: 'bg-amber-500/10  text-amber-400  border-amber-500/20', dot: 'bg-amber-400' },
    Hard: { cls: 'bg-red-500/10    text-red-400    border-red-500/20', dot: 'bg-red-400' },
};

const tabs = [
    { id: 'history', label: 'Idea History', icon: Bookmark },
    { id: 'profile', label: 'Profile', icon: User },
];

/* ─────────────── HELPERS ─────────────── */
const StatCard = ({ icon: Icon, label, value, sub, accent }) => (
    <div className={`relative bg-black border rounded-2xl p-5 overflow-hidden transition-all hover:border-white/20 ${accent ? 'border-white/15' : 'border-white/8'}`}>
        <div className="flex items-start justify-between">
            <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-3">{label}</p>
                <p className="text-3xl font-black tracking-tight">{value}</p>
                {sub && <p className="text-white/30 text-xs mt-1">{sub}</p>}
            </div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accent ? 'bg-white/10' : 'bg-white/5'}`}>
                <Icon className="w-5 h-5 text-white/50" />
            </div>
        </div>
    </div>
);

const IdeaCard = ({ idea, index, onDelete }) => {
    const diff = DIFFICULTY_STYLE[idea.difficulty] || DIFFICULTY_STYLE.Medium;
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
            className="group relative bg-black border border-white/8 rounded-2xl p-6 hover:border-white/20 transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,255,255,0.04)]"
        >
            {/* Delete button */}
            <button
                onClick={() => onDelete(idea.id)}
                className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-white/30 hover:text-red-400 transition-all"
                title="Remove idea"
            >
                <Trash2 className="w-3.5 h-3.5" />
            </button>

            <div className="flex items-start gap-3 mb-3">
                <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold leading-tight group-hover:text-white transition-colors pr-6 mb-1">{idea.title}</h3>
                    <span className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${diff.cls}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${diff.dot}`} />
                        {idea.difficulty}
                    </span>
                </div>
            </div>

            <p className="text-white/40 text-sm leading-relaxed mb-5 line-clamp-2">{idea.description}</p>

            <div className="flex items-center gap-5 text-xs text-white/30">
                <span className="flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5" />{idea.budget}</span>
                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{idea.time}</span>
                <span className="flex items-center gap-1.5 ml-auto"><Calendar className="w-3.5 h-3.5" />{new Date(idea.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}</span>
            </div>
        </motion.div>
    );
};

/* ─────────────── MAIN COMPONENT ─────────────── */
const Dashboard = ({ user, userPlan, onGoHome, onChangePlan }) => {
    const [activeTab, setActiveTab] = useState('history');
    const [ideas, setIdeas] = useState([]);
    const [loadingIdeas, setLoadingIdeas] = useState(true);
    const [dailyCount, setDailyCount] = useState(0);
    const [profile, setProfile] = useState({ full_name: '', avatar_url: '', bio: '', website: '' });
    const [editProfile, setEditProfile] = useState(null);
    const [savingProfile, setSavingProfile] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [photoFile, setPhotoFile] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterDiff, setFilterDiff] = useState('All');
    const fileInputRef = useRef(null);

    /* ── Fetch ideas ── */
    useEffect(() => {
        if (!user?.uid) return;
        setLoadingIdeas(true);

        const fetchIdeas = async () => {
            try {
                // Fetch User Profile for strict daily count
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                if (userDoc.exists()) {
                    const profileData = userDoc.data();
                    const todayStr = new Date().toISOString().split('T')[0];
                    if (profileData.last_usage_date === todayStr) {
                        setDailyCount(profileData.daily_usage || 0);
                    } else {
                        setDailyCount(0);
                    }
                }

                // Fetch history
                const q = query(
                    collection(db, 'business_ideas'),
                    where('user_id', '==', user.uid)
                );
                const querySnapshot = await getDocs(q);
                const ideasData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    created_at: doc.data().created_at?.toDate() || new Date()
                }));

                // Sort by created_at desc client-side
                ideasData.sort((a, b) => b.created_at - a.created_at);
                setIdeas(ideasData);
            } catch (error) {
                console.error('Error fetching ideas:', error);
                toast.error('Could not load your ideas.');
            } finally {
                setLoadingIdeas(false);
            }
        };

        fetchIdeas();
    }, [user]);

    /* ── Fetch profile ── */
    useEffect(() => {
        if (!user?.uid) return;

        const fetchProfile = async () => {
            try {
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                if (userDoc.exists()) {
                    const profileData = userDoc.data();
                    const resolved = {
                        full_name: profileData.full_name || user.displayName || '',
                        avatar_url: profileData.avatar_url || user.photoURL || AVATAR_OPTIONS[0],
                        bio: profileData.bio || '',
                        website: profileData.website || '',
                    };
                    setProfile(resolved);
                } else {
                    // Fallback to auth data
                    setProfile({
                        full_name: user.displayName || '',
                        avatar_url: user.photoURL || AVATAR_OPTIONS[0],
                        bio: '',
                        website: '',
                    });
                }
            } catch (error) {
                console.error('Error fetching profile:', error);
            }
        };

        fetchProfile();
    }, [user]);

    /* ── Delete idea ── */
    const deleteIdea = async (id) => {
        const prev = ideas;
        setIdeas(ideas.filter(i => i.id !== id));
        try {
            await deleteDoc(doc(db, 'business_ideas', id));
            toast.success('Idea removed');
        } catch (error) {
            console.error('Error deleting idea:', error);
            toast.error('Could not delete.');
            setIdeas(prev);
        }
    };

    /* ── Profile photo selection ── */
    const handlePhotoSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 3 * 1024 * 1024) { toast.error('Image must be under 3MB'); return; }
        setPhotoFile(file);
        setPhotoPreview(URL.createObjectURL(file));
    };

    /* ── Upload photo to Supabase Storage ── */
    const uploadPhoto = async () => {
        if (!photoFile || !user?.uid) return null;
        setUploadingPhoto(true);
        try {
            const ext = photoFile.name.split('.').pop();
            const storageRef = ref(storage, `avatars/${user.uid}/avatar-${Date.now()}.${ext}`);
            const snapshot = await uploadBytes(storageRef, photoFile);
            const publicUrl = await getDownloadURL(snapshot.ref);
            return publicUrl;
        } catch (err) {
            toast.error('Photo upload failed: ' + err.message);
            return null;
        } finally {
            setUploadingPhoto(false);
        }
    };

    /* ── Save profile ── */
    const saveProfile = async () => {
        setSavingProfile(true);
        try {
            let avatarUrl = editProfile.avatar_url;
            if (photoFile) {
                const uploaded = await uploadPhoto();
                if (uploaded) avatarUrl = uploaded;
            }
            const updated = { ...editProfile, avatar_url: avatarUrl };

            // Update Firestore
            await setDoc(doc(db, 'users', user.uid), {
                ...updated,
                updated_at: serverTimestamp(),
            }, { merge: true });

            // Update Auth Profile
            if (auth.currentUser) {
                await updateProfile(auth.currentUser, {
                    displayName: updated.full_name,
                    photoURL: updated.avatar_url
                });
            }

            setProfile(updated);
            setEditProfile(null);
            setPhotoFile(null);
            setPhotoPreview(null);
            toast.success('Profile updated!');
        } catch (err) {
            toast.error(err.message);
        } finally {
            setSavingProfile(false);
        }
    };

    /* ── Derived ── */
    const planStyle = PLAN_STYLE[userPlan] || PLAN_STYLE.free;
    const PlanIcon = planStyle.Icon;
    const displayP = editProfile !== null ? editProfile : profile;
    const currentAvatar = photoPreview || displayP.avatar_url;

    const difficulties = ['All', 'Easy', 'Medium', 'Hard'];
    const filteredIdeas = ideas.filter(idea => {
        const matchSearch = idea.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            idea.description?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchDiff = filterDiff === 'All' || idea.difficulty === filterDiff;
        return matchSearch && matchDiff;
    });

    const easyCount = ideas.filter(i => i.difficulty === 'Easy').length;
    const mediumCount = ideas.filter(i => i.difficulty === 'Medium').length;
    const hardCount = ideas.filter(i => i.difficulty === 'Hard').length;

    return (
        <div className="min-h-screen bg-black text-white pt-28 pb-24">
            <div className="max-w-6xl mx-auto px-6">

                {/* ── Profile Header ── */}
                <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
                    <div className="relative bg-gradient-to-br from-white/5 to-white/0 border border-white/10 rounded-3xl p-8">
                        {/* Background accent */}
                        <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
                            <div className="absolute -top-20 -right-20 w-60 h-60 bg-white/3 rounded-full blur-3xl" />
                        </div>

                        <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-6">
                            {/* Avatar */}
                            <div className="relative flex-shrink-0">
                                <div className="w-24 h-24 rounded-2xl overflow-hidden bg-white/5 border-2 border-white/15 shadow-xl">
                                    {profile.avatar_url ? (
                                        <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <User className="w-10 h-10 text-white/20" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-3 mb-1.5">
                                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight truncate">
                                        {profile.full_name || user?.email?.split('@')[0] || 'Founder'}
                                    </h1>
                                    <button onClick={onChangePlan}
                                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider transition-all hover:opacity-80 ${planStyle.cls} ${planStyle.glow}`}>
                                        <PlanIcon className="w-3 h-3" />{planStyle.label}
                                    </button>
                                </div>
                                <p className="text-white/40 text-sm mb-1">{user?.email}</p>
                                {profile.bio && <p className="text-white/50 text-sm leading-relaxed max-w-lg mt-1">{profile.bio}</p>}
                                {profile.website && (
                                    <a href={profile.website} target="_blank" rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-white/30 hover:text-white text-xs mt-2 transition-colors">
                                        <Globe className="w-3 h-3" />{profile.website.replace(/^https?:\/\//, '')}
                                        <ExternalLink className="w-2.5 h-2.5" />
                                    </a>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-3 flex-shrink-0">
                                <button onClick={() => { setActiveTab('profile'); setEditProfile({ ...profile }); }}
                                    className="flex items-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white px-4 py-2.5 rounded-full text-sm font-bold transition-all">
                                    <Edit3 className="w-4 h-4" /> Edit Profile
                                </button>
                                <button onClick={onGoHome}
                                    className="flex items-center gap-2 bg-white text-black px-4 py-2.5 rounded-full text-sm font-bold hover:bg-white/90 transition-all">
                                    <LayoutDashboard className="w-4 h-4" /> Home
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* ── Stats ── */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
                    className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
                    <StatCard icon={Target} label="Ideas Generated" value={ideas.length} sub="all time" accent />
                    <StatCard icon={Sparkles} label="Ideas Today" value={dailyCount} sub={`${userPlan === 'founder' ? 'Unlimited' : PLAN_LIMITS[userPlan] || 2} daily limit`} />
                    <StatCard icon={TrendingUp} label="Easy Ideas" value={easyCount} sub="low commitment" />
                    <StatCard icon={BarChart2} label="Medium Ideas" value={mediumCount} sub="balanced effort" />
                </motion.div>

                {/* ── Tabs ── */}
                <div className="flex gap-1 p-1 bg-white/3 border border-white/8 rounded-2xl mb-8 w-fit">
                    {tabs.map(({ id, label, icon: Icon }) => (
                        <button key={id} onClick={() => setActiveTab(id)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === id ? 'bg-white text-black shadow-lg' : 'text-white/40 hover:text-white'}`}>
                            <Icon className="w-4 h-4" />{label}
                        </button>
                    ))}
                </div>

                <AnimatePresence mode="wait">

                    {/* ───── HISTORY TAB ───── */}
                    {activeTab === 'history' && (
                        <motion.div key="history" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>

                            {/* Search & Filter */}
                            {ideas.length > 0 && (
                                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                                        <input
                                            value={searchQuery}
                                            onChange={e => setSearchQuery(e.target.value)}
                                            placeholder="Search your ideas..."
                                            className="w-full bg-white/5 border border-white/10 focus:border-white/25 rounded-xl py-3 pl-11 pr-4 text-white outline-none placeholder:text-white/20 transition-all text-sm"
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        {difficulties.map(d => (
                                            <button key={d} onClick={() => setFilterDiff(d)}
                                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${filterDiff === d ? 'bg-white text-black' : 'bg-white/5 border border-white/10 text-white/40 hover:text-white hover:border-white/20'}`}>
                                                {d}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {loadingIdeas ? (
                                <div className="flex flex-col items-center justify-center py-32 gap-4">
                                    <Loader2 className="w-8 h-8 text-white/30 animate-spin" />
                                    <p className="text-white/20 text-sm">Loading your ideas...</p>
                                </div>
                            ) : ideas.length === 0 ? (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-32">
                                    <div className="w-24 h-24 bg-white/3 border border-white/8 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                        <Bookmark className="w-12 h-12 text-white/15" />
                                    </div>
                                    <h3 className="text-2xl font-black mb-3 text-white/60">No ideas yet</h3>
                                    <p className="text-white/25 text-sm mb-10 max-w-xs mx-auto">Complete the quiz to generate personalized business ideas powered by AI.</p>
                                    <button onClick={onGoHome}
                                        className="bg-white text-black px-8 py-3.5 rounded-full font-black text-sm hover:bg-white/90 transition-all inline-flex items-center gap-2 shadow-xl">
                                        <ArrowUpRight className="w-4 h-4" /> Take the Quiz
                                    </button>
                                </motion.div>
                            ) : filteredIdeas.length === 0 ? (
                                <div className="text-center py-20">
                                    <AlertCircle className="w-10 h-10 text-white/20 mx-auto mb-4" />
                                    <p className="text-white/30 text-sm">No ideas match your search.</p>
                                </div>
                            ) : (
                                <>
                                    <p className="text-white/25 text-xs font-bold uppercase tracking-widest mb-4">
                                        {filteredIdeas.length} idea{filteredIdeas.length !== 1 ? 's' : ''}
                                    </p>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        {filteredIdeas.map((idea, i) => (
                                            <IdeaCard key={idea.id} idea={idea} index={i} onDelete={deleteIdea} />
                                        ))}
                                    </div>
                                    <div className="mt-10 text-center">
                                        <button onClick={onGoHome}
                                            className="inline-flex items-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white/60 hover:text-white px-6 py-3 rounded-full text-sm font-bold transition-all">
                                            <RefreshCcw className="w-4 h-4" /> Generate More Ideas
                                        </button>
                                    </div>
                                </>
                            )}
                        </motion.div>
                    )}

                    {/* ───── PROFILE TAB ───── */}
                    {activeTab === 'profile' && (
                        <motion.div key="profile" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                            <div className="grid gap-6 md:grid-cols-3">

                                {/* ── Avatar Column ── */}
                                <div className="md:col-span-1 space-y-4">
                                    <div className="bg-black border border-white/10 rounded-2xl p-6">
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-5">Profile Photo</h3>

                                        {/* Current avatar display */}
                                        <div className="flex justify-center mb-5">
                                            <div className="relative group">
                                                <div className="w-28 h-28 rounded-2xl overflow-hidden bg-white/5 border-2 border-white/15 shadow-xl">
                                                    {currentAvatar ? (
                                                        <img src={currentAvatar} alt="avatar" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <User className="w-12 h-12 text-white/20" />
                                                        </div>
                                                    )}
                                                </div>
                                                {editProfile !== null && (
                                                    <button
                                                        onClick={() => fileInputRef.current?.click()}
                                                        className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-2xl opacity-0 group-hover:opacity-100 transition-all"
                                                    >
                                                        <Camera className="w-7 h-7 text-white" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Upload button */}
                                        {editProfile !== null && (
                                            <>
                                                <input
                                                    ref={fileInputRef}
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handlePhotoSelect}
                                                    className="hidden"
                                                />
                                                <button
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="w-full flex items-center justify-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white/60 hover:text-white py-2.5 rounded-xl text-xs font-bold transition-all mb-4"
                                                >
                                                    <Upload className="w-4 h-4" />
                                                    {photoFile ? 'Change Photo' : 'Upload Photo'}
                                                </button>
                                                {photoFile && (
                                                    <p className="text-center text-white/30 text-xs mb-4">📸 {photoFile.name}</p>
                                                )}

                                                <div className="border-t border-white/5 pt-4">
                                                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/20 mb-3">Or pick an avatar</p>
                                                    <div className="grid grid-cols-3 gap-2">
                                                        {AVATAR_OPTIONS.map((url) => (
                                                            <button key={url}
                                                                onClick={() => {
                                                                    setEditProfile(prev => ({ ...prev, avatar_url: url }));
                                                                    setPhotoFile(null);
                                                                    setPhotoPreview(null);
                                                                }}
                                                                className={`w-full aspect-square rounded-xl overflow-hidden border-2 transition-all ${(editProfile.avatar_url === url && !photoPreview) ? 'border-white scale-105 shadow-lg' : 'border-white/10 hover:border-white/30'}`}
                                                            >
                                                                <img src={url} alt="avatar" className="w-full h-full bg-white/5" />
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {/* Account card */}
                                    <div className="bg-black border border-white/8 rounded-2xl p-6">
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 mb-4">Account</h3>
                                        <div className="space-y-3">
                                            <button onClick={onChangePlan}
                                                className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/3 hover:bg-white/8 border border-white/5 transition-all text-left">
                                                <PlanIcon className="w-4 h-4 text-white/40 flex-shrink-0" />
                                                <div>
                                                    <p className="text-xs font-bold text-white/70">Upgrade Plan</p>
                                                    <p className="text-[10px] text-white/30">Current: {planStyle.label}</p>
                                                </div>
                                                <ArrowUpRight className="w-3.5 h-3.5 text-white/20 ml-auto" />
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    await signOut(auth);
                                                    toast.success('Signed out');
                                                    onGoHome();
                                                }}
                                                className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/3 hover:bg-red-500/10 border border-white/5 hover:border-red-500/20 transition-all text-left group">
                                                <LogOut className="w-4 h-4 text-white/30 group-hover:text-red-400 flex-shrink-0" />
                                                <p className="text-xs font-bold text-white/50 group-hover:text-red-400">Sign Out</p>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* ── Profile Info Column ── */}
                                <div className="md:col-span-2">
                                    <div className="bg-black border border-white/10 rounded-2xl p-6">
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Profile Info</h3>
                                            {editProfile === null ? (
                                                <button onClick={() => setEditProfile({ ...profile })}
                                                    className="flex items-center gap-2 text-xs font-bold bg-white text-black px-4 py-2 rounded-full hover:bg-white/90 transition-all shadow-lg">
                                                    <Edit3 className="w-3.5 h-3.5" /> Edit
                                                </button>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => { setEditProfile(null); setPhotoFile(null); setPhotoPreview(null); }}
                                                        className="flex items-center gap-1.5 text-xs font-bold text-white/30 hover:text-white px-3 py-2 transition-all">
                                                        <X className="w-3.5 h-3.5" /> Cancel
                                                    </button>
                                                    <button onClick={saveProfile} disabled={savingProfile || uploadingPhoto}
                                                        className="flex items-center gap-2 text-xs font-bold bg-white text-black px-4 py-2 rounded-full disabled:opacity-50 hover:bg-white/90 transition-all shadow-lg">
                                                        {(savingProfile || uploadingPhoto) ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                                        {uploadingPhoto ? 'Uploading...' : 'Save Changes'}
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-6">
                                            {/* Full Name */}
                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-2 block">Full Name</label>
                                                {editProfile !== null ? (
                                                    <input
                                                        value={editProfile.full_name}
                                                        onChange={e => setEditProfile(prev => ({ ...prev, full_name: e.target.value }))}
                                                        className="w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-xl py-3.5 px-4 text-white outline-none transition-all"
                                                        placeholder="Your full name"
                                                    />
                                                ) : (
                                                    <p className="text-white font-semibold py-3">{profile.full_name || <span className="text-white/20 italic font-normal">Not set</span>}</p>
                                                )}
                                            </div>

                                            {/* Email readonly */}
                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-2 block">Email Address</label>
                                                <p className="text-white/40 font-semibold py-3 text-sm">{user?.email}</p>
                                            </div>

                                            {/* Bio */}
                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-2 block">Short Bio</label>
                                                {editProfile !== null ? (
                                                    <textarea
                                                        value={editProfile.bio}
                                                        onChange={e => setEditProfile(prev => ({ ...prev, bio: e.target.value }))}
                                                        className="w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-xl py-3.5 px-4 text-white outline-none transition-all min-h-[90px] resize-none"
                                                        placeholder="Tell us about yourself..."
                                                    />
                                                ) : (
                                                    <p className="text-white font-semibold py-3 text-sm leading-relaxed">{profile.bio || <span className="text-white/20 italic font-normal">Not set</span>}</p>
                                                )}
                                            </div>

                                            {/* Website */}
                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-2 block">Website</label>
                                                {editProfile !== null ? (
                                                    <div className="relative">
                                                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                                                        <input
                                                            value={editProfile.website}
                                                            onChange={e => setEditProfile(prev => ({ ...prev, website: e.target.value }))}
                                                            className="w-full bg-white/5 border border-white/10 focus:border-white/30 rounded-xl py-3.5 pl-11 pr-4 text-white outline-none transition-all"
                                                            placeholder="https://yoursite.com"
                                                        />
                                                    </div>
                                                ) : (
                                                    <p className="text-white font-semibold py-3 text-sm">
                                                        {profile.website ? (
                                                            <a href={profile.website} target="_blank" rel="noopener noreferrer"
                                                                className="text-white/60 hover:text-white underline underline-offset-4 flex items-center gap-1.5">
                                                                {profile.website}
                                                                <ExternalLink className="w-3 h-3" />
                                                            </a>
                                                        ) : <span className="text-white/20 italic font-normal">Not set</span>}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default Dashboard;
