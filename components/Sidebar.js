import React from 'react';
import styles from '../styles/Home.module.css';
import { COLORS } from '../lib/colors';

export default function Sidebar({ open, sidebarRef, onClose, session, onSignOut, currentView, onChangeView }) {
  return (
    <aside
      className={`${styles.sidebar} ${open ? styles.open : ''}`}
      ref={sidebarRef}
      aria-hidden={!open}
      style={{
        borderTopRightRadius: '24px',
        borderBottomRightRadius: '24px',
      }}
    >
      <div style={{ padding: '16px 12px' }}>
        <div
          className={`${styles.sidebarItem} ${currentView === 'subscriptions' ? styles.selected : ''}`}
          onClick={() => { onChangeView('subscriptions'); onClose(); }}
          style={{
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <span>Subscriptions</span>
        </div>
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ padding: '16px', borderTop: `1px solid ${COLORS.border}` }}>
        <div style={{ fontSize: '14px', color: COLORS.textPrimary, marginBottom: '16px', paddingLeft: '12px' }}>{session?.user?.email}</div>
        <button
          onClick={onSignOut}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: COLORS.transparent,
            color: COLORS.destructive,
            border: `1px solid ${COLORS.destructive}`,
            borderRadius: '24px',
            cursor: 'pointer',
            fontWeight: '500',
            fontFamily: "'Google Sans Flex', sans-serif",
          }}
        >
          Sign Out
        </button>
      </div>
    </aside>
  );
}
