import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Bell } from 'lucide-react';

interface GraphCardProps {
    title: string;
    data: any[];
    dataKey: string;
    color: string;
    unit: string;
    averageValue?: number;
    status?: 'typical' | 'atypical';
    onNotifyCaretaker?: () => void;
}

export const GraphCard: React.FC<GraphCardProps> = ({
    title,
    data,
    dataKey,
    color,
    unit,
    averageValue,
    status = 'typical',
    onNotifyCaretaker
}) => {
    return (
        <div className="glass-panel" style={{ padding: '1rem', height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <h3 style={{ margin: 0, opacity: 0.8 }}>{title}</h3>
                    {status === 'atypical' && (
                        <div
                            className="atypical-badge"
                            title="Atypical readings detected"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                background: 'var(--color-danger-light)',
                                color: 'var(--color-danger)',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '999px',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                cursor: 'pointer'
                            }}
                            onClick={onNotifyCaretaker}
                        >
                            <Bell size={14} />
                            <span>Warning</span>
                        </div>
                    )}
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: color }}>
                        {averageValue ? Math.round(averageValue) : '-'} <span style={{ fontSize: '1rem', opacity: 0.6 }}>{unit}</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.5 }}>Average</div>
                </div>
            </div>

            <div style={{ flex: 1, width: '100%', minHeight: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 5, right: 30, left: 30, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                        <XAxis 
                            dataKey="time" 
                            stroke="var(--text-secondary)" 
                            tick={{ fontSize: 12, fill: 'var(--text-secondary)' }}
                            interval={0}
                            angle={0}
                            textAnchor="middle"
                            domain={['Mon', 'Sun']}
                            type="category"
                        />
                        <YAxis domain={['auto', 'auto']} hide />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '8px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                color: 'var(--text-main)'
                            }}
                            itemStyle={{ color: color, fontWeight: 600 }}
                            labelStyle={{ color: 'var(--text-secondary)' }}
                        />
                        <Line
                            type="monotone"
                            dataKey={dataKey}
                            stroke={color}
                            strokeWidth={3}
                            dot={false}
                            activeDot={{ r: 6, strokeWidth: 0 }}
                            animationDuration={500}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
