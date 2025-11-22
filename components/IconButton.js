import React from 'react';
import { COLORS } from '../lib/colors';

const IconButton = ({ onClick, icon, color, hoverColor, bgColor = 'transparent', hoverBgColor, disabled, style, title, ...props }) => {
    const onPress = (e) => {
        if (disabled) return;
        e.stopPropagation();
        e.currentTarget.style.transform = 'scale(0.90)';
        e.currentTarget.style.transition = 'transform 0.1s cubic-bezier(0.4, 0, 0.2, 1)';
    };

    const onRelease = (e) => {
        if (disabled) return;
        e.stopPropagation();
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.transition = 'transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)';
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            title={title}
            style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                border: 'none',
                background: bgColor,
                color: color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: disabled ? 'default' : 'pointer',
                transition: 'background-color 0.2s cubic-bezier(0.4, 0, 0.2, 1), transform 0.1s cubic-bezier(0.4, 0, 0.2, 1)',
                opacity: disabled ? 0.5 : 1,
                flexShrink: 0,
                padding: 0,
                ...style
            }}
            onMouseDown={onPress}
            onMouseUp={onRelease}
            onMouseLeave={onRelease}
            onMouseOver={(e) => !disabled && (e.currentTarget.style.background = hoverBgColor || COLORS.surfaceHighlight)}
            onMouseOut={(e) => !disabled && (e.currentTarget.style.background = bgColor)}
            {...props}
        >
            {icon}
        </button>
    );
};

export default IconButton;
