import React, { useState, useEffect, useCallback } from 'react';
import styles from '../styles/Home.module.css';
import SubscriptionForm from './SubscriptionForm';
import MarkPaidModal from './MarkPaidModal';
import { COLORS } from '../lib/colors';
import useHaptics from '../lib/useHaptics';
import { motion } from 'framer-motion';

const SubscriptionListItem = ({ subscription, onDelete, onUpdate, isExpanded, onExpand, onCollapse, onMarkPaidModalOpen, onMarkPaidModalClose }) => {
  const { triggerHaptic } = useHaptics();
  const [expanded, setExpanded] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFullyExpanded, setIsFullyExpanded] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);
  const [showMarkPaidModal, setShowMarkPaidModal] = useState(false);


  // Handle entry animation cleanup
  useEffect(() => {
    if (subscription.isNew && !hasEntered) {
      const timer = setTimeout(() => {
        setHasEntered(true);
      }, 500); // Match animation duration + buffer
      return () => clearTimeout(timer);
    }
  }, [subscription.isNew, hasEntered]);

  // Sync expanded state
  useEffect(() => {
    setExpanded(isExpanded);
    if (isExpanded) {
      // Wait for animation to finish before allowing overflow
      const timer = setTimeout(() => setIsFullyExpanded(true), 300);
      return () => clearTimeout(timer);
    } else {
      setIsFullyExpanded(false);
    }
  }, [isExpanded]);

  // Collapse on outside click
  useEffect(() => {
    if (!expanded) return;

    const handleClickOutside = (e) => {
      if (!e.target.closest(`[data-subscription-id="${subscription._id}"]`)) {
        handleCancel();
      }
    };

    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [expanded, subscription._id]);

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

  const handleSave = async (data) => {
    const updatedSubscription = {
      ...subscription,
      ...data,
      nextDueDate: data.date || null
    };

    handleCancel();

    try {
      await onUpdate(updatedSubscription);
    } catch (error) {
      console.error('Failed to update:', error);
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
      triggerHaptic('light');
      setExpanded(true);
      if (onExpand) onExpand(subscription._id);
    }
  };

  const handleDeleteClick = async () => {
    setIsDeleting(true);
    setTimeout(async () => {
      try {
        await onDelete(subscription._id);
      } catch (error) {
        console.error('Failed to delete:', error);
        setIsDeleting(false);
      }
    }, 300);
  };

  const calculateNextDate = (baseDate, cycle, cDays, cMonths) => {
    const nextDate = new Date(baseDate);
    switch (cycle) {
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case 'yearly':
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 'daily':
        nextDate.setDate(nextDate.getDate() + 1);
        break;
      case 'custom':
        if (cDays) {
          nextDate.setDate(nextDate.getDate() + parseInt(cDays));
        }
        break;
      case 'monthly_custom':
        if (cMonths) {
          nextDate.setMonth(nextDate.getMonth() + parseInt(cMonths));
        }
        break;
      default:
        nextDate.setMonth(nextDate.getMonth() + 1);
    }
    return nextDate;
  };

  const handleMarkPaid = async ({ strategy, resetDate }) => {
    triggerHaptic('success');
    setShowMarkPaidModal(false);
    if (onMarkPaidModalClose) onMarkPaidModalClose();

    if (!subscription.nextDueDate) return;

    let nextDate;
    const currentDueDate = new Date(subscription.nextDueDate);

    if (strategy === 'keep') {
      nextDate = calculateNextDate(
        currentDueDate,
        subscription.billingCycle,
        subscription.customDays,
        subscription.customMonths
      ).toISOString();
    } else {
      // Reset cycle based on the provided resetDate (default today)
      const baseDate = new Date(resetDate);
      nextDate = calculateNextDate(
        baseDate,
        subscription.billingCycle,
        subscription.customDays,
        subscription.customMonths
      ).toISOString();
    }

    // Calculate the date being marked as paid
    const paidDate = strategy === 'keep'
      ? (subscription.nextDueDate ? new Date(subscription.nextDueDate).toISOString() : new Date().toISOString())
      : new Date(resetDate).toISOString();

    // Create history entry
    const historyEntry = {
      date: paidDate,
      cost: subscription.cost
    };

    // Update subscription with new date and history
    const updatedSubscription = {
      ...subscription,
      nextDueDate: nextDate,
      paymentHistory: [...(subscription.paymentHistory || []), historyEntry]
    };

    // Collapse the item before update
    handleCancel();

    // Optimistic update
    try {
      await onUpdate(updatedSubscription);
    } catch (error) {
      console.error('Failed to mark paid:', error);
    }
  };

  const { progress, label } = calculateProgress();
  const hasDueDate = subscription.nextDueDate;
  const statusColor = progress > 70 ? COLORS.destructive : (hasDueDate ? COLORS.primary : COLORS.neutral);

  const itemRef = React.useRef(null);

  // Scroll haptics - IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Trigger haptic on any intersection change (enter/exit)
          // Only if not expanded
          if (!expanded) {
            triggerHaptic('ultra-light');
          }
        });
      },
      {
        // Offset top by approx header height (assuming ~60px) to feel like it's passing under
        rootMargin: '-60px 0px 0px 0px',
        threshold: 0
      }
    );

    if (itemRef.current) {
      observer.observe(itemRef.current);
    }

    return () => observer.disconnect();
  }, [triggerHaptic, expanded]);

  return (
    <motion.li
      layout // Enable layout animations for reordering
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
      transition={{ layout: { type: "spring", stiffness: 300, damping: 30 } }}
      ref={itemRef}
      data-subscription-id={subscription._id}
      className={`${styles.subscriptionItem} ${subscription.isNew && !hasEntered ? styles.itemEnter : ''} ${isDeleting ? styles.itemExit : ''}`}
      onClick={handleToggleExpand}
      style={{
        flexDirection: 'column',
        alignItems: 'stretch',
        cursor: 'pointer',
        overflow: isFullyExpanded ? 'visible' : 'hidden', // Allow dropdowns to spill out when fully expanded
        zIndex: isFullyExpanded ? 10 : 1 // Bring to front when expanded so dropdowns go over other items
      }}
    >
      {/* Collapsed View Wrapper */}
      <div
        className={`${styles.expandableWrapper} ${!expanded ? styles.open : ''}`}
      >
        <div className={styles.expandableInner}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '20px',
            width: '100%',
            padding: 'var(--padding-collapsed)',
            opacity: !expanded ? 1 : 0,
            transition: 'opacity 0.2s ease',
            pointerEvents: !expanded ? 'auto' : 'none'
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
                display: 'block',
                opacity: subscription.active === false ? 0.6 : 1, // Dim if inactive
                textDecoration: subscription.active === false ? 'line-through' : 'none' // Optional: strike-through
              }}>
                {subscription.name || 'New Subscription'}
              </span>
              {/* Cost Subtitle - Only if active */}
              {subscription.active !== false && subscription.cost > 0 && (
                <span style={{
                  fontFamily: "'Google Sans Flex', sans-serif",
                  fontSize: '13px',
                  color: COLORS.textSecondary,
                  display: 'block',
                  marginTop: '4px',
                  fontWeight: '400'
                }}>
                  {subscription.currency} {subscription.cost} / {subscription.billingCycle === 'custom' ? `Every ${subscription.customDays} days` : subscription.billingCycle}
                </span>
              )}
            </div>

            {/* Right Side: Days Left or Inactive Label */}
            <div style={{ flexShrink: 0 }}>
              {subscription.active === false ? (
                <span style={{
                  fontFamily: "'Google Sans Flex', sans-serif",
                  fontSize: '13px',
                  color: COLORS.textSecondary,
                  fontWeight: '500',
                  padding: '4px 8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  opacity: 0.8
                }}>
                  Inactive
                </span>
              ) : (
                <span style={{
                  fontFamily: "'Google Sans Flex', sans-serif",
                  fontSize: '13px',
                  color: statusColor === COLORS.destructive ? COLORS.destructive : COLORS.textPrimary,
                  whiteSpace: 'nowrap'
                }}>
                  {label}
                </span>
              )}
            </div>
          </div>


        </div>
      </div>

      {/* Expanded View Wrapper */}
      <div
        className={`${styles.expandableWrapper} ${expanded ? styles.open : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.expandableInner} style={{ overflow: isFullyExpanded ? 'visible' : 'hidden' }}>
          <div style={{
            opacity: expanded ? 1 : 0,
            transition: 'opacity 0.3s ease 0.1s', // Slight delay for opacity
            overflow: isFullyExpanded ? 'visible' : 'hidden' // Allow dropdowns to overflow when fully expanded
          }}>



            <div style={{
              padding: 'var(--padding-expanded)'
            }}>
              <SubscriptionForm
                initialName={subscription.name}
                initialDate={subscription.nextDueDate ? new Date(subscription.nextDueDate).toISOString().split('T')[0] : ''}
                initialCost={subscription.cost}
                initialCurrency={subscription.currency}
                initialCycle={subscription.billingCycle}
                initialCustomDays={subscription.customDays}
                initialCustomMonths={subscription.customMonths}
                initialCategory={subscription.category}
                initialNotes={subscription.notes}
                onSubmit={handleSave}
                onCancel={handleCancel}
                showDelete={true}
                isActive={subscription.active !== false}
                onDelete={handleDeleteClick}
                onStop={async () => {
                  // Toggle active state
                  const newActiveState = subscription.active === false ? true : false;
                  const updatedSubscription = {
                    ...subscription,
                    active: newActiveState
                  };
                  handleCancel(); // Collapse
                  try {
                    await onUpdate(updatedSubscription);
                  } catch (error) {
                    console.error('Failed to update active state:', error);
                  }
                }}
                showMarkPaid={hasDueDate}
                onMarkPaid={(e) => {
                  e.stopPropagation();
                  setShowMarkPaidModal(true);
                  if (onMarkPaidModalOpen) onMarkPaidModalOpen();
                }}
                paymentHistory={subscription.paymentHistory}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mark Paid Modal */}
      <MarkPaidModal
        isOpen={showMarkPaidModal}
        onClose={() => {
          setShowMarkPaidModal(false);
          if (onMarkPaidModalClose) onMarkPaidModalClose();
        }}
        onConfirm={handleMarkPaid}
        subscription={subscription}
      />
    </motion.li>
  );
};

export default React.memo(SubscriptionListItem);

