import React, { useState, useEffect, useRef } from 'react';
import styles from '../styles/Home.module.css';
import SubscriptionList from './SubscriptionList';
import Modal, { ModalButton } from './Modal';
import Loader from './Loader';
import { COLORS } from '../lib/colors';

const AddSubscriptionModal = ({ isOpen, onClose, onAdd }) => {
  const [value, setValue] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (value.trim()) {
      onAdd(value.trim());
      setValue('');
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Subscription">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label style={{ fontFamily: "'Google Sans Flex', sans-serif", fontSize: '12px', fontWeight: '500', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Name</label>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Subscription name"
          className={styles.composerInput}
          style={{ borderRadius: '12px', width: '100%', fontFamily: "'Google Sans Flex', sans-serif", fontSize: '16px', padding: '14px 16px', height: '48px' }}
          autoFocus
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
          <ModalButton onClick={onClose} variant="secondary">Cancel</ModalButton>
          <ModalButton type="submit" variant="primary">Add</ModalButton>
        </div>
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

      // Show FAB if scrolling up or at the top
      if (currentScrollY < lastScrollY.current || currentScrollY < 50) {
        setIsFabVisible(true);
      } else if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
        // Hide FAB if scrolling down
        setIsFabVisible(false);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Loader />
      </div>
    );
  }

  if (error) {
    return <div className={styles.error}>Error: {error}</div>;
  }

  return (
    <div className={styles.container}>
      <SubscriptionList
        subscriptions={subscriptions}
        onDelete={onDelete}
        onUpdate={onUpdate}
      />

      {/* Floating Action Button */}
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 100,
          pointerEvents: 'none', // Allow clicks to pass through container
        }}
      >
        <div
          style={{
            position: 'relative',
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
              backgroundColor: COLORS.primary,
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
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = COLORS.primaryHover)}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = COLORS.primary)}
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
        onAdd={composerProps.onAdd}
      />
    </div>
  );
}
