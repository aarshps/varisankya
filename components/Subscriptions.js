import React from 'react';
import styles from '../styles/Home.module.css';
import SubscriptionList from './SubscriptionList';
import Loader from './Loader';

export default function Subscriptions({ subscriptions, loading, error, onDelete, onUpdate }) {
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Loader />
      </div>
    );
  }

  if (error) {
    return <div className={styles.error}>Error: {error}</div>;
  }

  return (
    <div className={styles.container}>
      <SubscriptionList
        subscriptions={subscriptions}
        onDelete={onDelete}
        onUpdate={onUpdate}
      />
    </div>
  );
}
