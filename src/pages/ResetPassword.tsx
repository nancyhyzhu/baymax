import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Auth.css';

export const ResetPassword: React.FC = () => {
    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!formData.password || !formData.confirmPassword) {
            setError('Please fill in all fields');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        // TODO: Add logic to reset password via API
        console.log('Password reset submitted');

        // Simulate successful reset
        alert('Password reset successfully! You can now login.');
        navigate('/login');
    };

    return (
        <div className="auth-container">
            <div className="auth-image-section">
                <div className="auth-image-overlay">
                    <h2>Secure Your<br />Account</h2>
                    <p>Choose a strong password to keep your health data safe and secure.</p>
                </div>
            </div>

            <div className="auth-form-section">
                <div className="auth-card">
                    <div className="auth-header">
                        <div className="logo-container">
                            <img src="/logo (1).png" alt="Baymax" className="logo-icon" />
                            <span className="logo-text" style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--text-main)' }}>Baymax</span>
                        </div>
                        <h2>Reset Password</h2>
                        <p className="welcome-text">Create a new password for your account.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="auth-form">
                        {error && <div className="error-message">{error}</div>}

                        <div className="form-group">
                            <label htmlFor="password">New Password</label>
                            <div className="input-wrapper">
                                <input
                                    type="password"
                                    id="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Enter new password"
                                    required
                                />
                                <span className="input-icon">🔒</span>
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="confirmPassword">Confirm New Password</label>
                            <div className="input-wrapper">
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    placeholder="Confirm new password"
                                    required
                                />
                                <span className="input-icon">🔒</span>
                            </div>
                        </div>

                        <button type="submit" className="auth-button">
                            Reset Password
                        </button>
                    </form>

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
