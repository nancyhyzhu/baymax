import React, { useState, useEffect } from 'react';
import { Save, Lock, User as UserIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export const Settings: React.FC = () => {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    age: 0,
    height: '',
    weight: '',
    sex: '',
    conditions: '',
    medications: '',
    caretakerName: '',
    caretakerPhone: '',
    email: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (currentUser) {
        setFormData(prev => ({ ...prev, email: currentUser.email || '' }));

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .single();

        if (data && !error) {
          // Map snake_case DB to camelCase State
          setFormData(prev => ({
            ...prev,
            name: data.name || '',
            age: data.age || 0,
            height: data.height || '',
            weight: data.weight || '',
            sex: data.sex || '',
            conditions: data.conditions || '',
            medications: data.medications || '',
            caretakerName: data.caretaker_name || '',
            caretakerPhone: data.caretaker_phone || ''
          }));
        }
        setLoading(false);
      }
    };
    fetchProfile();
  }, [currentUser]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    if (!currentUser) return;
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: currentUser.id,
          name: formData.name,
          age: Number(formData.age),
          height: formData.height,
          weight: formData.weight,
          sex: formData.sex,
          conditions: formData.conditions,
          medications: formData.medications,
          caretaker_name: formData.caretakerName,
          caretaker_phone: formData.caretakerPhone
        });

      if (error) throw error;
      alert('Settings saved successfully!');
    } catch (err: any) {
      alert('Error saving settings: ' + err.message);
    }
  };

  const InputGroup = ({ label, name, type = 'text', value, placeholder }: any) => (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{ display: 'block', marginBottom: '0.5rem', opacity: 0.7, fontSize: '0.9rem' }}>{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '0.75rem',
          background: 'var(--input-bg)',
          border: '1px solid var(--input-border)',
          borderRadius: '8px',
          color: 'var(--text-main)',
          fontSize: '1rem',
          outline: 'none'
        }}
      />
    </div>
  );

  if (loading) return <div style={{ padding: '2rem' }}>Loading profile...</div>;

  return (
    <div className="glass-panel" style={{ padding: '2rem', maxWidth: '800px', margin: '2rem auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--input-border)', paddingBottom: '1rem' }}>
        <UserIcon size={32} color="#3b82f6" />
        <h2 style={{ margin: 0 }}>User Profile & Settings</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>

        {/* Account Info */}
        <section>
          <h3 style={{ marginTop: 0, marginBottom: '1.5rem', color: '#3b82f6' }}>Account Information</h3>
          <InputGroup label="Full Name" name="name" value={formData.name} />
          <InputGroup label="Email Address" name="email" value={formData.email} type="email" />

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', opacity: 0.7, fontSize: '0.9rem' }}>Password</label>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <input
                type="password"
                value="********"
                readOnly
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: 'var(--input-bg)',
                  border: '1px solid var(--input-border)',
                  borderRadius: '8px',
                  color: 'var(--text-main)',
                  fontSize: '1rem',
                  opacity: 0.5,
                  cursor: 'not-allowed'
                }}
              />
              <button style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: '1px solid var(--input-border)', borderRadius: '8px', padding: '0 1rem', cursor: 'pointer', color: 'var(--text-main)' }}>
                <Lock size={16} /> Change
              </button>
            </div>
          </div>
        </section>

        {/* Physical Stats */}
        <section>
          <h3 style={{ marginTop: 0, marginBottom: '1.5rem', color: '#10b981' }}>Physical Statistics</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <InputGroup label="Age" name="age" value={formData.age} type="number" />
            <InputGroup label="Sex" name="sex" value={formData.sex} />
            <InputGroup label="Height" name="height" value={formData.height} />
            <InputGroup label="Weight" name="weight" value={formData.weight} />
          </div>
        </section>
      </div>

      {/* Medical & Caretaker - Full Width */}
      <section style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--input-border)' }}>
        <h3 style={{ marginTop: 0, marginBottom: '1.5rem', color: '#f59e0b' }}>Medical Details</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', opacity: 0.7, fontSize: '0.9rem' }}>Diagnosed Conditions</label>
            <textarea
              name="conditions"
              value={formData.conditions}
              onChange={handleChange}
              rows={3}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'var(--input-bg)',
                border: '1px solid var(--input-border)',
                borderRadius: '8px',
                color: 'var(--text-main)',
                fontSize: '1rem',
                fontFamily: 'inherit',
                resize: 'none',
                outline: 'none'
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', opacity: 0.7, fontSize: '0.9rem' }}>Medications & Dosage</label>
            <textarea
              name="medications"
              value={formData.medications}
              onChange={handleChange}
              rows={3}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'var(--input-bg)',
                border: '1px solid var(--input-border)',
                borderRadius: '8px',
                color: 'var(--text-main)',
                fontSize: '1rem',
                fontFamily: 'inherit',
                resize: 'none',
                outline: 'none'
              }}
            />
          </div>
        </div>
      </section>

      <section style={{ marginTop: '2rem' }}>
        <h3 style={{ marginTop: 0, marginBottom: '1.5rem', color: '#ef4444' }}>Caretaker Contact</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <InputGroup label="Caretaker Name" name="caretakerName" value={formData.caretakerName} />
          <InputGroup label="Phone Number" name="caretakerPhone" value={formData.caretakerPhone} />
        </div>
      </section>

      <div style={{ marginTop: '3rem', textAlign: 'right' }}>
        <button className="primary-btn" onClick={handleSave} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 2rem', fontSize: '1.1rem' }}>
          <Save size={20} />
          Save Changes
        </button>
      </div>
    </div>
  );
};
