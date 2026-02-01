import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserOutlined, MailOutlined, LockOutlined } from '@ant-design/icons';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../firebase';
import './Auth.css';

export const CreateAccount: React.FC = () => {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Basic validation
        if (!formData.fullName || !formData.email || !formData.password || !formData.confirmPassword) {
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

        try {
            // Create user account
            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);

            // Update display name
            await updateProfile(userCredential.user, {
                displayName: formData.fullName
            });

            // Navigate to onboarding
            navigate('/onboarding');
        } catch (err: any) {
            console.error('Registration error:', err);
            if (err.code === 'auth/email-already-in-use') {
                setError('Email already in use');
            } else if (err.code === 'auth/weak-password') {
                setError('Password is too weak');
            } else {
                setError('Failed to create account. Please try again.');
            }
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-image-section">
                <div className="auth-image-overlay">
                    <h2>Join Our<br />Community</h2>
                    <p>Start your journey towards better health management today. It only takes a minute to get started.</p>
                </div>
            </div>

            <div className="auth-form-section">
                <div className="auth-card">
                    <div className="auth-header">
                        <div className="logo-container">
                            <img src="/logo (1).png" alt="HomeCare" className="logo-icon" />
                        </div>
                        <h2>Create Account</h2>
                        <p className="welcome-text">Fill in your details to create your account.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="auth-form">
                        {error && <div className="error-message">{error}</div>}

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                            <div className="form-group">
                                <label htmlFor="fullName">Full Name</label>
                                <div className="input-wrapper">
                                    <input
                                        type="text"
                                        id="fullName"
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleChange}
                                        placeholder="John Doe"
                                        required
                                    />
                                    <UserOutlined className="input-icon" />
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="email">Email</label>
                                <div className="input-wrapper">
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="john@example.com"
                                        required
                                    />
                                    <MailOutlined className="input-icon" />
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                            <div className="form-group">
                                <label htmlFor="password">Password</label>
                                <div className="input-wrapper">
                                    <input
                                        type="password"
                                        id="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="Password"
                                        required
                                    />
                                    <LockOutlined className="input-icon" />
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="confirmPassword">Confirm</label>
                                <div className="input-wrapper">
                                    <input
                                        type="password"
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        placeholder="Confirm"
                                        required
                                    />
                                    <LockOutlined className="input-icon" />
                                </div>
                            </div>
                        </div>

                        <div className="form-options">
                            <label className="checkbox-label">
                                <input type="checkbox" required />
                                <span>I agree to the <a href="#" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>Terms & Conditions</a></span>
                            </label>
                        </div>

                        <button type="submit" className="auth-button">
                            Create Account
                        </button>
                    </form>

                    <div className="auth-footer">
                        <p>
                            Already have an account?
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
