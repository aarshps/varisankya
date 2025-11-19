import React from 'react';
import styles from '../styles/Home.module.css';

export default function SubscriptionListItem({ subscription, onDelete }) {
  return (
    <li className={styles.subscriptionItem}>
      <span style={{ flex: 1, wordBreak: 'break-word', paddingRight: '10px', fontFamily: "'Google Sans Flex', sans-serif", fontSize: '16px' }}>{subscription.name}</span>
      <button onClick={() => onDelete(subscription._id)} className={styles.removeButton}>Remove</button>
    </li>
  );
}
