import React from 'react';
import IconButton from '../IconButton';

export default function SubscriptionDetailCard({ data }) {
    if (!data) return null;

    return (
        <div style={{
            background: 'linear-gradient(145deg, #1E1E1E, #252525)',
            padding: '24px',
            borderRadius: '24px',
            border: '1px solid #444746',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            color: '#E3E3E3',
            transition: 'transform 0.2s ease',
            animation: 'fadeIn 0.4s ease-out'
        }}>
            <div style={{ marginBottom: '20px', borderBottom: '1px solid #444746', paddingBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: '28px', margin: '0 0 4px 0', color: '#A8C7FA', fontWeight: '600' }}>{data.estimatedCost}</h2>
                    <p style={{ margin: 0, color: '#C4C7C5', fontSize: '13px', fontWeight: '500' }}>Estimated Monthly Cost</p>
                </div>
                {data.officialWebsite && (
                    <IconButton
                        onClick={() => window.open(data.officialWebsite, '_blank')}
                        title="Go to Website"
                        icon={
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M19 19H5V5H12V3H5C3.89 3 3 3.9 3 5V19C3 20.1 3.89 21 5 21H19C20.1 21 21 20.1 21 19V12H19V19ZM14 3V5H17.59L7.76 14.83L9.17 16.24L19 6.41V10H21V3H14Z" fill="currentColor" />
                            </svg>
                        }
                        bgColor="#3E3E3E"
                        color="#A8C7FA"
                        hoverBgColor="#4E4E4E"
                    />
                )}
            </div>

            <div style={{ marginBottom: '20px' }}>
                <h3 style={{ fontSize: '13px', color: '#A8C7FA', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: '600' }}>Overview</h3>
                <p style={{ lineHeight: '1.6', color: '#E3E3E3', fontSize: '14px', margin: 0 }}>{data.description}</p>
            </div>

            <div style={{ marginBottom: '20px' }}>
                <h3 style={{ fontSize: '13px', color: '#A8C7FA', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: '600' }}>Key Features</h3>
                <ul style={{ paddingLeft: '20px', color: '#C4C7C5', lineHeight: '1.6', fontSize: '14px', margin: 0 }}>
                    {data.features.map((feature, index) => (
                        <li key={index} style={{ marginBottom: '6px' }}>{feature}</li>
                    ))}
                </ul>
            </div>

            <div>
                <h3 style={{ fontSize: '13px', color: '#A8C7FA', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: '600' }}>Alternatives</h3>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {data.alternatives.map((alt, index) => (
                        <span key={index} style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            color: '#E3E3E3',
                            padding: '6px 12px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            fontWeight: '500'
                        }}>
                            {alt}
                        </span>
                    ))}
                </div>
            </div>
            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
