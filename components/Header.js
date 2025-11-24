import React, { useState, useEffect } from 'react';
import styles from '../styles/Home.module.css';
import { COLORS } from '../lib/colors';
import Button from './Button';
import useHaptics from '../lib/useHaptics';

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
              <img
                src={session.user.image}
                alt="profile"
                width={36}
                height={36}
                style={{
                  borderRadius: '50%',
                  marginLeft: '4px',
                  border: `2px solid ${COLORS.surfaceVariant}`,
                  cursor: 'pointer',
                  position: 'relative',
                  zIndex: 10, // Always on top
                  backgroundColor: '#1E1E1E' // Ensure opaque background
                }}
                onClick={() => {
                  // Haptic handled by useEffect
                  setShowLogout(!showLogout);
                }}
                onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.92)'}
                onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              />
            )}
          </>
        )}
      </div>
    </header >
  );
}
