import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    // This allows using process.env.API_KEY in the code by replacing it at build time
    define: {
      'process.env.API_KEY': JSON.stringify(env.VITE_API_KEY),
    },
    server: {
      port: 3000,
      open: true
    }
  };
});