import React, { useState, useEffect, useRef } from 'react';
import styles from '../styles/Home.module.css';
import { COLORS } from '../lib/colors';

export default function Header({ session, onSignOut }) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };

    if (showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileMenu]);

  return (
    <header className={styles.header}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <img src="/android-logo.png" alt="Varisankya Logo" width={32} height={32} style={{ borderRadius: '8px', flexShrink: 0 }} />
        <span style={{ fontWeight: '500', fontSize: '20px', lineHeight: '32px', color: COLORS.textPrimary }}>Varisankya</span>
      </div>

      {/* Profile Container */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }} ref={menuRef}>
        {session?.user?.image && (
          <img
            src={session.user.image}
            alt="profile"
            width={32}
            height={32}
            style={{ borderRadius: '50%', cursor: 'pointer' }}
            onClick={() => setShowProfileMenu(!showProfileMenu)}
          />
        )}

        {/* Profile Menu Modal */}
        {showProfileMenu && (
          <div style={{
            position: 'absolute',
            top: '48px',
            right: 0,
            backgroundColor: COLORS.surface,
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            zIndex: 1000,
            minWidth: '200px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            border: `1px solid ${COLORS.border}`
          }}>
            <div style={{ fontSize: '14px', color: COLORS.textPrimary, wordBreak: 'break-all' }}>
              {session?.user?.email}
            </div>
            <button
              onClick={() => {
                setShowProfileMenu(false);
                onSignOut();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                width: '100%',
                padding: '10px',
                backgroundColor: COLORS.destructiveBg,
                color: COLORS.destructive,
                border: `1px solid ${COLORS.destructive}`,
                borderRadius: '20px',
                cursor: 'pointer',
                fontWeight: '500',
                fontFamily: "'Google Sans Flex', sans-serif",
                fontSize: '14px'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 17V14H9V10H16V7L21 12L16 17ZM14 2H3V22H14V19H5V5H14V2Z" fill="currentColor" />
              </svg>
              Sign Out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
