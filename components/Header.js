import React from 'react';
import Image from 'next/image';
import styles from '../styles/Home.module.css';

export default function Header({ onHamburgerClick, hamburgerRef, session, hideHamburger = false }) {
  return (
    <header className={styles.header}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {hideHamburger ? (
          // Empty div to maintain spacing where hamburger would be
          <div style={{ width: '40px', height: '40px', visibility: 'hidden' }}></div>
        ) : (
          <button onClick={onHamburgerClick} className={styles.hamburger} ref={hamburgerRef} aria-label="Menu">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 18H21V16H3V18ZM3 13H21V11H3V13ZM3 6V8H21V6H3Z" fill="#E3E3E3" />
            </svg>
          </button>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Image src="/android-chrome-192x192.png" alt="Varisankya Logo" width={32} height={32} style={{ borderRadius: '8px' }} />
          <span style={{ fontWeight: '500', fontSize: '20px' }}>Varisankya</span>
        </div>
      </div>
      {!hideHamburger && (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {session?.user?.image && (
            <Image src={session.user.image} alt="profile" width={32} height={32} style={{ borderRadius: '50%' }} />
          )}
        </div>
      )}
    </header>
  );
}
