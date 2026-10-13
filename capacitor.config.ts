import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ps.edu.rafiqalmushrif',
  appName: 'رفيق المشرف',
  webDir: 'dist',
  backgroundColor: '#0f172a',
  android: {
    allowMixedContent: false,
    captureInput: true,
  },
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
    },
  },
};

export default config;
