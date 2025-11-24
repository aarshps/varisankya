import React from 'react';
import { COLORS } from '../lib/colors';
import useHaptics from '../lib/useHaptics';

const IconButton = ({ onClick, icon, color, hoverColor, bgColor = 'transparent', hoverBgColor, disabled, style, title, ...props }) => {
    const { triggerHaptic } = useHaptics();
    return (
        <button
            onClick={(e) => {
                triggerHaptic('light');
                if (onClick) onClick(e);
            }}
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
                opacity: disabled ? 0.5 : 1,
                flexShrink: 0,
                padding: 0,
                ...style
            }}
            {...props}
        >
            {icon}
        </button>
    );
};

export default IconButton;
