import React from 'react';
import { COLORS } from '../lib/colors';

export default function AppNameComponent() {
    return (
        <span style={{
            fontWeight: '500',
            fontSize: '20px',
            color: COLORS.textPrimary,
            display: 'flex',
            alignItems: 'center',
            height: '100%'
        }}>
            Varisankya
        </span>
    );
}
