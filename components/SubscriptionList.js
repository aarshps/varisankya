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
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    let targetDate;
    if (subscription.status === 'Inactive') return 9999; // Inactive at bottom

    if (subscription.nextDueDate) {
      targetDate = new Date(subscription.nextDueDate);
    } else if (subscription.lastPaidDate) {
      const lastPaid = new Date(subscription.lastPaidDate);
      targetDate = new Date(lastPaid);

      if (subscription.recurrenceType === 'monthly') {
        const dayOfMonth = parseInt(subscription.recurrenceValue) || 1;
        targetDate.setDate(dayOfMonth);
        if (targetDate.getDate() !== dayOfMonth) {
          targetDate.setDate(0);
        }
        if (targetDate <= lastPaid) {
          targetDate = new Date(lastPaid);
          targetDate.setMonth(targetDate.getMonth() + 1);
          targetDate.setDate(dayOfMonth);
          if (targetDate.getDate() !== dayOfMonth) {
            targetDate.setDate(0);
          }
        }
      } else if (subscription.recurrenceType === 'yearly') {
        const [month, day] = String(subscription.recurrenceValue || '01-01').split('-').map(Number);
        targetDate.setMonth(month - 1);
        targetDate.setDate(day);
        if (targetDate <= lastPaid) {
          targetDate.setFullYear(targetDate.getFullYear() + 1);
        }
      } else if (subscription.recurrenceType === 'manual') {
        return 9998; // No dates for manual
      } else {
        // Default 'days' logic
        const daysToAdd = parseInt(subscription.recurrenceValue) || 30;
        targetDate.setDate(lastPaid.getDate() + daysToAdd);
      }
    } else {
      return 9998; // No dates set
    }

    targetDate.setHours(0, 0, 0, 0);
    const diff = targetDate - now;
    const daysLeftRaw = Math.ceil(diff / (1000 * 60 * 60 * 24));

    return daysLeftRaw;
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
