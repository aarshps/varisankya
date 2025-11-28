import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { COLORS } from '../lib/colors';

const HistoryItem = ({ entry, isGlobalLast, subscription, onDeleteHistoryItem, paymentHistory, triggerHaptic }) => {
    const dotColor = isGlobalLast ? COLORS.textSecondary : COLORS.surface;
    const borderColor = isGlobalLast ? COLORS.textSecondary : COLORS.textSecondary;

    // Long Press Logic
    const [isPressing, setIsPressing] = React.useState(false);
    const timerRef = React.useRef(null);

    const handleStart = () => {
        setIsPressing(true);
        timerRef.current = setTimeout(() => {
            triggerHaptic('heavy');
            if (onDeleteHistoryItem) {
                const originalIndex = paymentHistory.indexOf(entry);
                if (originalIndex !== -1) {
                    onDeleteHistoryItem(originalIndex);
                }
            }
            setIsPressing(false);
        }, 800); // 800ms long press
    };

    const handleEnd = () => {
        setIsPressing(false);
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: -20, scale: 0.9 }} // Slide in from left (filling from previous page)
            animate={{
                opacity: isPressing ? 0.5 : 1,
                x: 0,
                scale: isPressing ? 0.95 : 1
            }}
            exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }} // Fade out and slight scale down
            transition={{
                layout: { duration: 0.3, type: "spring", bounce: 0.2 },
                opacity: { duration: 0.2 },
                x: { type: "spring", stiffness: 300, damping: 30 }
            }}
            onMouseDown={handleStart}
            onMouseUp={handleEnd}
            onMouseLeave={handleEnd}
            onTouchStart={handleStart}
            onTouchEnd={handleEnd}
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                flex: '0 0 calc((100% - 8px) / 3)', // Show 3 items with gap consideration
                minWidth: '60px', // Minimum width for readability
                cursor: 'pointer',
                userSelect: 'none'
            }}>
            {/* Dot */}
            <div style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: dotColor,
                border: `2px solid ${borderColor}`,
                boxShadow: isGlobalLast ? `0 0 0 3px ${COLORS.textSecondary}20` : 'none',
                flexShrink: 0
            }} />

            {/* Date */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
            }}>
                <span style={{
                    fontSize: '10px',
                    fontWeight: isGlobalLast ? '700' : '500',
                    color: isGlobalLast ? COLORS.textPrimary : COLORS.textSecondary,
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
                {/* Amount Display */}
                {entry.cost !== undefined && (
                    <span style={{
                        fontSize: '9px',
                        color: isGlobalLast ? COLORS.primary : COLORS.textSecondary,
                        fontWeight: isGlobalLast ? '600' : '400',
                        marginTop: '2px'
                    }}>
                        {subscription.currency} {entry.cost}
                    </span>
                )}
            </div>
        </motion.div>
    );
};

const PaymentHistoryTimeline = ({ paymentHistory, subscription, onDeleteHistoryItem, triggerHaptic }) => {
    const ITEMS_PER_PAGE = 3;
    const [currentPage, setCurrentPage] = useState(0);
    const [direction, setDirection] = useState(0);

    // Initialize page to last page on mount
    React.useEffect(() => {
        if (paymentHistory && paymentHistory.length > 0) {
            const totalPages = Math.ceil(paymentHistory.length / ITEMS_PER_PAGE);
            setCurrentPage(Math.max(0, totalPages - 1));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run only once on mount

    const totalPages = paymentHistory ? Math.ceil(paymentHistory.length / ITEMS_PER_PAGE) : 0;

    const handlePrevPage = () => {
        if (currentPage > 0) {
            triggerHaptic('selection');
            setDirection(-1);
            setCurrentPage(prev => prev - 1);
        }
    };

    const handleNextPage = () => {
        if (currentPage < totalPages - 1) {
            triggerHaptic('selection');
            setDirection(1);
            setCurrentPage(prev => prev + 1);
        }
    };

    const slideVariants = {
        enter: (direction) => ({
            x: direction > 0 ? '100%' : '-100%',
            opacity: 0
        }),
        center: {
            x: 0,
            opacity: 1
        },
        exit: (direction) => ({
            x: direction < 0 ? '100%' : '-100%',
            opacity: 0
        })
    };

    if (!paymentHistory || paymentHistory.length === 0) {
        return null;
    }

    return (
        <div style={{ marginBottom: '16px' }}>
            <div style={{
                position: 'relative',
                padding: '16px 12px 12px 12px',
                backgroundColor: COLORS.surfaceVariant,
                borderRadius: '24px',
                border: `1px solid ${COLORS.border}`,
                overflow: 'hidden'
            }}>
                {/* Connecting Line */}
                <div style={{
                    position: 'absolute',
                    top: '21px',
                    left: '48px', // Adjusted for arrow buttons
                    right: '48px', // Adjusted for arrow buttons
                    height: '2px',
                    backgroundColor: COLORS.border,
                    zIndex: 0
                }} />

                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    position: 'relative',
                    zIndex: 1
                }}>
                    {/* Left Arrow */}
                    <div
                        onClick={handlePrevPage}
                        style={{
                            padding: '8px',
                            cursor: currentPage > 0 ? 'pointer' : 'default',
                            opacity: currentPage > 0 ? 1 : 0.3,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'opacity 0.2s ease'
                        }}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={COLORS.textSecondary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M15 18l-6-6 6-6" />
                        </svg>
                    </div>

                    {/* Items Container */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        flex: 1,
                        gap: '4px',
                        overflow: 'hidden', // Hide items animating out
                        position: 'relative',
                        height: '60px' // Fixed height to prevent layout shifts
                    }}>
                        <AnimatePresence mode="popLayout" initial={false} custom={direction}>
                            <motion.div
                                key={currentPage}
                                custom={direction}
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{
                                    x: { type: "spring", stiffness: 300, damping: 30 },
                                    opacity: { duration: 0.2 }
                                }}
                                style={{
                                    display: 'flex',
                                    width: '100%',
                                    justifyContent: 'flex-end', // Align to right so newest items stay still
                                    gap: '4px',
                                    position: 'absolute' // Absolute positioning for overlap
                                }}
                            >
                                <AnimatePresence mode="popLayout" initial={false}>
                                    {(() => {
                                        const sortedHistory = [...paymentHistory].sort((a, b) => new Date(a.date) - new Date(b.date));
                                        const totalItems = sortedHistory.length;

                                        // Calculate indices to fill from the right (newest items)
                                        // The last page (totalPages - 1) should have the last ITEMS_PER_PAGE items
                                        // The page before that should have the previous ITEMS_PER_PAGE items, etc.
                                        // Formula: endIndex = totalItems - (totalPages - 1 - currentPage) * ITEMS_PER_PAGE
                                        const itemsFromEnd = (totalPages - 1 - currentPage) * ITEMS_PER_PAGE;
                                        const endIndex = totalItems - itemsFromEnd;
                                        const startIndex = Math.max(0, endIndex - ITEMS_PER_PAGE);

                                        return sortedHistory
                                            .slice(startIndex, endIndex)
                                            .map((entry) => {
                                                // Calculate global index to determine if it's the absolute last item
                                                const globalIndex = sortedHistory.indexOf(entry);
                                                const isGlobalLast = globalIndex === sortedHistory.length - 1;

                                                return (
                                                    <HistoryItem
                                                        key={entry.date} // Use date as key for stable identity
                                                        entry={entry}
                                                        isGlobalLast={isGlobalLast}
                                                        subscription={subscription}
                                                        onDeleteHistoryItem={(idx) => {
                                                            // Adjust index for global list
                                                            const originalIndex = paymentHistory.indexOf(entry);
                                                            onDeleteHistoryItem(originalIndex);

                                                            // If we are on the first page and it becomes empty, we don't need to do anything special
                                                            // The totalPages will decrease, and if currentPage > newTotalPages - 1, it should be adjusted
                                                            // But since we are filling from the right, the current page content will just shift

                                                            // However, if we are on a page that is no longer valid (e.g. was page 1, now only 0 exists)
                                                            // We need to adjust currentPage. This is handled in the effect, but for smooth animation:
                                                            const newTotalPages = Math.ceil((paymentHistory.length - 1) / ITEMS_PER_PAGE);
                                                            if (currentPage >= newTotalPages && currentPage > 0) {
                                                                setDirection(-1);
                                                                setCurrentPage(prev => prev - 1);
                                                            }
                                                        }}
                                                        paymentHistory={paymentHistory}
                                                        triggerHaptic={triggerHaptic}
                                                    />
                                                );
                                            });
                                    })()}
                                </AnimatePresence>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Right Arrow */}
                    <div
                        onClick={handleNextPage}
                        style={{
                            padding: '8px',
                            cursor: currentPage < totalPages - 1 ? 'pointer' : 'default',
                            opacity: currentPage < totalPages - 1 ? 1 : 0.3,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'opacity 0.2s ease'
                        }}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={COLORS.textSecondary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 18l6-6-6-6" />
                        </svg>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentHistoryTimeline;
