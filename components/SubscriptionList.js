import React from 'react';
import SubscriptionListItem from './SubscriptionListItem';

export default function SubscriptionList({ subscriptions, onDelete }) {
  if (!subscriptions || subscriptions.length === 0) {
    return <p style={{ textAlign: 'center', color: '#666' }}>No subscriptions yet. Add one below!</p>;
  }

  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: 0, width: '100%' }}>
      {subscriptions.map((s) => (
        <SubscriptionListItem key={s._id} subscription={s} onDelete={onDelete} />
      ))}
    </ul>
  );
}
