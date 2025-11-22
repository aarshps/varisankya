import React from 'react';
import { COLORS } from '../lib/colors';

export const ModalButton = ({ onClick, children, variant = 'primary', type = 'button', disabled = false }) => {
    const baseStyle = {
        padding: '10px 24px',
        borderRadius: '20px',
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: '14px',
        fontWeight: '500',
        fontFamily: "'Google Sans Flex', sans-serif",
        opacity: disabled ? 0.5 : 1,
    };

    const variants = {
        primary: {
            backgroundColor: COLORS.primary,
            color: '#003355',
        },
        secondary: {
            backgroundColor: 'transparent',
            color: COLORS.primary,
            border: `1px solid ${COLORS.border}`,
        },
        danger: {
            backgroundColor: COLORS.destructive,
            color: '#410E0B',
        },
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            style={{ ...baseStyle, ...variants[variant] }}
        >
            {children}
        </button>
    );
};

const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
            }}
            onClick={onClose}
        >
            <div
                style={{
                    backgroundColor: COLORS.surface,
                    borderRadius: '28px',
                    padding: '24px',
                    width: '90%',
                    maxWidth: '400px',
                    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.4)',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <h2 style={{
                    margin: '0 0 24px 0',
                    fontSize: '24px',
                    fontWeight: '400',
                    color: COLORS.textPrimary,
                    fontFamily: "'Google Sans Flex', sans-serif"
                }}>
                    {title}
                </h2>
                {children}
            </div>
        </div>
    );
};

export default Modal;
