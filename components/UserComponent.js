import React, { useState, useEffect } from 'react';
import { COLORS } from '../lib/colors';
import Button from './Button';

export default function UserComponent({ session, onSignOut }) {
    const [showLogout, setShowLogout] = useState(false);
    const [imageError, setImageError] = useState(false);

    // Auto-hide logout button
    useEffect(() => {
        if (showLogout) {
            const timer = setTimeout(() => {
                setShowLogout(false);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [showLogout]);

    if (!session) return null;

    console.log('UserComponent session:', session); // Debug log

    return (
        <div style={{ display: 'flex', alignItems: 'center', height: '36px', position: 'relative' }}>
            <div style={{
                position: 'absolute',
                right: '48px',
                top: 0,
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                zIndex: 0,
                opacity: showLogout ? 1 : 0,
                transform: showLogout ? 'translateX(0)' : 'translateX(20px)',
                pointerEvents: showLogout ? 'auto' : 'none',
                transition: 'opacity 0.3s ease, transform 0.3s cubic-bezier(0.2, 0, 0, 1)'
            }}>
                <Button
                    onClick={() => {
                        setShowLogout(false);
                        onSignOut();
                    }}
                    variant="destructive"
                    style={{ height: '36px', padding: '0 16px' }}
                >
                    Logout
                </Button>
            </div>

            {(session.user?.image && !imageError) ? (
                <img
                    src={session.user.image}
                    alt="profile"
                    width={36}
                    height={36}
                    onError={(e) => {
                        console.error('Error loading user image:', session.user.image, e);
                        setImageError(true);
                    }}
                    referrerPolicy="no-referrer"
                    style={{
                        borderRadius: '50%',
                        marginLeft: '4px',
                        border: `2px solid ${COLORS.surfaceVariant}`,
                        cursor: 'pointer',
                        position: 'relative',
                        zIndex: 10, // Always on top
                        backgroundColor: '#1E1E1E', // Ensure opaque background
                        objectFit: 'cover'
                    }}
                    onClick={() => setShowLogout(!showLogout)}
                    onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.92)'}
                    onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                />
            ) : (
                <div
                    style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        marginLeft: '4px',
                        border: `2px solid ${COLORS.surfaceVariant}`,
                        cursor: 'pointer',
                        position: 'relative',
                        zIndex: 10,
                        backgroundColor: '#333333', // Dark gray for fallback
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#E3E3E3', // Light text
                        fontWeight: '500',
                        fontSize: '16px',
                        userSelect: 'none'
                    }}
                    onClick={() => setShowLogout(!showLogout)}
                    onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.92)'}
                    onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                    {session.user?.name ? session.user.name.charAt(0).toUpperCase() : 'U'}
                </div>
            )}
        </div>
    );
}
