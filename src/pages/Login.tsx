import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Activity, Lock, Mail } from 'lucide-react';
import { seedDatabase } from '../utils/seedData';

export const Login: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                navigate('/');
            } else {
                const { data, error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;
                // Seed generic data then go to onboarding to fill specific details
                if (data.user) {
                    await seedDatabase(data.user.id, email);
                }
                navigate('/onboarding');
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem'
        }}>
            <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '2.5rem', background: 'rgba(255,255,255,0.85)' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                        borderRadius: '50%',
                        width: '60px',
                        height: '60px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1rem auto',
                        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)'
                    }}>
                        <Activity size={32} color="white" />
                    </div>
                    <h1 style={{ margin: 0, fontSize: '1.75rem', color: 'var(--text-main)' }}>
                        {isLogin ? 'Welcome Back' : 'Create Account'}
                    </h1>
                    <p style={{ margin: '0.5rem 0 0 0', opacity: 0.6 }}>Baymax Health Monitor</p>
                </div>

                {error && (
                    <div style={{
                        background: 'var(--color-danger-light)',
                        color: 'var(--color-danger)',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        marginBottom: '1.5rem',
                        fontSize: '0.9rem',
                        textAlign: 'center'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1.25rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>Email</label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem 1rem 0.75rem 2.5rem',
                                    borderRadius: '8px',
                                    border: '1px solid var(--input-border)',
                                    background: 'var(--input-bg)',
                                    fontSize: '1rem',
                                    outline: 'none',
                                    color: 'var(--text-main)',
                                    boxSizing: 'border-box' // Fix padding overflow
                                }}
                                placeholder="hiro@sfit.edu"
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>Password</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem 1rem 0.75rem 2.5rem',
                                    borderRadius: '8px',
                                    border: '1px solid var(--input-border)',
                                    background: 'var(--input-bg)',
                                    fontSize: '1rem',
                                    outline: 'none',
                                    color: 'var(--text-main)',
                                    boxSizing: 'border-box'
                                }}
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="primary-btn"
                        style={{ width: '100%', padding: '0.8rem', fontSize: '1.1rem' }}
                        disabled={loading}
                    >
                        {loading ? 'Processing...' : (isLogin ? 'Log In' : 'Sign Up')}
                    </button>
                </form>

                <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>
                    <span style={{ opacity: 0.6 }}>
                        {isLogin ? "Don't have an account? " : "Already have an account? "}
                    </span>
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        style={{
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            color: 'var(--color-primary)',
                            fontWeight: 600,
                            cursor: 'pointer',
                            boxShadow: 'none'
                        }}
                    >
                        {isLogin ? 'Sign Up' : 'Log In'}
                    </button>
                </div>
            </div>
        </div>
    );
};
