import React from 'react';
import styles from '../styles/Home.module.css';
import { COLORS } from '../lib/colors';

export default function Header({ onHamburgerClick, hamburgerRef, session, hideHamburger = false }) {
  return (
    <header className={styles.header}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Always render hamburger container to maintain spacing */}
        <div style={{ width: '40px', height: '40px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {!hideHamburger && (
            <button
              onClick={onHamburgerClick}
              className={styles.hamburger}
              ref={hamburgerRef}
              aria-label="Menu"
              style={{ padding: '8px', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 18H21V16H3V18ZM3 13H21V11H3V13ZM3 6V8H21V6H3Z" fill={COLORS.textPrimary} />
              </svg>
            </button>
          )}
        </div>
        <img src="/android-logo.png" alt="Varisankya Logo" width={32} height={32} style={{ borderRadius: '8px', flexShrink: 0 }} />
        <span style={{ fontWeight: '500', fontSize: '20px', lineHeight: '32px', color: COLORS.textPrimary }}>Varisankya</span>
      </div>
      {/* Always render profile container to maintain spacing */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', flexShrink: 0 }}>
        {!hideHamburger && session?.user?.image && (
          <img src={session.user.image} alt="profile" width={32} height={32} style={{ borderRadius: '50%' }} />
        )}
      </div>
    </header>
  );
}
