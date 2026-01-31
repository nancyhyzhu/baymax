import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Check } from 'lucide-react';
import './Auth.css';

export const Onboarding: React.FC = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        age: '',
        sex: '',
        height: '',
        weight: '',
        hasConditions: '',
        conditionDetails: '',
        takesMedication: '',
        caretakerName: '',
        caretakerPhone: ''
    });

    const [medications, setMedications] = useState<Array<{
        name: string;
        frequency: string;
        time: string;
        reminder: boolean;
    }>>([]);

    const [currentMedication, setCurrentMedication] = useState({
        name: '',
        frequency: 'daily',
        time: '',
        reminder: false
    });

    const [error, setError] = useState('');

    const totalSteps = 3;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError(''); // Clear error on change
    };

    const handleNext = () => {
        // Validation logic
        if (step === 1) {
            if (!formData.age || !formData.height || !formData.weight) {
                setError('Please fill out all required fields');
                return;
            }
        }

        if (step === 2) {
            if (!formData.hasConditions || !formData.takesMedication) {
                setError('Please fill out all required fields');
                return;
            }
            if (formData.hasConditions === 'yes' && !formData.conditionDetails) {
                setError('Please provide details about your conditions');
                return;
            }
            if (formData.takesMedication === 'yes' && medications.length === 0) {
                setError('Please add at least one medication');
                return;
            }
        }

        setError('');
        if (step < totalSteps) setStep(step + 1);
    };

    const handleBack = () => {
        setError('');
        if (step > 1) setStep(step - 1);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Final step validation just in case
        if (!formData.caretakerName || !formData.caretakerPhone) {
            setError('Please fill out all required fields');
            return;
        }

        console.log('Onboarding data:', formData);
        navigate('/dashboard', { state: { justLoggedIn: true } });
    };

    // Calculate progress percentage
    const progress = (step / totalSteps) * 100;

    const LabelWithAsterisk = ({ children }: { children: React.ReactNode }) => (
        <span>
            {children} <span style={{ color: 'var(--color-danger)' }}>*</span>
        </span>
    );

    const handleAddMedication = () => {
        if (!currentMedication.name || !currentMedication.time) {
            setError('Please fill in medication name and time');
            return;
        }
        setMedications([...medications, currentMedication]);
        setCurrentMedication({ name: '', frequency: 'daily', time: '', reminder: false });
        setError('');
    };

    const handleDeleteMedication = (index: number) => {
        setMedications(medications.filter((_, i) => i !== index));
    };

    const handleCurrentMedicationChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setCurrentMedication({
            ...currentMedication,
            [e.target.name]: e.target.value
        });
        setError('');
    };

    return (
        <div className="auth-container" style={{ justifyContent: 'center', background: 'var(--bg-gradient)' }}>
            {/* Image section removed for full-screen wizard flow */}

            <div className="auth-form-section" style={{ flex: '0 1 auto', width: '100%', maxWidth: '600px', background: 'transparent' }}>
                <div className="auth-card" style={{ maxWidth: '100%', width: '100%', padding: '2rem', boxShadow: 'none' }}>

                    {/* Progress Bar */}
                    <div style={{ marginBottom: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                            <span>Step {step} of {totalSteps}</span>
                            <span>{Math.round(progress)}%</span>
                        </div>
                        <div style={{ width: '100%', height: '6px', background: 'rgba(0,0,0,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{
                                width: `${progress}%`,
                                height: '100%',
                                background: 'var(--color-primary)',
                                borderRadius: '3px',
                                transition: 'width 0.3s ease-in-out'
                            }}></div>
                        </div>
                    </div>

                    <div className="auth-header" style={{ marginBottom: '1rem', textAlign: 'left' }}>
                        <h2 style={{ fontSize: '1.8rem', margin: 0 }}>
                            {step === 1 && "The Basics"}
                            {step === 2 && "Medical History"}
                            {step === 3 && "Emergency Contact"}
                        </h2>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                            <p className="welcome-text" style={{ margin: 0 }}>
                                {step === 1 && "Let's start with your physical stats."}
                                {step === 2 && "Any conditions we should know about?"}
                                {step === 3 && "Who should we call in an emergency?"}
                            </p>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                <span style={{ color: 'var(--color-danger)' }}>*</span> indicates required field
                            </span>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="auth-form">

                        {/* Step 1: Physical Stats */}
                        {step === 1 && (
                            <div className="step-content">
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div className="form-group">
                                        <label htmlFor="age"><LabelWithAsterisk>Age</LabelWithAsterisk></label>
                                        <div className="input-wrapper">
                                            <input
                                                type="number"
                                                id="age"
                                                name="age"
                                                value={formData.age}
                                                onChange={handleChange}
                                                placeholder="e.g. 25"
                                                min="0"
                                                onKeyDown={(e) => {
                                                    if (e.key === '-' || e.key === 'e') {
                                                        e.preventDefault();
                                                    }
                                                }}
                                                autoFocus
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="sex"><LabelWithAsterisk>Sex</LabelWithAsterisk></label>
                                        <div className="input-wrapper">
                                            <select
                                                id="sex"
                                                name="sex"
                                                value={formData.sex}
                                                onChange={handleChange}
                                                required
                                                style={{
                                                    width: '100%',
                                                    padding: '0.75rem 1rem',
                                                    border: '1px solid rgba(0, 0, 0, 0.1)',
                                                    borderRadius: '0.75rem',
                                                    fontSize: '0.95rem',
                                                    background: 'rgba(255, 255, 255, 0.5)',
                                                    color: 'var(--text-main)',
                                                    outline: 'none'
                                                }}
                                            >
                                                <option value="" disabled>Select...</option>
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div className="form-group">
                                        <label htmlFor="height"><LabelWithAsterisk>Height (cm)</LabelWithAsterisk></label>
                                        <select
                                            id="height"
                                            name="height"
                                            value={formData.height}
                                            onChange={handleChange}
                                            required
                                            style={{
                                                width: '100%',
                                                padding: '0.75rem 1rem',
                                                border: '1px solid rgba(0, 0, 0, 0.1)',
                                                borderRadius: '0.75rem',
                                                fontSize: '0.95rem',
                                                background: 'rgba(255, 255, 255, 0.5)',
                                                color: 'var(--text-main)',
                                                outline: 'none'
                                            }}
                                        >
                                            <option value="">Select height</option>
                                            {[...Array(161)].map((_, i) => {
                                                const cm = i + 90; // 90-250cm range
                                                return <option key={cm} value={cm}>{cm} cm</option>;
                                            })}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="weight"><LabelWithAsterisk>Weight (kg)</LabelWithAsterisk></label>
                                        <select
                                            id="weight"
                                            name="weight"
                                            value={formData.weight}
                                            onChange={handleChange}
                                            required
                                            style={{
                                                width: '100%',
                                                padding: '0.75rem 1rem',
                                                border: '1px solid rgba(0, 0, 0, 0.1)',
                                                borderRadius: '0.75rem',
                                                fontSize: '0.95rem',
                                                background: 'rgba(255, 255, 255, 0.5)',
                                                color: 'var(--text-main)',
                                                outline: 'none'
                                            }}
                                        >
                                            <option value="">Select weight</option>
                                            {[...Array(181)].map((_, i) => {
                                                const kg = i + 20; // 20-200kg range
                                                return <option key={kg} value={kg}>{kg} kg</option>;
                                            })}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Medical Details */}
                        {step === 2 && (
                            <div className="step-content">
                                {/* Diagnosed Conditions Question */}
                                <div className="form-group">
                                    <label><LabelWithAsterisk>Do you have any diagnosed conditions?</LabelWithAsterisk></label>
                                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                            <input
                                                type="radio"
                                                name="hasConditions"
                                                value="yes"
                                                checked={formData.hasConditions === 'yes'}
                                                onChange={handleChange}
                                                autoFocus
                                            />
                                            Yes
                                        </label>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                            <input
                                                type="radio"
                                                name="hasConditions"
                                                value="no"
                                                checked={formData.hasConditions === 'no'}
                                                onChange={handleChange}
                                            />
                                            No
                                        </label>
                                    </div>
                                </div>

                                {/* Conditional: Condition Details */}
                                {formData.hasConditions === 'yes' && (
                                    <div className="form-group">
                                        <label htmlFor="conditionDetails"><LabelWithAsterisk>Please provide details</LabelWithAsterisk></label>
                                        <textarea
                                            id="conditionDetails"
                                            name="conditionDetails"
                                            value={formData.conditionDetails}
                                            onChange={handleChange}
                                            placeholder="Describe your diagnosed conditions"
                                            rows={3}
                                            required
                                            style={{
                                                width: '100%',
                                                padding: '0.75rem',
                                                border: '1px solid rgba(0, 0, 0, 0.1)',
                                                borderRadius: '0.75rem',
                                                fontSize: '0.95rem',
                                                background: 'rgba(255, 255, 255, 0.5)',
                                                color: 'var(--text-main)',
                                                fontFamily: 'inherit',
                                                resize: 'none',
                                                outline: 'none'
                                            }}
                                        />
                                    </div>
                                )}

                                {/* Medication Question */}
                                <div className="form-group" style={{ marginTop: '1.5rem' }}>
                                    <label><LabelWithAsterisk>Do you take any medication?</LabelWithAsterisk></label>
                                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                            <input
                                                type="radio"
                                                name="takesMedication"
                                                value="yes"
                                                checked={formData.takesMedication === 'yes'}
                                                onChange={handleChange}
                                            />
                                            Yes
                                        </label>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                            <input
                                                type="radio"
                                                name="takesMedication"
                                                value="no"
                                                checked={formData.takesMedication === 'no'}
                                                onChange={handleChange}
                                            />
                                            No
                                        </label>
                                    </div>
                                </div>

                                {/* Conditional: Medication Details */}
                                {formData.takesMedication === 'yes' && (
                                    <>
                                        {/* Medication List Table */}
                                        {medications.length > 0 && (
                                            <div style={{ marginBottom: '1rem', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '0.75rem', overflow: 'hidden' }}>
                                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                                    <thead>
                                                        <tr style={{ background: 'rgba(0,0,0,0.05)' }}>
                                                            <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.85rem', fontWeight: 600 }}>Medication</th>
                                                            <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.85rem', fontWeight: 600 }}>Frequency</th>
                                                            <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.85rem', fontWeight: 600 }}>Time</th>
                                                            <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.85rem', fontWeight: 600, width: '60px' }}>Delete</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {medications.map((med, index) => (
                                                            <tr key={index} style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                                                                <td style={{ padding: '0.75rem', fontSize: '0.9rem' }}>{med.name}</td>
                                                                <td style={{ padding: '0.75rem', fontSize: '0.9rem', textTransform: 'capitalize' }}>{med.frequency.replace('-', ' ')}</td>
                                                                <td style={{ padding: '0.75rem', fontSize: '0.9rem' }}>{med.time}</td>
                                                                <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleDeleteMedication(index)}
                                                                        style={{
                                                                            background: 'transparent',
                                                                            border: 'none',
                                                                            color: 'var(--color-danger)',
                                                                            cursor: 'pointer',
                                                                            fontSize: '1.2rem',
                                                                            padding: '0.25rem'
                                                                        }}
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

                                        {/* Add Medication Form */}
                                        <div style={{ background: 'rgba(0,0,0,0.02)', padding: '1rem', borderRadius: '0.75rem', border: '1px dashed rgba(0,0,0,0.15)' }}>
                                            <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem' }}>Add Medication</div>

                                            <div className="form-group">
                                                <label htmlFor="currentMedicationName">Medication Name</label>
                                                <div className="input-wrapper">
                                                    <input
                                                        type="text"
                                                        id="currentMedicationName"
                                                        name="name"
                                                        value={currentMedication.name}
                                                        onChange={handleCurrentMedicationChange}
                                                        placeholder="e.g. Aspirin"
                                                    />
                                                </div>
                                            </div>

                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                                <div className="form-group">
                                                    <label htmlFor="currentMedicationFrequency">Frequency</label>
                                                    <select
                                                        id="currentMedicationFrequency"
                                                        name="frequency"
                                                        value={currentMedication.frequency}
                                                        onChange={handleCurrentMedicationChange}
                                                        style={{
                                                            width: '100%',
                                                            padding: '0.75rem 1rem',
                                                            border: '1px solid rgba(0, 0, 0, 0.1)',
                                                            borderRadius: '0.75rem',
                                                            fontSize: '0.95rem',
                                                            background: 'rgba(255, 255, 255, 0.5)',
                                                            color: 'var(--text-main)',
                                                            outline: 'none'
                                                        }}
                                                    >
                                                        <option value="daily">Daily</option>
                                                        <option value="twice-daily">Twice Daily</option>
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
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={handleAddMedication}
                                                style={{
                                                    width: '100%',
                                                    padding: '0.75rem',
                                                    background: 'var(--color-primary)',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '0.75rem',
                                                    fontSize: '0.95rem',
                                                    fontWeight: 600,
                                                    cursor: 'pointer',
                                                    marginTop: '0.5rem'
                                                }}
                                            >
                                                + Add Medication
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Step 3: Caretaker Info */}
                        {step === 3 && (
                            <div className="step-content">
                                <div className="form-group">
                                    <label htmlFor="caretakerName"><LabelWithAsterisk>Caretaker Name</LabelWithAsterisk></label>
                                    <div className="input-wrapper">
                                        <input
                                            type="text"
                                            id="caretakerName"
                                            name="caretakerName"
                                            value={formData.caretakerName}
                                            onChange={handleChange}
                                            placeholder="Full Name"
                                            autoFocus
                                            required
                                        />
                                        <span className="input-icon">👤</span>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="caretakerPhone"><LabelWithAsterisk>Phone Number</LabelWithAsterisk></label>
                                    <div className="input-wrapper">
                                        <input
                                            type="tel"
                                            id="caretakerPhone"
                                            name="caretakerPhone"
                                            value={formData.caretakerPhone}
                                            onChange={handleChange}
                                            placeholder="(555) 000-0000"
                                            required
                                        />
                                        <span className="input-icon">📞</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Error Message */}
                        {error && (
                            <div style={{ color: 'var(--color-danger)', fontSize: '0.9rem', marginTop: '1rem', textAlign: 'center', fontWeight: 500 }}>
                                {error}
                            </div>
                        )}

                        {/* Navigation Buttons */}
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                            {step > 1 && (
                                <button
                                    type="button"
                                    onClick={handleBack}
                                    style={{
                                        background: 'var(--bg-primary)',
                                        color: 'var(--text-main)',
                                        border: '1px solid rgba(0,0,0,0.1)',
                                        flex: 1,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.5rem',
                                        padding: '0.875rem'
                                    }}
                                >
                                    <ChevronLeft size={20} /> Back
                                </button>
                            )}

                            {step < totalSteps ? (
                                <button
                                    type="button"
                                    onClick={handleNext}
                                    className="auth-button"
                                    style={{ flex: 1, margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                                >
                                    Next <ChevronRight size={20} />
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    className="auth-button"
                                    style={{ flex: 1, margin: 0, background: 'var(--color-success)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                                >
                                    Complete <Check size={20} />
                                </button>
                            )}
                        </div>

                    </form>
                </div>
            </div>
        </div>
    );
};
