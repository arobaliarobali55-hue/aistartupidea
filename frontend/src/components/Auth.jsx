import React, { useState, useRef } from 'react';
import { auth, db, storage } from '../firebase';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    GithubAuthProvider,
    updateProfile,
    sendEmailVerification
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Mail, Lock, ArrowRight, Github, Chrome, Loader2, Send, MailCheck,
    User, Globe, FileText, Camera, Upload, Check, X
} from 'lucide-react';
import toast from 'react-hot-toast';

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

const InputField = ({ icon: Icon, label, type = 'text', value, onChange, placeholder, required }) => (
    <div className="space-y-1.5">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 ml-1 block">{label}</label>
        <div className="relative group">
            <Icon className="absolute left-5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-white/20 group-focus-within:text-white/50 transition-colors" />
            <input
                type={type}
                value={value}
                onChange={onChange}
                className="w-full bg-white/5 border border-white/10 focus:border-white/30 focus:bg-white/7 transition-all rounded-2xl py-4 pl-13 pr-5 text-white outline-none placeholder:text-white/15 text-sm"
                placeholder={placeholder}
                required={required}
            />
        </div>
    </div>
);

const AuthComponent = ({ onAuthSuccess }) => {
    const [mode, setMode] = useState('login'); // login | signup-step1 | signup-step2
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [bio, setBio] = useState('');
    const [website, setWebsite] = useState('');
    const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_OPTIONS[0]);
    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const fileInputRef = useRef(null);

    /* ── Photo select ── */
    const handlePhotoSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 3 * 1024 * 1024) { toast.error('Image must be under 3MB'); return; }
        setPhotoFile(file);
        setPhotoPreview(URL.createObjectURL(file));
    };

    /* ── Upload photo ── */
    const uploadPhoto = async (userId) => {
        if (!photoFile) return null;
        setUploadingPhoto(true);
        try {
            const ext = photoFile.name.split('.').pop();
            const storageRef = ref(storage, `avatars/${userId}/avatar-${Date.now()}.${ext}`);
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

    /* ── Login ── */
    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
            toast.success('Welcome back!');
            if (onAuthSuccess) onAuthSuccess();
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    /* ── Signup Step 1 ── */
    const handleSignupStep1 = (e) => {
        e.preventDefault();
        if (!email || !password || !fullName) return toast.error('Please fill all required fields.');
        if (password.length < 6) return toast.error('Password must be at least 6 characters.');
        setMode('signup-step2');
    };

    /* ── Signup Final ── */
    const handleSignupSubmit = async () => {
        setLoading(true);
        try {
            // Sign up first
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            const userId = user.uid;

            // Upload photo if provided
            let finalAvatarUrl = selectedAvatar;
            if (photoFile && userId) {
                const uploaded = await uploadPhoto(userId);
                if (uploaded) finalAvatarUrl = uploaded;
            }

            // Update Auth Profile
            await updateProfile(user, {
                displayName: fullName,
                photoURL: finalAvatarUrl
            });

            // Save to Firestore
            await setDoc(doc(db, 'users', userId), {
                full_name: fullName,
                avatar_url: finalAvatarUrl,
                bio,
                website,
                email,
                plan: 'free',
                plan_limit: 5,
                created_at: new Date().toISOString()
            });

            await sendEmailVerification(user);
            setEmailSent(true);

            toast.success('Account created! Please verify your email.');
            // Note: In Firebase, the user is signed in immediately after signup.
            // But we show the email confirmation screen.
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    /* ── Social login ── */
    const handleSocialLogin = async (providerName) => {
        try {
            let provider;
            if (providerName === 'google') provider = new GoogleAuthProvider();
            else if (providerName === 'github') provider = new GithubAuthProvider();

            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            // Check if user document exists, if not create it
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (!userDoc.exists()) {
                await setDoc(doc(db, 'users', user.uid), {
                    full_name: user.displayName || '',
                    avatar_url: user.photoURL || selectedAvatar,
                    bio: '',
                    website: '',
                    email: user.email,
                    plan: 'free',
                    plan_limit: 5,
                    created_at: new Date().toISOString()
                });
            }

            toast.success('Welcome!');
            if (onAuthSuccess) onAuthSuccess();
        } catch (error) {
            toast.error(error.message);
        }
    };

    /* ── Resend email ── */
    const handleResendEmail = async () => {
        setLoading(true);
        try {
            if (auth.currentUser) {
                await sendEmailVerification(auth.currentUser);
                toast.success('Confirmation email resent!');
            }
        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    /* ─────── Email confirmation screen ─────── */
    if (emailSent) {
        return (
            <div className="max-w-md mx-auto">
                <div className="bg-black border border-white/10 rounded-[2.5rem] p-8 sm:p-10 text-center shadow-2xl">
                    <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 200 }}
                        className="w-24 h-24 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <MailCheck className="w-10 h-10 text-white" />
                    </motion.div>
                    <h2 className="text-3xl font-black tracking-tight mb-3">Check your inbox</h2>
                    <p className="text-white/40 text-sm mb-2">Confirmation sent to</p>
                    <p className="text-white font-bold text-sm mb-6 break-all">{email}</p>
                    <p className="text-white/30 text-xs mb-8 leading-relaxed">Click the link in the email to activate your account. Then come back and sign in.</p>
                    <div className="space-y-3">
                        <button onClick={() => { setMode('login'); setEmailSent(false); }}
                            className="w-full bg-white text-black py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/90 transition-all flex items-center justify-center gap-2">
                            <ArrowRight className="w-4 h-4" /> Go to Sign In
                        </button>
                        <button onClick={handleResendEmail} disabled={loading}
                            className="w-full bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Resend Email
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    /* ─────── Signup Step 2: Photo & Profile ─────── */
    if (mode === 'signup-step2') {
        const currentAvatar = photoPreview || selectedAvatar;
        return (
            <div className="max-w-lg mx-auto">
                <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }}
                    className="bg-black border border-white/10 rounded-[2.5rem] p-8 sm:p-10 shadow-2xl">

                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 font-bold text-3xl text-black italic shadow-xl">T</div>
                        <h2 className="text-3xl font-black tracking-tight mb-2">Make it yours</h2>
                        <p className="text-white/40 text-sm">Add your photo and complete your profile</p>
                    </div>

                    {/* Profile Photo Upload */}
                    <div className="mb-7">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-3 block">Profile Photo</label>
                        <div className="flex items-center gap-5">
                            {/* Avatar preview */}
                            <div className="relative group flex-shrink-0">
                                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-white/5 border-2 border-white/15 shadow-lg">
                                    <img src={currentAvatar} alt="avatar" className="w-full h-full object-cover bg-white/5" />
                                </div>
                                <button onClick={() => fileInputRef.current?.click()}
                                    className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-2xl opacity-0 group-hover:opacity-100 transition-all">
                                    <Camera className="w-6 h-6 text-white" />
                                </button>
                            </div>

                            <div className="flex-1 space-y-2">
                                <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />
                                <button onClick={() => fileInputRef.current?.click()}
                                    className="w-full flex items-center justify-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white/60 hover:text-white py-3 rounded-xl text-xs font-bold transition-all">
                                    <Upload className="w-4 h-4" />
                                    {photoFile ? 'Change Photo' : 'Upload a Photo'}
                                </button>
                                {photoFile && (
                                    <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                                        <Check className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                                        <span className="text-white/50 text-xs truncate">{photoFile.name}</span>
                                        <button onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                                            className="ml-auto text-white/30 hover:text-white transition-colors flex-shrink-0">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                )}
                                <p className="text-white/20 text-[10px]">JPG, PNG, GIF · Max 3MB</p>
                            </div>
                        </div>
                    </div>

                    {/* Avatar grid (alternative) */}
                    <div className="mb-7">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-3 block">Or Choose an Avatar</label>
                        <div className="grid grid-cols-9 gap-1.5">
                            {AVATAR_OPTIONS.map((url) => (
                                <button key={url} onClick={() => { setSelectedAvatar(url); setPhotoFile(null); setPhotoPreview(null); }}
                                    className={`w-full aspect-square rounded-xl overflow-hidden border-2 transition-all ${(selectedAvatar === url && !photoPreview) ? 'border-white scale-105 shadow-lg' : 'border-white/10 hover:border-white/30'}`}>
                                    <img src={url} alt="avatar" className="w-full h-full bg-white/5" />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Bio & Website */}
                    <div className="space-y-4 mb-7">
                        <InputField icon={FileText} label="Short Bio (Optional)" value={bio} onChange={e => setBio(e.target.value)} placeholder="e.g. Aspiring entrepreneur, designer..." />
                        <InputField icon={Globe} label="Website (Optional)" value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://yoursite.com" />
                    </div>

                    <button onClick={handleSignupSubmit} disabled={loading || uploadingPhoto}
                        className="w-full bg-white text-black py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-white/90 transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-xl">
                        {(loading || uploadingPhoto) ? <Loader2 className="w-5 h-5 animate-spin" /> : <><span>Create Account</span><ArrowRight className="w-5 h-5" /></>}
                    </button>
                    <button onClick={() => setMode('signup-step1')} className="w-full mt-3 text-white/30 hover:text-white text-xs font-bold py-2 transition-colors">← Back</button>
                </motion.div>
            </div>
        );
    }

    /* ─────── Login / Signup Step 1 ─────── */
    return (
        <div className="max-w-md mx-auto">
            <AnimatePresence mode="wait">
                <motion.div key={mode} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                    className="bg-black border border-white/10 rounded-[2.5rem] p-8 sm:p-10 shadow-2xl">

                    <div className="text-center mb-10">
                        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                            className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 font-bold text-3xl text-black italic shadow-xl">T
                        </motion.div>
                        <h2 className="text-3xl font-black tracking-tight mb-2">
                            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
                        </h2>
                        <p className="text-white/40 text-sm">
                            {mode === 'login' ? 'Elevate your business strategy today.' : 'Start your journey to a million-dollar venture.'}
                        </p>
                    </div>

                    {/* Progress indicator for signup */}
                    {mode === 'signup-step1' && (
                        <div className="flex items-center gap-2 mb-8">
                            <div className="flex-1 h-1 rounded-full bg-white" />
                            <div className="flex-1 h-1 rounded-full bg-white/15" />
                            <span className="text-[10px] text-white/30 font-bold ml-1">Step 1 of 2</span>
                        </div>
                    )}

                    <form onSubmit={mode === 'login' ? handleLoginSubmit : handleSignupStep1} className="space-y-4">
                        {mode === 'signup-step1' && (
                            <InputField icon={User} label="Full Name *" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="John Doe" required />
                        )}
                        <InputField icon={Mail} label="Email Address *" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@company.com" required />
                        <InputField icon={Lock} label="Password *" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />

                        <button type="submit" disabled={loading}
                            className="w-full bg-white text-black py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-white/90 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 mt-4 shadow-xl">
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                <>{mode === 'login' ? 'Sign In' : 'Continue'}<ArrowRight className="w-5 h-5" /></>
                            )}
                        </button>
                    </form>

                    <div className="mt-8">
                        <div className="relative flex items-center mb-6">
                            <div className="flex-grow border-t border-white/5" />
                            <span className="flex-shrink mx-4 text-[10px] font-black text-white/20 uppercase tracking-widest">Or Continue With</span>
                            <div className="flex-grow border-t border-white/5" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={() => handleSocialLogin('google')}
                                className="flex items-center justify-center gap-3 bg-white/5 border border-white/10 hover:bg-white/10 transition-all py-3.5 rounded-2xl group">
                                <Chrome className="w-5 h-5 text-white/40 group-hover:text-white transition-colors" />
                                <span className="text-xs font-bold text-white/70 group-hover:text-white transition-colors">Google</span>
                            </button>
                            <button onClick={() => handleSocialLogin('github')}
                                className="flex items-center justify-center gap-3 bg-white/5 border border-white/10 hover:bg-white/10 transition-all py-3.5 rounded-2xl group">
                                <Github className="w-5 h-5 text-white/40 group-hover:text-white transition-colors" />
                                <span className="text-xs font-bold text-white/70 group-hover:text-white transition-colors">GitHub</span>
                            </button>
                        </div>
                    </div>

                    <div className="mt-8 text-center">
                        <button onClick={() => setMode(mode === 'login' ? 'signup-step1' : 'login')} className="text-xs font-bold">
                            <span className="text-white/30 mr-2">
                                {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
                            </span>
                            <span className="text-white hover:underline underline-offset-4 decoration-2">
                                {mode === 'login' ? 'Sign Up for Free' : 'Sign In'}
                            </span>
                        </button>
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default AuthComponent;

