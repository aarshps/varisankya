import React, { useEffect, useState, useRef } from 'react';

// Use React.memo to prevent re-renders when props haven't changed meaningfully
const ProgressBar = React.memo(({ progress, color = '#A8C7FA' }) => {
    const [width, setWidth] = useState(0);
    const mountedRef = useRef(false);

    useEffect(() => {
        if (!mountedRef.current) {
            // First render - animate
            mountedRef.current = true;
            const timer = setTimeout(() => {
                setWidth(Math.max(0, Math.min(100, progress)));
            }, 100);
            return () => clearTimeout(timer);
        }
        // For subsequent renders (including when ID changes from optimistic to server),
        // just update the width immediately without animation to prevent stutter
        else {
            setWidth(Math.max(0, Math.min(100, progress)));
        }
    }, [progress]); // Only re-run when progress changes

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
                transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)', // Consistent animation
            }} />
        </div>
    );
}, (prevProps, nextProps) => {
    // Only re-render if progress or color have actually changed significantly
    return prevProps.progress === nextProps.progress && prevProps.color === nextProps.color;
});

export default ProgressBar;
