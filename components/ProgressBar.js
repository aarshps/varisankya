import React, { useEffect, useState } from 'react';

export default function ProgressBar({ progress, color = '#A8C7FA' }) {
    const [width, setWidth] = useState(0);

    useEffect(() => {
        // Trigger animation on mount or progress change
        const timer = setTimeout(() => {
            setWidth(Math.max(0, Math.min(100, progress)));
        }, 100);
        return () => clearTimeout(timer);
    }, [progress]);

    return (
        <div style={{
            width: '100%',
            height: '4px',
            backgroundColor: '#444746', // M3 Dark Surface Variant
            borderRadius: '2px',
            overflow: 'hidden',
            marginTop: '8px'
        }}>
            <div style={{
                width: `${width}%`,
                height: '100%',
                backgroundColor: color,
                borderRadius: '2px',
                transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)', // Smooth ease-out animation
            }} />
        </div>
    );
}
