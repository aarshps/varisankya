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
  const getProgress = (subscription) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    let targetDate;
    if (subscription.status === 'Inactive') return 0;

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
      } else {
        // Default 'days' logic
        const daysToAdd = parseInt(subscription.recurrenceValue) || 30;
        targetDate.setDate(lastPaid.getDate() + daysToAdd);
      }
    } else if (subscription.nextDueDate) {
      targetDate = new Date(subscription.nextDueDate);
    } else {
      return 0;
    }

    targetDate.setHours(0, 0, 0, 0);
    const diff = targetDate - now;
    const daysLeftRaw = Math.ceil(diff / (1000 * 60 * 60 * 24));

    let total = 30;
    if (subscription.recurrenceType === 'days') {
      total = parseInt(subscription.recurrenceValue) || 30;
    } else if (subscription.recurrenceType === 'monthly') {
      total = 30;
    } else if (subscription.recurrenceType === 'yearly') {
      total = 365;
    }

    const elapsed = total - daysLeftRaw;
    // Calculate progress percentage
    // If daysLeftRaw < 0 (overdue), elapsed > total -> progress > 100
    const progress = (elapsed / total) * 100;
    return progress;
  };

  const sortedSubscriptions = [...subscriptions].sort((a, b) => {
    // Inactive items always go to the bottom
    if (a.status === 'Inactive' && b.status !== 'Inactive') return 1;
    if (a.status !== 'Inactive' && b.status === 'Inactive') return -1;

    const progressA = getProgress(a);
    const progressB = getProgress(b);
    return progressB - progressA; // Descending order (bigger progress bar at top)
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
