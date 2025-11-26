import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.varisankya.app',
    appName: 'Varisankya',
    webDir: 'public',
    plugins: {
        GoogleAuth: {
            scopes: ['profile', 'email'],
            serverClientId: '632270986797-irj4q05686000593441584t04297426e.apps.googleusercontent.com',
            forceCodeForRefreshToken: true,
        },
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
