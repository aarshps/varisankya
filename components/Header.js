import React from 'react';
import styles from '../styles/Home.module.css';

export default function Header({ onHamburgerClick, hamburgerRef, session, hideHamburger = false }) {
  return (
    <header className={styles.header}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {hideHamburger ? (
          // Empty div to maintain spacing where hamburger would be
          <div style={{ width: '40px', height: '40px', visibility: 'hidden' }}></div>
        ) : (
          <button ref={hamburgerRef} className={styles.hamburger} onClick={onHamburgerClick} aria-label="Toggle sidebar">☰</button>
        )}
        <div style={{ marginLeft: '12px' }}>Varisankya</div>
      </div>
      {!hideHamburger && (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {session?.user?.image && (
            <img src={session.user.image} alt="profile" style={{ width: 32, height: 32, borderRadius: '50%' }} />
          )}
        </div>
      )}
    </header>
  );
}
