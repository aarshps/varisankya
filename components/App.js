import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import styles from '../styles/Home.module.css';

export default function App({ session, sidebarOpen, onHamburgerClick, onCloseSidebar, onSignOut, sidebarRef, hamburgerRef, children, currentView, onChangeView }) {
  return (
    <div className={styles.appContainer}>
      <Header onHamburgerClick={onHamburgerClick} hamburgerRef={hamburgerRef} session={session} />
      <Sidebar
        open={sidebarOpen}
        sidebarRef={sidebarRef}
        onClose={onCloseSidebar}
        session={session}
        onSignOut={onSignOut}
        currentView={currentView}
        onChangeView={onChangeView}
      />
      {sidebarOpen && <div className={styles.overlay} onClick={onCloseSidebar} />}
      <div className={`${styles.appMain} ${sidebarOpen ? styles.mainOpen : ''}`}>
        {children}
      </div>
    </div>
  );
}
