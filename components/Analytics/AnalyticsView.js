import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import SubscriptionDetailCard from './SubscriptionDetailCard';
import CustomSelect from '../CustomSelect';
import IconButton from '../IconButton';
import Loader from '../Loader';
import styles from '../../styles/Home.module.css';

export default function AnalyticsView({ initialSubscription, onBack }) {
    const { data: session, status } = useSession();
    const [subscriptions, setSubscriptions] = useState([]);
    const [selectedSubscription, setSelectedSubscription] = useState(initialSubscription || '');
    const [researchData, setResearchData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isClearingCache, setIsClearingCache] = useState(false);

    useEffect(() => {
        if (status === 'authenticated' && session?.dbAccessValid !== false) {
            fetchSubscriptions();
        }
    }, [status, session]);

    useEffect(() => {
        if (initialSubscription) {
            setSelectedSubscription(initialSubscription);
        }
    }, [initialSubscription]);

    const fetchSubscriptions = async () => {
        try {
            const res = await fetch('/api/subscriptions');
            if (res.ok) {
                const data = await res.json();
                setSubscriptions(data);
            }
        } catch (error) {
            console.error('Failed to fetch subscriptions', error);
        }
    };

    const handleSubscriptionChange = (subName) => {
        setSelectedSubscription(subName);
        if (subName) {
            // Trigger research automatically (will check location)
            setResearchData(null);
        } else {
            setResearchData(null);
        }
    };

    const initiateResearch = async (subName, loc = null) => {
        setIsLoading(true);
        setResearchData(null);

        try {
            const res = await fetch('/api/analytics/insight', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subscriptionName: subName, location: loc }),
            });

            if (!res.ok) throw new Error('Failed to fetch');

            const data = await res.json();
            setResearchData(data.insight);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClearCache = async () => {
        if (!selectedSubscription) return;
        setIsClearingCache(true);
        try {
            await fetch(`/api/analytics/insight?subscriptionName=${encodeURIComponent(selectedSubscription)}`, {
                method: 'DELETE',
            });

            if ("geolocation" in navigator) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        initiateResearch(selectedSubscription, {
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude,
                        });
                    },
                    () => initiateResearch(selectedSubscription) // Fallback without location
                );
            } else {
                initiateResearch(selectedSubscription);
            }
        } catch (error) {
            console.error("Failed to clear cache", error);
        } finally {
            setIsClearingCache(false);
        }
    };

    useEffect(() => {
        if (selectedSubscription && !researchData && !isLoading) {
            // Initial fetch attempt
            if ("geolocation" in navigator) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        initiateResearch(selectedSubscription, {
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude,
                        });
                    },
                    (error) => {
                        console.log("Location denied", error);
                        // Still fetch, but without location
                        initiateResearch(selectedSubscription);
                    }
                );
            } else {
                // No geolocation support, fetch without it
                initiateResearch(selectedSubscription);
            }
        }
    }, [selectedSubscription]);

    const subscriptionOptions = subscriptions.map(sub => ({ value: sub.name, label: sub.name }));

    return (
        <div className={styles.content} style={{ padding: '20px', overflowY: 'auto', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

            <div style={{
                width: '100%',
                maxWidth: '600px',
                marginBottom: '16px',
                background: 'linear-gradient(145deg, #1E1E1E, #252525)',
                padding: '24px',
                borderRadius: '24px',
                border: '1px solid #444746',
                boxShadow: '0 4px 24px rgba(0,0,0,0.2)'
            }}>
                <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {onBack && (
                        <IconButton
                            onClick={onBack}
                            title="Back to Subscriptions"
                            icon={
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M3 13H11V3H3V13ZM3 21H11V15H3V21ZM13 21H21V11H13V21ZM13 3V9H21V3H13Z" fill="currentColor" />
                                </svg>
                            }
                            bgColor="transparent"
                            color="#E3E3E3"
                            hoverBgColor="#3E3E3E"
                            style={{ margin: '-8px 0 -8px -8px' }}
                        />
                    )}
                    <div>
                        <h2 style={{ margin: '0 0 4px 0', fontSize: '18px', color: '#E3E3E3', fontWeight: '500' }}>Research Subscription</h2>
                        <p style={{ margin: 0, fontSize: '13px', color: '#C4C7C5' }}>Get AI-powered insights and pricing analysis</p>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                        <CustomSelect
                            value={selectedSubscription}
                            onChange={handleSubscriptionChange}
                            options={subscriptionOptions}
                            placeholder="Select Subscription"
                        />
                    </div>
                    {selectedSubscription && (
                        <IconButton
                            onClick={handleClearCache}
                            disabled={isClearingCache || isLoading || !researchData}
                            title="Clear Cache & Refresh"
                            icon={
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4C7.58 4 4.01 7.58 4.01 12C4.01 16.42 7.58 20 12 20C15.73 20 18.84 17.45 19.73 14H17.65C16.83 16.33 14.61 18 12 18C8.69 18 6 15.31 6 12C6 8.69 8.69 6 12 6C13.66 6 15.14 6.69 16.22 7.78L13 11H20V4L17.65 6.35Z" fill="currentColor" />
                                </svg>
                            }
                            bgColor="#2D2D2D"
                            color="#E3E3E3"
                            hoverBgColor="#3E3E3E"
                            style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '12px',
                                border: '1px solid #444746'
                            }}
                        />
                    )}
                </div>
            </div>

            {isLoading && (
                <div style={{
                    width: '100%',
                    maxWidth: '600px',
                    padding: '40px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    flexDirection: 'column',
                    gap: '16px',
                    color: '#C4C7C5',
                    fontFamily: "'Google Sans Flex', sans-serif"
                }}>
                    <Loader size={48} />
                    <span style={{ fontSize: '14px', fontWeight: '500' }}>Analyzing subscription details...</span>
                </div>
            )}

            {researchData && !isLoading && (
                <SubscriptionDetailCard data={researchData} />
            )}

            <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
        </div>
    );
}
