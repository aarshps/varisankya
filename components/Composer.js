import React, { useState, useEffect, useRef } from 'react';
import styles from '../styles/Home.module.css';

export default function Composer({ value, onChange, onSubmit }) {
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
  const originalViewportHeight = useRef(window.innerHeight);
  const inputRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      const newViewportHeight = window.innerHeight;
      const heightDifference = originalViewportHeight.current - newViewportHeight;

      // Check if the viewport height decreased significantly (indicating keyboard is open)
      // Use a threshold (150px) to filter out minor changes
      setIsKeyboardOpen(heightDifference > 150);
      setViewportHeight(newViewportHeight);
    };

    // Add event listener for resize (happens when keyboard opens/closes)
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Calculate offset when keyboard is open
  const calculatedBottom = isKeyboardOpen
    ? `${originalViewportHeight.current - viewportHeight}px`
    : '0px';

  // Dynamic styles to adjust position when keyboard is open
  const dynamicStyles = {
    position: 'fixed',
    bottom: calculatedBottom,
    left: '0',
    right: '0',
    zIndex: 20,
    maxWidth: '600px',
    margin: '0 auto'
  };

  return (
    <div className={styles.composerWrapper} style={dynamicStyles}>
      <div className={styles.composerInner}>
        <form onSubmit={onSubmit} style={{ display: 'flex', gap: 0, width: '100%' }}>
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Add a subscription..."
            className={styles.composerInput}
            aria-label="Add subscription"
          />
          <button type="submit" className={styles.composerButton}>Add</button>
        </form>
      </div>
    </div>
  );
}
