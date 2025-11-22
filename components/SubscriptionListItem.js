import React, { useState, useEffect, useCallback } from 'react';
import styles from '../styles/Home.module.css';
import ProgressBar from './ProgressBar';
import Modal, { ModalButton } from './Modal';
import IconButton from './IconButton';

// Hook for M3E button press animation
const useButtonAnim = () => {
  const onPress = (e) => {
    e.stopPropagation();
    e.currentTarget.style.transform = 'scale(0.90)';
    e.currentTarget.style.transition = 'transform 0.1s cubic-bezier(0.4, 0, 0.2, 1)';
  };
  const onRelease = (e) => {
    e.stopPropagation();
    e.currentTarget.style.transform = 'scale(1)';
    e.currentTarget.style.transition = 'transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)';
  };
  return { onPress, onRelease };
};

const SubscriptionListItem = ({ subscription, onDelete, onUpdate, isExpanded, onExpand, onCollapse }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const { onPress, onRelease } = useButtonAnim();

  // Sync local expanded state with parent's expanded state
  useEffect(() => {
    setExpanded(isExpanded);
  }, [isExpanded]);

  // Auto‑collapse after 60s of inactivity
  useEffect(() => {
    if (!expanded) return undefined;
    const timer = setTimeout(() => {
      setExpanded(false);
      if (onCollapse) onCollapse();
    }, 60000);
    return () => clearTimeout(timer);
  }, [expanded, onCollapse]);

  // Collapse when clicking outside
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

  // Ultra-simple progress calculation - only Next Due Date
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

    // Progress based on 30-day window
    const cappedDays = Math.min(Math.max(daysLeftRaw, 0), 30);
    const progress = ((30 - cappedDays) / 30) * 100;

    const formattedTargetDate = targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const displayLabel = `${daysLeft} days left (${formattedTargetDate})`;

    return { progress, daysLeft, daysLeftRaw, label: displayLabel };
  }, [subscription.nextDueDate]);

  const getTodayString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleNextDueDateChange = async (e) => {
    const newDate = e.target.value;

    try {
      await onUpdate({
        ...subscription,
        nextDueDate: newDate || null,
      });
    } catch (error) {
      console.error('Failed to update next due date:', error);
    }
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      await onDelete(subscription._id);
    } catch (error) {
      console.error('Failed to delete subscription:', error);
      setIsDeleting(false);
    }
  };

  const { progress, daysLeft, label } = calculateProgress();
  const hasDueDate = subscription.nextDueDate;
  const statusColor = progress > 70 ? '#F2B8B5' : (hasDueDate ? '#A8C7FA' : '#8E918F');

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
          animation: isDeleting ? `${styles.fadeOut} 0.2s forwards` : `${styles.fadeIn} 0.3s ease-out`,
          flexDirection: 'column',
          alignItems: 'stretch',
          cursor: 'pointer',
          transition: 'background-color 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1), transform 0.1s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
        }}
        onMouseDown={(e) => {
          e.currentTarget.style.transform = 'scale(0.99)';
        }}
        onMouseUp={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        <div style={{ width: '100%', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontFamily: "'Google Sans Flex', sans-serif", fontSize: '16px', fontWeight: '500', whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: '1.3' }}>{subscription.name}</span>
              <span style={{
                fontFamily: "'Google Sans Flex', sans-serif",
                fontSize: '12px',
                color: statusColor === '#F2B8B5' ? '#F2B8B5' : '#E3E3E3',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                backgroundColor: statusColor === '#F2B8B5' ? 'rgba(242, 184, 181, 0.12)' : '#3E3E3E',
                padding: '4px 8px',
                borderRadius: '12px',
                marginBottom: '2px'
              }}>{label}</span>
            </div>
            <ProgressBar
              progress={progress}
              color={statusColor}
            />
          </div>
        </div>

        {/* Expanded View - Ultra Simple */}
        <div
          style={{
            maxHeight: expanded ? '200px' : '0',
            opacity: expanded ? 1 : 0,
            overflow: 'hidden',
            marginTop: expanded ? '16px' : '0',
            paddingTop: expanded ? '16px' : '0',
            borderTop: expanded ? '1px solid #444746' : 'none',
            transition: 'max-height 0.3s ease-out, opacity 0.3s ease-out, margin-top 0.3s ease-out, padding-top 0.3s ease-out, border-top 0.3s ease-out',
          }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Next Due Date Picker */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontFamily: "'Google Sans Flex', sans-serif", fontSize: '12px', fontWeight: '500', color: '#C4C7C5', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Next Due Date</label>
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
                  appearance: 'none',
                  WebkitAppearance: 'none',
                }}
                value={subscription.nextDueDate ? new Date(subscription.nextDueDate).toISOString().split('T')[0] : ''}
                onChange={handleNextDueDateChange}
                onClick={(e) => {
                  e.stopPropagation();
                  e.target.showPicker && e.target.showPicker();
                }}
              />
            </div>

            {/* Delete Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <IconButton
                onClick={handleDeleteClick}
                title="Delete"
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 19C6 20.1 6.9 21 8 21H16C17.1 21 18 20.1 18 19V7H6V19ZM19 4H15.5L14.5 3H9.5L8.5 4H5V6H19V4Z" fill="currentColor" />
                  </svg>
                }
                style={{
                  color: '#F2B8B5',
                  backgroundColor: 'rgba(242, 184, 181, 0.12)',
                  border: '1px solid rgba(242, 184, 181, 0.3)',
                }}
                onPress={onPress}
                onRelease={onRelease}
              />
            </div>
          </div>
        </div>
      </li>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Subscription"
      >
        <p style={{ fontFamily: "'Google Sans Flex', sans-serif", fontSize: '16px', color: '#E3E3E3', margin: '0 0 24px 0' }}>
          Are you sure you want to delete <strong>{subscription.name}</strong>? This action cannot be undone.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <ModalButton onClick={() => setShowDeleteModal(false)} variant="secondary">
            Cancel
          </ModalButton>
          <ModalButton onClick={handleDeleteConfirm} variant="danger">
            Delete
          </ModalButton>
        </div>
      </Modal>
    </>
  );
};

// Memoize to prevent unnecessary re-renders
export default React.memo(SubscriptionListItem);
