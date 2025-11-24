import React, { useMemo } from 'react';
import React, { useMemo } from 'react';
import Modal from './Modal';
import Button from './Button';
import { COLORS } from '../lib/colors';
import useHaptics from '../lib/useHaptics';

const SummaryModal = ({ isOpen, onClose, subscriptions }) => {
    const { triggerHaptic } = useHaptics();

    const timelineData = useMemo(() => {
        const total = subscriptions.length;
        const dates = {};

        // Group subscriptions by their next due date
        subscriptions.forEach(sub => {
            if (sub.nextDueDate) {
                const date = new Date(sub.nextDueDate);
                const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
                dates[dateStr] = (dates[dateStr] || 0) + 1;
            }
        });

        // Sort dates and get next 30 days worth
        const sortedDates = Object.entries(dates)
            .sort((a, b) => new Date(a[0]) - new Date(b[0]))
            .slice(0, 10); // Show max 10 dates

        return { total, sortedDates };
    }, [subscriptions]);

    const maxCount = Math.max(...timelineData.sortedDates.map(([_, count]) => count), 1);

    const handleClose = () => {
        triggerHaptic('medium');
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Upcoming Renewals">
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '24px',
                padding: '8px 0'
            }}>
                {/* Total Count */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    padding: '16px',
                    background: COLORS.surfaceVariant,
                    borderRadius: '16px'
                }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '32px', fontWeight: 'bold', color: COLORS.primary }}>{timelineData.total}</div>
                        <div style={{ fontSize: '13px', color: COLORS.textSecondary, marginTop: '4px' }}>Active Subscriptions</div>
                    </div>
                </div>

                {/* Timeline Graph */}
                {timelineData.sortedDates && timelineData.sortedDates.length > 0 ? (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        padding: '16px',
                        background: COLORS.surface,
                        borderRadius: '16px'
                    }}>
                        <div style={{ fontSize: '14px', fontWeight: '500', color: COLORS.textPrimary, marginBottom: '8px' }}>
                            Renewals Timeline
                        </div>

                        {/* Bar Chart */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'flex-end',
                            gap: '8px',
                            height: '120px',
                            padding: '0 4px'
                        }}>
                            {timelineData.sortedDates.map(([dateStr, count], i) => {
                                const date = new Date(dateStr);
                                const height = (count / maxCount) * 100;
                                const isToday = dateStr === new Date().toISOString().split('T')[0];

                                return (
                                    <div key={i} style={{
                                        flex: 1,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}>
                                        {/* Bar */}
                                        <div style={{
                                            width: '100%',
                                            height: '100%',
                                            display: 'flex',
                                            alignItems: 'flex-end',
                                            justifyContent: 'center'
                                        }}>
                                            <div style={{
                                                width: '100%',
                                                maxWidth: '32px',
                                                height: `${height}%`,
                                                minHeight: '8px',
                                                backgroundColor: isToday ? COLORS.destructive : COLORS.primary,
                                                borderRadius: '8px 8px 4px 4px',
                                                position: 'relative',
                                                transition: 'all 0.3s ease'
                                            }}>
                                                {/* Count badge */}
                                                <div style={{
                                                    position: 'absolute',
                                                    top: '-24px',
                                                    left: '50%',
                                                    transform: 'translateX(-50%)',
                                                    fontSize: '11px',
                                                    fontWeight: '600',
                                                    color: COLORS.textPrimary,
                                                    background: COLORS.surfaceVariant,
                                                    padding: '2px 6px',
                                                    borderRadius: '8px',
                                                    whiteSpace: 'nowrap'
                                                }}>
                                                    {count}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Date Label */}
                                        <div style={{
                                            fontSize: '10px',
                                            color: isToday ? COLORS.destructive : COLORS.textSecondary,
                                            textAlign: 'center',
                                            fontWeight: isToday ? '600' : '400',
                                            marginTop: '4px'
                                        }}>
                                            {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <div style={{
                        textAlign: 'center',
                        padding: '32px',
                        color: COLORS.textSecondary,
                        background: COLORS.surface,
                        borderRadius: '16px'
                    }}>
                        No upcoming renewals. Click OK to start adding!
                    </div>
                )}

                {/* OK Button */}
                <Button
                    onClick={handleClose}
                    variant="primary"
                    style={{ width: '100%', height: '48px', marginTop: '8px' }}
                >
                    OK
                </Button>
            </div>
        </Modal>
    );
};

export default SummaryModal;
