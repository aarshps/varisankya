import React, { useState, useEffect } from 'react';
import styles from '../styles/Home.module.css';
import { COLORS } from '../lib/colors';
import Button from './Button';

export default function Header({ session, onSignOut, onAddClick }) {
  const [showLogout, setShowLogout] = useState(false);

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
              right: '4px', // Start from behind the profile pic
              top: 0,
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              transform: showLogout ? 'translateX(-44px)' : 'translateX(0)', // Slide out to left
              opacity: showLogout ? 1 : 0,
              zIndex: 0, // Behind profile
              transition: 'all 0.4s cubic-bezier(0.2, 0, 0, 1)',
              pointerEvents: showLogout ? 'auto' : 'none'
            }}>
              <Button
                onClick={onSignOut}
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
                  transition: 'transform 0.2s',
                  position: 'relative',
                  zIndex: 10, // Always on top
                  backgroundColor: '#1E1E1E' // Ensure opaque background
                }}
                onClick={() => setShowLogout(!showLogout)}
                onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.92)'}
                onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              />
            )}
          </>
        )}
      </div>
    </header>
  );
}
