import React, { useState, useEffect, useCallback } from 'react';
import styles from '../styles/Home.module.css';
import SubscriptionForm from './SubscriptionForm';
import { COLORS } from '../lib/colors';

const SubscriptionListItem = ({ subscription, onDelete, onUpdate, isExpanded, onExpand, onCollapse }) => {
  const [expanded, setExpanded] = useState(false);

  // Sync expanded state
  useEffect(() => {
    setExpanded(isExpanded);
  }, [isExpanded]);

  // Collapse on outside click
  useEffect(() => {
    if (!expanded) return;

    const handleClickOutside = (e) => {
      if (!e.target.closest(`[data-subscription-id="${subscription._id}"]`)) {
        setExpanded(false);
        if (onCollapse) onCollapse();
      }
    };

    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [expanded, onCollapse, subscription._id]);

  // Calculate progress
  const calculateProgress = useCallback(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    if (!subscription.nextDueDate) {
      return { progress: 0, label: 'No due date set' };
    }

    const targetDate = new Date(subscription.nextDueDate);
    targetDate.setHours(0, 0, 0, 0);

    const diff = targetDate - now;
    const daysLeftRaw = Math.ceil(diff / (1000 * 60 * 60 * 24));
    const daysLeft = Math.max(0, daysLeftRaw);
    const cappedDays = Math.min(Math.max(daysLeftRaw, 0), 30);
    const progress = ((30 - cappedDays) / 30) * 100;

    const formattedTargetDate = targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const displayLabel = `${daysLeft} days left (${formattedTargetDate})`;

    return { progress, label: displayLabel };
  }, [subscription.nextDueDate]);

  const handleSave = async ({ name, date }) => {
    // Optimistic UI: Update immediately
    const updatedSubscription = {
      ...subscription,
      name: name,
      nextDueDate: date || null,
    };

    // Collapse immediately for smooth UX
    setExpanded(false);
    if (onCollapse) onCollapse();

    // Sync with API in background
    try {
      await onUpdate(updatedSubscription);
    } catch (error) {
      console.error('Failed to update:', error);
      // If API fails, re-expand to let user retry
      setExpanded(true);
      if (onExpand) onExpand(subscription._id);
    }
  };

  const handleCancel = () => {
    setExpanded(false);
    if (onCollapse) onCollapse();
  };

  const handleToggleExpand = (e) => {
    e.stopPropagation();
    if (expanded) {
      handleCancel();
    } else {
      setExpanded(true);
      if (onExpand) onExpand(subscription._id);
    }
  };

  const handleDeleteClick = async () => {
    // Delete directly without confirmation
    try {
      await onDelete(subscription._id);
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const { progress, label } = calculateProgress();
  const hasDueDate = subscription.nextDueDate;
  const statusColor = progress > 70 ? COLORS.destructive : (hasDueDate ? COLORS.primary : COLORS.neutral);

  return (
    <li
      data-subscription-id={subscription._id}
      className={styles.subscriptionItem}
      onClick={handleToggleExpand}
      style={{
        flexDirection: 'column',
        alignItems: 'stretch',
        cursor: 'pointer'
      }}
    >
      {/* Collapsed View */}
      {!expanded && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          width: '100%'
        }}>
          {/* Name */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{
              fontFamily: "'Google Sans Flex', sans-serif",
              fontSize: '17px',
              fontWeight: '500',
              color: COLORS.textPrimary,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              display: 'block'
            }}>
              {subscription.name || 'New Subscription'}
            </span>
          </div>

          {/* Days Left */}
          <div style={{ flexShrink: 0 }}>
            <span style={{
              fontFamily: "'Google Sans Flex', sans-serif",
              fontSize: '13px',
              color: statusColor === COLORS.destructive ? COLORS.destructive : COLORS.textPrimary,
              whiteSpace: 'nowrap'
            }}>
              {label}
            </span>
          </div>
        </div>
      )}

      {/* Expanded View */}
      {expanded && (
        <div style={{ width: '100%' }} onClick={(e) => e.stopPropagation()}>
          <SubscriptionForm
            initialName={subscription.name}
            initialDate={subscription.nextDueDate ? new Date(subscription.nextDueDate).toISOString().split('T')[0] : ''}
            onSave={handleSave}
            onCancel={handleCancel}
            showDelete={true}
            onDelete={handleDeleteClick}
          />
        </div>
      )}
    </li>
  );
};

export default React.memo(SubscriptionListItem);
