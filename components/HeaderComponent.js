import React from 'react';
import styles from '../styles/Home.module.css';
import LogoComponent from './LogoComponent';
import AppNameComponent from './AppNameComponent';
import UserComponent from './UserComponent';

export default function HeaderComponent({ session, onSignOut }) {
    return (
        <header className={styles.header}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', height: '100%' }}>
                <LogoComponent />
                <AppNameComponent />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', height: '100%', position: 'relative' }}>
                <UserComponent session={session} onSignOut={onSignOut} />
            </div>
        </header>
    );
}
