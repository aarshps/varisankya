import React, { useState, useEffect, useCallback } from 'react';
import styles from '../styles/Home.module.css';
import Modal, { ModalButton } from './Modal';
import Button from './Button';
import { COLORS } from '../lib/colors';

const SubscriptionListItem = ({ subscription, onDelete, onUpdate, isExpanded, onExpand, onCollapse }) => {
  const [expanded, setExpanded] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editedName, setEditedName] = useState(subscription.name);
  const [editedDate, setEditedDate] = useState(
    subscription.nextDueDate ? new Date(subscription.nextDueDate).toISOString().split('T')[0] : ''
  );

  // Sync expanded state
  useEffect(() => {
    setExpanded(isExpanded);
    if (isExpanded) {
      setEditedName(subscription.name);
      setEditedDate(subscription.nextDueDate ? new Date(subscription.nextDueDate).toISOString().split('T')[0] : '');
    }
  }, [isExpanded, subscription]);

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

  const handleSave = async () => {
    // Optimistic UI: Update immediately
    const updatedSubscription = {
      ...subscription,
      name: editedName,
      nextDueDate: editedDate || null,
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
    setEditedName(subscription.name);
    setEditedDate(subscription.nextDueDate ? new Date(subscription.nextDueDate).toISOString().split('T')[0] : '');
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

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    // Optimistic UI: Close modal and trigger delete immediately
    setShowDeleteModal(false);

    // Delete in background
    try {
      await onDelete(subscription._id);
    } catch (error) {
      console.error('Failed to delete:', error);
      // If API fails, show modal again
      setShowDeleteModal(true);
    }
  };

  const { progress, label } = calculateProgress();
  const hasDueDate = subscription.nextDueDate;
  const statusColor = progress > 70 ? COLORS.destructive : (hasDueDate ? COLORS.primary : COLORS.neutral);
  const isModified = editedName !== subscription.name ||
    (editedDate !== (subscription.nextDueDate ? new Date(subscription.nextDueDate).toISOString().split('T')[0] : ''));

  const circleRadius = 16;
  const circumference = 2 * Math.PI * circleRadius;

  return (
    <>
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
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          width: '100%',
          maxHeight: expanded ? '0' : '100px',
          opacity: expanded ? 0 : 1,
          overflow: 'hidden',
          transition: 'all 0.3s cubic-bezier(0.2, 0, 0, 1)'
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
          <div style={{
            flexShrink: 0
          }}>
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

        {/* Expanded View */}
        <div
          style={{
            maxHeight: expanded ? '500px' : '0',
            opacity: expanded ? 1 : 0,
            overflow: 'hidden',
            transition: expanded
              ? 'all 0.3s cubic-bezier(0.2, 0, 0, 1)'
              : 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: expanded ? 'translateY(0)' : 'translateY(-10px)'
          }}
        >
          {expanded && (
            <div
              style={{
                width: '100%'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* Name and Date in 2 columns */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="text"
                    className={styles.dateInput}
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    placeholder="Subscription Name"
                    onClick={(e) => e.stopPropagation()}
                    style={{ flex: '2 1 0', minWidth: 0 }}
                  />
                  <input
                    type="date"
                    className={styles.dateInput}
                    value={editedDate}
                    onChange={(e) => setEditedDate(e.target.value)}
                    onClick={(e) => {
                      e.stopPropagation();
                      e.target.showPicker && e.target.showPicker();
                    }}
                    style={{ flex: '1 1 0', minWidth: 0 }}
                  />
                </div>

                {/* Action Buttons */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <Button onClick={handleDeleteClick} variant="destructive">
                    Delete
                  </Button>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCancel();
                      }}
                      variant="neutral"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSave();
                      }}
                      variant="success"
                      disabled={!isModified}
                    >
                      Save
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </li>

      {/* Delete Modal */}
      < Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Subscription" >
        <p style={{
          fontFamily: "'Google Sans Flex', sans-serif",
          fontSize: '16px',
          color: COLORS.textPrimary,
          margin: '0 0 24px 0'
        }}>
          Are you sure you want to delete <strong>{subscription.name}</strong>?
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <ModalButton onClick={() => setShowDeleteModal(false)} variant="secondary">Cancel</ModalButton>
          <ModalButton onClick={handleDeleteConfirm} variant="danger">Delete</ModalButton>
        </div>
      </Modal >
    </>
  );
};

export default React.memo(SubscriptionListItem);
