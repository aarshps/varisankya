import React from 'react';

export default function LogoComponent() {
    return (
        <img
            src="/logo.png"
            alt="Varisankya Logo"
            width={36}
            height={36}
            style={{ borderRadius: '8px', flexShrink: 0 }}
        />
    );
}
