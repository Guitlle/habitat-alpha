import React, { useState } from 'react';
import { supabase } from '../../services/supabase';
import { X, Mail, Lock, User, Loader2, Command } from 'lucide-react';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [authMethod, setAuthMethod] = useState<'password' | 'otp'>('password');
    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (authMethod === 'otp') {
                if (!otpSent) {
                    // Send OTP
                    const { error } = await supabase.auth.signInWithOtp({ email });
                    if (error) throw error;
                    setOtpSent(true);
                    alert('Code sent to your email!');
                } else {
                    // Verify OTP
                    const { error } = await supabase.auth.verifyOtp({ email, token: otp, type: 'email' });
                    if (error) throw error;
                    onClose();
                }
            } else {
                // Password Flow
                if (isLogin) {
                    const { error } = await supabase.auth.signInWithPassword({ email, password });
                    if (error) throw error;
                } else {
                    const { error } = await supabase.auth.signUp({ email, password });
                    if (error) throw error;
                    alert('Success! Please check your email for confirmation.');
                }
                onClose();
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred during authentication');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/50 dark:bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 w-full max-w-md shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] relative overflow-hidden">
                {/* Visual Accent */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500"></div>

                <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                    <X size={20} />
                </button>

                <div className="flex flex-col items-center mb-6">
                    <div className="p-3 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-500/20 mb-4">
                        <Command size={28} className="text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {otpSent ? 'Enter Code' : (isLogin ? 'Welcome Back' : 'Create Account')}
                    </h2>

                    {/* Method Toggle */}
                    {!otpSent && (
                        <div className="flex bg-gray-100 dark:bg-gray-900/50 p-1 rounded-lg mt-4 w-full">
                            <button
                                onClick={() => setAuthMethod('password')}
                                className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-all ${authMethod === 'password' ? 'bg-white dark:bg-gray-800 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500'}`}
                            >
                                Password
                            </button>
                            <button
                                onClick={() => setAuthMethod('otp')}
                                className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-all ${authMethod === 'otp' ? 'bg-white dark:bg-gray-800 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500'}`}
                            >
                                Email Code
                            </button>
                        </div>
                    )}
                </div>

                <form onSubmit={handleAuth} className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
                        <div className="relative">
                            <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                required type="email" value={email} onChange={e => setEmail(e.target.value)}
                                className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl pl-12 pr-4 py-3.5 text-sm text-gray-900 dark:text-white focus:border-indigo-500 outline-none transition-all focus:ring-4 focus:ring-indigo-500/10 placeholder-gray-400"
                                placeholder="name@example.com"
                            />
                        </div>
                    </div>

                    {/* OTP Input */}
                    {authMethod === 'otp' && otpSent && (
                        <div className="space-y-1.5 animate-in fade-in slide-in-from-bottom-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">6-Digit Code</label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    required type="text" value={otp} onChange={e => setOtp(e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl pl-12 pr-4 py-3.5 text-sm text-gray-900 dark:text-white focus:border-indigo-500 outline-none transition-all focus:ring-4 focus:ring-indigo-500/10 placeholder-gray-400 font-mono tracking-widest"
                                    placeholder="123456"
                                />
                            </div>
                        </div>
                    )}

                    {/* Password Input */}
                    {authMethod === 'password' && (
                        <div className="space-y-1.5 animate-in fade-in slide-in-from-bottom-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Password</label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    required type="password" value={password} onChange={e => setPassword(e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl pl-12 pr-4 py-3.5 text-sm text-gray-900 dark:text-white focus:border-indigo-500 outline-none transition-all focus:ring-4 focus:ring-indigo-500/10 placeholder-gray-400"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-xl flex items-center gap-3 text-red-600 dark:text-red-400 text-xs">
                            <span>{error}</span>
                        </div>
                    )}

                    <button
                        disabled={loading}
                        type="submit"
                        className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-400 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transform active:scale-[0.98]"
                    >
                        {loading ? <Loader2 size={18} className="animate-spin" /> : (
                            authMethod === 'otp'
                                ? (otpSent ? 'Verify Code' : 'Send Code')
                                : (isLogin ? 'Sign In' : 'Get Started')
                        )}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-900 flex justify-center">
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-xs text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-medium"
                    >
                        {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AuthModal;
