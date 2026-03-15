import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.elrico.zenova',
  appName: 'Zenova',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
