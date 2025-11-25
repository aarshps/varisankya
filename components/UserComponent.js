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

    return (
        <div style={{ display: 'flex', alignItems: 'center', height: '36px', position: 'relative', width: '36px' }}>
            <div style={{
                position: 'absolute',
                right: '-20px', // Extend to screen edge (compensating for header padding)
                top: '-8px',
                display: 'flex',
                alignItems: 'center',
                padding: '8px 20px 8px 16px', // Right padding matches header padding to keep profile pic in place
                backgroundColor: showLogout ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                borderTopLeftRadius: '32px',
                borderBottomLeftRadius: '32px',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                zIndex: 10
            }}>
                {/* Logout Button Wrapper */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    overflow: 'hidden',
                    width: showLogout ? 'auto' : '0px',
                    opacity: showLogout ? 1 : 0,
                    marginRight: showLogout ? '12px' : '0px',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}>
                    <Button
                        onClick={() => {
                            setShowLogout(false);
                            onSignOut();
                        }}
                        variant="destructive"
                        style={{ height: '36px', padding: '0 16px', whiteSpace: 'nowrap' }}
                    >
                        Logout
                    </Button>
                </div>

                {/* Profile Picture */}
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
                            border: `2px solid ${COLORS.surfaceVariant}`,
                            cursor: 'pointer',
                            backgroundColor: '#1E1E1E',
                            objectFit: 'cover',
                            flexShrink: 0
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
                            border: `2px solid ${COLORS.surfaceVariant}`,
                            cursor: 'pointer',
                            backgroundColor: '#333333',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#E3E3E3',
                            fontWeight: '500',
                            fontSize: '16px',
                            userSelect: 'none',
                            flexShrink: 0
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
        </div>
    );
}
