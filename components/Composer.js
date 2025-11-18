import React from 'react';
import styles from '../styles/Home.module.css';

export default function Composer({ value, onChange, onSubmit }) {
  return (
    <div className={styles.composerWrapper}>
      <div className={styles.composerInner}>
        <form onSubmit={onSubmit} style={{ display: 'flex', gap: 0, width: '100%' }}>
          <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder="Add a subscription..." className={styles.composerInput} aria-label="Add subscription" />
          <button type="submit" className={styles.composerButton}>Add</button>
        </form>
      </div>
    </div>
  );
}
