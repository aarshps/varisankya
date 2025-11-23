import React from 'react';
import styles from '../styles/Home.module.css';

export default function FloatingButtonComponent({ onClick, showUndo, onUndo }) {
    const [visible, setVisible] = React.useState(true);
    const lastScrollY = React.useRef(0);

    React.useEffect(() => {
        const handleScroll = () => {
            const scrollContainer = document.querySelector(`.${styles.subscriptionsContainer}`);
            if (!scrollContainer) return;

            const currentScrollY = scrollContainer.scrollTop;

            // Show on scroll up, hide on scroll down
            if (currentScrollY < lastScrollY.current || currentScrollY < 50) {
                setVisible(true);
            } else if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
                setVisible(false);
            }

            lastScrollY.current = currentScrollY;
        };

        // Poll for the element until found
        const checkForElement = setInterval(() => {
            const scrollContainer = document.querySelector(`.${styles.subscriptionsContainer}`);
            if (scrollContainer) {
                scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
                clearInterval(checkForElement);
            }
        }, 100);

        return () => {
            clearInterval(checkForElement);
            const scrollContainer = document.querySelector(`.${styles.subscriptionsContainer}`);
            if (scrollContainer) {
                scrollContainer.removeEventListener('scroll', handleScroll);
            }
        };
    }, []);

    return (
        <div style={{
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 100,
            pointerEvents: 'none' // Pass through clicks on the wrapper
        }}>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    pointerEvents: visible ? 'auto' : 'none',
                    transform: visible ? 'translateY(0)' : 'translateY(100px)',
                    opacity: visible ? 1 : 0,
                    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease'
                }}
            >
                {/* Undo Button */}
                {showUndo && (
                    <button
                        className={styles.undoButton}
                        onClick={onUndo}
                    >
                        Undo
                    </button>
                )}

                {/* Add Button */}
                <button
                    className={styles.fab}
                    onClick={onClick}
                >
                    Add
                </button>
            </div>
        </div>
    );
}
