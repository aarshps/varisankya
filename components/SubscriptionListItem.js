import React, { useState, useEffect, useCallback } from 'react';
import styles from '../styles/Home.module.css';
import ProgressBar from './ProgressBar';
import StatusSelect from './StatusSelect';

// Hook for M3E button press animation
const useButtonAnim = () => {
  const onPress = (e) => {
    e.currentTarget.style.transform = 'scale(0.98)';
    e.currentTarget.style.transition = 'transform 0.1s cubic-bezier(0.4, 0, 0.2, 1)';
  };
  const onRelease = (e) => {
    e.currentTarget.style.transform = 'scale(1)';
    e.currentTarget.style.transition = 'transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)';
  };
  return { onPress, onRelease };
};

const SubscriptionListItem = ({ subscription, onDelete, onUpdate, isExpanded, onExpand, onCollapse }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({ ...subscription });

  // Keep edit form in sync with prop changes
  useEffect(() => {
    setEditForm({ ...subscription });
  }, [subscription]);

  // Sync local expanded state with parent's expanded state
  useEffect(() => {
    setExpanded(isExpanded);
  }, [isExpanded]);

  // Auto‑collapse after a period of inactivity (8 s) or after a successful save
  useEffect(() => {
    if (!expanded) return undefined;
    const timer = setTimeout(() => {
      setExpanded(false);
      if (onCollapse) onCollapse();
    }, 8000);
    return () => clearTimeout(timer);
  }, [expanded, onCollapse]);

  // Collapse when clicking outside of this component
  useEffect(() => {
    if (!expanded) return;

    const handleClickOutside = (e) => {
      // Check if the click is outside of this subscription item
      if (!e.target.closest(`[data-subscription-id="${subscription._id}"]`)) {
        setExpanded(false);
        if (onCollapse) onCollapse();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [expanded, onCollapse, subscription._id]);

  // Ensure elapsed days never go negative
  // Ensure elapsed days never go negative
  const calculateProgress = useCallback(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Normalize today to midnight

    let targetDate;
    if (subscription.status === 'Inactive') return { progress: 0, daysLeft: 0, label: 'Inactive' };

    if (subscription.nextDueDate) {
      targetDate = new Date(subscription.nextDueDate);
    } else if (subscription.lastPaidDate) {
      // If only Last Paid is set, target is exactly one month after
      const lastPaid = new Date(subscription.lastPaidDate);
      targetDate = new Date(lastPaid);
      targetDate.setMonth(lastPaid.getMonth() + 1);
    } else {
      return { progress: 0, daysLeft: 0, label: 'No dates set' };
    }

    // Normalize target to midnight
    targetDate.setHours(0, 0, 0, 0);

    const diff = targetDate - now;
    const daysLeftRaw = Math.ceil(diff / (1000 * 60 * 60 * 24));

    // For display, we don't show negative days
    const daysLeft = Math.max(0, daysLeftRaw);

    // Assume a 30-day cycle for progress calculation
    const total = 30;
    const elapsed = total - daysLeftRaw;

    // Calculate progress
    // If daysLeftRaw > 30 (e.g. due in 2 months), elapsed is negative -> progress 0%
    // If daysLeftRaw < 0 (overdue), elapsed > 30 -> progress 100%
    const progress = Math.max(0, Math.min(100, (elapsed / total) * 100));

    return { progress, daysLeft, label: `${daysLeft} days left` };
  }, [subscription]);

  const { progress, daysLeft, label } = calculateProgress();

  const { onPress, onRelease } = useButtonAnim();

  const buttonStyle = {
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: 'pointer',
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this subscription?')) {
      onDelete(subscription._id);
    }
  };

  const handleSave = async (e) => {
    e.stopPropagation();
    setIsSaving(true);
    await onUpdate({ ...editForm, _id: subscription._id });
    setIsSaving(false);
    // Animate modal close
    setIsClosing(true);
    setTimeout(() => {
      setIsEditing(false);
      setIsClosing(false);
      setExpanded(false);
      if (onCollapse) onCollapse();
    }, 350); // Slightly longer than the CSS transition
  };

  const handleCancel = (e) => {
    e.stopPropagation();
    setEditForm({ ...subscription });
    // Animate modal close
    setIsClosing(true);
    setTimeout(() => {
      setIsEditing(false);
      setIsClosing(false);
      if (onCollapse) onCollapse();
    }, 350); // Slightly longer than the CSS transition
  };

  return (
    <>
      <li
        data-subscription-id={subscription._id}
        className={`${styles.subscriptionItem} ${expanded ? styles.expanded : ''}`}
        onClick={(e) => {
          e.stopPropagation(); // Prevent event bubbling
          if (!isEditing) {
            if (expanded) {
              setExpanded(false);
              if (onCollapse) onCollapse();
            } else {
              setExpanded(true);
              if (onExpand) onExpand(subscription._id);
            }
          }
        }}
        style={{
          animation: isDeleting ? `${styles.fadeOut} 0.2s forwards` : `${styles.fadeIn} 0.3s ease-out`,
          flexDirection: 'column',
          alignItems: 'stretch',
          cursor: isEditing ? 'default' : 'pointer',
          transition: 'background-color 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1), transform 0.1s cubic-bezier(0.4, 0, 0.2, 1)',
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div style={{ flex: 1, paddingRight: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: "'Google Sans Flex', sans-serif", fontSize: '16px', fontWeight: '500' }}>{subscription.name}</span>
              <span style={{ fontFamily: "'Google Sans Flex', sans-serif", fontSize: '12px', color: '#C4C7C5' }}>{label}</span>
            </div>
            <ProgressBar progress={progress} color={daysLeft < 3 ? '#F2B8B5' : '#A8C7FA'} />
          </div>
          <button
            onClick={handleDelete}
            className={styles.removeButton}
            aria-label="Delete subscription"
            style={buttonStyle}
            onMouseDown={onPress}
            onMouseUp={onRelease}
            onMouseLeave={onRelease}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 19C6 20.1 6.9 21 8 21H16C17.1 21 18 20.1 18 19V7H6V19ZM19 4H15.5L14.5 3H9.5L8.5 4H5V6H19V4Z" fill="currentColor" />
            </svg>
          </button>
        </div>

        <div
          style={{
            width: '100%',
            overflow: 'hidden',
            maxHeight: expanded ? '300px' : '0',
            opacity: expanded ? 1 : 0,
            marginTop: expanded ? '16px' : '0',
            paddingTop: expanded ? '16px' : '0',
            borderTop: expanded ? '1px solid #444746' : 'none',
            transition: 'max-height 0.3s ease-out, opacity 0.3s ease-out, margin-top 0.3s ease-out, padding-top 0.3s ease-out, border-top 0.3s ease-out',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: "'Google Sans Flex', sans-serif", fontSize: '14px', color: '#C4C7C5' }}>Status:</span>
              <span style={{ fontFamily: "'Google Sans Flex', sans-serif", fontSize: '14px', fontWeight: '500', color: subscription.status === 'Inactive' ? '#F2B8B5' : '#C2E7FF' }}>{subscription.status || 'Active'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: "'Google Sans Flex', sans-serif", fontSize: '14px', color: '#C4C7C5' }}>Last Paid:</span>
              <span style={{ fontFamily: "'Google Sans Flex', sans-serif", fontSize: '14px', fontWeight: '500' }}>{subscription.lastPaidDate ? new Date(subscription.lastPaidDate).toLocaleDateString() : '-'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: "'Google Sans Flex', sans-serif", fontSize: '14px', color: '#C4C7C5' }}>Next Due:</span>
              <span style={{ fontFamily: "'Google Sans Flex', sans-serif", fontSize: '14px', fontWeight: '500' }}>{subscription.nextDueDate ? new Date(subscription.nextDueDate).toLocaleDateString() : '-'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
              <button
                onClick={() => {
                  setIsEditing(true);
                  setExpanded(false); // Collapse the expanded view when edit is clicked
                  if (onCollapse) onCollapse();
                }}
                style={{
                  padding: '8px 24px',
                  borderRadius: '20px',
                  border: '1px solid #444746',
                  background: 'transparent',
                  color: '#A8C7FA',
                  fontFamily: "'Google Sans Flex', sans-serif",
                  fontSize: '14px',
                  fontWeight: '500',
                  ...buttonStyle,
                }}
                onMouseDown={onPress}
                onMouseUp={onRelease}
                onMouseLeave={onRelease}
                onMouseOver={(e) => (e.currentTarget.style.background = '#2D2D2D')}
                onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                Edit
              </button>
            </div>
          </div>
        </div>
      </li>

      {/* Edit Modal */}
      {isEditing && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: isClosing ? 'rgba(0, 0, 0, 0)' : 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            opacity: isClosing ? 0 : 1,
            transition: 'background-color 0.3s ease-out, opacity 0.3s ease-out',
          }}
          onClick={handleCancel}
        >
          <div
            style={{
              backgroundColor: '#1E1E1E',
              borderRadius: '24px',
              padding: '32px',
              width: '90%',
              maxWidth: '500px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
              transform: isClosing ? 'scale(0.95)' : 'scale(1)',
              opacity: isClosing ? 0 : 1,
              transition: 'transform 0.3s ease-out, opacity 0.3s ease-out',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontFamily: "'Google Sans Flex', sans-serif", fontSize: '24px', fontWeight: '500', color: '#E3E3E3', marginTop: 0, marginBottom: '24px' }}>
              Edit Subscription
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontFamily: "'Google Sans Flex', sans-serif", fontSize: '12px', fontWeight: '500', color: '#C4C7C5', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Name</label>
                <input
                  className={styles.composerInput}
                  style={{ borderRadius: '12px', width: '100%', fontFamily: "'Google Sans Flex', sans-serif", fontSize: '16px', padding: '14px 16px', height: '48px' }}
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="Subscription name"
                  disabled={isSaving}
                />
              </div>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: '1 1 150px' }}>
                  <label style={{ fontFamily: "'Google Sans Flex', sans-serif", fontSize: '12px', fontWeight: '500', color: '#C4C7C5', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Last Paid</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="date"
                      className={styles.composerInput}
                      style={{
                        borderRadius: '12px',
                        fontFamily: "'Google Sans Flex', sans-serif",
                        fontSize: '16px',
                        padding: '14px 40px 14px 44px',
                        height: '48px',
                        width: '100%',
                        colorScheme: 'dark',
                      }}
                      value={editForm.lastPaidDate ? new Date(editForm.lastPaidDate).toISOString().split('T')[0] : ''}
                      onChange={(e) => setEditForm({ ...editForm, lastPaidDate: e.target.value })}
                      disabled={isSaving}
                    />
                    <svg style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M19 4H18V2H16V4H8V2H6V4H5C3.89 4 3.01 4.9 3.01 6L3 20C3 21.1 3.89 22 5 22H19C20.1 22 21 21.1 21 20V6C21 4.9 20.1 4 19 4ZM19 20H5V10H19V20ZM19 8H5V6H19V8Z" fill="#A8C7FA" />
                    </svg>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: '1 1 150px' }}>
                  <label style={{ fontFamily: "'Google Sans Flex', sans-serif", fontSize: '12px', fontWeight: '500', color: '#C4C7C5', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Next Due</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="date"
                      className={styles.composerInput}
                      style={{
                        borderRadius: '12px',
                        fontFamily: "'Google Sans Flex', sans-serif",
                        fontSize: '16px',
                        padding: '14px 40px 14px 44px',
                        height: '48px',
                        width: '100%',
                        colorScheme: 'dark',
                      }}
                      value={editForm.nextDueDate ? new Date(editForm.nextDueDate).toISOString().split('T')[0] : ''}
                      onChange={(e) => setEditForm({ ...editForm, nextDueDate: e.target.value })}
                      disabled={isSaving}
                    />
                    <svg style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M19 4H18V2H16V4H8V2H6V4H5C3.89 4 3.01 4.9 3.01 6L3 20C3 21.1 3.89 22 5 22H19C20.1 22 21 21.1 21 20V6C21 4.9 20.1 4 19 4ZM19 20H5V10H19V20ZM19 8H5V6H19V8Z" fill="#A8C7FA" />
                    </svg>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontFamily: "'Google Sans Flex', sans-serif", fontSize: '12px', fontWeight: '500', color: '#C4C7C5', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</label>
                <StatusSelect
                  value={editForm.status || 'Active'}
                  onChange={(val) => setEditForm({ ...editForm, status: val })}
                  disabled={isSaving}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  onClick={handleCancel}
                  disabled={isSaving}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '24px',
                    border: '1px solid #444746',
                    background: 'transparent',
                    color: '#E3E3E3',
                    cursor: isSaving ? 'not-allowed' : 'pointer',
                    fontFamily: "'Google Sans Flex', sans-serif",
                    fontSize: '15px',
                    fontWeight: '500',
                    transition: 'background-color 0.2s, transform 0.1s',
                    opacity: isSaving ? 0.5 : 1,
                  }}
                  onMouseDown={!isSaving ? onPress : undefined}
                  onMouseUp={!isSaving ? onRelease : undefined}
                  onMouseLeave={!isSaving ? onRelease : undefined}
                  onMouseOver={(e) => !isSaving && (e.currentTarget.style.background = '#2D2D2D')}
                  onMouseOut={(e) => !isSaving && (e.currentTarget.style.background = 'transparent')}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  style={{
                    padding: '12px 32px',
                    borderRadius: '24px',
                    border: 'none',
                    background: isSaving ? '#80A3D4' : '#A8C7FA',
                    color: '#003355',
                    fontWeight: '500',
                    cursor: isSaving ? 'not-allowed' : 'pointer',
                    fontFamily: "'Google Sans Flex', sans-serif",
                    fontSize: '15px',
                    transition: 'background-color 0.2s, transform 0.1s',
                    boxShadow: '0 2px 8px rgba(168, 199, 250, 0.4)',
                  }}
                  onMouseDown={!isSaving ? onPress : undefined}
                  onMouseUp={!isSaving ? onRelease : undefined}
                  onMouseLeave={!isSaving ? onRelease : undefined}
                  onMouseOver={(e) => !isSaving && (e.currentTarget.style.background = '#C2E7FF')}
                  onMouseOut={(e) => !isSaving && (e.currentTarget.style.background = '#A8C7FA')}
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Memoize the SubscriptionListItem component
// This will prevent re-renders when parent re-renders (e.g., for notifications)
// but still update when subscription data changes
const MemoizedSubscriptionListItem = React.memo(SubscriptionListItem, (prevProps, nextProps) => {
  // Only re-render if the subscription data has actually changed
  // Also re-render if the expansion state changes, or if delete/update callbacks change
  return (
    prevProps.subscription._id === nextProps.subscription._id &&
    prevProps.subscription.name === nextProps.subscription.name &&
    prevProps.subscription.lastPaidDate === nextProps.subscription.lastPaidDate &&
    prevProps.subscription.nextDueDate === nextProps.subscription.nextDueDate &&
    prevProps.subscription.status === nextProps.subscription.status &&
    prevProps.subscription.createdAt === nextProps.subscription.createdAt &&
    prevProps.subscription.updatedAt === nextProps.subscription.updatedAt &&
    prevProps.isExpanded === nextProps.isExpanded &&
    prevProps.onDelete === nextProps.onDelete &&
    prevProps.onUpdate === nextProps.onUpdate &&
    prevProps.onExpand === nextProps.onExpand &&
    prevProps.onCollapse === nextProps.onCollapse
  );
});

export default MemoizedSubscriptionListItem;
