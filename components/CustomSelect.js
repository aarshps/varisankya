import React, { useState, useRef, useEffect } from 'react';

const CustomSelect = ({
    value,
    onChange,
    options,
    placeholder = "Select...",
    disabled = false,
    renderOption,
    renderValue,
    getOptionLabel = (option) => option?.label || option,
    getOptionValue = (option) => option?.value || option
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (option) => {
        if (disabled) return;
        onChange(getOptionValue(option));
        setIsOpen(false);
    };

    const selectedOption = options.find(o => getOptionValue(o) === value);
    const displayLabel = selectedOption ? getOptionLabel(selectedOption) : (value || placeholder);

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
                    backgroundColor: '#1E1E1E',
                    border: `1px solid ${isOpen ? '#A8C7FA' : '#444746'}`,
                    borderRadius: '12px',
                    cursor: disabled ? 'default' : 'pointer',
                    color: '#E3E3E3',
                    fontSize: '16px',
                    opacity: disabled ? 0.6 : 1,
                    boxShadow: isOpen ? '0 0 0 1px #A8C7FA' : 'none',
                }}
            >
                <span style={{ fontWeight: value ? '500' : '400', color: value ? '#E3E3E3' : '#C4C7C5' }}>
                    {renderValue ? renderValue(value) : displayLabel}
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
                        backgroundColor: '#1E1E1E',
                        border: '1px solid #444746',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        zIndex: 10,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                        maxHeight: '250px',
                        overflowY: 'auto',
                        animation: 'fadeIn 0.1s ease-out'
                    }}
                >
                    {options.map((option, index) => {
                        const optValue = getOptionValue(option);
                        const isSelected = value === optValue;
                        return (
                            <div
                                key={optValue || index}
                                onClick={() => handleSelect(option)}
                                style={{
                                    padding: '12px 16px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    backgroundColor: isSelected ? '#2D2D2D' : 'transparent',
                                    transition: 'background-color 0.1s'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2D2D2D'}
                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = isSelected ? '#2D2D2D' : 'transparent'}
                            >
                                {renderOption ? renderOption(option, isSelected) : (
                                    <>
                                        <span style={{
                                            color: '#E3E3E3',
                                            fontWeight: isSelected ? '500' : '400'
                                        }}>
                                            {getOptionLabel(option)}
                                        </span>
                                        {isSelected && (
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" fill="#A8C7FA" />
                                            </svg>
                                        )}
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-5px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default CustomSelect;
