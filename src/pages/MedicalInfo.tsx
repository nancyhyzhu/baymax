import React, { useState, useEffect } from 'react';
import { Save, Heart } from 'lucide-react';
import { useUser } from '../context/UserContext';
import './Settings.css';
import './Onboarding.css';

export const MedicalInfo: React.FC = () => {
  const { profile, updateProfile, medicationDetails, addMedicationWithDetails, removeMedicationByIndex, updateMedicationReminder, updateMedicationDetails } = useUser();

  // We keep local state for form fields to allow editing before saving
  const [formData, setFormData] = useState(profile);
  const [conditions, setConditions] = useState<string[]>([]);
  const [currentCondition, setCurrentCondition] = useState('');
  const [showAddMedicationForm, setShowAddMedicationForm] = useState(false);
  const [showAddDiagnosisForm, setShowAddDiagnosisForm] = useState(false);

  useEffect(() => {
    setFormData(profile);
    // Parse conditions from string (stored as comma-separated) to array
    if (profile.conditions && profile.conditions !== 'None') {
      setConditions(profile.conditions.split(',').map(c => c.trim()).filter(c => c.length > 0));
    } else {
      setConditions([]);
    }
  }, [profile]);

  const [currentMedication, setCurrentMedication] = useState({
    name: '',
    frequency: '',
    time: '',
    reminder: false
  });

  const handleSave = async () => {
    const updatedFormData = {
      ...formData,
      conditions: conditions.length > 0 ? conditions.join(', ') : 'None'
    };
    await updateProfile(updatedFormData);
    alert('Medical information saved successfully!');
  };

  const handleAddCondition = () => {
    if (!currentCondition.trim()) {
      return;
    }
    if (conditions.includes(currentCondition.trim())) {
      alert('This condition is already added');
      return;
    }
    setConditions([...conditions, currentCondition.trim()]);
    setCurrentCondition('');
    setShowAddDiagnosisForm(false);
  };

  const handleDeleteCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  const handleAddMedication = async () => {
    if (!currentMedication.name.trim()) {
      alert('Please fill in medication name');
      return;
    }
    await addMedicationWithDetails(currentMedication);
    setCurrentMedication({ name: '', frequency: '', time: '', reminder: false });
    setShowAddMedicationForm(false);
  };

  const handleDeleteMedication = async (index: number) => {
    await removeMedicationByIndex(index);
  };

  const handleCurrentMedicationChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = e.target;
    const value = target.type === 'checkbox' ? (target as HTMLInputElement).checked : target.value;
    const updatedMedication = {
      ...currentMedication,
      [target.name]: value
    };
    // If frequency or time is cleared, disable reminder
    if ((target.name === 'frequency' || target.name === 'time') && !value) {
      updatedMedication.reminder = false;
    }
    setCurrentMedication(updatedMedication);
  };

  const handleMedicationReminderToggle = async (index: number) => {
    const med = medicationDetails[index];
    if (!med || !med.frequency || !med.time) return;
    await updateMedicationReminder(index, !med.reminder);
  };

  const handleFrequencyChange = async (index: number, newFrequency: string) => {
    await updateMedicationDetails(index, { frequency: newFrequency });
  };

  const LabelWithAsterisk = ({ children }: { children: React.ReactNode }) => (
    <span>
      {children} <span style={{ color: 'var(--color-danger)' }}>*</span>
    </span>
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
        <Heart size={32} color="var(--color-primary)" />
        <h2 style={{ 
          margin: 0, 
          fontSize: '1.5rem',
          fontWeight: 700,
          color: 'var(--text-main)',
          letterSpacing: '-0.025em'
        }}>Medical Information</h2>
      </div>

      <section>
        <h3 style={{ 
          marginTop: 0, 
          marginBottom: '1.5rem', 
          color: 'var(--color-warning)',
          fontSize: '1.25rem',
          fontWeight: 700,
          letterSpacing: '-0.025em'
        }}>Diagnosed Conditions</h3>
        
        {/* Conditions List */}
        {conditions.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
            {conditions.map((condition, idx) => (
              <div key={idx} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'var(--color-primary-light)',
                color: 'var(--color-primary)',
                padding: '0.25rem 0.75rem',
                borderRadius: '16px',
                fontSize: '0.875rem',
                fontWeight: 500
              }}>
                {condition}
                <button
                  type="button"
                  onClick={() => handleDeleteCondition(idx)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--color-primary)',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: '1rem',
                    lineHeight: 1,
                    opacity: 0.7
                  }}
                  title="Remove condition"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add Diagnosis Button */}
        {!showAddDiagnosisForm && (
          <button
            type="button"
            onClick={() => setShowAddDiagnosisForm(true)}
            style={{
              padding: '0.5rem 1rem',
              background: 'var(--color-primary)',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: 'pointer',
              marginTop: '0.5rem',
              transition: 'all 0.2s ease',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#2563eb';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--color-primary)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            + Add Diagnosis
          </button>
        )}

        {/* Add Condition Form */}
        {showAddDiagnosisForm && (
          <div className="add-medication-form">
            <div className="add-medication-title">Add Diagnosis</div>
            <div className="form-group">
              <label htmlFor="currentCondition"><LabelWithAsterisk>Condition Name</LabelWithAsterisk></label>
              <input
                type="text"
                id="currentCondition"
                value={currentCondition}
                onChange={(e) => setCurrentCondition(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCondition();
                  }
                }}
                placeholder="e.g. Diabetes, Hypertension"
                className="form-input"
              />
            </div>
            <button
              type="button"
              onClick={handleAddCondition}
              className="add-medication-btn"
            >
              + Add Diagnosis
            </button>
          </div>
        )}
      </section>

      <section style={{ marginTop: '2rem' }}>
        <h3 style={{ 
          marginTop: 0, 
          marginBottom: '1.5rem', 
          color: 'var(--color-warning)',
          fontSize: '1.25rem',
          fontWeight: 700,
          letterSpacing: '-0.025em'
        }}>Medications</h3>
        
        {/* Medication List Table */}
        {medicationDetails.length > 0 && (
          <div className="medication-table-wrapper">
            <table className="medication-table">
              <thead>
                <tr>
                  <th>Medication</th>
                  <th>Frequency</th>
                  <th>Time</th>
                  <th>Notify</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {medicationDetails.map((med, index) => (
                  <tr key={index} className="medication-row">
                    <td>{med.name || '--'}</td>
                    <td>
                      <select
                        value={med.frequency || ''}
                        onChange={(e) => handleFrequencyChange(index, e.target.value)}
                        className="form-select"
                        style={{
                          padding: '0.25rem 0.5rem',
                          fontSize: '0.875rem',
                          border: '1px solid var(--input-border)',
                          borderRadius: '4px',
                          background: 'white',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="">Select frequency</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="as-needed">As Needed</option>
                      </select>
                    </td>
                    <td>{med.time || '--'}</td>
                    <td className="notify-cell">
                      <label className="notify-checkbox-label">
                        <input
                          type="checkbox"
                          checked={med.reminder}
                          onChange={() => handleMedicationReminderToggle(index)}
                          disabled={!med.frequency || !med.time}
                          className="notify-checkbox"
                        />
                      </label>
                    </td>
                    <td className="delete-cell">
                      <button
                        type="button"
                        onClick={() => handleDeleteMedication(index)}
                        className="delete-medication-btn-row"
                        title="Delete medication"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Add Medication Button */}
        {!showAddMedicationForm && (
          <button
            type="button"
            onClick={() => setShowAddMedicationForm(true)}
            style={{
              padding: '0.5rem 1rem',
              background: 'var(--color-primary)',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: 'pointer',
              marginTop: '0.5rem',
              transition: 'all 0.2s ease',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#2563eb';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--color-primary)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            + Add Medication
          </button>
        )}

        {/* Add Medication Form */}
        {showAddMedicationForm && (
          <div className="add-medication-form">
            <div className="add-medication-title">Add Medication</div>

            <div className="form-group">
              <label htmlFor="currentMedicationName"><LabelWithAsterisk>Medication Name</LabelWithAsterisk></label>
              <input
                type="text"
                id="currentMedicationName"
                name="name"
                value={currentMedication.name}
                onChange={handleCurrentMedicationChange}
                placeholder="e.g. Aspirin"
                className="form-input"
              />
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="currentMedicationFrequency">Frequency</label>
                <select
                  id="currentMedicationFrequency"
                  name="frequency"
                  value={currentMedication.frequency}
                  onChange={handleCurrentMedicationChange}
                  className={`form-select ${!currentMedication.frequency ? 'placeholder-selected' : ''}`}
                >
                  <option value="" className="placeholder-option">Select frequency</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="as-needed">As Needed</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="currentMedicationTime">Time</label>
                <div className="input-wrapper">
                  <input
                    type="time"
                    id="currentMedicationTime"
                    name="time"
                    value={currentMedication.time}
                    onChange={handleCurrentMedicationChange}
                    className={`form-input ${!currentMedication.time ? 'placeholder-time' : ''}`}
                  />
                </div>
              </div>
            </div>

            <div className="notify-form-group">
              <input
                type="checkbox"
                name="reminder"
                id="medication-reminder"
                checked={currentMedication.reminder}
                onChange={handleCurrentMedicationChange}
                disabled={!currentMedication.frequency || !currentMedication.time}
                className="notify-checkbox"
              />
              <label htmlFor="medication-reminder" className="notify-checkbox-label-form">
                Notify me to take this medication
              </label>
            </div>

            <button
              type="button"
              onClick={handleAddMedication}
              className="add-medication-btn"
            >
              + Add Medication
            </button>
          </div>
        )}
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
