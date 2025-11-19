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
      <div style={{ padding: '16px', borderTop: '1px solid #eee' }}>
        <div style={{ fontSize: '14px', color: '#333', marginBottom: '8px', paddingLeft: '12px' }}>{session?.user?.email}</div>
        <div style={{ fontSize: '12px', color: '#666', marginBottom: '12px', paddingLeft: '12px' }}>{`DB: vari_${session?.user?.username || session?.user?.email.split('@')[0]}_${process.env.NODE_ENV || 'development'}`}</div>
        <button
          onClick={onSignOut}
          style={{ width: '100%', padding: '12px', backgroundColor: '#fff', color: '#b3261e', border: '1px solid #e0e0e0', borderRadius: '24px', cursor: 'pointer', fontWeight: '500', fontFamily: "'Google Sans Flex', sans-serif" }}
        >
          Sign Out
        </button>
      </div>
    </aside>
  );
}
