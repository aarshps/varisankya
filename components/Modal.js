import React, { useState, useEffect } from 'react';

// Hook for M3E button press animation
const useButtonAnim = () => {
    const onPress = (e) => {
        e.currentTarget.style.transform = 'scale(0.98)';
        e.currentTarget.style.transition = 'transform 0.1s cubic-bezier(0.4, 0, 0.2, 1)';
    };
    const onRelease = (e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.transition = 'transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)';
    };
    return { onPress, onRelease };
};

const Modal = ({ isOpen, onClose, title, children, actions }) => {
    const [isClosing, setIsClosing] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setIsClosing(false);
        }
    }, [isOpen]);

    if (!isOpen && !isClosing) return null;

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            setIsClosing(false);
            onClose();
        }, 300);
    };

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: isClosing ? 'rgba(0, 0, 0, 0)' : 'rgba(0, 0, 0, 0.7)',
                zIndex: 1000,
                opacity: isClosing ? 0 : 1,
                transition: 'background-color 0.3s ease-out, opacity 0.3s ease-out',
                overflowY: 'auto',
                display: (isOpen || isClosing) ? 'flex' : 'none',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
            }}
            onClick={handleClose}
        >
            <div
                style={{
                    backgroundColor: '#1E1E1E',
                    borderRadius: '24px',
                    padding: '32px',
                    width: '90%',
                    maxWidth: '500px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
                    transform: isClosing ? 'scale(0.95)' : 'scale(1)',
                    opacity: isClosing ? 0 : 1,
                    transition: 'transform 0.3s ease-out, opacity 0.3s ease-out',
                    margin: 'auto',
                    maxHeight: '80vh',
                    overflowY: 'auto',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <h2 style={{ fontFamily: "'Google Sans Flex', sans-serif", fontSize: '24px', fontWeight: '500', color: '#E3E3E3', marginTop: 0, marginBottom: '24px' }}>
                    {title}
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {children}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                        {actions}
                    </div>
                </div>
            </div>
        </div>
    );
};

export const ModalButton = ({ onClick, variant = 'primary', disabled, children, type = 'button' }) => {
    const { onPress, onRelease } = useButtonAnim();

    const styles = {
        primary: {
            background: disabled ? '#555' : '#A8C7FA',
            color: disabled ? '#888' : '#003355',
            boxShadow: disabled ? 'none' : '0 2px 8px rgba(168, 199, 250, 0.4)',
        },
        secondary: {
            background: 'transparent',
            color: '#E3E3E3',
            border: '1px solid #444746',
        },
        danger: {
            background: '#ffb4ab',
            color: '#690005',
            boxShadow: '0 2px 8px rgba(255, 180, 171, 0.4)',
        }
    };

    const currentStyle = styles[variant] || styles.primary;

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            style={{
                padding: '12px 24px',
                borderRadius: '24px',
                border: variant === 'secondary' ? '1px solid #444746' : 'none',
                cursor: disabled ? 'not-allowed' : 'pointer',
                fontFamily: "'Google Sans Flex', sans-serif",
                fontSize: '15px',
                fontWeight: '500',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                ...currentStyle
            }}
            onMouseDown={!disabled ? onPress : undefined}
            onMouseUp={!disabled ? onRelease : undefined}
            onMouseLeave={!disabled ? onRelease : undefined}
            onMouseOver={(e) => {
                if (disabled) return;
                if (variant === 'primary') e.currentTarget.style.background = '#C2E7FF';
                if (variant === 'secondary') e.currentTarget.style.background = '#2D2D2D';
                if (variant === 'danger') e.currentTarget.style.background = '#ffdad6';
            }}
            onMouseOut={(e) => {
                if (disabled) return;
                e.currentTarget.style.background = currentStyle.background;
            }}
        >
            {children}
        </button>
    );
};

export default Modal;
