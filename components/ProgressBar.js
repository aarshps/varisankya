import React from 'react';
import { COLORS } from '../lib/colors';

const ProgressBar = ({ progress, color }) => {
    return (
        <div style={{
            width: '100%',
            height: '4px',
            backgroundColor: COLORS.surfaceHighlight,
            borderRadius: '2px',
            overflow: 'hidden'
        }}>
            <div style={{
                width: `${Math.min(Math.max(progress, 0), 100)}%`,
                height: '100%',
                backgroundColor: color || COLORS.primary,
                transition: 'width 0.3s ease-in-out, background-color 0.3s ease-in-out'
            }} />
        </div>
    );
};

export default ProgressBar;
