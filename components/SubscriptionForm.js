import React, { useState } from 'react';
import styles from '../styles/Home.module.css';
import Button from './Button';
import DropdownComponent from './DropdownComponent';
import DatePickerComponent from './DatePickerComponent';
import { COLORS } from '../lib/colors';
import useHaptics from '../lib/useHaptics';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'CAD', 'AUD'];
const BILLING_CYCLES = [
    { value: 'monthly', label: 'Monthly' },
    { value: 'monthly_custom', label: 'Every X Months' },
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
    initialCustomMonths = '',
    initialCategory = 'Other',
    initialNotes = '',
    onSubmit,
    onCancel,
    onDelete,
    onMarkPaid,
    showDelete = false,
    showMarkPaid = false,
}) => {
    const [name, setName] = useState(initialName);
    const [date, setDate] = useState(initialDate);
    const [cost, setCost] = useState(initialCost);
    const [currency, setCurrency] = useState(initialCurrency);
    const [billingCycle, setBillingCycle] = useState(initialCycle);
    const [customDays, setCustomDays] = useState(initialCustomDays);
    const [customMonths, setCustomMonths] = useState(initialCustomMonths);
    const [category, setCategory] = useState(initialCategory);
    const [notes, setNotes] = useState(initialNotes);
    const { triggerHaptic } = useHaptics();

    const handleSubmit = () => {
        triggerHaptic('success');
        onSubmit({
            name,
            date,
            cost,
            currency,
            billingCycle,
            customDays: billingCycle === 'custom' ? customDays : null,
            customMonths: billingCycle === 'monthly_custom' ? customMonths : null,
            category,
            notes
        });
    };

    const handleCancel = () => {
        triggerHaptic('light');
        onCancel();
    };

    const handleDelete = () => {
        triggerHaptic('warning');
        onDelete();
    };

    const handleMarkPaid = (e) => {
        triggerHaptic('light');
        onMarkPaid(e);
    };

    // Check if form is dirty (has changes)
    const isDirty =
        name !== initialName ||
        date !== initialDate ||
        cost !== initialCost ||
        currency !== initialCurrency ||
        billingCycle !== initialCycle ||
        customDays !== initialCustomDays ||
        customMonths !== initialCustomMonths ||
        category !== initialCategory ||
        notes !== initialNotes;

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--gap-standard)', // Standard gap
        }}>
            {/* Row 1: Name */}
            <input
                type="text"
                placeholder="Service Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onFocus={() => triggerHaptic('ultra-light')}
                className={styles.input}
                style={{ width: '100%' }}
            />

            {/* Row 2: Date */}
            <DatePickerComponent
                value={date}
                onChange={setDate}
                style={{ width: '100%' }}
            />

            {/* Row 2: Cost and Currency */}
            <div style={{ display: 'flex', gap: '12px' }}>
                <input
                    type="number"
                    placeholder="Cost"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    onFocus={() => triggerHaptic('ultra-light')}
                    className={styles.input}
                    style={{ flex: 1 }}
                />
                <DropdownComponent
                    options={CURRENCIES.map(c => ({ value: c, label: c }))}
                    value={currency}
                    onChange={setCurrency}
                    style={{ flex: 1 }}
                />
            </div>

            {/* Row 3: Billing Cycle */}
            <DropdownComponent
                options={BILLING_CYCLES}
                value={billingCycle}
                onChange={setBillingCycle}
            />

            {/* Conditional: Custom Days Input */}
            {billingCycle === 'custom' && (
                <input
                    type="number"
                    placeholder="Number of Days"
                    value={customDays}
                    onChange={(e) => setCustomDays(e.target.value)}
                    onFocus={() => triggerHaptic('ultra-light')}
                    className={styles.input}
                    min="1"
                />
            )}

            {/* Conditional: Custom Months Input */}
            {billingCycle === 'monthly_custom' && (
                <input
                    type="number"
                    placeholder="Number of Months"
                    value={customMonths}
                    onChange={(e) => setCustomMonths(e.target.value)}
                    onFocus={() => triggerHaptic('ultra-light')}
                    className={styles.input}
                    min="1"
                />
            )}

            {/* Row 4: Category */}
            <DropdownComponent
                options={CATEGORIES.map(c => ({ value: c, label: c }))}
                value={category}
                onChange={setCategory}
            />

            {/* Row 5: Notes */}
            <textarea
                placeholder="Notes (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onFocus={() => triggerHaptic('ultra-light')}
                className={styles.textarea}
            />

            {/* Action Buttons */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '8px',
                flexWrap: 'wrap',
                gap: '12px'
            }}>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    {showDelete && (
                        <Button onClick={handleDelete} variant="destructive">
                            Delete
                        </Button>
                    )}
                    {showMarkPaid && (
                        <Button onClick={handleMarkPaid} variant="primary">
                            Paid
                        </Button>
                    )}
                </div>

                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginLeft: 'auto' }}>
                    <Button
                        onClick={handleCancel}
                        variant="neutral"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        variant="success"
                        disabled={!name.trim() || !isDirty}
                    >
                        Save
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default SubscriptionForm;
