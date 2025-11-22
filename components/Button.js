import React from 'react';

const useButtonAnim = () => {
    const onPress = (e) => {
        e.stopPropagation();
        e.currentTarget.style.transform = 'scale(0.90)';
        e.currentTarget.style.transition = 'transform 0.1s cubic-bezier(0.4, 0, 0.2, 1)';
    };
    const onRelease = (e) => {
        e.stopPropagation();
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.transition = 'transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)';
    };
    return { onPress, onRelease };
};

const Button = ({
    children,
    onClick,
    variant = 'primary', // primary, secondary, danger
    disabled = false,
    style = {},
    type = 'button',
    ...props
}) => {
    const { onPress, onRelease } = useButtonAnim();

    const baseStyle = {
        padding: '12px 24px',
        borderRadius: '24px',
        border: 'none',
        fontFamily: "'Google Sans Flex', sans-serif",
        fontSize: '15px',
        fontWeight: '500',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'background-color 0.2s, transform 0.1s, box-shadow 0.2s',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        opacity: disabled ? 0.6 : 1,
        ...style
    };

    let variantStyle = {};

    switch (variant) {
        case 'primary':
            variantStyle = {
                background: disabled ? '#444746' : '#A8C7FA',
                color: disabled ? '#8E918F' : '#003355',
                boxShadow: disabled ? 'none' : '0 2px 8px rgba(168, 199, 250, 0.4)',
            };
            break;
        case 'secondary':
            variantStyle = {
                background: 'transparent',
                border: '1px solid #444746',
                color: '#E3E3E3',
            };
            break;
        case 'danger':
            variantStyle = {
                background: 'rgba(242, 184, 181, 0.12)',
                color: '#F2B8B5',
            };
            break;
        default:
            variantStyle = {
                background: '#A8C7FA',
                color: '#003355',
            };
    }

    const handleMouseOver = (e) => {
        if (disabled) return;
        if (variant === 'primary') e.currentTarget.style.background = '#C2E7FF';
        if (variant === 'secondary') e.currentTarget.style.background = '#2D2D2D';
        if (variant === 'danger') e.currentTarget.style.background = 'rgba(242, 184, 181, 0.2)';
    };

    const handleMouseOut = (e) => {
        if (disabled) return;
        if (variant === 'primary') e.currentTarget.style.background = '#A8C7FA';
        if (variant === 'secondary') e.currentTarget.style.background = 'transparent';
        if (variant === 'danger') e.currentTarget.style.background = 'rgba(242, 184, 181, 0.12)';
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            style={{ ...baseStyle, ...variantStyle }}
            onMouseDown={!disabled ? onPress : undefined}
            onMouseUp={!disabled ? onRelease : undefined}
            onMouseLeave={(e) => {
                if (!disabled) onRelease(e);
                handleMouseOut(e);
            }}
            onMouseOver={handleMouseOver}
            onMouseOut={handleMouseOut}
            {...props}
        >
            {children}
        </button>
    );
};

export default Button;
