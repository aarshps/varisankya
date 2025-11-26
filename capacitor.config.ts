import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.varisankya.app',
    appName: 'Varisankya',
    webDir: 'out',
    plugins: {
        CapacitorHttp: {
            enabled: true
        }
    }
};

export default config;
