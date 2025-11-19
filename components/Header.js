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
          <button ref={hamburgerRef} className={styles.hamburger} onClick={onHamburgerClick} aria-label="Toggle sidebar" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0', display: 'flex', alignItems: 'center', marginRight: '12px' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 12H21" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M3 6H21" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M3 18H21" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
        <div>Varisankya</div>
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
