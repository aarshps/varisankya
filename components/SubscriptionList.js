import React, { useState, useCallback } from 'react';
import SubscriptionListItem from './SubscriptionListItem';

const SubscriptionList = React.memo(({ subscriptions, onDelete, onUpdate }) => {
  const [expandedId, setExpandedId] = useState(null);

  const handleExpand = useCallback((id) => {
    setExpandedId(id);
  }, []);

  const handleCollapse = useCallback(() => {
    setExpandedId(null);
  }, []);

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

  // Helper to calculate days left for sorting
  const getDaysLeft = (subscription) => {
    if (subscription.status === 'Inactive') return 9999; // Push to bottom

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    let targetDate;
    if (subscription.nextDueDate) {
      targetDate = new Date(subscription.nextDueDate);
    } else if (subscription.lastPaidDate) {
      const lastPaid = new Date(subscription.lastPaidDate);
      targetDate = new Date(lastPaid);
      targetDate.setMonth(lastPaid.getMonth() + 1);
    } else {
      return 9998; // No dates set, push to bottom but above Inactive
    }

    targetDate.setHours(0, 0, 0, 0);
    const diff = targetDate - now;
    const daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return daysLeft; // Return raw value for sorting (negative means overdue/fullest)
  };

  // Sort subscriptions: Fullest (lowest days left) first
  const sortedSubscriptions = [...subscriptions].sort((a, b) => {
    const daysA = getDaysLeft(a);
    const daysB = getDaysLeft(b);
    return daysA - daysB;
  });

  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: 0, width: '100%' }}>
      {sortedSubscriptions.map((s) => (
        <SubscriptionListItem
          key={s.localId || s._id}
          subscription={s}
          onDelete={onDelete}
          onUpdate={onUpdate}
          isExpanded={expandedId === s._id}
          onExpand={handleExpand}
          onCollapse={handleCollapse}
        />
      ))}
    </ul>
  );
}, (prevProps, nextProps) => {
  // Only re-render if subscriptions array, onDelete, or onUpdate have changed
  return (
    prevProps.subscriptions === nextProps.subscriptions &&
    prevProps.onDelete === nextProps.onDelete &&
    prevProps.onUpdate === nextProps.onUpdate
  );
});

export default SubscriptionList;
