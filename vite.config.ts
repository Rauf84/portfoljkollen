import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const isCodespace = Boolean(process.env.CODESPACE_NAME);

const codespaceHost = isCodespace
  ? `${process.env.CODESPACE_NAME}-5173.${process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN ?? 'app.github.dev'}`
  : undefined;

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    hmr: isCodespace
      ? {
          host: codespaceHost,
          port: 443,
          protocol: 'wss'
        }
      : undefined
  }
});
