import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'de.ueberstundenrechner.app',
  appName: 'Überstundenrechner',
  webDir: 'www',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    Preferences: {},
    Dialog: {}
  }
};

export default config;
