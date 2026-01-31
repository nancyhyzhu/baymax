import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { User, Activity, Calendar, Settings, LogOut } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useUser();

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

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      navigate('/login');
    }
  };

  return (
    <header style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '2rem',
      padding: '1rem 2rem',
    }} className="glass-panel">

      {/* ... Logo section unchanged ... */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <img
          src="/logo (1).png"
          alt="Baymax"
          style={{
            width: '40px',
            height: '40px',
            objectFit: 'contain'
          }}
        />
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--text-main)' }}>
          Baymax <span style={{ opacity: 0.5, fontWeight: 400 }}>Health Monitor</span>
        </h1>
      </div>

      <nav style={{ display: 'flex', gap: '1rem' }}>
        <NavLink to="/dashboard" style={linkStyle}>
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

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 600 }}>{profile.name || 'Guest'}</div>
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

        <div style={{ height: '24px', width: '1px', background: 'var(--glass-border)' }}></div>

        <button
          onClick={handleLogout}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            padding: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'color 0.2s',
            boxShadow: 'none'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-danger)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
          title="Sign Out"
        >
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
};
