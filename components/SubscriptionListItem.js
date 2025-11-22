import React, { useState, useEffect, useCallback } from 'react';
import styles from '../styles/Home.module.css';
import ProgressBar from './ProgressBar';
import CustomSelect from './CustomSelect';
import RecurrenceSelect from './RecurrenceSelect';
import MonthSelect from './MonthSelect';
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
  const [editForm, setEditForm] = useState({ ...subscription, recurrenceType: subscription.recurrenceType || 'days', recurrenceValue: subscription.recurrenceValue || 30 });
  const [showDeleteModal, setShowDeleteModal] = useState(false); // New state for delete modal

  // Keep edit form in sync with prop changes
  useEffect(() => {
    setEditForm({ ...subscription, recurrenceType: subscription.recurrenceType || 'days', recurrenceValue: subscription.recurrenceValue || 30 });
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

  // Ensure elapsed days never go negative
  // Ensure elapsed days never go negative
  const calculateProgress = useCallback(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Normalize today to midnight

    let targetDate;
    if (subscription.status === 'Inactive') return { progress: 0, daysLeft: 0, label: 'Inactive', targetDate: null };

    if (subscription.nextDueDate) {
      targetDate = new Date(subscription.nextDueDate);
    } else if (subscription.lastPaidDate) {
      const lastPaid = new Date(subscription.lastPaidDate);
      targetDate = new Date(lastPaid);

      if (subscription.recurrenceType === 'monthly') {
        // Set to specific day of current month (relative to last paid)
        const dayOfMonth = parseInt(subscription.recurrenceValue) || 1;
        targetDate.setDate(dayOfMonth);

        // Handle month rollover (e.g. setting Feb 30 -> Mar 2)
        // We want to clamp to the last day of the month if needed
        if (targetDate.getDate() !== dayOfMonth) {
          targetDate.setDate(0);
        }

        // If the calculated date is before or same as last paid, move to next month
        if (targetDate <= lastPaid) {
          targetDate = new Date(lastPaid);
          targetDate.setMonth(targetDate.getMonth() + 1);
          targetDate.setDate(dayOfMonth);
          if (targetDate.getDate() !== dayOfMonth) {
            targetDate.setDate(0);
          }
        }
      } else if (subscription.recurrenceType === 'yearly') {
        // Set to specific date this year (relative to last paid)
        const [month, day] = String(subscription.recurrenceValue || '01-01').split('-').map(Number);
        targetDate.setMonth(month - 1);
        targetDate.setDate(day);

        // If the calculated date is before or same as last paid, move to next year
        if (targetDate <= lastPaid) {
          targetDate.setFullYear(targetDate.getFullYear() + 1);
        }
      } else if (subscription.recurrenceType === 'manual') {
        // Manual recurrence: If nextDueDate is not set (which is why we are here in the else-if block),
        // we should NOT auto-calculate anything based on lastPaidDate.
        return { progress: 0, daysLeft: 0, label: 'No due date', targetDate: null };
      } else {
        // Default 'days' logic
        const daysToAdd = parseInt(subscription.recurrenceValue) || 30;
        targetDate.setDate(lastPaid.getDate() + daysToAdd);
      }
    } else if (subscription.nextDueDate) {
      // Fallback if only next due date is present and not manual
      targetDate = new Date(subscription.nextDueDate);
    } else {
      return { progress: 0, daysLeft: 0, label: 'No dates set', targetDate: null };
    }

    // Normalize target to midnight
    targetDate.setHours(0, 0, 0, 0);

    const diff = targetDate - now;
    const daysLeftRaw = Math.ceil(diff / (1000 * 60 * 60 * 24));

    // For display, we don't show negative days
    const daysLeft = Math.max(0, daysLeftRaw);

    // NEW: Progress based on absolute days left, not percentage of cycle
    // Cap visualization at 30 days for consistency across all recurrence types
    // 0 days = 100% (urgent), 30+ days = 0% (safe)
    const cappedDays = Math.min(Math.max(daysLeftRaw, 0), 30);
    const progress = ((30 - cappedDays) / 30) * 100;

    const formattedTargetDate = targetDate ? targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
    const displayLabel = targetDate ? `${daysLeft} days left (${formattedTargetDate})` : label;

    return { progress, daysLeft, daysLeftRaw, label: displayLabel, targetDate };
  }, [subscription]);

  const getMaxDays = (month) => {
    if (!month) return 31;
    const m = parseInt(month);
    if (m === 2) return 29; // Allow 29 for leap years
    if ([4, 6, 9, 11].includes(m)) return 30;
    return 31;
  };

  const getRecurrenceLabel = () => {
    const type = subscription.recurrenceType || 'days';
    const value = subscription.recurrenceValue;

    switch (type) {
      case 'days':
        return `Every ${value || 30} Days`;
      case 'monthly':
        return `Monthly (${value || 1}${getOrdinalSuffix(value || 1)})`;
      case 'yearly':
        return `Yearly (${value || '01-01'})`;
      case 'manual':
        return 'Manual';
      default:
        return 'Every 30 Days';
    }
  };

  const getOrdinalSuffix = (i) => {
    const j = i % 10,
      k = i % 100;
    if (j === 1 && k !== 11) {
      return 'st';
    }
    if (j === 2 && k !== 12) {
      return 'nd';
    }
    if (j === 3 && k !== 13) {
      return 'rd';
    }
    return 'th';
  };

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
    editForm.recurrenceType !== subscription.recurrenceType ||
    String(editForm.recurrenceValue) !== String(subscription.recurrenceValue) ||
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
              <span style={{ fontFamily: "'Google Sans Flex', sans-serif", fontSize: '14px', color: '#C4C7C5' }}>Recurrence:</span>
              <span style={{ fontFamily: "'Google Sans Flex', sans-serif", fontSize: '14px', fontWeight: '500' }}>{getRecurrenceLabel()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: "'Google Sans Flex', sans-serif", fontSize: '14px', color: '#C4C7C5' }}>Last Paid:</span>
              <span style={{ fontFamily: "'Google Sans Flex', sans-serif", fontSize: '14px', fontWeight: '500' }}>{subscription.lastPaidDate ? new Date(subscription.lastPaidDate).toLocaleDateString() : '-'}</span>
            </div>
            {subscription.recurrenceType === 'manual' && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: "'Google Sans Flex', sans-serif", fontSize: '14px', color: '#C4C7C5' }}>Next Due:</span>
                <span style={{ fontFamily: "'Google Sans Flex', sans-serif", fontSize: '14px', fontWeight: '500' }}>{subscription.nextDueDate ? new Date(subscription.nextDueDate).toLocaleDateString() : '-'}</span>
              </div>
            )}
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
                {/* Recurrence Type */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontFamily: "'Google Sans Flex', sans-serif", fontSize: '12px', fontWeight: '500', color: '#C4C7C5', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Recurrence</label>
                  <RecurrenceSelect
                    value={editForm.recurrenceType}
                    onChange={(value) => {
                      let newValue = editForm.recurrenceValue;
                      if (value === 'days') newValue = 30;
                      else if (value === 'monthly') newValue = 1;
                      else if (value === 'yearly') newValue = '01-01';

                      setEditForm({ ...editForm, recurrenceType: value, recurrenceValue: newValue });
                    }}
                    disabled={isSaving}
                  />
                </div>

                {/* Dynamic Recurrence Value Input */}
                {editForm.recurrenceType === 'days' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontFamily: "'Google Sans Flex', sans-serif", fontSize: '12px', fontWeight: '500', color: '#C4C7C5', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Days Cycle</label>
                    <input
                      type="number"
                      min="1"
                      className={styles.composerInput}
                      style={{ borderRadius: '12px', width: '100%', fontFamily: "'Google Sans Flex', sans-serif", fontSize: '16px', padding: '14px 16px', height: '48px', boxSizing: 'border-box', maxWidth: '100%', appearance: 'none', WebkitAppearance: 'none' }}
                      value={editForm.recurrenceValue}
                      onChange={(e) => setEditForm({ ...editForm, recurrenceValue: e.target.value })}
                      placeholder="e.g. 30"
                      disabled={isSaving}
                    />
                  </div>
                )}

                {editForm.recurrenceType === 'monthly' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontFamily: "'Google Sans Flex', sans-serif", fontSize: '12px', fontWeight: '500', color: '#C4C7C5', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Day of Month</label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      className={styles.composerInput}
                      style={{ borderRadius: '12px', width: '100%', fontFamily: "'Google Sans Flex', sans-serif", fontSize: '16px', padding: '14px 16px', height: '48px', boxSizing: 'border-box', maxWidth: '100%', appearance: 'none', WebkitAppearance: 'none' }}
                      value={editForm.recurrenceValue}
                      onChange={(e) => {
                        let val = parseInt(e.target.value);
                        if (val > 31) val = 31;
                        if (val < 1) val = 1;
                        setEditForm({ ...editForm, recurrenceValue: val });
                      }}
                      placeholder="e.g. 15"
                      disabled={isSaving}
                    />
                  </div>
                )}

                {editForm.recurrenceType === 'yearly' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontFamily: "'Google Sans Flex', sans-serif", fontSize: '12px', fontWeight: '500', color: '#C4C7C5', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date</label>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <div style={{ flex: 2 }}>
                        <MonthSelect
                          value={String(editForm.recurrenceValue || '01-01').split('-')[0]}
                          onChange={(newMonth) => {
                            const currentDay = parseInt(String(editForm.recurrenceValue || '01-01').split('-')[1]);
                            const maxDays = getMaxDays(newMonth);
                            const newDay = currentDay > maxDays ? maxDays : currentDay;
                            setEditForm({ ...editForm, recurrenceValue: `${newMonth}-${String(newDay).padStart(2, '0')}` });
                          }}
                          disabled={isSaving}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <input
                          type="number"
                          min="1"
                          max={getMaxDays(String(editForm.recurrenceValue || '01-01').split('-')[0])}
                          className={styles.composerInput}
                          style={{ borderRadius: '12px', width: '100%', fontFamily: "'Google Sans Flex', sans-serif", fontSize: '16px', padding: '14px 16px', height: '48px', boxSizing: 'border-box', maxWidth: '100%', appearance: 'none', WebkitAppearance: 'none' }}
                          value={parseInt(String(editForm.recurrenceValue || '01-01').split('-')[1])}
                          onChange={(e) => {
                            const currentMonth = String(editForm.recurrenceValue || '01-01').split('-')[0];
                            let val = parseInt(e.target.value);
                            if (isNaN(val)) {
                              setEditForm({ ...editForm, recurrenceValue: `${currentMonth}-01` }); // Reset to 01 if cleared
                              return;
                            }
                            const max = getMaxDays(currentMonth);
                            if (val > max) val = max;
                            if (val < 1) val = 1;
                            const newDay = String(val).padStart(2, '0');
                            setEditForm({ ...editForm, recurrenceValue: `${currentMonth}-${newDay}` });
                          }}
                          placeholder="Day"
                          disabled={isSaving}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontFamily: "'Google Sans Flex', sans-serif", fontSize: '12px', fontWeight: '500', color: '#C4C7C5', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Last Paid</label>
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
                    onChange={(e) => setEditForm({ ...editForm, lastPaidDate: e.target.value })}
                    onClick={(e) => e.target.showPicker && e.target.showPicker()}
                    disabled={isSaving}
                  />
                </div>

                {editForm.recurrenceType === 'manual' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontFamily: "'Google Sans Flex', sans-serif", fontSize: '12px', fontWeight: '500', color: '#C4C7C5', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Next Due</label>
                    <input
                      type="date"
                      min={getTodayString()}
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
                      onChange={(e) => setEditForm({ ...editForm, nextDueDate: e.target.value })}
                      onClick={(e) => e.target.showPicker && e.target.showPicker()}
                      disabled={isSaving}
                    />
                  </div>
                )}
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
