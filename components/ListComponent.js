import React, { useState, useCallback } from 'react';
import styles from '../styles/Home.module.css';
import ListItemComponent from './ListItemComponent';

const ListComponent = React.memo(({ subscriptions, onDelete, onUpdate }) => {
    const [expandedId, setExpandedId] = useState(null);

    // Auto-scroll to new subscription (without expanding)
    React.useEffect(() => {
        if (!subscriptions) return;
        const newSub = subscriptions.find(s => s.isNew);
        if (newSub) {
            // Small timeout to allow render
            setTimeout(() => {
                const element = document.querySelector(`[data-subscription-id="${newSub._id}"]`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 100);
        }

        // Auto-expand restored subscription
        // Check if shouldExpand is a recent timestamp (within last 2 seconds)
        const restoredSub = subscriptions.find(s => s.shouldExpand && (Date.now() - s.shouldExpand < 2000));
        if (restoredSub) {
            setExpandedId(restoredSub.localId || restoredSub._id);
        }
    }, [subscriptions]);

    const handleExpand = useCallback((id) => {
        setExpandedId(id);
    }, []);

    const handleCollapse = useCallback(() => {
        setExpandedId(null);
    }, []);

    if (!subscriptions || subscriptions.length === 0) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
                width: '100%',
                color: '#666',
                padding: '20px'
            }}>
                <p style={{ margin: 0, textAlign: 'center' }}>No subscriptions yet. Add one below!</p>
            </div>
        );
    }

    // Ultra-simple helper - only Next Due Date
    const getDaysLeft = (subscription) => {
        if (!subscription.nextDueDate) return 9999; // No date set - bottom

        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const targetDate = new Date(subscription.nextDueDate);
        targetDate.setHours(0, 0, 0, 0);

        const diff = targetDate - now;
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    };

    const sortedSubscriptions = [...subscriptions].sort((a, b) => {
        const daysLeftA = getDaysLeft(a);
        const daysLeftB = getDaysLeft(b);
        return daysLeftA - daysLeftB; // Ascending order (fewer days = higher priority)
    });

    return (
        <ul className={styles.subscriptionsContainer} style={{ listStyle: 'none', margin: 0, width: '100%' }}>
            {sortedSubscriptions.map((s) => {
                const stableId = s.localId || s._id;
                return (
                    <ListItemComponent
                        key={stableId}
                        subscription={s}
                        onDelete={onDelete}
                        onUpdate={onUpdate}
                        isExpanded={expandedId === stableId}
                        onExpand={() => handleExpand(stableId)}
                        onCollapse={handleCollapse}
                    />
                );
            })}
        </ul>
    );
}, (prevProps, nextProps) => {
    // Only re-render if subscriptions array, onDelete, or onUpdate have changed
    return (
        prevProps.subscriptions === nextProps.subscriptions &&
        prevProps.onDelete === nextProps.onDelete &&
        prevProps.onUpdate === nextProps.onUpdate
    );
});

ListComponent.displayName = 'ListComponent';

export default ListComponent;
