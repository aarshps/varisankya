import React, { useState } from 'react';
import styles from '../styles/Home.module.css';
import Modal, { ModalButton } from './Modal';
import { COLORS } from '../lib/colors';

const AddSubscriptionModal = ({ isOpen, onClose, onAdd }) => {
    const [value, setValue] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (value.trim()) {
            onAdd(value.trim());
            setValue('');
            onClose();
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add Subscription">
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontFamily: "'Google Sans Flex', sans-serif", fontSize: '12px', fontWeight: '500', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Name</label>
                <input
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="Subscription name"
                    className={styles.composerInput}
                    style={{ borderRadius: '12px', width: '100%', fontFamily: "'Google Sans Flex', sans-serif", fontSize: '16px', padding: '14px 16px', height: '48px' }}
                    autoFocus
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
                    <ModalButton onClick={onClose} variant="secondary">Cancel</ModalButton>
                    <ModalButton type="submit" variant="primary">Add</ModalButton>
                </div>
            </form>
        </Modal>
    );
};

export default AddSubscriptionModal;
