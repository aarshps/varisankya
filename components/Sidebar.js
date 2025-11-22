import React from 'react';
import styles from '../styles/Home.module.css';

export default function Sidebar({ open, sidebarRef, onClose, session, onSignOut, currentView, onChangeView }) {
  // M3E press animations
  const handlePress = (e) => {
    e.currentTarget.style.transform = 'scale(0.96)';
    e.currentTarget.style.transition = 'transform 0.1s cubic-bezier(0.4, 0, 0.2, 1)';
  };
  const handleRelease = (e) => {
    e.currentTarget.style.transform = 'scale(1)';
    e.currentTarget.style.transition = 'transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)';
  };

  return (
    <aside
      className={`${styles.sidebar} ${open ? styles.open : ''}`}
      ref={sidebarRef}
      aria-hidden={!open}
      style={{
        borderTopRightRadius: '24px',
        borderBottomRightRadius: '24px',
        willChange: 'transform',
        backfaceVisibility: 'hidden'
      }}
    >
      <div style={{ padding: '16px 12px' }}>
        <div
          className={`${styles.sidebarItem} ${currentView === 'subscriptions' ? styles.selected : ''}`}
          onClick={() => { onChangeView('subscriptions'); onClose(); }}
          onMouseDown={handlePress}
          onMouseUp={handleRelease}
          onMouseLeave={handleRelease}
          onTouchStart={handlePress}
          onTouchEnd={handleRelease}
          style={{
            display: 'flex',
            alignItems: 'center',
            transition: 'transform 0.1s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          <span>Subscriptions</span>
        </div>
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ padding: '16px', borderTop: '1px solid #444746' }}>
        < style={{ fontSize: '14px', color: '#E3E3E3', marginBottom: '16px', paddingLeft: '12px' }}>{session?.user?.email}</div>
      <button
        onClick={onSignOut}
        onMouseDown={handlePress}
        onMouseUp={handleRelease}
        onMouseLeave={handleRelease}
        onTouchStart={handlePress}
        onTouchEnd={handleRelease}
        style={{
          width: '100%',
          padding: '12px',
          backgroundColor: 'transparent',
          color: '#F2B8B5',
          border: '1px solid #8C1D18',
          borderRadius: '24px',
          cursor: 'pointer',
          fontWeight: '500',
          fontFamily: "'Google Sans Flex', sans-serif",
          transition: 'transform 0.1s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        Sign Out
      </button>
    </div>
    </aside >
  );
}
