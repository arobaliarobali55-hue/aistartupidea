import React from 'react';

const Footer = () => {
    return (
        <footer className="py-20 border-t border-white/5">
            <div className="max-w-7xl mx-auto px-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-10">
                    <div className="flex items-center gap-2">
                        <img src="/logo.png" alt="logo" className="w-8 h-8 rounded-lg object-contain" />
                        <span className="text-xl font-bold tracking-tighter">aistartupidea</span>
                    </div>

                    <div className="flex gap-12">
                        {['Press', 'Legal', 'Privacy', 'Contact'].map(link => (
                            <a key={link} href="#" className="text-xs font-bold uppercase tracking-widest text-white/40 hover:text-white transition-colors">
                                {link}
                            </a>
                        ))}
                    </div>

                    <div className="text-white/20 text-xs font-medium">
                        © 2026 aistartupidea Labs Inc. Aligns with AI.
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
