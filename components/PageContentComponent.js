import React from 'react';
import styles from '../styles/Home.module.css';

export default function PageContentComponent({ children }) {
    return (
        <div className={styles.content}>
            {children}
        </div>
    );
}
