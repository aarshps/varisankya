import React, { useState, useRef, useEffect } from 'react';

const RecurrenceSelect = ({ value, onChange, disabled }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    const options = [
        { value: 'days', label: 'Every X Days' },
        { value: 'monthly', label: 'Monthly (Day of Month)' },
        { value: 'yearly', label: 'Yearly (Day of Year)' },
        { value: 'manual', label: 'Manual (Next Due Date)' }
    ];

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (newValue) => {
        if (disabled) return;
        onChange(newValue);
        setIsOpen(false);
    };

    const getLabel = (val) => {
        const option = options.find(o => o.value === val);
        return option ? option.label : 'Every X Days';
    };

    return (
        <div
            ref={containerRef}
            style={{ position: 'relative', width: '100%', fontFamily: "'Google Sans Flex', sans-serif" }}
        >
            {/* Trigger */}
            <div
                onClick={() => !disabled && setIsOpen(!isOpen)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 16px',
                    height: '48px',
                    backgroundColor: '#2D2D2D',
                    border: `1px solid ${isOpen ? '#A8C7FA' : '#444746'}`,
                    borderRadius: '12px',
                    cursor: disabled ? 'default' : 'pointer',
                    color: '#E3E3E3',
                    fontSize: '16px',
                    transition: 'all 0.2s ease',
                    opacity: disabled ? 0.6 : 1,
                    boxShadow: isOpen ? '0 0 0 1px #A8C7FA' : 'none',
                }}
            >
                <span style={{ fontWeight: '500', color: '#E3E3E3' }}>
                    {getLabel(value)}
                </span>
                <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    style={{
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease',
                        color: '#A8C7FA'
                    }}
                >
                    <path d="M7 10L12 15L17 10H7Z" fill="currentColor" />
                </svg>
            </div>

            {/* Dropdown Menu */}
            {isOpen && (
                <div
                    style={{
                        position: 'absolute',
                        top: 'calc(100% + 4px)',
                        left: 0,
                        right: 0,
                        backgroundColor: '#2D2D2D',
                        border: '1px solid #444746',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        zIndex: 10,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                        animation: 'fadeIn 0.1s ease-out'
                    }}
                >
                    {options.map((option) => (
                        <div
                            key={option.value}
                            onClick={() => handleSelect(option.value)}
                            style={{
                                padding: '12px 16px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                backgroundColor: value === option.value ? '#3C3C3C' : 'transparent',
                                transition: 'background-color 0.1s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#3C3C3C'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = value === option.value ? '#3C3C3C' : 'transparent'}
                        >
                            <span style={{
                                color: '#E3E3E3',
                                fontWeight: value === option.value ? '500' : '400'
                            }}>
                                {option.label}
                            </span>
                            {value === option.value && (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" fill="#A8C7FA" />
                                </svg>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default RecurrenceSelect;
