import React, { useState, useEffect, useCallback } from 'react';
import styles from '../styles/Home.module.css';
import SubscriptionForm from './SubscriptionForm';
import { COLORS } from '../lib/colors';

const ListItemComponent = ({ subscription, onDelete, onUpdate, isExpanded, onExpand, onCollapse }) => {
    const [expanded, setExpanded] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isFullyExpanded, setIsFullyExpanded] = useState(false);
    const [hasEntered, setHasEntered] = useState(false);

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

    const { progress, label } = calculateProgress();
    const hasDueDate = subscription.nextDueDate;
    const statusColor = progress > 70 ? COLORS.destructive : (hasDueDate ? COLORS.primary : COLORS.neutral);

    return (
        <li
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
                        padding: '4px 0',
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
                                display: 'block'
                            }}>
                                {subscription.name || 'New Subscription'}
                            </span>
                            {/* Cost Subtitle */}
                            {subscription.cost > 0 && (
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
                        paddingTop: '8px', // Add some padding when expanded
                        paddingBottom: '4px', // Ensure bottom content isn't cut off
                        overflow: isFullyExpanded ? 'visible' : 'hidden' // Allow dropdowns to overflow when fully expanded
                    }}>
                        <SubscriptionForm
                            initialName={subscription.name}
                            initialDate={subscription.nextDueDate ? new Date(subscription.nextDueDate).toISOString().split('T')[0] : ''}
                            initialCost={subscription.cost}
                            initialCurrency={subscription.currency}
                            initialCycle={subscription.billingCycle}
                            initialCustomDays={subscription.customDays}
                            initialCategory={subscription.category}
                            initialNotes={subscription.notes}
                            onSave={handleSave}
                            onCancel={handleCancel}
                            showDelete={true}
                            onDelete={handleDeleteClick}
                        />
                    </div>
                </div>
            </div>
        </li>
    );
};

export default React.memo(ListItemComponent);
