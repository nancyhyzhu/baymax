import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';

export const WelcomeWidget: React.FC = () => {
    const { profile } = useUser();
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000); // Update every second

        return () => clearInterval(timer);
    }, []);

    const getGreeting = () => {
        const hour = currentTime.getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    };

    const userName = profile?.name || 'User';

    // Get a daily inspirational quote (same quote for the entire day)
    const getDailyQuote = () => {
        const quotes = [
            { text: "Your health is your wealth. Take care of it every day.", author: "Unknown" },
            { text: "Small steps lead to big changes. Keep moving forward.", author: "Unknown" },
            { text: "Every day is a fresh start. Make it count.", author: "Unknown" },
            { text: "Your body can do it. It's your mind you need to convince.", author: "Unknown" },
            { text: "Progress, not perfection. Every effort matters.", author: "Unknown" },
            { text: "Take care of your body. It's the only place you have to live.", author: "Jim Rohn" },
            { text: "Health is not about the weight you lose, but the life you gain.", author: "Unknown" },
            { text: "The greatest wealth is health.", author: "Virgil" },
            { text: "You are stronger than you think. Believe in yourself.", author: "Unknown" },
            { text: "Wellness is not a destination, it's a way of life.", author: "Unknown" },
            { text: "Your future self will thank you for the choices you make today.", author: "Unknown" },
            { text: "Healing takes time, but every step forward is progress.", author: "Unknown" },
            { text: "Self-care is not selfish. It's essential.", author: "Unknown" },
            { text: "Your health journey is unique. Trust the process.", author: "Unknown" },
            { text: "Every moment is a new beginning. Embrace it.", author: "Unknown" },
            { text: "Take it one day at a time. You've got this.", author: "Unknown" },
            { text: "Your body hears everything your mind says. Stay positive.", author: "Naomi Judd" },
            { text: "Health is the crown on a well person's head that only a sick person can see.", author: "Unknown" },
            { text: "The best time to take care of your health was yesterday. The second best time is now.", author: "Unknown" },
            { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
            { text: "The only bad workout is the one that didn't happen.", author: "Unknown" },
            { text: "Take care of your body. It's the only place you have to live.", author: "Jim Rohn" },
            { text: "To keep the body in good health is a duty... otherwise we shall not be able to keep our mind strong and clear.", author: "Buddha" },
            { text: "The greatest medicine of all is to teach people how not to need it.", author: "Hippocrates" },
            { text: "A healthy outside starts from the inside.", author: "Robert Urich" }
        ];

        // Use the date as a seed to get the same quote for the entire day
        const today = new Date();
        const dateString = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
        let hash = 0;
        for (let i = 0; i < dateString.length; i++) {
            hash = ((hash << 5) - hash) + dateString.charCodeAt(i);
            hash = hash & hash; // Convert to 32-bit integer
        }
        const index = Math.abs(hash) % quotes.length;
        return quotes[index];
    };

    return (
        <div className="glass-panel" style={{ 
            padding: '2rem', 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'space-between'
        }}>
            <div>
                <h2 style={{ 
                    margin: 0, 
                    marginBottom: '0.5rem', 
                    fontSize: '1.75rem',
                    fontWeight: 600,
                    color: 'var(--text-main)'
                }}>
                    {getGreeting()}, {userName}!
                </h2>
                <p style={{ 
                    margin: 0, 
                    marginBottom: '2rem', 
                    fontSize: '1rem',
                    opacity: 0.7,
                    color: 'var(--text-secondary)'
                }}>
                    {formatDate(currentTime)}
                </p>
            </div>
            
            <div>
                <div style={{
                    fontSize: '4rem',
                    fontWeight: 700,
                    color: 'var(--color-primary)',
                    fontFamily: 'monospace',
                    letterSpacing: '0.05em',
                    marginBottom: '1rem',
                    lineHeight: 1
                }}>
                    {formatTime(currentTime)}
                </div>
            </div>

            <div style={{
                padding: '1rem',
                background: 'rgba(59, 130, 246, 0.08)',
                borderRadius: '8px',
                borderLeft: '3px solid var(--color-primary)'
            }}>
                <p style={{
                    margin: 0,
                    marginBottom: '0.5rem',
                    fontSize: '0.9rem',
                    fontStyle: 'italic',
                    color: 'var(--text-main)',
                    lineHeight: '1.6',
                    opacity: 0.9
                }}>
                    "{getDailyQuote().text}"
                </p>
                <p style={{
                    margin: 0,
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)',
                    opacity: 0.7,
                    textAlign: 'right'
                }}>
                    — {getDailyQuote().author}
                </p>
            </div>
        </div>
    );
};
