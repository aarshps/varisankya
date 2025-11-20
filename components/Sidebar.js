import React from 'react';
import SidebarNavItem from './SidebarNavItem';
import styles from '../styles/Home.module.css';

export default function Sidebar({ open, sidebarRef, onClose, session, onSignOut }) {
  return (
    <aside className={`${styles.sidebar} ${open ? styles.open : ''}`} ref={sidebarRef} aria-hidden={!open} style={{ borderTopRightRadius: '24px', borderBottomRightRadius: '24px' }}>
      <div style={{ padding: '16px 12px' }}>
        <div className={`${styles.sidebarItem} ${styles.selected}`} onClick={onClose}>Subscriptions</div>
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ padding: '16px', borderTop: '1px solid #444746' }}>
        <div style={{ fontSize: '14px', color: '#E3E3E3', marginBottom: '8px', paddingLeft: '12px' }}>{session?.user?.email}</div>
        <div style={{ fontSize: '12px', color: '#C4C7C5', marginBottom: '12px', paddingLeft: '12px' }}>{`DB: ${session?.user?.databaseName || 'Loading...'}`}</div>
        <button
          onClick={onSignOut}
          style={{ width: '100%', padding: '12px', backgroundColor: 'transparent', color: '#F2B8B5', border: '1px solid #8C1D18', borderRadius: '24px', cursor: 'pointer', fontWeight: '500', fontFamily: "'Google Sans Flex', sans-serif" }}
        >
          Sign Out
        </button>
      </div>
    </aside>
  );
}
