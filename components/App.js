import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import styles from '../styles/Home.module.css';

export default function App({ session, sidebarOpen, onHamburgerClick, onCloseSidebar, onSignOut, sidebarRef, hamburgerRef, children }) {
  return (
    <div className={styles.appContainer}>
      <Header onHamburgerClick={onHamburgerClick} hamburgerRef={hamburgerRef} session={session} />
      <Sidebar open={sidebarOpen} sidebarRef={sidebarRef} onClose={onCloseSidebar} session={session} onSignOut={onSignOut} />
      <div className={styles.appMain}>
        {children}
      </div>
    </div>
  );
}
