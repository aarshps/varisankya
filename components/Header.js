import React from 'react';
import styles from '../styles/Home.module.css';

export default function Header({ onHamburgerClick, hamburgerRef, session, hideHamburger = false }) {
  // M3E press animations
  const handlePress = (e) => {
    e.currentTarget.style.transform = 'scale(0.92)';
    e.currentTarget.style.transition = 'transform 0.1s cubic-bezier(0.4, 0, 0.2, 1)';
  };
  const handleRelease = (e) => {
    e.currentTarget.style.transform = 'scale(1)';
    e.currentTarget.style.transition = 'transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)';
  };

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
              onMouseDown={handlePress}
              onMouseUp={handleRelease}
              onMouseLeave={handleRelease}
              onTouchStart={handlePress}
              onTouchEnd={handleRelease}
              style={{ transition: 'transform 0.1s cubic-bezier(0.4, 0, 0.2, 1)' }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 18H21V16H3V18ZM3 13H21V11H3V13ZM3 6V8H21V6H3Z" fill="#E3E3E3" />
              </svg>
            </button>
          )}
        </div>
        <img src="/android-logo.png" alt="Varisankya Logo" width={32} height={32} style={{ borderRadius: '8px', flexShrink: 0 }} />
        <span style={{ fontWeight: '500', fontSize: '20px', lineHeight: '32px' }}>Varisankya</span>
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
