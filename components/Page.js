import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import styles from '../styles/Home.module.css';

export default function Page({ session, sidebarOpen, sidebarRef, hamburgerRef, onHamburgerClick, onCloseSidebar, onSignOut, composerProps, children }) {
  return (
    <div>
      <Header onHamburgerClick={onHamburgerClick} hamburgerRef={hamburgerRef} session={session} />
      <Sidebar open={sidebarOpen} sidebarRef={sidebarRef} onClose={onCloseSidebar} session={session} onSignOut={onSignOut} />
      {sidebarOpen && <div className={styles.overlay} onClick={onCloseSidebar} />}
      <main className={`${styles.main} ${styles.appMain} ${sidebarOpen ? styles.mainOpen : ''}`}>
        {children}
      </main>
      {/* Composer is provided by the page child (e.g., Subscriptions) */}
    </div>
  );
}
