import React from 'react';

export default function SubscriptionListItem({ subscription, onDelete }) {
  return (
    <li style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', margin: '8px 0', backgroundColor: '#fff', border: '1px solid #e0e0e0', borderRadius: '6px' }}>
      <span style={{ flex: 1, wordBreak: 'break-word', paddingRight: '10px' }}>{subscription.name}</span>
      <button onClick={() => onDelete(subscription._id)} style={{ padding: '6px 12px', backgroundColor: '#ea4335', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}>Remove</button>
    </li>
  );
}
