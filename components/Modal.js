import React, { useEffect, useState } from 'react';
import styles from '../styles/Home.module.css';
import { COLORS } from '../lib/colors';

export const ModalButton = ({ onClick, children, variant = 'primary', type = 'button', disabled = false }) => {
    const [isPressed, setIsPressed] = useState(false);

    const baseStyle = {
        padding: '10px 24px',
        borderRadius: '20px',
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: '14px',
        fontWeight: '500',
        fontFamily: "'Google Sans Flex', sans-serif",
        transition: 'transform 0.1s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.2s',
        transform: isPressed && !disabled ? 'scale(0.96)' : 'scale(1)',
        opacity: disabled ? 0.5 : 1,
    };

    const variants = {
        primary: {
            backgroundColor: COLORS.primary,
            color: '#003355', // Keep dark text on light blue
        },
        secondary: {
            backgroundColor: 'transparent',
            color: COLORS.primary,
            border: `1px solid ${COLORS.border}`,
        },
        danger: {
            backgroundColor: COLORS.destructive,
            color: '#410E0B', // Keep dark text on light red
        },
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            style={{ ...baseStyle, ...variants[variant] }}
            onMouseDown={() => setIsPressed(true)}
            onMouseUp={() => setIsPressed(false)}
            onMouseLeave={() => setIsPressed(false)}
            onTouchStart={() => setIsPressed(true)}
            onTouchEnd={() => setIsPressed(false)}
        >
            {children}
        </button>
    );
};

const Modal = ({ isOpen, onClose, title, children }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            // Small delay to allow render before animation starts
            requestAnimationFrame(() => setIsAnimating(true));
        } else {
            setIsAnimating(false);
            const timer = setTimeout(() => setIsVisible(false), 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isVisible) return null;

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: isAnimating ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0, 0, 0, 0)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                transition: 'background-color 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                backdropFilter: isAnimating ? 'blur(4px)' : 'blur(0px)',
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
                    transform: isAnimating ? 'scale(1) translateY(0)' : 'scale(0.9) translateY(20px)',
                    opacity: isAnimating ? 1 : 0,
                    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
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
