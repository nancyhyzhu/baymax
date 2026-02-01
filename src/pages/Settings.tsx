import React, { useState, useEffect } from 'react';
import { Save, Lock, User as UserIcon } from 'lucide-react';
import { useUser } from '../context/UserContext';
import './Settings.css';

export const Settings: React.FC = () => {
  const { profile, updateProfile } = useUser();

  // We keep local state for form fields to allow editing before saving
  const [formData, setFormData] = useState(profile);

  useEffect(() => {
    setFormData(profile);
  }, [profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    await updateProfile(formData);
    alert('Settings saved successfully!');
  };

  const InputGroup = ({ label, name, type = 'text', value, placeholder }: any) => (
    <div className="form-group settings-form-group" style={{ marginBottom: '1rem' }}>
      <label style={{ 
        display: 'block', 
        marginTop: '0rem',
        fontSize: '0.875rem',
        fontWeight: 600,
        color: 'var(--text-main)'
      }}>{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className="form-input"
        style={{
          width: '100%',
          padding: '0.875rem 1rem',
          border: '1.5px solid rgba(0, 0, 0, 0.1)',
          borderRadius: '0.75rem',
          fontSize: '0.95rem',
          background: 'rgba(255, 255, 255, 0.7)',
          color: 'var(--text-main)',
          fontFamily: 'inherit',
          boxSizing: 'border-box',
          outline: 'none',
          transition: 'all 0.2s ease'
        }}
        onFocus={(e) => {
          e.target.style.borderColor = 'var(--color-primary)';
          e.target.style.background = '#fff';
          e.target.style.boxShadow = '0 0 0 4px var(--color-primary-light)';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = 'rgba(0, 0, 0, 0.1)';
          e.target.style.background = 'rgba(255, 255, 255, 0.7)';
          e.target.style.boxShadow = 'none';
        }}
        onMouseEnter={(e) => {
          if (document.activeElement !== e.currentTarget) {
            e.currentTarget.style.borderColor = 'var(--color-primary)';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
          }
        }}
        onMouseLeave={(e) => {
          if (document.activeElement !== e.currentTarget) {
            e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.1)';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.7)';
          }
        }}
      />
    </div>
  );

  return (
    <div className="glass-panel settings-container" style={{ padding: '2rem', maxWidth: '1200px', margin: '2rem auto' }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '1rem', 
        marginBottom: '2rem', 
        borderBottom: '1px solid rgba(0, 0, 0, 0.1)', 
        paddingBottom: '1rem' 
      }}>
        <UserIcon size={32} color="var(--color-primary)" />
        <h2 style={{ 
          margin: 0, 
          fontSize: '1.5rem',
          fontWeight: 700,
          color: 'var(--text-main)',
          letterSpacing: '-0.025em'
        }}>User Settings</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Account Info */}
        <section>
          <h3 style={{ 
            marginTop: 0, 
            marginBottom: '1.5rem', 
            color: 'var(--color-primary)',
            fontSize: '1.25rem',
            fontWeight: 700,
            letterSpacing: '-0.025em'
          }}>Account Information</h3>
          <InputGroup label="Full Name" name="name" value={formData.name} />
          <InputGroup label="Email Address" name="email" value={formData.email} type="email" />

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label style={{ 
              display: 'block', 
              marginTop: '0rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'var(--text-main)'
            }}>Password</label>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <input
                type="password"
                value="********"
                readOnly
                className="form-input"
                style={{
                  flex: 1,
                  padding: '0.875rem 1rem',
                  border: '1.5px solid rgba(0, 0, 0, 0.1)',
                  borderRadius: '0.75rem',
                  fontSize: '0.95rem',
                  background: 'rgba(255, 255, 255, 0.7)',
                  color: 'var(--text-main)',
                  fontFamily: 'inherit',
                  opacity: 0.5,
                  cursor: 'not-allowed'
                }}
              />
              <button 
                className="primary-btn"
                style={{ 
                  whiteSpace: 'nowrap', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem',
                  padding: '0.875rem 1.25rem',
                  fontSize: '0.95rem',
                  fontWeight: 600
                }}
              >
                <Lock size={16} /> Change
              </button>
            </div>
          </div>
        </section>

        {/* Physical Stats */}
        <section>
          <h3 style={{ 
            marginTop: 0, 
            marginBottom: '1.5rem', 
            color: 'var(--color-success)',
            fontSize: '1.25rem',
            fontWeight: 700,
            letterSpacing: '-0.025em'
          }}>Physical Statistics</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <InputGroup label="Age" name="age" value={formData.age} type="number" />
            <InputGroup label="Sex" name="sex" value={formData.sex} />
            <InputGroup label="Height" name="height" value={formData.height} />
            <InputGroup label="Weight" name="weight" value={formData.weight} />
          </div>
        </section>
      </div>

      <section style={{ marginTop: '2rem' }}>
        <h3 style={{ 
          marginTop: 0, 
          marginBottom: '1.5rem', 
          color: 'var(--color-danger)',
          fontSize: '1.25rem',
          fontWeight: 700,
          letterSpacing: '-0.025em'
        }}>Caretaker Contact</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
          <InputGroup label="Caretaker Name" name="caretakerName" value={formData.caretakerName} />
          <InputGroup label="Phone Number" name="caretakerPhone" value={formData.caretakerPhone} />
        </div>
      </section>

      <div style={{ marginTop: '3rem', textAlign: 'right' }}>
        <button 
          className="primary-btn" 
          onClick={handleSave} 
          style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            padding: '0.875rem 2rem', 
            fontSize: '0.95rem',
            fontWeight: 600,
            borderRadius: '0.75rem'
          }}
        >
          <Save size={20} />
          Save Changes
        </button>
      </div>
    </div>
  );
};
