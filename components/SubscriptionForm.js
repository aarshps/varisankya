import React, { useState, useEffect } from 'react';
import styles from '../styles/Home.module.css';
import Button from './Button';
import DropdownComponent from './DropdownComponent';
import DatePickerComponent from './DatePickerComponent';
import { COLORS } from '../lib/colors';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'CAD', 'AUD'];
const BILLING_CYCLES = [
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'daily', label: 'Daily' },
    { value: 'custom', label: 'Custom (Days)' },
];
const CATEGORIES = ['Entertainment', 'Utilities', 'Software', 'Insurance', 'Gym/Fitness', 'Other'];

const SubscriptionForm = ({
    initialName = '',
    initialDate = '',
    initialCost = '',
    initialCurrency = 'USD',
    initialCycle = 'monthly',
    initialCustomDays = '',
    initialCategory = 'Other',
    initialNotes = '',
    onSave,
    onCancel,
    showDelete = false,
    onDelete
}) => {
    const [name, setName] = useState(initialName);
    const [date, setDate] = useState(initialDate);
    const [cost, setCost] = useState(initialCost);
    const [currency, setCurrency] = useState(initialCurrency);
    const [billingCycle, setBillingCycle] = useState(initialCycle);
    const [customDays, setCustomDays] = useState(initialCustomDays);
    const [category, setCategory] = useState(initialCategory);
    const [notes, setNotes] = useState(initialNotes);

    // Reset form when initial values change
    useEffect(() => {
        setName(initialName);
        setDate(initialDate);
        setCost(initialCost);
        setCurrency(initialCurrency);
        setBillingCycle(initialCycle);
        setCustomDays(initialCustomDays);
        setCategory(initialCategory);
        setNotes(initialNotes);
    }, [initialName, initialDate, initialCost, initialCurrency, initialCycle, initialCustomDays, initialCategory, initialNotes]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            name,
            date,
            cost,
            currency,
            billingCycle,
            customDays: billingCycle === 'custom' ? customDays : null,
            category,
            notes
        });
    };

    return (
        <div className={styles.formGroup}>
            {/* Name */}
            <input
                type="text"
                className={styles.dateInput}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Subscription Name"
                style={{ width: '100%' }}
            />

            {/* Date */}
            <DatePickerComponent
                value={date}
                onChange={setDate}
            />

            {/* Cost, Currency, Cycle */}
            <div className={styles.formRow}>
                <div style={{ display: 'flex', flex: '1.5 1 0', gap: '8px' }}>
                    <div style={{ width: '90px' }}>
                        <DropdownComponent
                            value={currency}
                            onChange={setCurrency}
                            options={CURRENCIES}
                        />
                    </div>
                    <input
                        type="number"
                        className={styles.dateInput}
                        value={cost}
                        onChange={(e) => setCost(e.target.value)}
                        placeholder="Cost"
                        step="0.01"
                        style={{ flex: 1, minWidth: 0 }}
                    />
                </div>
                <div style={{ flex: '1 1 0', minWidth: 0 }}>
                    <DropdownComponent
                        value={billingCycle}
                        onChange={setBillingCycle}
                        options={BILLING_CYCLES}
                    />
                </div>
            </div>

            {/* Custom Days Input */}
            {billingCycle === 'custom' && (
                <input
                    type="number"
                    className={styles.dateInput}
                    value={customDays}
                    onChange={(e) => setCustomDays(e.target.value)}
                    placeholder="Every X Days"
                    min="1"
                    style={{ width: '100%' }}
                />
            )}

            {/* Category */}
            <DropdownComponent
                value={category}
                onChange={setCategory}
                options={CATEGORIES}
            />

            {/* Notes */}
            <textarea
                className={styles.dateInput}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notes (optional)"
                style={{ height: '100px', paddingTop: '12px', resize: 'none' }}
            />

            {/* Action Buttons */}
            <div style={{
                display: 'flex',
                justifyContent: showDelete ? 'space-between' : 'flex-end',
                alignItems: 'center',
                marginTop: '8px'
            }}>
                {showDelete && (
                    <Button onClick={onDelete} variant="destructive">
                        Delete
                    </Button>
                )}

                <div style={{ display: 'flex', gap: '12px' }}>
                    <Button
                        onClick={onCancel}
                        variant="neutral"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        variant="success"
                        disabled={!name.trim()}
                    >
                        Save
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default SubscriptionForm;
