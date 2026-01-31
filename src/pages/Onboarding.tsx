import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { auth, db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import './Auth.css';
import './Onboarding.css';

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
        hasCaretaker: '',
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
        frequency: '',
        time: '',
        reminder: false
    });

    const [error, setError] = useState('');
    const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
    const [errorStep, setErrorStep] = useState<number | null>(null);

    // Force clear error on mount to prevent any stale errors from showing
    useEffect(() => {
        setError('');
        setHasAttemptedSubmit(false);
        setErrorStep(null);
    }, []);

    const totalSteps = 4;

    // Clear error and submission attempt when step changes
    useEffect(() => {
        setError('');
        setHasAttemptedSubmit(false);
        setErrorStep(null);
    }, [step]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        // Clear error when user starts fixing fields - this provides immediate feedback
        if (error && hasAttemptedSubmit && errorStep === step) {
            setError('');
            setErrorStep(null);
            setHasAttemptedSubmit(false);
        }
    };

    const handleNext = () => {
        // Set attempt flag for current step validation
        setHasAttemptedSubmit(true);

        // Validation logic
        if (step === 1) {
            if (!formData.age || !formData.sex || !formData.height || !formData.weight) {
                setError('Please fill out all required fields');
                setErrorStep(step);
                return;
            }
        }

        if (step === 2) {
            if (!formData.hasConditions) {
                setError('Please fill out all required fields');
                setErrorStep(step);
                return;
            }
            if (formData.hasConditions === 'yes' && !formData.conditionDetails) {
                setError('Please provide details about your conditions');
                setErrorStep(step);
                return;
            }
        }

        if (step === 3) {
            if (!formData.takesMedication) {
                setError('Please fill out all required fields');
                setErrorStep(step);
                return;
            }
            if (formData.takesMedication === 'yes' && medications.length === 0) {
                setError('Please add at least one medication');
                setErrorStep(step);
                return;
            }
        }

        // Don't validate step 4 in handleNext - step 4 uses handleSubmit instead
        // This prevents errors from showing when navigating to step 4

        // Validation passed - clear ALL error state BEFORE moving to next step
        setError('');
        setHasAttemptedSubmit(false);
        setErrorStep(null);

        // Move to next step - useEffect will clear these again as a backup
        if (step < totalSteps) {
            setStep(step + 1);
        }
    };

    const handleBack = () => {
        setError('');
        setHasAttemptedSubmit(false);
        setErrorStep(null);
        if (step > 1) {
            setStep(step - 1);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // ONLY validate Step 4 logic if we are actually on Step 4
        if (step === 4) {
            setHasAttemptedSubmit(true);

            if (!formData.hasCaretaker) {
                setError('Please fill out all required fields');
                setErrorStep(4);
                return;
            }

            if (formData.hasCaretaker === 'yes' && (!formData.caretakerName || !formData.caretakerPhone)) {
                setError('Please fill out all required fields');
                setErrorStep(4);
                return;
            }

            // If validation passes, save to Firestore
            setError('');
            setHasAttemptedSubmit(false);
            setErrorStep(null);

            try {
                const user = auth.currentUser;
                if (!user) {
                    setError('Not authenticated. Please log in again.');
                    return;
                }

                // Save user profile to Firestore
                await setDoc(doc(db, 'users', user.uid), {
                    name: user.displayName || '',
                    age: parseInt(formData.age) || 0,
                    height: formData.height,
                    weight: formData.weight,
                    sex: formData.sex,
                    conditions: formData.hasConditions === 'yes' ? formData.conditionDetails : 'None',
                    caretakerName: formData.hasCaretaker === 'yes' ? formData.caretakerName : '',
                    caretakerPhone: formData.hasCaretaker === 'yes' ? formData.caretakerPhone : '',
                    email: user.email || ''
                });

                // Save medications to Firestore (if any)
                if (formData.takesMedication === 'yes' && medications.length > 0) {
                    for (const med of medications) {
                        await setDoc(doc(db, 'medications', `${user.uid}_${med.name}`), {
                            userId: user.uid,
                            name: med.name,
                            schedule: [], // Will be populated later via calendar
                            takenHistory: {}
                        });
                    }
                }

                navigate('/dashboard', { state: { justLoggedIn: true } });
            } catch (err) {
                console.error('Error saving onboarding data:', err);
                setError('Failed to save your information. Please try again.');
            }
        }
    };

    // Calculate progress percentage
    const progress = (step / totalSteps) * 100;

    const LabelWithAsterisk = ({ children }: { children: React.ReactNode }) => (
        <span>
            {children} <span style={{ color: 'var(--color-danger)' }}>*</span>
        </span>
    );

    const handleAddMedication = () => {
        if (!currentMedication.name) {
            setError('Please fill in medication name');
            setErrorStep(step);
            setHasAttemptedSubmit(true);
            return;
        }
        // Time is optional, so we don't validate it
        setMedications([...medications, currentMedication]);
        setCurrentMedication({ name: '', frequency: '', time: '', reminder: false });
        setError('');
        setErrorStep(null);
        setHasAttemptedSubmit(false);
    };

    const handleDeleteMedication = (index: number) => {
        setMedications(medications.filter((_, i) => i !== index));
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
        // Clear error when user is fixing medication input
        if (error) {
            setError('');
            setErrorStep(null);
            setHasAttemptedSubmit(false);
        }
    };

    const handleMedicationReminderToggle = (index: number) => {
        const med = medications[index];
        // Only allow toggling if both frequency and time are filled
        if (!med.frequency || !med.time) {
            return;
        }
        const updatedMedications = medications.map((med, i) =>
            i === index ? { ...med, reminder: !med.reminder } : med
        );
        setMedications(updatedMedications);
    };

    return (
        <div className="auth-container onboarding-container">
            <div className="auth-form-section onboarding-section">
                <div className="auth-card onboarding-card">
                    {/* Progress Bar */}
                    <div className="progress-container">
                        <div className="progress-header">
                            <span className="progress-step">Step {step} of {totalSteps}</span>
                            <span className="progress-percentage">{Math.round(progress)}%</span>
                        </div>
                        <div className="progress-bar-wrapper">
                            <div
                                className="progress-bar-fill"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                    </div>

                    <div className="auth-header onboarding-header">
                        <h2 className="onboarding-title">
                            {step === 1 && "The Basics"}
                            {step === 2 && "Diagnosis"}
                            {step === 3 && "Medication"}
                            {step === 4 && "Caretaker Contact"}
                        </h2>
                        <p className="welcome-text onboarding-subtitle">
                            {step === 1 && "Let's start with your physical stats."}
                            {step === 2 && "Any conditions we should know about?"}
                            {step === 3 && "Do you take any medication?"}
                            {step === 4 && "Who should we call in an emergency?"}
                        </p>
                        <span className="required-hint">
                            <span className="required-asterisk">*</span> indicates required field
                        </span>
                    </div>

                    <form onSubmit={handleSubmit} className="auth-form onboarding-form">
                        {/* Step 1: Physical Stats */}
                        {step === 1 && (
                            <div className="step-content fade-in">
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label htmlFor="age"><LabelWithAsterisk>Age</LabelWithAsterisk></label>
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
                                            className="form-input"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="sex"><LabelWithAsterisk>Sex</LabelWithAsterisk></label>
                                        <select
                                            id="sex"
                                            name="sex"
                                            value={formData.sex}
                                            onChange={handleChange}
                                            required
                                            className={`form-select ${!formData.sex ? 'placeholder-selected' : ''}`}
                                        >
                                            <option value="" disabled className="placeholder-option">Select...</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="form-grid form-grid-spaced">
                                    <div className="form-group">
                                        <label htmlFor="height"><LabelWithAsterisk>Height (cm)</LabelWithAsterisk></label>
                                        <input
                                            type="number"
                                            id="height"
                                            name="height"
                                            value={formData.height}
                                            onChange={handleChange}
                                            placeholder="e.g. 175"
                                            min="90"
                                            max="250"
                                            required
                                            className={`form-input ${!formData.height ? 'placeholder-time' : ''}`}
                                            onKeyDown={(e) => {
                                                if (e.key === '-' || e.key === 'e') {
                                                    e.preventDefault();
                                                }
                                            }}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="weight"><LabelWithAsterisk>Weight (kg)</LabelWithAsterisk></label>
                                        <input
                                            type="number"
                                            id="weight"
                                            name="weight"
                                            value={formData.weight}
                                            onChange={handleChange}
                                            placeholder="e.g. 70"
                                            min="20"
                                            max="200"
                                            required
                                            className={`form-input ${!formData.weight ? 'placeholder-time' : ''}`}
                                            onKeyDown={(e) => {
                                                if (e.key === '-' || e.key === 'e') {
                                                    e.preventDefault();
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Diagnosis */}
                        {step === 2 && (
                            <div className="step-content fade-in">
                                {/* Diagnosed Conditions Question */}
                                <div className="form-group medication-question">
                                    <label><LabelWithAsterisk>Do you have any diagnosed conditions?</LabelWithAsterisk></label>
                                    <div className="radio-group">
                                        <label className="radio-label">
                                            <input
                                                type="radio"
                                                name="hasConditions"
                                                value="yes"
                                                checked={formData.hasConditions === 'yes'}
                                                onChange={handleChange}
                                                autoFocus
                                            />
                                            <span>Yes</span>
                                        </label>
                                        <label className="radio-label">
                                            <input
                                                type="radio"
                                                name="hasConditions"
                                                value="no"
                                                checked={formData.hasConditions === 'no'}
                                                onChange={handleChange}
                                            />
                                            <span>No</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Conditional: Condition Details */}
                                {formData.hasConditions === 'yes' && (
                                    <div className="medication-section-fade">
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
                                                className="form-input"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Step 3: Medication */}
                        {step === 3 && (
                            <div className="step-content fade-in">
                                {/* Medication Question */}
                                <div className="form-group medication-question">
                                    <label><LabelWithAsterisk>Do you take any medication?</LabelWithAsterisk></label>
                                    <div className="radio-group">
                                        <label className="radio-label">
                                            <input
                                                type="radio"
                                                name="takesMedication"
                                                value="yes"
                                                checked={formData.takesMedication === 'yes'}
                                                onChange={handleChange}
                                                autoFocus
                                            />
                                            <span>Yes</span>
                                        </label>
                                        <label className="radio-label">
                                            <input
                                                type="radio"
                                                name="takesMedication"
                                                value="no"
                                                checked={formData.takesMedication === 'no'}
                                                onChange={handleChange}
                                            />
                                            <span>No</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Conditional: Medication Details */}
                                {formData.takesMedication === 'yes' && (
                                    <div className="medication-section-fade">
                                        {/* Medication List Table */}
                                        {medications.length > 0 && (
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
                                                        {medications.map((med, index) => (
                                                            <tr key={index} className="medication-row">
                                                                <td>{med.name || '--'}</td>
                                                                <td className="capitalize">{med.frequency ? med.frequency.replace('-', ' ') : '--'}</td>
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

                                        {/* Add Medication Form */}
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
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Step 4: Caretaker Info */}
                        {step === 4 && (
                            <div className="step-content fade-in">
                                <div className="form-group medication-question">
                                    <label className="form-label"><LabelWithAsterisk>Would you like to add a caretaker contact?</LabelWithAsterisk></label>
                                    <div className="radio-group">
                                        <label className="radio-label">
                                            <input
                                                type="radio"
                                                name="hasCaretaker"
                                                value="yes"
                                                checked={formData.hasCaretaker === 'yes'}
                                                onChange={handleChange}
                                                autoFocus
                                            />
                                            <span>Yes</span>
                                        </label>
                                        <label className="radio-label">
                                            <input
                                                type="radio"
                                                name="hasCaretaker"
                                                value="no"
                                                checked={formData.hasCaretaker === 'no'}
                                                onChange={handleChange}
                                            />
                                            <span>No</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Conditional: Caretaker Details */}
                                {formData.hasCaretaker === 'yes' && (
                                    <div className="medication-section-fade">
                                        <div className="form-group">
                                            <label htmlFor="caretakerName"><LabelWithAsterisk>Caretaker Name</LabelWithAsterisk></label>
                                            <input
                                                type="text"
                                                id="caretakerName"
                                                name="caretakerName"
                                                value={formData.caretakerName}
                                                onChange={handleChange}
                                                placeholder="Full Name"
                                                autoFocus
                                                required
                                                className="form-input"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="caretakerPhone"><LabelWithAsterisk>Phone Number</LabelWithAsterisk></label>
                                            <input
                                                type="tel"
                                                id="caretakerPhone"
                                                name="caretakerPhone"
                                                value={formData.caretakerPhone}
                                                onChange={handleChange}
                                                placeholder="(555) 000-0000"
                                                required
                                                className="form-input"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Navigation Buttons */}
                        <div className="onboarding-navigation">
                            {/* Error Message - only show if error exists, user attempted submit, and we're on the step where error occurred */}
                            {error &&
                                error.trim() !== '' &&
                                hasAttemptedSubmit === true &&
                                errorStep !== null &&
                                typeof errorStep === 'number' &&
                                errorStep === step ? (
                                <div className="error-message onboarding-error">
                                    {error}
                                </div>
                            ) : null}
                            <div className="nav-buttons-row">
                                {step > 1 && (
                                    <button
                                        key="back-btn" // Added key
                                        type="button"
                                        onClick={handleBack}
                                        className="nav-button nav-button-back"
                                    >
                                        <ChevronLeft size={20} /> Back
                                    </button>
                                )}

                                {step < totalSteps ? (
                                    <button
                                        key="next-btn" // Added key
                                        type="button"
                                        onClick={handleNext}
                                        className="nav-button nav-button-next"
                                    >
                                        Next <ChevronRight size={20} />
                                    </button>
                                ) : (
                                    <button
                                        key="submit-btn" // Added key
                                        type="submit"
                                        className="nav-button nav-button-submit"
                                    >
                                        Complete <Check size={20} />
                                    </button>
                                )}
                            </div>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    );
};
