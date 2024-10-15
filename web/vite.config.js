import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import eslint from 'vite-plugin-eslint';

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: true,
    proxy: {
      "/info": {
        target: "http://127.0.0.1:8000",
        secure: false,
      },
      "/workflow": {
        target: "http://127.0.0.1:8000",
        secure: false,
      },
      "/node": {
        target: "http://127.0.0.1:8000",
        secure: false,
        bypass: function(req, res, proxyOptions) {
            if (req.url.startsWith('/node_modules')) {
                return req.url;
            }
            return null;
        }
      },
      "/connection": {
        target: "http://127.0.0.1:8000",
        secure: false,
        bypass: function(req, res, proxyOptions) {
          if (req.url.startsWith('/connections')) {
              return req.url;
          }
          return null;
        }
      },
      "/flow": {
        target: "http://127.0.0.1:8000",
        secure: false,
        bypass: function(req, res, proxyOptions) {
          if (req.url.startsWith('/flows')) {
              return req.url;
          }
          return null;
        }
      },
      "/process": {
        target: "http://127.0.0.1:8000",
        secure: false,
        bypass: function(req, res, proxyOptions) {
          if (req.url.startsWith('/processes')) {
              return req.url;
          }
          return null;
        }
      },
      "/model": {
        target: "http://127.0.0.1:8000",
        secure: false,
        bypass: function(req, res, proxyOptions) {
          if (req.url.startsWith('/models')) {
              return req.url;
          }
          return null;
        }
      },
      "/instance": {
        target: "http://127.0.0.1:8000",
        secure: false,
        bypass: function(req, res, proxyOptions) {
          if (req.url.startsWith('/instances')) {
              return req.url;
          }
          return null;
        }
      },
    },
  },
  plugins: [react(), eslint()],
});
