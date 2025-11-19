import React from 'react';
import SubscriptionList from './SubscriptionList';
import Composer from './Composer';
import styles from '../styles/Home.module.css';

export default function Subscriptions({ subscriptions, loading, error, onDelete, onUpdate, composerProps }) {
  return (
    <>
      <div className={styles.content}>
        <div className={styles.subscriptionsContainer}>
          {error && <div style={{ color: '#d93025', backgroundColor: '#fce8e6', padding: '10px', borderRadius: '4px', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}
          {loading && <div style={{ textAlign: 'center', padding: '20px' }}>Loading subscriptions...</div>}
          {!loading && <SubscriptionList subscriptions={subscriptions} onDelete={onDelete} onUpdate={onUpdate} />}
        </div>
      </div>
      {/* Composer sits outside the scrollable area */}
      <Composer {...composerProps} />
    </>
  );
}
