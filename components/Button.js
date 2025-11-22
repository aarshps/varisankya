import React from 'react';
import styles from '../styles/Home.module.css';

const Button = ({
    children,
    onClick,
    variant = 'primary', // primary, destructive, neutral, success
    className = '',
    style = {},
    ...props
}) => {
    // Map variants to CSS classes
    const variantClass = {
        primary: styles.buttonPrimary,
        destructive: styles.buttonDestructive,
        neutral: styles.buttonNeutral,
        success: styles.buttonSuccess,
    }[variant] || styles.buttonPrimary;

    return (
        <button
            className={`${styles.button} ${variantClass} ${className}`}
            onClick={onClick}
            style={style}
            {...props}
        >
            {children}
        </button>
    );
};

export default Button;
