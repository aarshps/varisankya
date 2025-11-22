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

  // Auto-collapse after 3s of inactivity
  useEffect(() => {
    if (!expanded) return;

    let timer;
    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        setExpanded(false);
        if (onCollapse) onCollapse();
      }, 3000);
    };

    resetTimer();
    const handleInteraction = () => resetTimer();
    const itemElement = document.querySelector(`[data-subscription-id="${subscription._id}"]`);

    if (itemElement) {
      itemElement.addEventListener('mousemove', handleInteraction);
      itemElement.addEventListener('click', handleInteraction);
      itemElement.addEventListener('keydown', handleInteraction);
    }

    return () => {
      clearTimeout(timer);
      if (itemElement) {
        itemElement.removeEventListener('mousemove', handleInteraction);
        itemElement.removeEventListener('click', handleInteraction);
        itemElement.removeEventListener('keydown', handleInteraction);
      }
    };
  }, [expanded, onCollapse, subscription._id]);

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
    try {
      await onUpdate({
        ...subscription,
        name: editedName,
        nextDueDate: editedDate || null,
      });
      setExpanded(false);
      if (onCollapse) onCollapse();
    } catch (error) {
      console.error('Failed to update:', error);
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
    try {
      await onDelete(subscription._id);
    } catch (error) {
      console.error('Failed to delete:', error);
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
          width: '100%'
        }}>
          {/* Name */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{
              fontFamily: "'Google Sans Flex', sans-serif",
              fontSize: '16px',
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

          {/* Days Left + Progress Circle */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            flexShrink: 0
          }}>
            <span style={{
              fontFamily: "'Google Sans Flex', sans-serif",
              fontSize: '12px',
              color: statusColor === COLORS.destructive ? COLORS.destructive : COLORS.textPrimary,
              whiteSpace: 'nowrap'
            }}>
              {label}
            </span>

            <svg
              width="36"
              height="36"
              viewBox="0 0 36 36"
              style={{
                transform: 'rotate(-90deg)',
                flexShrink: 0
              }}
            >
              <circle
                cx="18"
                cy="18"
                r={circleRadius}
                fill="none"
                stroke={COLORS.surfaceVariant}
                strokeWidth="3"
              />
              <circle
                cx="18"
                cy="18"
                r={circleRadius}
                fill="none"
                stroke={statusColor}
                strokeWidth="3"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - Math.min(progress, 100) / 100)}
                strokeLinecap="round"
                style={{
                  transition: 'stroke-dashoffset 0.5s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.3s ease',
                  animation: progress >= 100 ? 'pulseRed 1.5s ease-in-out infinite' : 'none'
                }}
              />
            </svg>
          </div>
        </div>

        {/* Expanded View */}
        {expanded && (
          <div
            style={{
              paddingTop: '32px',
              width: '100%'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Name Input */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{
                  fontFamily: "'Google Sans Flex', sans-serif",
                  fontSize: '12px',
                  fontWeight: '500',
                  color: COLORS.textSecondary,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Name
                </label>
                <input
                  type="text"
                  className={styles.dateInput}
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  placeholder="Subscription Name"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>

              {/* Date Picker */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{
                  fontFamily: "'Google Sans Flex', sans-serif",
                  fontSize: '12px',
                  fontWeight: '500',
                  color: COLORS.textSecondary,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Next Due Date
                </label>
                <input
                  type="date"
                  className={styles.dateInput}
                  value={editedDate}
                  onChange={(e) => setEditedDate(e.target.value)}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.target.showPicker && e.target.showPicker();
                  }}
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
      </li>

      {/* Delete Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Subscription">
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
      </Modal>
    </>
  );
};

export default React.memo(SubscriptionListItem);
