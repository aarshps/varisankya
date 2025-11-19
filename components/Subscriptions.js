import React, { useState, useEffect, useRef } from 'react';
import SubscriptionList from './SubscriptionList';
import styles from '../styles/Home.module.css';

import Modal, { ModalButton } from './Modal';

// Reusable modal component for adding new subscriptions
const AddSubscriptionModal = ({ isOpen, onClose, onSubmit, value, onChange }) => {
  const [isClosing, setIsClosing] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (value.trim()) {
      setIsClosing(true);
      onSubmit(e);
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Subscription"
      actions={
        <>
          <ModalButton onClick={handleCancel} variant="secondary">
            Cancel
          </ModalButton>
          <ModalButton
            onClick={handleSubmit}
            disabled={!value.trim()}
            type="submit"
          >
            Add
          </ModalButton>
        </>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
      </form>
    </Modal>
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
