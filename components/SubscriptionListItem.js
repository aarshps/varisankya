import React, { useState, useEffect, useCallback } from 'react';
import styles from '../styles/Home.module.css';
import ProgressBar from './ProgressBar';
import StatusSelect from './StatusSelect';
import RecurrenceSelect from './RecurrenceSelect';
import MonthSelect from './MonthSelect';
import Modal, { ModalButton } from './Modal';

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

    // Calculate total cycle length for progress
    let total = 30;
    if (subscription.recurrenceType === 'days') {
      total = parseInt(subscription.recurrenceValue) || 30;
    } else if (subscription.recurrenceType === 'monthly') {
      total = 30; // Approx
    } else if (subscription.recurrenceType === 'yearly') {
      total = 365;
    }

    const elapsed = total - daysLeftRaw;

    // Calculate progress
    // If daysLeftRaw > total (e.g. due in 2 months), elapsed is negative -> progress 0%
    // If daysLeftRaw < 0 (overdue), elapsed > total -> progress 100%
    const progress = Math.max(0, Math.min(100, (elapsed / total) * 100));

    return { progress, daysLeft, label: `${daysLeft} days left` };
    return { progress, daysLeft, label: `${daysLeft} days left`, targetDate };
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
  let statusColor = '#81C995'; // Green (default/safe)
  if (progress > 85) statusColor = '#F2B8B5'; // Red (danger/overdue)
  else if (progress > 50) statusColor = '#A8C7FA'; // Blue (warning/approaching)

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

  const handlePaid = (e) => {
    e.stopPropagation();
    const now = new Date();
    const nowISO = now.toISOString();

    // Check for early payment
    let nextDueDate = null;

    // If targetDate is in the future (and valid), we are paying early!
    if (targetDate && targetDate > now) {
      // Calculate the NEXT cycle after the current target date
      const nextCycle = new Date(targetDate);

      if (subscription.recurrenceType === 'monthly') {
        nextCycle.setMonth(nextCycle.getMonth() + 1);
        // Handle rollover
        const dayOfMonth = parseInt(subscription.recurrenceValue) || 1;
        if (nextCycle.getDate() !== dayOfMonth) {
          nextCycle.setDate(0); // Clamp to end of month
        }
      } else if (subscription.recurrenceType === 'yearly') {
        nextCycle.setFullYear(nextCycle.getFullYear() + 1);
      } else if (subscription.recurrenceType === 'days') {
        const daysToAdd = parseInt(subscription.recurrenceValue) || 30;
        nextCycle.setDate(nextCycle.getDate() + daysToAdd);
      }

      nextDueDate = nextCycle.toISOString();
    }

    // Optimistic update
    // Optimistic update
    onUpdate({ ...subscription, lastPaidDate: nowISO, nextDueDate: nextDueDate });
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
          <div style={{ flex: 1, paddingLeft: '12px', paddingRight: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: "'Google Sans Flex', sans-serif", fontSize: '16px', fontWeight: '500' }}>{subscription.name}</span>
              <span style={{ fontFamily: "'Google Sans Flex', sans-serif", fontSize: '12px', color: '#C4C7C5' }}>{label}</span>
            </div>
            <ProgressBar
              progress={progress}
              color={
                progress > 85 ? '#F2B8B5' : // Red
                  progress > 50 ? '#A8C7FA' : // Blue
                    '#81C995'                   // Green
              }
            />
          </div>
          <button
            onClick={handleDeleteClick}
            className={styles.removeButton}
            aria-label="Delete subscription"
            style={{ ...buttonStyle, paddingRight: '10px' }}
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
              <button
                onClick={handlePaid}
                disabled={!hasDates}
                style={{
                  padding: '8px 24px',
                  borderRadius: '20px',
                  border: 'none',
                  background: !hasDates ? '#444746' : '#206C45',
                  color: !hasDates ? '#8E918F' : '#E3E3E3',
                  fontFamily: "'Google Sans Flex', sans-serif",
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: !hasDates ? 'not-allowed' : 'pointer',
                  ...buttonStyle,
                }}
                onMouseDown={hasDates ? onPress : undefined}
                onMouseUp={hasDates ? onRelease : undefined}
                onMouseLeave={hasDates ? onRelease : undefined}
                onMouseOver={(e) => hasDates && (e.currentTarget.style.background = '#2B8A5A')}
                onMouseOut={(e) => hasDates && (e.currentTarget.style.background = '#206C45')}
              >
                Paid
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
                  disabled={isSaving || !hasChanges}
                  style={{
                    padding: '12px 32px',
                    borderRadius: '24px',
                    border: 'none',
                    background: isSaving || !hasChanges ? '#444746' : '#A8C7FA',
                    color: isSaving || !hasChanges ? '#8E918F' : '#003355',
                    fontWeight: '500',
                    cursor: isSaving || !hasChanges ? 'not-allowed' : 'pointer',
                    fontFamily: "'Google Sans Flex', sans-serif",
                    fontSize: '15px',
                    transition: 'background-color 0.2s, transform 0.1s',
                    boxShadow: isSaving || !hasChanges ? 'none' : '0 2px 8px rgba(168, 199, 250, 0.4)',
                  }}
                  onMouseDown={!isSaving && hasChanges ? onPress : undefined}
                  onMouseUp={!isSaving && hasChanges ? onRelease : undefined}
                  onMouseLeave={!isSaving && hasChanges ? onRelease : undefined}
                  onMouseOver={(e) => !isSaving && hasChanges && (e.currentTarget.style.background = '#C2E7FF')}
                  onMouseOut={(e) => !isSaving && hasChanges && (e.currentTarget.style.background = '#A8C7FA')}
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
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
