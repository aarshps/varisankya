import React, { useState } from 'react';
import Modal from './Modal';
import Button from './Button';
import DatePickerComponent from './DatePickerComponent';
import { COLORS } from '../lib/colors';
import useHaptics from '../lib/useHaptics';

const MarkPaidModal = ({ isOpen, onClose, onConfirm, subscription, paymentHistory }) => {
    const [strategy, setStrategy] = useState('keep');
    const [resetDate, setResetDate] = useState(new Date().toISOString().split('T')[0]);
    const { triggerHaptic } = useHaptics();

    const handleConfirm = () => {
        triggerHaptic('success');
        onConfirm({ strategy, resetDate });
        // Reset state for next time
        setStrategy('keep');
        setResetDate(new Date().toISOString().split('T')[0]);
    };

    const handleClose = () => {
        triggerHaptic('light');
        // Reset state when closing
        setStrategy('keep');
        setResetDate(new Date().toISOString().split('T')[0]);
        onClose();
    };

    const handleStrategyChange = (newStrategy) => {
        if (strategy !== newStrategy) {
            triggerHaptic('selection');
            setStrategy(newStrategy);
        }
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

    const formatDate = (date) => {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    // Calculate Keep Date
    const keepDate = subscription.nextDueDate ? calculateNextDate(
        new Date(subscription.nextDueDate),
        subscription.billingCycle,
        subscription.customDays,
        subscription.customMonths
    ) : null;

    // Calculate Reset Date
    const calculatedResetDate = calculateNextDate(
        new Date(resetDate),
        subscription.billingCycle,
        subscription.customDays,
        subscription.customMonths
    );

    const activeDate = strategy === 'keep' ? keepDate : calculatedResetDate;

    // Calculate extended forecast
    const paidDate = strategy === 'keep'
        ? (subscription.nextDueDate ? new Date(subscription.nextDueDate) : new Date())
        : new Date(resetDate);

    const followingDate = activeDate ? calculateNextDate(
        activeDate,
        subscription.billingCycle,
        subscription.customDays,
        subscription.customMonths
    ) : null;

    const ForecastItem = ({ label, date, isPrimary = false, isLast = false }) => (
        <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
            padding: '8px 2px',
            borderRight: isLast ? 'none' : `1px solid ${COLORS.border}`,
            backgroundColor: isPrimary ? `${COLORS.primary}08` : 'transparent'
        }}>
            <span style={{
                fontSize: '10px',
                color: COLORS.textSecondary,
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                textAlign: 'center'
            }}>
                {label}
            </span>
            <span style={{
                fontSize: '12px',
                color: isPrimary ? COLORS.primary : COLORS.textPrimary,
                fontWeight: isPrimary ? '700' : '500',
                textAlign: 'center'
            }}>
                {formatDate(date)}
            </span>
        </div>
    );

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Mark as Paid">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* Payment History Timeline */}
                {paymentHistory && paymentHistory.length > 0 && (
                    <div style={{ marginBottom: '16px' }}>
                        <div style={{
                            fontSize: '11px',
                            fontWeight: '600',
                            color: COLORS.textSecondary,
                            marginBottom: '12px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            paddingLeft: '8px'
                        }}>
                            Payment Timeline
                        </div>
                        <div style={{
                            position: 'relative',
                            padding: '16px 12px 12px 12px',
                            backgroundColor: COLORS.surfaceVariant,
                            borderRadius: '24px',
                            border: `1px solid ${COLORS.border}`
                        }}>
                            {/* Connecting Line */}
                            <div style={{
                                position: 'absolute',
                                top: '21px',
                                left: '24px',
                                right: '24px',
                                height: '2px',
                                backgroundColor: COLORS.border,
                                zIndex: 0
                            }} />

                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                position: 'relative',
                                zIndex: 1
                            }}>
                                {[...paymentHistory]
                                    .sort((a, b) => new Date(a.date) - new Date(b.date)) // Oldest to Newest (Left to Right)
                                    .slice(-5) // Show last 5
                                    .map((entry, index, array) => {
                                        const isLast = index === array.length - 1;
                                        const dotColor = isLast ? COLORS.textSecondary : COLORS.surface;
                                        const borderColor = isLast ? COLORS.textSecondary : COLORS.textSecondary;

                                        return (
                                            <div key={index} style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                gap: '6px',
                                                flex: 1
                                            }}>
                                                {/* Dot */}
                                                <div style={{
                                                    width: '10px',
                                                    height: '10px',
                                                    borderRadius: '50%',
                                                    backgroundColor: dotColor,
                                                    border: `2px solid ${borderColor}`,
                                                    boxShadow: isLast ? `0 0 0 3px ${COLORS.textSecondary}20` : 'none'
                                                }} />

                                                {/* Date */}
                                                <div style={{
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center'
                                                }}>
                                                    <span style={{
                                                        fontSize: '10px',
                                                        fontWeight: isLast ? '700' : '500',
                                                        color: isLast ? COLORS.textPrimary : COLORS.textSecondary,
                                                        whiteSpace: 'nowrap'
                                                    }}>
                                                        {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                    </span>
                                                    <span style={{
                                                        fontSize: '8px',
                                                        color: COLORS.textSecondary,
                                                        opacity: 0.8
                                                    }}>
                                                        {new Date(entry.date).getFullYear()}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>
                    </div>
                )}

                {/* Option 1: Keep Schedule */}
                <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                    padding: '12px 16px',
                    borderRadius: '16px',
                    border: `1px solid ${strategy === 'keep' ? COLORS.primary : 'transparent'}`,
                    backgroundColor: strategy === 'keep' ? `${COLORS.primary}10` : 'transparent',
                    transition: 'all 0.2s var(--easing-standard)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            border: `2px solid ${strategy === 'keep' ? COLORS.primary : COLORS.textSecondary}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            {strategy === 'keep' && <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: COLORS.primary }} />}
                        </div>
                        <input
                            type="radio"
                            name="markPaidStrategy"
                            checked={strategy === 'keep'}
                            onChange={() => handleStrategyChange('keep')}
                            style={{ display: 'none' }}
                        />
                        <div>
                            <span style={{ display: 'block', color: COLORS.textPrimary, fontWeight: '500', fontSize: '16px' }}>
                                Keep Schedule
                            </span>
                            <span style={{ display: 'block', color: COLORS.textSecondary, fontSize: '13px', marginTop: '2px' }}>
                                Add cycle to current due date
                            </span>
                        </div>
                    </div>
                </label>

                {/* Option 2: Reset Cycle */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    padding: '12px 16px',
                    borderRadius: '16px',
                    border: `1px solid ${strategy === 'reset' ? COLORS.primary : 'transparent'}`,
                    backgroundColor: strategy === 'reset' ? `${COLORS.primary}10` : 'transparent',
                    transition: 'all 0.2s var(--easing-standard)'
                }} onClick={() => handleStrategyChange('reset')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: strategy === 'reset' ? '16px' : '0' }}>
                        <div style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            border: `2px solid ${strategy === 'reset' ? COLORS.primary : COLORS.textSecondary}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            {strategy === 'reset' && <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: COLORS.primary }} />}
                        </div>
                        <input
                            type="radio"
                            name="markPaidStrategy"
                            checked={strategy === 'reset'}
                            onChange={() => handleStrategyChange('reset')}
                            style={{ display: 'none' }}
                        />
                        <div>
                            <span style={{ display: 'block', color: COLORS.textPrimary, fontWeight: '500', fontSize: '16px' }}>
                                Reset Cycle
                            </span>
                            <span style={{ display: 'block', color: COLORS.textSecondary, fontSize: '13px', marginTop: '2px' }}>
                                Set next due date based on a new date
                            </span>
                        </div>
                    </div>

                    {strategy === 'reset' && (
                        <div style={{ paddingLeft: '36px' }} onClick={(e) => e.stopPropagation()}>
                            <DatePickerComponent
                                value={resetDate}
                                onChange={setResetDate}
                            />
                        </div>
                    )}
                </div>

                {/* Extended Forecast Display */}
                {activeDate && (
                    <div style={{
                        display: 'flex',
                        marginTop: '4px',
                        border: `1px solid ${COLORS.border}`,
                        borderRadius: '16px',
                        overflow: 'hidden',
                        backgroundColor: COLORS.background
                    }}>
                        <ForecastItem label="Marking Paid" date={paidDate} />
                        <ForecastItem label="Next Due" date={activeDate} isPrimary={true} />
                        <ForecastItem label="Following" date={followingDate} isLast={true} />
                    </div>
                )}

                {/* Action Buttons */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '8px',
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
                    <Button onClick={handleClose} variant="neutral">
                        Cancel
                    </Button>
                    <Button onClick={handleConfirm} variant="success">
                        Confirm
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default MarkPaidModal;
