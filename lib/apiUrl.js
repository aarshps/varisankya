// Helper to get the API base URL
export const getApiUrl = () => {
    // In Capacitor (native app), use the production API
    if (typeof window !== 'undefined' && window.Capacitor) {
        return 'https://varisankya.vercel.app';
    }
    // In browser, use relative URLs (same origin)
    return '';
};

export default getApiUrl;
