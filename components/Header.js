/* eslint-disable @next/next/no-img-element */
import React from 'react';
import styles from '../styles/Home.module.css';
import { COLORS } from '../lib/colors';
import Button from './Button';

export default function Header({ session, onSignOut, onAddClick }) {
  return (
    <header className={styles.header}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <img src="/android-logo.png" alt="Varisankya Logo" width={32} height={32} style={{ borderRadius: '8px', flexShrink: 0 }} />
        <span style={{ fontWeight: '500', fontSize: '20px', lineHeight: '32px', color: COLORS.textPrimary }}>Varisankya</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {session && (
          <>
            <Button
              onClick={onSignOut}
              variant="destructive"
            >
              Logout
            </Button>
            {session.user?.image && (
              <img
                src={session.user.image}
                alt="profile"
                width={36}
                height={36}
                style={{ borderRadius: '50%', marginLeft: '4px', border: `2px solid ${COLORS.surfaceVariant}` }}
              />
            )}
          </>
        )}
      </div>
    </header>
  );
}
