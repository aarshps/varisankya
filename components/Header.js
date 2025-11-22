import React from 'react';
import styles from '../styles/Home.module.css';
import { COLORS } from '../lib/colors';
import IconButton from './IconButton';

export default function Header({ session, onSignOut, onAddClick }) {
  return (
    <header className={styles.header}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <img src="/android-logo.png" alt="Varisankya Logo" width={32} height={32} style={{ borderRadius: '8px', flexShrink: 0 }} />
        <span style={{ fontWeight: '500', fontSize: '20px', lineHeight: '32px', color: COLORS.textPrimary }}>Varisankya</span>
      </div>

      {/* Actions Container */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {session && (
          <>
            <IconButton
              onClick={onAddClick}
              title="Add Subscription"
              icon={
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 13H13V19H11V13H5V11H11V5H13V11H19V13Z" fill="currentColor" />
                </svg>
              }
              style={{
                color: COLORS.primary,
                backgroundColor: 'transparent',
              }}
            />
            <IconButton
              onClick={onSignOut}
              title="Sign Out"
              icon={
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 17V14H9V10H16V7L21 12L16 17ZM14 2H3V22H14V19H5V5H14V2Z" fill="currentColor" />
                </svg>
              }
              style={{
                color: COLORS.destructive,
                backgroundColor: 'transparent',
              }}
            />
            {session.user?.image && (
              <img
                src={session.user.image}
                alt="profile"
                width={32}
                height={32}
                style={{ borderRadius: '50%', marginLeft: '4px' }}
              />
            )}
          </>
        )}
      </div>
    </header>
  );
}
