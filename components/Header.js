import React, { useState, useEffect } from 'react';
import styles from '../styles/Home.module.css';
import { COLORS } from '../lib/colors';
import Button from './Button';
import useHaptics, { markHapticsInitialized } from '../lib/useHaptics';

export default function Header({ session, onSignOut, onAddClick }) {
  const { triggerHaptic } = useHaptics();
  const [showLogout, setShowLogout] = useState(false);

  // Haptic feedback on showLogout change
  useEffect(() => {
    // Skip initial render if needed, but here we want feedback on change
    // We can check if it's different from initial state, but simple check is enough
    // Actually, we only want to trigger when it changes.
    // Since this effect runs on mount (false), we might want to skip that if we don't want haptic on load.
    // However, it's false by default so it's fine.
    // But wait, if we want it on "appears and disappears", we should trigger it.
    // Let's use a ref to track mount.
  }, [showLogout]);

  const mounted = React.useRef(false);
  useEffect(() => {
    if (mounted.current) {
      triggerHaptic('light');
    } else {
      mounted.current = true;
    }
  }, [showLogout, triggerHaptic]);

  // Auto-hide logout button
  useEffect(() => {
    if (showLogout) {
      const timer = setTimeout(() => {
        setShowLogout(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showLogout]);

  return (
    <header className={styles.header}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '36px' }}>
        <img src="/android-logo.png" alt="Varisankya Logo" width={36} height={36} style={{ borderRadius: '8px', flexShrink: 0 }} />
        <span style={{ fontWeight: '500', fontSize: '20px', lineHeight: '36px', color: COLORS.textPrimary }}>Varisankya</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', height: '36px', position: 'relative' }}>
        {session && (
          <>
            <div style={{
              position: 'absolute',
              right: '48px',
              top: 0,
              height: '36px',
              display: showLogout ? 'flex' : 'none',
              alignItems: 'center',
              zIndex: 0
            }}>
              <Button
                onClick={() => {
                  triggerHaptic('medium');
                  setShowLogout(false);
                  onSignOut();
                }}
                variant="destructive"
                style={{ height: '36px', padding: '0 16px' }}
              >
                Logout
              </Button>
            </div>

            {session.user?.image && (
              <div
                role="button"
                tabIndex={0}
                style={{
                  borderRadius: '50%',
                  marginLeft: '4px',
                  cursor: 'pointer',
                  position: 'relative',
                  zIndex: 10,
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#1E1E1E' // Ensure opaque background
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.transform = 'scale(0.92)';
                }}
                onTouchStart={(e) => {
                  e.currentTarget.style.transform = 'scale(0.92)';
                }}
                onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                onTouchEnd={(e) => e.currentTarget.style.transform = 'scale(1)'}
                onClick={() => {
                  // Initialize haptics if not already done (ensures first click works)
                  if (typeof navigator !== 'undefined' && navigator.vibrate) {
                    try {
                      navigator.vibrate(40); // medium duration
                      // Mark as initialized for future haptic calls
                      if (typeof markHapticsInitialized === 'function') {
                        markHapticsInitialized();
                      }
                    } catch (e) {
                      console.debug('Haptic failed:', e);
                    }
                  }
                  setShowLogout(!showLogout);
                }}
              >
                <img
                  src={session.user.image}
                  alt="profile"
                  width={36}
                  height={36}
                  style={{
                    borderRadius: '50%',
                    border: `2px solid ${COLORS.surfaceVariant}`,
                    pointerEvents: 'none' // Let the div handle events
                  }}
                />
              </div>
            )}
          </>
        )}
      </div>
    </header >
  );
}
