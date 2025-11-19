import React, { useState, useEffect, useRef } from 'react';
import SubscriptionList from './SubscriptionList';
import styles from '../styles/Home.module.css';

// Reusable modal component for adding new subscriptions
const AddSubscriptionModal = ({ isOpen, onClose, onSubmit, value, onChange }) => {
  const [isClosing, setIsClosing] = useState(false);

  if (!isOpen && !isClosing) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (value.trim()) {
      setIsClosing(true);
      onSubmit(e);
      // Close modal after a delay to allow optimistic UI to work
      setTimeout(() => {
        setIsClosing(false);
        onClose();
      }, 300);
    }
  };

  const handleCancel = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 300);
  };

  // Hook for M3E button press animation (consistent with other buttons)
  const useButtonAnim = () => {
    const onPress = (e) => {
      e.currentTarget.style.transform = 'scale(0.98)';
      e.currentTarget.style.transition = 'transform 0.1s cubic-bezier(0.4, 0, 0.2, 1)';
    };
    const onRelease = (e) => {
      e.currentTarget.style.transform = 'scale(1)';
      e.currentTarget.style.transition = 'transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)';
    };
    return { onPress, onRelease };
  };

  const { onPress, onRelease } = useButtonAnim();

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: isClosing ? 'rgba(0, 0, 0, 0)' : 'rgba(0, 0, 0, 0.7)',
        zIndex: 1000,
        opacity: isClosing ? 0 : 1,
        transition: 'background-color 0.3s ease-out, opacity 0.3s ease-out',
        overflowY: 'auto',
        display: (isOpen || isClosing) ? 'flex' : 'none',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
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
          margin: 'auto', // Centers the modal and allows scrolling
          maxHeight: '80vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ fontFamily: "'Google Sans Flex', sans-serif", fontSize: '24px', fontWeight: '500', color: '#E3E3E3', marginTop: 0, marginBottom: '24px' }}>
          Add New Subscription
        </h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontFamily: "'Google Sans Flex', sans-serif", fontSize: '12px', fontWeight: '500', color: '#C4C7C5', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Name</label>
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Subscription name"
              className={styles.composerInput}
              style={{ borderRadius: '12px', width: '100%', fontFamily: "'Google Sans Flex', sans-serif", fontSize: '16px', padding: '14px 16px', height: '48px' }}
              autoFocus
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              type="button"
              onClick={handleCancel}
              style={{
                padding: '12px 24px',
                borderRadius: '24px',
                border: '1px solid #444746',
                background: 'transparent',
                color: '#E3E3E3',
                cursor: 'pointer',
                fontFamily: "'Google Sans Flex', sans-serif",
                fontSize: '15px',
                fontWeight: '500',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              onMouseDown={onPress}
              onMouseUp={onRelease}
              onMouseLeave={onRelease}
              onMouseOver={(e) => (e.currentTarget.style.background = '#2D2D2D')}
              onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!value.trim()}
              style={{
                padding: '12px 32px',
                borderRadius: '24px',
                border: 'none',
                background: !value.trim() ? '#555' : '#A8C7FA',
                color: !value.trim() ? '#888' : '#003355',
                fontWeight: '500',
                cursor: !value.trim() ? 'not-allowed' : 'pointer',
                fontFamily: "'Google Sans Flex', sans-serif",
                fontSize: '15px',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: !value.trim() ? 'none' : '0 2px 8px rgba(168, 199, 250, 0.4)',
              }}
              onMouseDown={!value.trim() ? undefined : onPress}
              onMouseUp={!value.trim() ? undefined : onRelease}
              onMouseLeave={!value.trim() ? undefined : onRelease}
              onMouseOver={(e) => !value.trim() || (e.currentTarget.style.background = '#C2E7FF')}
              onMouseOut={(e) => !value.trim() || (e.currentTarget.style.background = '#A8C7FA')}
            >
              Add
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function Subscriptions({ subscriptions, loading, error, onDelete, onUpdate, composerProps }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [isFabVisible, setIsFabVisible] = useState(true);
  const lastScrollY = useRef(0);

  const toggleModal = () => {
    setShowAddModal(!showAddModal);
  };

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Hide FAB when scrolling down, show when scrolling up
      if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
        setIsFabVisible(false);
      } else {
        setIsFabVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <div className={styles.content}>
        <div className={styles.subscriptionsContainer}>
          {error && <div style={{ color: '#d93025', backgroundColor: '#fce8e6', padding: '10px', borderRadius: '4px', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}
          {loading && <div style={{ textAlign: 'center', padding: '20px' }}>Loading subscriptions...</div>}
          {!loading && <SubscriptionList subscriptions={subscriptions} onDelete={onDelete} onUpdate={onUpdate} />}
        </div>

        {/* Floating action button container for slide animation */}
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            zIndex: 20,
            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: isFabVisible ? 'translateY(0)' : 'translateY(100px)',
            pointerEvents: isFabVisible ? 'auto' : 'none',
          }}
        >
          <button
            onClick={toggleModal}
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: '#A8C7FA',
              color: '#003355',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              fontWeight: 'bold',
              boxShadow: '0 4px 12px rgba(168, 199, 250, 0.4)',
              transition: 'background-color 0.2s, transform 0.1s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#C2E7FF')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#A8C7FA')}
            onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            +
          </button>
        </div>
      </div>

      {/* Reuse Add Subscription Modal */}
      <AddSubscriptionModal
        isOpen={showAddModal}
        onClose={toggleModal}
        onSubmit={composerProps.onSubmit}
        value={composerProps.value}
        onChange={composerProps.onChange}
      />
    </>
  );
}
