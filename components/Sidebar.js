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
            gap: '12px',
            transition: 'transform 0.1s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          {/* Unique subscription icon - receipt with circular refresh arrows */}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19.5 3.5L18 2L16.5 3.5L15 2L13.5 3.5L12 2L10.5 3.5L9 2L7.5 3.5L6 2L4.5 3.5L3 2V22L4.5 20.5L6 22L7.5 20.5L9 22L10.5 20.5L12 22L13.5 20.5L15 22L16.5 20.5L18 22L19.5 20.5L21 22V2L19.5 3.5Z" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <path d="M7 8H17M7 12H17M7 16H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M17 15C17 16.66 15.66 18 14 18C12.34 18 11 16.66 11 15C11 13.34 12.34 12 14 12C15.66 12 17 13.34 17 15Z" fill="#1E1E1E" />
            <path d="M15.5 14.5L14 16L12.5 14.5M12.5 15.5L14 14L15.5 15.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>Subscriptions</span>
        </div>
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ padding: '16px', borderTop: '1px solid #444746' }}>
        <div style={{ fontSize: '14px', color: '#E3E3E3', marginBottom: '16px', paddingLeft: '12px' }}>{session?.user?.email}</div>
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
    </aside>
  );
}
