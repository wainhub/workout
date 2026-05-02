import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kellum.workoutcoach',
  appName: 'Workout Coach',
  webDir: 'out',   // used only for local dev; production loads from server.url below
  server: {
    // The Capacitor WebView loads the live Vercel deployment.
    // Workout data is stored in localStorage so all tracking works offline.
    // API features (AI generation, videos) degrade gracefully without internet.
    url: 'https://workout-flax-two.vercel.app',
    cleartext: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 800,
      backgroundColor: '#000000',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
};

export default config;
