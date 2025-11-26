import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.varisankya.app',
    appName: 'Varisankya',
    webDir: 'public',
    plugins: {
        CapacitorHttp: {
            enabled: true
        }
    },
    server: {
        url: 'https://varisankya.vercel.app',
        allowNavigation: [
            "varisankya.vercel.app",
            "*.varisankya.vercel.app",
            "accounts.google.com",
            "*.google.com"
        ]
    }
};

export default config;
