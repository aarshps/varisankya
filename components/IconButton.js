import React from 'react';
import { COLORS } from '../lib/colors';

const IconButton = ({ onClick, icon, color, hoverColor, bgColor = 'transparent', hoverBgColor, disabled, style, title, ...props }) => {
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
