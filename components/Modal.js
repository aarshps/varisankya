import React from 'react';
import { COLORS } from '../lib/colors';
import styles from '../styles/Home.module.css';

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
    const [shouldRender, setShouldRender] = React.useState(isOpen);
    const [isClosing, setIsClosing] = React.useState(false);

    React.useEffect(() => {
        if (isOpen) {
            setShouldRender(true);
            setIsClosing(false);
        } else if (shouldRender) {
            setIsClosing(true);
            const timer = setTimeout(() => {
                setShouldRender(false);
                setIsClosing(false);
            }, 180); // Slightly less than 200ms to avoid flicker
            return () => clearTimeout(timer);
        }
    }, [isOpen, shouldRender]);

    if (!shouldRender) return null;

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
                animation: isClosing ? 'fadeOut 0.2s var(--easing-standard) forwards' : 'fadeIn 0.2s var(--easing-standard) forwards'
            }}
            onClick={!isClosing ? onClose : undefined}
        >
            <div
                className={styles.modalOpen}
                style={{
                    backgroundColor: COLORS.surface,
                    borderRadius: '24px',
                    padding: 'var(--padding-modal)',
                    width: '90%',
                    maxWidth: '400px',
                    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.4)',
                    animation: isClosing ? 'scaleOut 0.2s var(--easing-standard) forwards' : 'scaleIn 0.2s var(--easing-standard) forwards'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Title removed as per request */}
                {children}
            </div>
        </div>
    );
};

export default Modal;
