import React, { useState, useEffect } from 'react';
import styles from '../styles/Home.module.css';
import Button from './Button';

const SubscriptionForm = ({ initialName = '', initialDate = '', onSave, onCancel, showDelete = false, onDelete }) => {
    const [name, setName] = useState(initialName);
    const [date, setDate] = useState(initialDate);

    // Reset form when initial values change (e.g. when opening modal)
    useEffect(() => {
        setName(initialName);
        setDate(initialDate);
    }, [initialName, initialDate]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({ name, date });
    };

    const isModified = name !== initialName || date !== initialDate;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
            {/* Name and Date in 2 columns */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                    type="text"
                    className={styles.dateInput}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Subscription Name"
                    autoFocus
                    style={{ flex: '2 1 0', minWidth: 0 }}
                />
                <input
                    type="date"
                    className={styles.dateInput}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    style={{ flex: '1 1 0', minWidth: 0 }}
                />
            </div>

            {/* Action Buttons */}
            <div style={{
                display: 'flex',
                justifyContent: showDelete ? 'space-between' : 'flex-end',
                alignItems: 'center'
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
                        disabled={!name.trim()} // Disable if name is empty
                    >
                        Save
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default SubscriptionForm;
