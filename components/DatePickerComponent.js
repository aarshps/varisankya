import React, { useEffect, useState } from 'react';
import DropdownComponent from './DropdownComponent';

const MONTHS = [
    { value: 0, label: 'Jan' }, { value: 1, label: 'Feb' }, { value: 2, label: 'Mar' },
    { value: 3, label: 'Apr' }, { value: 4, label: 'May' }, { value: 5, label: 'Jun' },
    { value: 6, label: 'Jul' }, { value: 7, label: 'Aug' }, { value: 8, label: 'Sep' },
    { value: 9, label: 'Oct' }, { value: 10, label: 'Nov' }, { value: 11, label: 'Dec' }
];

const DatePickerComponent = ({ value, onChange, style }) => {
    // Initialize state directly from props to avoid useEffect re-render
    const getInitialState = (val) => {
        if (val) {
            const date = new Date(val);
            if (!isNaN(date.getTime())) {
                return {
                    day: date.getDate(),
                    month: date.getMonth(),
                    year: date.getFullYear()
                };
            }
        }
        return { day: '', month: '', year: '' };
    };

    const initialState = getInitialState(value);
    const [day, setDay] = useState(initialState.day);
    const [month, setMonth] = useState(initialState.month);
    const [year, setYear] = useState(initialState.year);

    useEffect(() => {
        // Only update if external value changes significantly (e.g. reset)
        // and doesn't match current internal state
        const current = getInitialState(value);
        if (current.day !== day || current.month !== month || current.year !== year) {
            // Check if the external value actually corresponds to a different date
            // This prevents loops if the parent passes back the same value
            setDay(current.day);
            setMonth(current.month);
            setYear(current.year);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    const handleChange = (d, m, y) => {
        if (d && m !== '' && y) {
            const date = new Date(y, m, d);
            // Adjust for timezone offset to keep the date string correct (YYYY-MM-DD)
            // Actually, simpler to just construct the string manually to avoid timezone shifts
            const mm = String(m + 1).padStart(2, '0');
            const dd = String(d).padStart(2, '0');
            onChange(`${y}-${mm}-${dd}`);
        }
    };

    const days = Array.from({ length: 31 }, (_, i) => i + 1);
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 10 }, (_, i) => currentYear + i); // Next 10 years

    return (
        <div style={{ display: 'flex', gap: '8px', width: '100%', ...style }}>
            <div style={{ flex: 1 }}>
                <DropdownComponent
                    value={day}
                    onChange={(val) => {
                        setDay(val);
                        handleChange(val, month, year);
                    }}
                    options={days}
                    placeholder="DD"
                />
            </div>
            <div style={{ flex: 1.5 }}>
                <DropdownComponent
                    value={month}
                    onChange={(val) => {
                        setMonth(val);
                        handleChange(day, val, year);
                    }}
                    options={MONTHS}
                    placeholder="MMM"
                />
            </div>
            <div style={{ flex: 1.5 }}>
                <DropdownComponent
                    value={year}
                    onChange={(val) => {
                        setYear(val);
                        handleChange(day, month, val);
                    }}
                    options={years}
                    placeholder="YYYY"
                />
            </div>
        </div>
    );
};

export default DatePickerComponent;
