import React from 'react';
import styles from '../styles/Home.module.css';

export default function SidebarNavItem({ label, selected, onClick }) {
  return (
    <div className={`${styles.navItem} ${selected ? styles.selected : ''}`} onClick={onClick}>
      {label}
    </div>
  );
}
