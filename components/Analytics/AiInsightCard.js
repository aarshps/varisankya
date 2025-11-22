import React from 'react';

export default function AiInsightCard({ insight, loading, onRefresh, totalMonthly }) {
    return (
        <div style={{
            background: 'linear-gradient(145deg, #1E1E1E, #252525)',
            padding: '32px',
            borderRadius: '24px',
            border: '1px solid #444746',
            boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Decorative background element */}
            <div style={{
                position: 'absolute',
                top: '-50px',
                right: '-50px',
                width: '150px',
                height: '150px',
                background: 'radial-gradient(circle, rgba(168, 199, 250, 0.1) 0%, rgba(0,0,0,0) 70%)',
                borderRadius: '50%',
                pointerEvents: 'none'
            }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div>
                    <h2 style={{ fontSize: '20px', color: '#E3E3E3', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '24px' }}>✨</span> Subscription Intelligence
                    </h2>
                    <p style={{ color: '#C4C7C5', fontSize: '14px', marginTop: '4px' }}>
                        AI-powered analysis of your spending
                    </p>
                </div>
                <button
                    onClick={onRefresh}
                    disabled={loading}
                    style={{
                        background: 'transparent',
                        border: '1px solid #444746',
                        color: '#A8C7FA',
                        padding: '8px 16px',
                        borderRadius: '20px',
                        cursor: loading ? 'wait' : 'pointer',
                        fontSize: '13px',
                        transition: 'all 0.2s'
                    }}
                >
                    {loading ? 'Analyzing...' : 'Refresh Analysis'}
                </button>
            </div>

            <div style={{ marginBottom: '32px', padding: '20px', background: 'rgba(0,0,0,0.2)', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#A8C7FA', lineHeight: 1 }}>
                    ${Math.round(totalMonthly || 0)}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ color: '#E3E3E3', fontWeight: '500' }}>Total Monthly Spend</span>
                    <span style={{ color: '#C4C7C5', fontSize: '13px' }}>Est. ${Math.round((totalMonthly || 0) * 12)} / year</span>
                </div>
            </div>

            <div style={{ minHeight: '100px' }}>
                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ height: '16px', background: '#444746', borderRadius: '4px', width: '100%', animation: 'pulse 1.5s infinite' }} />
                        <div style={{ height: '16px', background: '#444746', borderRadius: '4px', width: '90%', animation: 'pulse 1.5s infinite' }} />
                        <div style={{ height: '16px', background: '#444746', borderRadius: '4px', width: '95%', animation: 'pulse 1.5s infinite' }} />
                    </div>
                ) : (
                    <div style={{
                        color: '#E3E3E3',
                        lineHeight: '1.6',
                        fontSize: '16px',
                        whiteSpace: 'pre-wrap',
                        fontFamily: "'Google Sans', sans-serif"
                    }}>
                        {insight || "Click refresh to generate insights about your subscriptions."}
                    </div>
                )}
            </div>

            <style jsx>{`
        @keyframes pulse {
          0% { opacity: 0.6; }
          50% { opacity: 1; }
          100% { opacity: 0.6; }
        }
      `}</style>
        </div>
    );
}
