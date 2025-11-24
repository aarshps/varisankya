import React, { useMemo } from 'react';
import Modal from './Modal';
import Button from './Button';
import { COLORS } from '../lib/colors';
import useHaptics from '../lib/useHaptics';

const SummaryModal = ({ isOpen, onClose, subscriptions }) => {
    const { triggerHaptic } = useHaptics();

    const summary = useMemo(() => {
        const total = subscriptions.length;
        const categories = {};
        let totalCost = 0;

        subscriptions.forEach(sub => {
            const cat = sub.category || 'Other';
            categories[cat] = (categories[cat] || 0) + 1;
            totalCost += parseFloat(sub.cost) || 0;
        });

        return { total, categories, totalCost };
    }, [subscriptions]);

    const categoryColors = {
        'Entertainment': '#A8C7FA',
        'Utilities': '#81C995',
        'Software': '#F2B8B5',
        'Insurance': '#D4A5FF',
        'Gym/Fitness': '#FFD6A5',
        'Other': '#C4C7C5'
    };

    // Generate pie chart segments
    const generatePieSegments = () => {
        const { categories, total } = summary;
        if (total === 0) return null;

        const segments = [];
        let currentAngle = 0;

        Object.entries(categories).forEach(([category, count]) => {
            const percentage = (count / total) * 100;
            const angle = (percentage / 100) * 360;
            const largeArc = angle > 180 ? 1 : 0;

            const startX = 50 + 45 * Math.cos((currentAngle - 90) * Math.PI / 180);
            const startY = 50 + 45 * Math.sin((currentAngle - 90) * Math.PI / 180);
            const endX = 50 + 45 * Math.cos((currentAngle + angle - 90) * Math.PI / 180);
            const endY = 50 + 45 * Math.sin((currentAngle + angle - 90) * Math.PI / 180);

            const pathData = [
                `M 50 50`,
                `L ${startX} ${startY}`,
                `A 45 45 0 ${largeArc} 1 ${endX} ${endY}`,
                `Z`
            ].join(' ');

            segments.push({
                path: pathData,
                color: categoryColors[category] || categoryColors['Other'],
                category,
                count,
                percentage: percentage.toFixed(1)
            });

            currentAngle += angle;
        });

        return segments;
    };

    const segments = generatePieSegments();

    const handleClose = () => {
        triggerHaptic('medium');
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Subscriptions Summary">
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '24px',
                padding: '8px 0'
            }}>
                {/* Statistics */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-around',
                    padding: '16px',
                    background: COLORS.surfaceVariant,
                    borderRadius: '16px'
                }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '28px', fontWeight: 'bold', color: COLORS.primary }}>{summary.total}</div>
                        <div style={{ fontSize: '12px', color: COLORS.textSecondary, marginTop: '4px' }}>Total</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '28px', fontWeight: 'bold', color: COLORS.success }}>${summary.totalCost.toFixed(2)}</div>
                        <div style={{ fontSize: '12px', color: COLORS.textSecondary, marginTop: '4px' }}>Monthly Cost</div>
                    </div>
                </div>

                {/* Pie Chart */}
                {segments && segments.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                        <svg viewBox="0 0 100 100" style={{ width: '200px', height: '200px' }}>
                            {segments.map((segment, i) => (
                                <path
                                    key={i}
                                    d={segment.path}
                                    fill={segment.color}
                                    stroke={COLORS.surface}
                                    strokeWidth="0.5"
                                />
                            ))}
                        </svg>

                        {/* Legend */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
                            {segments.map((segment, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <div style={{
                                        width: '12px',
                                        height: '12px',
                                        borderRadius: '2px',
                                        backgroundColor: segment.color
                                    }} />
                                    <span style={{ fontSize: '12px', color: COLORS.textSecondary }}>
                                        {segment.category} ({segment.count})
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {summary.total === 0 && (
                    <div style={{
                        textAlign: 'center',
                        padding: '32px',
                        color: COLORS.textSecondary
                    }}>
                        No subscriptions yet. Click OK to start adding!
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
