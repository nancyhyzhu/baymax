import React from 'react';
import { Smile, Frown, Meh, AlertCircle } from 'lucide-react';

interface ExpressionWidgetProps {
    expression: 'happy' | 'anxious' | 'neutral' | 'angry';
}

export const ExpressionWidget: React.FC<ExpressionWidgetProps> = ({ expression }) => {
    const getConfig = () => {
        switch (expression) {
            case 'happy':
                return { icon: Smile, color: '#10b981', label: 'Excited / Happy', desc: 'User is in a positive state.' };
            case 'anxious':
                return { icon: AlertCircle, color: '#f59e0b', label: 'Anxious', desc: 'Elevated stress levels detected.' };
            case 'angry':
                return { icon: Frown, color: '#ef4444', label: 'Angry / Stressed', desc: 'High arousal negative state.' };
            default:
                return { icon: Meh, color: '#94a3b8', label: 'Calm / Neutral', desc: 'Baseline emotional state.' };
        }
    };

    const { icon: Icon, color, label, desc } = getConfig();

    return (
        <div className="glass-panel" style={{
            padding: '2rem',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            borderTop: `4px solid ${color}`
        }}>
            <div style={{
                position: 'relative',
                marginBottom: '1.5rem',
                filter: `drop-shadow(0 0 20px ${color}55)`
            }}>
                <Icon size={80} color={color} strokeWidth={1.5} />
            </div>

            <h2 style={{ margin: '0 0 0.5rem 0', color: color }}>{label}</h2>
            <p style={{ margin: 0, opacity: 0.7, maxWidth: '200px' }}>{desc}</p>

            <div style={{ marginTop: '2rem', width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.8rem', opacity: 0.6, color: 'var(--text-main)' }}>
                    <span>Confidence</span>
                    <span>94%</span>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'rgba(0,0,0,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: '94%', height: '100%', background: color, borderRadius: '3px' }}></div>
                </div>
            </div>
        </div>
    );
};
