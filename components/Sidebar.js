import React from 'react';
import SidebarNavItem from './SidebarNavItem';
import styles from '../styles/Home.module.css';

export default function Sidebar({ open, sidebarRef, onClose, session, onSignOut }) {
  return (
    <aside className={`${styles.sidebar} ${open ? styles.open : ''}`} ref={sidebarRef} aria-hidden={!open}>
      <div style={{ padding: '16px' }}>
        <SidebarNavItem label="Subscriptions" selected onClick={onClose} />
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ padding: '16px', borderTop: '1px solid #eee' }}>
        <div style={{ fontSize: '14px', color: '#333', marginBottom: '8px' }}>{session?.user?.email}</div>
        <div style={{ fontSize: '12px', color: '#666', marginBottom: '12px' }}>{`DB: vari_${session?.user?.username || session?.user?.email.split('@')[0]}_${process.env.NODE_ENV || 'development'}`}</div>
        <button
          onClick={onSignOut}
          style={{ width: '100%', padding: '10px', backgroundColor: '#ea4335', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          Sign Out
        </button>
      </div>
    </aside>
  );
}
