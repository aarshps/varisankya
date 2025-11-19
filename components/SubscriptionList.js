import React from 'react';
import SubscriptionListItem from './SubscriptionListItem';

export default function SubscriptionList({ subscriptions, onDelete }) {
  if (!subscriptions || subscriptions.length === 0) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100%', 
        width: '100%',
        color: '#666',
        padding: '20px'
      }}>
        <p style={{ margin: 0, textAlign: 'center' }}>No subscriptions yet. Add one below!</p>
      </div>
    );
  }

  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: 0, width: '100%' }}>
      {subscriptions.map((s) => (
        <SubscriptionListItem key={s._id} subscription={s} onDelete={onDelete} />
      ))}
    </ul>
  );
}
