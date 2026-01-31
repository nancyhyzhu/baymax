import React from 'react';
import { NavLink } from 'react-router-dom';
import { User, Activity, Calendar, Settings } from 'lucide-react';

export const Header: React.FC = () => {
  const linkStyle = ({ isActive }: { isActive: boolean }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    textDecoration: 'none',
    color: isActive ? 'var(--color-primary)' : 'var(--text-secondary)',
    fontWeight: isActive ? 600 : 400,
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    background: isActive ? 'var(--color-primary-light)' : 'transparent',
    transition: 'all 0.2s'
  });

  return (
    <header style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '2rem',
      padding: '1rem 2rem',
    }} className="glass-panel">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{
          background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
          borderRadius: '50%',
          padding: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 10px rgba(59, 130, 246, 0.3)'
        }}>
          <Activity size={24} color="white" />
        </div>
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--text-main)' }}>
          Baymax <span style={{ opacity: 0.5, fontWeight: 400 }}>Health Monitor</span>
        </h1>
      </div>

      <nav style={{ display: 'flex', gap: '1rem' }}>
        <NavLink to="/" style={linkStyle}>
          <Activity size={18} />
          Dashboard
        </NavLink>
        <NavLink to="/session" style={linkStyle}>
          <Calendar size={18} />
          Daily Session
        </NavLink>
        <NavLink to="/settings" style={linkStyle}>
          <Settings size={18} />
          User Settings
        </NavLink>
      </nav>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 600 }}>Hiro Hamada</div>
          <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Patient ID: #84920</div>
        </div>
        <div style={{
          background: 'rgba(59, 130, 246, 0.1)',
          padding: '0.5rem',
          borderRadius: '50%',
          color: 'var(--color-primary)'
        }}>
          <User size={20} />
        </div>
      </div>
    </header>
  );
};
