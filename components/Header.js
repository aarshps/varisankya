import React from 'react';
import styles from '../styles/Home.module.css';

export default function Header({ onHamburgerClick, hamburgerRef, session }) {
  return (
    <header className={styles.header}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <button ref={hamburgerRef} className={styles.hamburger} onClick={onHamburgerClick} aria-label="Toggle sidebar">☰</button>
        <div style={{ marginLeft: '12px' }}>Varisankya</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {session?.user?.image && (
          <img src={session.user.image} alt="profile" style={{ width: 32, height: 32, borderRadius: '50%' }} />
        )}
      </div>
    </header>
  );
}
