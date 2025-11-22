import React, { useState, useEffect, useCallback } from 'react';
import styles from '../styles/Home.module.css';
import ProgressBar from './ProgressBar';
import Modal, { ModalButton } from './Modal';
import IconButton from './IconButton';
import { COLORS } from '../lib/colors';

const SubscriptionListItem = ({ subscription, onDelete, onUpdate, isExpanded, onExpand, onCollapse }) => {
  const [expanded, setExpanded] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editedName, setEditedName] = useState(subscription.name);
  const [editedDate, setEditedDate] = useState(subscription.nextDueDate ? new Date(subscription.nextDueDate).toISOString().split('T')[0] : '');

  // Sync expanded state
  useEffect(() => {
    setExpanded(isExpanded);
    if (isExpanded) {
      // Reset edit state when expanding
      setEditedName(subscription.name);
      setEditedDate(subscription.nextDueDate ? new Date(subscription.nextDueDate).toISOString().split('T')[0] : '');
    }
  }, [isExpanded, subscription]);

  // Auto-collapse after 60s
  useEffect(() => {
    if (!expanded) return;
    const timer = setTimeout(() => {
      setExpanded(false);
      if (onCollapse) onCollapse();
    }, 60000);
    return () => clearTimeout(timer);
  }, [expanded, onCollapse]);

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

  // Optimized progress calculation
  const calculateProgress = useCallback(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    if (!subscription.nextDueDate) {
      return { progress: 0, daysLeft: 0, label: 'No due date set' };
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

    return { progress, daysLeft, daysLeftRaw, label: displayLabel };
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
    // Reset to original values
    setEditedName(subscription.name);
    setEditedDate(subscription.nextDueDate ? new Date(subscription.nextDueDate).toISOString().split('T')[0] : '');
    setExpanded(false);
    if (onCollapse) onCollapse();
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

  return (
    <>
      <li
        data-subscription-id={subscription._id}
        className={`${styles.subscriptionItem} ${expanded ? styles.expanded : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          if (expanded) {
            setExpanded(false);
            if (onCollapse) onCollapse();
          } else {
            setExpanded(true);
            if (onExpand) onExpand(subscription._id);
          }
        }}
        style={{
          flexDirection: 'column',
          alignItems: 'stretch',
          cursor: 'pointer',
          position: 'relative',
        }}
      >
        <div style={{ width: '100%', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '8px', marginBottom: '8px' }}>
              <input
                type="text"
                value={expanded ? editedName : subscription.name}
                onChange={(e) => setEditedName(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                placeholder="Subscription Name"
                readOnly={!expanded}
                style={{
                  fontFamily: "'Google Sans Flex', sans-serif",
                  fontSize: '16px',
                  fontWeight: '500',
                  whiteSpace: 'normal',
                  wordBreak: 'break-word',
                  lineHeight: '1.3',
                  background: 'transparent',
                  border: 'none',
                  color: COLORS.textPrimary,
                  width: '100%',
                  padding: 0,
                  margin: 0,
                  outline: 'none',
                  cursor: expanded ? 'text' : 'pointer',
                  pointerEvents: expanded ? 'auto' : 'none'
                }}
              />
              <span style={{
                fontFamily: "'Google Sans Flex', sans-serif",
                fontSize: '12px',
                color: statusColor === COLORS.destructive ? COLORS.destructive : COLORS.textPrimary,
                whiteSpace: 'nowrap',
                flexShrink: 0,
                backgroundColor: statusColor === COLORS.destructive ? COLORS.destructiveBg : COLORS.surfaceHighlight,
                padding: '4px 8px',
                borderRadius: '12px',
                marginBottom: '2px'
              }}>{label}</span>
            </div>
            <ProgressBar progress={progress} color={statusColor} />
          </div>
        </div>

        {/* Expanded View */}
        <div
          style={{
            maxHeight: expanded ? '400px' : '0',
            opacity: expanded ? 1 : 0,
            overflow: 'hidden',
            marginTop: expanded ? '16px' : '0',
            paddingTop: expanded ? '16px' : '0',
            borderTop: expanded ? `1px solid ${COLORS.border}` : 'none',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Name Edit removed - unified with header */}

            {/* Next Due Date Picker */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontFamily: "'Google Sans Flex', sans-serif", fontSize: '12px', fontWeight: '500', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Next Due Date</label>
              <input
                type="date"
                className={styles.composerInput}
                style={{
                  borderRadius: '12px',
                  fontFamily: "'Google Sans Flex', sans-serif",
                  fontSize: '16px',
                  padding: '14px 16px',
                  height: '48px',
                  width: '100%',
                  colorScheme: 'dark',
                  cursor: 'pointer',
                  boxSizing: 'border-box',
                }}
                value={editedDate}
                onChange={(e) => setEditedDate(e.target.value)}
                onClick={(e) => {
                  e.stopPropagation();
                  e.target.showPicker && e.target.showPicker();
                }}
              />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={handleDeleteClick}
                className={`${styles.button} ${styles.buttonDestructive}`}
              >
                Delete
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCancel();
                }}
                className={`${styles.button} ${styles.buttonGhost}`}
              >
                Cancel
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSave();
                }}
                className={`${styles.button} ${styles.buttonSuccess}`}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </li>

      {/* Delete Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Subscription">
        <p style={{ fontFamily: "'Google Sans Flex', sans-serif", fontSize: '16px', color: COLORS.textPrimary, margin: '0 0 24px 0' }}>
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
