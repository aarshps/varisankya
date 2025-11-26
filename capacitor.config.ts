import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.varisankya.app',
    appName: 'Varisankya',
    webDir: 'public',
    server: {
        url: 'https://varisankya.vercel.app',
        cleartext: true
    }
};

export default config;
