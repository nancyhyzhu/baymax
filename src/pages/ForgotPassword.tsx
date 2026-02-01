import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Auth.css';

export const ForgotPassword: React.FC = () => {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!email) {
            setError('Please enter your email address');
            return;
        }

        // TODO: Add logic to send password reset email
        console.log('Reset password requested for:', email);

        // Simulate successful request
        setSubmitted(true);
    };

    return (
        <div className="auth-container">
            <div className="auth-image-section">
                <div className="auth-image-overlay">
                    <h2>Recover Your<br />Account</h2>
                    <p>Don't worry, it happens to the best of us. We'll help you get back to your account in no time.</p>
                </div>
            </div>

            <div className="auth-form-section">
                <div className="auth-card">
                    <div className="auth-header">
                        <div className="logo-container">
                            <img src="logo.png" alt="HomeCare" className="logo-icon" />
                            <span className="logo-text" style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--text-main)' }}>HomeCare</span>
                        </div>
                        <h2>Forgot Password?</h2>
                        <p className="welcome-text">Enter your email address to receive a password reset link.</p>
                    </div>

                    {!submitted ? (
                        <form onSubmit={handleSubmit} className="auth-form">
                            {error && <div className="error-message">{error}</div>}

                            <div className="form-group">
                                <label htmlFor="email">Email Address</label>
                                <div className="input-wrapper">
                                    <input
                                        type="email"
                                        id="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Enter your email"
                                        required
                                    />
                                    <span className="input-icon">✉</span>
                                </div>
                            </div>

                            <button type="submit" className="auth-button">
                                Send Reset Link
                            </button>
                        </form>
                    ) : (
                        <div className="success-message">
                            <div style={{ fontSize: '48px', marginBottom: '16px' }}>✉️</div>
                            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>Check your email</h3>
                            <p style={{ marginBottom: '24px', color: 'var(--text-main)' }}>We've sent a password reset link to <strong>{email}</strong></p>
                            <button
                                onClick={() => setSubmitted(false)}
                                className="auth-button"
                                style={{ backgroundColor: 'transparent', color: 'var(--color-primary)', border: '1px solid var(--color-primary)', boxShadow: 'none' }}
                            >
                                Try another email
                            </button>
                        </div>
                    )}

                    <div className="auth-footer">
                        <p>
                            Remember your password?
                            <Link to="/login" className="auth-link">
                                Sign In
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
