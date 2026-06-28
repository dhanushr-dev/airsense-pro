import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.airsense.pro',
  appName: 'AirSense Pro',
  webDir: 'dist',

  // Android-specific settings
  android: {
    backgroundColor: '#0f172a',
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false, // Set to true for debugging
  },

  // Plugins configuration
  plugins: {
    // Splash screen settings
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#0f172a',
      androidScaleType: 'CENTER_CROP',
      showSpinner: true,
      spinnerColor: '#3b82f6',
    },

    // Geolocation settings
    Geolocation: {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000,
    },
  },

  // Server configuration (for native app)
  server: {
    androidScheme: 'https',
    cleartext: false,
  },
};

export default config;
