import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LockOutlined, MailOutlined } from '@ant-design/icons';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import './Auth.css';

export const Login: React.FC = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
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

        if (!formData.email || !formData.password) {
            setError('Please fill in all fields');
            return;
        }

        try {
            await signInWithEmailAndPassword(auth, formData.email, formData.password);
            // On success, redirect
            navigate('/dashboard', { state: { justLoggedIn: true } });
        } catch (err: any) {
            console.error('Login error:', err);
            setError('Failed to login. Please check your credentials.');
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-image-section">
                <div className="auth-image-overlay">
                    <h2>Your Health,<br />Our Priority</h2>
                    <p>Access your medical records, schedule appointments, and connect with healthcare professionals all in one place.</p>
                </div>
            </div>

            <div className="auth-form-section">
                <div className="auth-card">
                    <div className="auth-header">
                        <div className="logo-container">
                            <img src="logo.png" alt="HomeCare" className="logo-icon" />
                        </div>
                        <h2>Welcome Back</h2>
                        <p className="welcome-text">Please enter your details to sign in.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="auth-form">
                        {error && <div className="error-message">{error}</div>}

                        <div className="form-group">
                            <label htmlFor="email">Email Address</label>
                            <div className="input-wrapper">
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="Enter your email"
                                    required
                                />
                                <MailOutlined className="input-icon" />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">Password</label>
                            <div className="input-wrapper">
                                <input
                                    type="password"
                                    id="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    required
                                />
                                <LockOutlined className="input-icon" />
                            </div>
                        </div>

                        <div className="form-options">
                            <label className="checkbox-label">
                                <input type="checkbox" />
                                <span>Remember me</span>
                            </label>
                            <Link to="/forgot-password" className="forgot-link">
                                Forgot password?
                            </Link>
                        </div>

                        <button type="submit" className="auth-button">
                            Sign In
                        </button>
                    </form>

                    <div className="auth-footer">
                        <p>
                            Don't have an account?
                            <Link to="/create-account" className="auth-link">
                                Sign Up
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
