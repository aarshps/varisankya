import React from 'react';
import SidebarNavItem from './SidebarNavItem';
import styles from '../styles/Home.module.css';

export default function Sidebar({ open, sidebarRef, onClose, session, onSignOut, currentView, onChangeView }) {
  const handleButtonPress = (e) => {
    e.currentTarget.style.transform = 'scale(0.98)';
  };
  const handleButtonRelease = (e) => {
    e.currentTarget.style.transform = 'scale(1)';
  };

  return (
    <aside className={`${styles.sidebar} ${open ? styles.open : ''}`} ref={sidebarRef} aria-hidden={!open} style={{ borderTopRightRadius: '24px', borderBottomRightRadius: '24px' }}>
      <div style={{ padding: '16px 12px' }}>
        <div
          className={`${styles.sidebarItem} ${currentView === 'subscriptions' ? styles.selected : ''}`}
          onClick={() => { onChangeView('subscriptions'); onClose(); }}
          style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 13H11V3H3V13ZM3 21H11V15H3V21ZM13 21H21V11H13V21ZM13 3V9H21V3H13Z" fill="currentColor" />
          </svg>
          <span>Subscriptions</span>
        </div>
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ padding: '16px', borderTop: '1px solid #444746' }}>
        <div style={{ fontSize: '14px', color: '#E3E3E3', marginBottom: '8px', paddingLeft: '12px' }}>{session?.user?.email}</div>
        <div style={{ fontSize: '12px', color: '#C4C7C5', marginBottom: '12px', paddingLeft: '12px' }}>{`DB: ${session?.user?.databaseName || 'Loading...'}`}</div>
        <button
          onClick={onSignOut}
          onMouseDown={handleButtonPress}
          onMouseUp={handleButtonRelease}
          onMouseLeave={handleButtonRelease}
          style={{ width: '100%', padding: '12px', backgroundColor: 'transparent', color: '#F2B8B5', border: '1px solid #8C1D18', borderRadius: '24px', cursor: 'pointer', fontWeight: '500', fontFamily: "'Google Sans Flex', sans-serif", transition: 'transform 0.1s cubic-bezier(0.4, 0, 0.2, 1)' }}
        >
          Sign Out
        </button>
      </div>
    </aside>
  );
}
