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

  // Simplified helper to calculate days left for sorting
  const getDaysLeft = (subscription) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    if (subscription.status === 'Inactive') return 9999; // Inactive at bottom

    let targetDate = null;

    // Priority 1: Use Next Due Date if set
    if (subscription.nextDueDate) {
      targetDate = new Date(subscription.nextDueDate);
    }
    // Priority 2: Calculate from Last Paid + Recurring Days
    else if (subscription.lastPaidDate && subscription.recurringDays) {
      const lastPaid = new Date(subscription.lastPaidDate);
      targetDate = new Date(lastPaid);
      targetDate.setDate(lastPaid.getDate() + parseInt(subscription.recurringDays));
    }

    if (!targetDate) return 9998; // No dates set

    targetDate.setHours(0, 0, 0, 0);
    const diff = targetDate - now;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const sortedSubscriptions = [...subscriptions].sort((a, b) => {
    // Inactive items always go to the bottom
    if (a.status === 'Inactive' && b.status !== 'Inactive') return 1;
    if (a.status !== 'Inactive' && b.status === 'Inactive') return -1;

    const daysLeftA = getDaysLeft(a);
    const daysLeftB = getDaysLeft(b);
    return daysLeftA - daysLeftB; // Ascending order (fewer days = higher priority)
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

SubscriptionList.displayName = 'SubscriptionList';

export default SubscriptionList;
