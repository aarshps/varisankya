import React, { useMemo } from 'react';
import Modal from './Modal';
import Button from './Button';
import { COLORS } from '../lib/colors';
import useHaptics from '../lib/useHaptics';

const SummaryModal = ({ isOpen, onClose, subscriptions }) => {
    const { triggerHaptic } = useHaptics();

    const summaryData = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const activeSubs = subscriptions.filter(s => s.active !== false);
        const urgent = []; // Overdue or expiring in 7 days
        const upcoming = []; // 8-30 days
        let noDueDateCount = 0;

        activeSubs.forEach(sub => {
            if (!sub.nextDueDate) {
                noDueDateCount++;
                return;
            }

            const dueDate = new Date(sub.nextDueDate);
            dueDate.setHours(0, 0, 0, 0);
            const daysUntil = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

            if (daysUntil <= 7) {
                urgent.push({ ...sub, daysUntil });
            } else if (daysUntil <= 30) {
                upcoming.push({ ...sub, daysUntil });
            }
        });

        return {
            activeCount: activeSubs.length,
            urgent: urgent.sort((a, b) => a.daysUntil - b.daysUntil),
            upcoming: upcoming.sort((a, b) => a.daysUntil - b.daysUntil),
            noDueDateCount
        };
    }, [subscriptions]);

    const handleClose = () => {
        triggerHaptic('medium');
        onClose();
    };

    const StatusCard = ({ title, items, color, emptyText }) => (
        <div style={{
            background: COLORS.surface,
            borderRadius: '24px',
            padding: '16px',
            border: `1px solid ${color}20`
        }}>
            <div style={{
                fontSize: '13px',
                fontWeight: '600',
                color: color,
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
            }}>
                <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: color
                }} />
                {title} ({items.length})
            </div>
            {items.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {items.slice(0, 3).map((item, i) => (
                        <div key={i} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: '12px',
                            color: COLORS.textSecondary,
                            padding: '8px 12px',
                            background: COLORS.surfaceVariant,
                            borderRadius: '24px'
                        }}>
                            <span style={{ fontWeight: '500', color: COLORS.textPrimary }}>{item.name}</span>
                            <span style={{ color: color, fontWeight: '600' }}>
                                {item.daysUntil === 0 ? 'Today' :
                                    item.daysUntil < 0 ? `${Math.abs(item.daysUntil)}d ago` :
                                        `${item.daysUntil}d`}
                            </span>
                        </div>
                    ))}
                    {items.length > 3 && (
                        <div style={{
                            fontSize: '11px',
                            color: COLORS.textSecondary,
                            textAlign: 'center',
                            marginTop: '2px'
                        }}>
                            +{items.length - 3} more
                        </div>
                    )}
                </div>
            ) : (
                <div style={{
                    fontSize: '11px',
                    color: COLORS.textSecondary,
                    textAlign: 'center',
                    padding: '8px'
                }}>
                    {emptyText}
                </div>
            )}
        </div>
    );

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Subscription Overview">
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                padding: '0'
            }}>
                {/* Quick Stats */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '12px'
                }}>
                    <div style={{
                        padding: '16px',
                        background: COLORS.surfaceVariant,
                        borderRadius: '24px',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: COLORS.primary }}>
                            {summaryData.activeCount}
                        </div>
                        <div style={{ fontSize: '11px', color: COLORS.textSecondary, marginTop: '2px' }}>
                            Active
                        </div>
                    </div>
                    <div style={{
                        padding: '16px',
                        background: COLORS.surfaceVariant,
                        borderRadius: '24px',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: COLORS.textSecondary }}>
                            {summaryData.noDueDateCount}
                        </div>
                        <div style={{ fontSize: '11px', color: COLORS.textSecondary, marginTop: '2px' }}>
                            No Due Date
                        </div>
                    </div>
                </div>

                {/* Status Cards */}
                <StatusCard
                    title="Urgent (Overdue or ≤7 days)"
                    items={summaryData.urgent}
                    color={COLORS.destructive}
                    emptyText="Nothing urgent!"
                />

                <StatusCard
                    title="Upcoming (8-30 days)"
                    items={summaryData.upcoming}
                    color={COLORS.primary}
                    emptyText="Nothing in next month"
                />

                {/* OK Button */}
                <div style={{
                    marginTop: '16px',
                    marginRight: '-24px',
                    marginBottom: '-24px',
                    marginLeft: '-24px',
                    padding: '16px 24px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderBottomLeftRadius: '32px',
                    borderBottomRightRadius: '32px',
                    borderTopLeftRadius: '32px',
                    borderTopRightRadius: '32px'
                }}>
                    <Button
                        onClick={handleClose}
                        variant="primary"
                        style={{ width: '100%', height: '48px' }}
                    >
                        Got It
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default SummaryModal;
