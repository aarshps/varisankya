import React, { useState, useRef, useEffect } from 'react';
import { COLORS } from '../lib/colors';
import styles from '../styles/Home.module.css';

const DropdownComponent = ({ value, onChange, options, placeholder = 'Select', style }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (optionValue) => {
        onChange(optionValue);
        setIsOpen(false);
    };

    const selectedLabel = options.find(opt => (typeof opt === 'object' ? opt.value : opt) === value);
    const displayLabel = selectedLabel ? (typeof selectedLabel === 'object' ? selectedLabel.label : selectedLabel) : placeholder;

    return (
        <div ref={dropdownRef} style={{ position: 'relative', width: '100%', ...style }}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    height: '48px',
                    padding: '0 16px',
                    borderRadius: '16px',
                    backgroundColor: COLORS.surfaceVariant,
                    border: `1px solid ${isOpen ? COLORS.primary : COLORS.border}`,
                    color: COLORS.textPrimary,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s',
                    fontFamily: "'Google Sans Flex', sans-serif",
                    fontSize: '16px'
                }}
            >
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {displayLabel}
                </span>
                <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    style={{
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s'
                    }}
                >
                    <path
                        d="M2 4L6 8L10 4"
                        stroke={COLORS.textSecondary}
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </div>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 4px)',
                    left: 0,
                    right: 0,
                    backgroundColor: COLORS.surfaceVariant,
                    borderRadius: '12px',
                    border: `1px solid ${COLORS.border}`,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    zIndex: 1000,
                    maxHeight: '200px',
                    overflowY: 'auto',
                    padding: '4px'
                }}>
                    {options.map((option) => {
                        const optValue = typeof option === 'object' ? option.value : option;
                        const optLabel = typeof option === 'object' ? option.label : option;
                        const isSelected = optValue === value;

                        return (
                            <div
                                key={optValue}
                                onClick={() => handleSelect(optValue)}
                                style={{
                                    padding: '10px 12px',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    color: isSelected ? COLORS.primary : COLORS.textPrimary,
                                    backgroundColor: isSelected ? COLORS.primarySelectedBg : 'transparent',
                                    fontSize: '14px',
                                    fontFamily: "'Google Sans Flex', sans-serif",
                                    transition: 'background-color 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    if (!isSelected) e.currentTarget.style.backgroundColor = COLORS.surfaceHighlight;
                                }}
                                onMouseLeave={(e) => {
                                    if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                            >
                                {optLabel}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default DropdownComponent;
