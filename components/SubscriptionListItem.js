import React, { useState, useEffect, useCallback } from 'react';
import styles from '../styles/Home.module.css';
import ProgressBar from './ProgressBar';
import CustomSelect from './CustomSelect';
// Removed: RecurrenceSelect and MonthSelect (simplified to recurringDays)
import Modal, { ModalButton } from './Modal';
import IconButton from './IconButton';
import Button from './Button';

// Hook for M3E button press animation
const useButtonAnim = () => {
  const onPress = (e) => {
    e.stopPropagation();
    e.currentTarget.style.transform = 'scale(0.90)'; // More noticeable scale for buttons
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
  const [isEditing, setIsEditing] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({ ...subscription, recurringDays: subscription.recurringDays || 30 });
  const [showDeleteModal, setShowDeleteModal] = useState(false); // New state for delete modal

  // Keep edit form in sync with prop changes
  useEffect(() => {
    setEditForm({ ...subscription, recurringDays: subscription.recurringDays || 30 });
  }, [subscription]);

  // Sync local expanded state with parent's expanded state
  useEffect(() => {
    setExpanded(isExpanded);
  }, [isExpanded]);

  // Auto‑collapse after a period of inactivity (60 s) or after a successful save
  useEffect(() => {
    if (!expanded) return undefined;
    const timer = setTimeout(() => {
      setExpanded(false);
      if (onCollapse) onCollapse();
    }, 60000);
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

    // Add a small delay before attaching the listener to avoid catching the click that opened it
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [expanded, onCollapse, subscription._id]);

  // Simplified progress calculation - 3-field system
  const calculateProgress = useCallback(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Normalize today to midnight

    if (subscription.status === 'Inactive') {
      return { progress: 0, daysLeft: 0, label: 'Inactive', targetDate: null };
    }

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

    // No dates set
    if (!targetDate) {
      return { progress: 0, daysLeft: 0, label: 'No dates set', targetDate: null };
    }

    // Normalize target to midnight
    targetDate.setHours(0, 0, 0, 0);

    const diff = targetDate - now;
    const daysLeftRaw = Math.ceil(diff / (1000 * 60 * 60 * 24));

    // For display, we don't show negative days
    const daysLeft = Math.max(0, daysLeftRaw);

    // Progress based on 30-day window
    // 0 days = 100% (urgent), 30+ days = 0% (safe)
    const cappedDays = Math.min(Math.max(daysLeftRaw, 0), 30);
    const progress = ((30 - cappedDays) / 30) * 100;

    const formattedTargetDate = targetDate ? targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
    const displayLabel = targetDate ? `${daysLeft} days left (${formattedTargetDate})` : 'No dates set';

    return { progress, daysLeft, daysLeftRaw, label: displayLabel, targetDate };
  }, [subscription]);


  const { progress, daysLeft, label, targetDate } = calculateProgress();
  const hasDates = subscription.nextDueDate || subscription.lastPaidDate;
  const isOverdue = daysLeft <= 0 && subscription.status !== 'Inactive' && hasDates;

  // Determine status color based on progress
  // Only use blue (safe/approaching) and red (urgent/overdue)
  // Use grey for inactive or no dates
  let statusColor = '#A8C7FA'; // Blue (default/safe)
  if (subscription.status === 'Inactive' || !hasDates) {
    statusColor = '#8E918F'; // Grey for inactive/no dates
  } else if (progress > 70) {
    statusColor = '#F2B8B5'; // Red (urgent/overdue)
  }

  const { onPress, onRelease } = useButtonAnim();

  const buttonStyle = {
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: 'pointer',
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    setShowDeleteModal(false);
    onDelete(subscription._id);
  };

  const handleSave = (e) => {
    e.stopPropagation();
    // Optimistic update: Fire and forget
    onUpdate({ ...editForm, _id: subscription._id });

    // Animate modal close immediately
    setIsClosing(true);
    setTimeout(() => {
      setIsEditing(false);
      setIsClosing(false);
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



  const normalizeDate = (d) => d ? new Date(d).toISOString().split('T')[0] : '';

  const getTodayString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const hasChanges =
    editForm.name !== subscription.name ||
    editForm.status !== subscription.status ||
    String(editForm.recurringDays) !== String(subscription.recurringDays) ||
    normalizeDate(editForm.lastPaidDate) !== normalizeDate(subscription.lastPaidDate) ||
    normalizeDate(editForm.nextDueDate) !== normalizeDate(subscription.nextDueDate);

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
        <button
          onClick={handleDeleteClick}
          className={styles.removeButton}
          aria-label="Delete subscription"
          style={{ ...buttonStyle, position: 'absolute', top: '12px', right: '16px', display: 'none' }} // Hide in main view
          onMouseDown={onPress}
          onMouseUp={onRelease}
          onMouseLeave={onRelease}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 19C6 20.1 6.9 21 8 21H16C17.1 21 18 20.1 18 19V7H6V19ZM19 4H15.5L14.5 3H9.5L8.5 4H5V6H19V4Z" fill="currentColor" />
          </svg>
        </button>

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
          onMouseDown={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: "'Google Sans Flex', sans-serif", fontSize: '14px', color: '#C4C7C5' }}>Status:</span>
              <span style={{ fontFamily: "'Google Sans Flex', sans-serif", fontSize: '14px', fontWeight: '500', color: subscription.status === 'Inactive' ? '#F2B8B5' : '#C2E7FF' }}>{subscription.status || 'Active'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: "'Google Sans Flex', sans-serif", fontSize: '14px', color: '#C4C7C5' }}>Recurring Days:</span>
              <span style={{ fontFamily: "'Google Sans Flex', sans-serif", fontSize: '14px', fontWeight: '500' }}>{subscription.recurringDays ? `Every ${subscription.recurringDays} days` : '-'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: "'Google Sans Flex', sans-serif", fontSize: '14px', color: '#C4C7C5' }}>Last Paid:</span>
              <span style={{ fontFamily: "'Google Sans Flex', sans-serif", fontSize: '14px', fontWeight: '500' }}>{subscription.lastPaidDate ? new Date(subscription.lastPaidDate).toLocaleDateString() : '-'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: "'Google Sans Flex', sans-serif", fontSize: '14px', color: '#C4C7C5' }}>Next Due:</span>
              <span style={{ fontFamily: "'Google Sans Flex', sans-serif", fontSize: '14px', fontWeight: '500' }}>{subscription.nextDueDate ? new Date(subscription.nextDueDate).toLocaleDateString() : (subscription.lastPaidDate && subscription.recurringDays ? 'Auto-calculated' : '-')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
              <IconButton
                onClick={handleDeleteClick}
                title="Delete"
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 19C6 20.1 6.9 21 8 21H16C17.1 21 18 20.1 18 19V7H6V19ZM19 4H15.5L14.5 3H9.5L8.5 4H5V6H19V4Z" fill="currentColor" />
                  </svg>
                }
                bgColor="#3E3E3E"
                color="#F2B8B5"
                hoverBgColor="#4E4E4E"
                style={{ marginRight: 'auto' }}
              />
              <IconButton
                onClick={() => {
                  setIsEditing(true);
                  setExpanded(false);
                  if (onCollapse) onCollapse();
                }}
                title="Edit"
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 17.25V21H6.75L17.81 9.94L14.06 6.19L3 17.25ZM20.71 7.04C21.1 6.65 21.1 6.02 20.71 5.63L18.37 3.29C17.98 2.9 17.35 2.9 16.96 3.29L15.13 5.12L18.88 8.87L20.71 7.04Z" fill="currentColor" />
                  </svg>
                }
                bgColor="#3E3E3E"
                color="#A8C7FA"
                hoverBgColor="#4E4E4E"
              />
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
                  style={{ borderRadius: '12px', width: '100%', fontFamily: "'Google Sans Flex', sans-serif", fontSize: '16px', padding: '14px 16px', height: '48px', boxSizing: 'border-box', maxWidth: '100%', appearance: 'none', WebkitAppearance: 'none' }}
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="Subscription name"
                  disabled={isSaving}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Simplified 3-Field System */}

                {/* Last Paid Date */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontFamily: "'Google Sans Flex', sans-serif", fontSize: '12px', fontWeight: '500', color: '#C4C7C5', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Last Paid Date (Optional)</label>
                  <input
                    type="date"
                    max={getTodayString()}
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
                      maxWidth: '100%',
                      appearance: 'none',
                      WebkitAppearance: 'none',
                    }}
                    value={editForm.lastPaidDate ? new Date(editForm.lastPaidDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => setEditForm({ ...editForm, lastPaidDate: e.target.value, nextDueDate: editForm.nextDueDate ? '' : editForm.nextDueDate })}
                    onClick={(e) => e.target.showPicker && e.target.showPicker()}
                    disabled={isSaving || editForm.nextDueDate}
                  />
                  {editForm.nextDueDate && (
                    <span style={{ fontSize: '11px', color: '#8E918F', fontFamily: "'Google Sans Flex', sans-serif" }}>
                      Disabled when Next Due is set
                    </span>
                  )}
                </div>

                {/* Recurring Days */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontFamily: "'Google Sans Flex', sans-serif", fontSize: '12px', fontWeight: '500', color: '#C4C7C5', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Recurring Days (Optional)</label>
                  <input
                    type="number"
                    min="1"
                    className={styles.composerInput}
                    style={{ borderRadius: '12px', width: '100%', fontFamily: "'Google Sans Flex', sans-serif", fontSize: '16px', padding: '14px 16px', height: '48px', boxSizing: 'border-box', maxWidth: '100%', appearance: 'none', WebkitAppearance: 'none' }}
                    value={editForm.recurringDays || ''}
                    onChange={(e) => setEditForm({ ...editForm, recurringDays: e.target.value })}
                    placeholder="e.g. 30 for monthly"
                    disabled={isSaving || editForm.nextDueDate}
                  />
                  {editForm.nextDueDate && (
                    <span style={{ fontSize: '11px', color: '#8E918F', fontFamily: "'Google Sans Flex', sans-serif" }}>
                      Disabled when Next Due is set
                    </span>
                  )}
                </div>

                {/* OR Separator */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '4px 0' }}>
                  <div style={{ flex: 1, height: '1px', backgroundColor: '#3E3E3E' }}></div>
                  <span style={{ color: '#8E918F', fontSize: '12px', fontWeight: '500', fontFamily: "'Google Sans Flex', sans-serif" }}>OR</span>
                  <div style={{ flex: 1, height: '1px', backgroundColor: '#3E3E3E' }}></div>
                </div>

                {/* Next Due Date */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontFamily: "'Google Sans Flex', sans-serif", fontSize: '12px', fontWeight: '500', color: '#C4C7C5', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Next Due Date (Optional)</label>
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
                      maxWidth: '100%',
                      appearance: 'none',
                      WebkitAppearance: 'none',
                    }}
                    value={editForm.nextDueDate ? new Date(editForm.nextDueDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => {
                      // If setting Next Due, clear Last Paid
                      if (e.target.value) {
                        setEditForm({ ...editForm, nextDueDate: e.target.value, lastPaidDate: '', recurringDays: '' });
                      } else {
                        setEditForm({ ...editForm, nextDueDate: '' });
                      }
                    }}
                    onClick={(e) => e.target.showPicker && e.target.showPicker()}
                    disabled={isSaving}
                  />
                  <span style={{ fontSize: '11px', color: '#8E918F', fontFamily: "'Google Sans Flex', sans-serif" }}>
                    Setting this will clear Last Paid + Recurring Days
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontFamily: "'Google Sans Flex', sans-serif", fontSize: '12px', fontWeight: '500', color: '#C4C7C5', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</label>
                <CustomSelect
                  value={editForm.status || 'Active'}
                  onChange={(val) => setEditForm({ ...editForm, status: val })}
                  options={['Active', 'Inactive']}
                  disabled={isSaving}
                  renderValue={(val) => (
                    <span style={{ color: val === 'Inactive' ? '#F2B8B5' : '#C2E7FF' }}>
                      {val}
                    </span>
                  )}
                  renderOption={(option, isSelected) => (
                    <>
                      <span style={{
                        color: option === 'Inactive' ? '#F2B8B5' : '#C2E7FF',
                        fontWeight: isSelected ? '500' : '400'
                      }}>
                        {option}
                      </span>
                      {isSelected && (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" fill="#A8C7FA" />
                        </svg>
                      )}
                    </>
                  )}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <Button
                  variant="secondary"
                  onClick={handleCancel}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSave}
                  disabled={isSaving || !hasChanges}
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
              </div>


            </div>
          </div>
        </div>
      )
      }

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Subscription"
        actions={
          <>
            <ModalButton onClick={() => setShowDeleteModal(false)} variant="secondary">
              Cancel
            </ModalButton>
            <ModalButton onClick={handleConfirmDelete} variant="danger">
              Delete
            </ModalButton>
          </>
        }
      >
        <p style={{ color: '#C4C7C5', fontFamily: "'Google Sans Flex', sans-serif", fontSize: '16px', margin: 0 }}>
          Are you sure you want to delete <strong>{subscription.name}</strong>? This action cannot be undone.
        </p>
      </Modal>
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
    prevProps.subscription.recurrenceType === nextProps.subscription.recurrenceType &&
    prevProps.subscription.recurrenceValue === nextProps.subscription.recurrenceValue &&
    prevProps.isExpanded === nextProps.isExpanded &&
    prevProps.onDelete === nextProps.onDelete &&
    prevProps.onUpdate === nextProps.onUpdate &&
    prevProps.onExpand === nextProps.onExpand &&
    prevProps.onCollapse === nextProps.onCollapse
  );
});

export default MemoizedSubscriptionListItem;
