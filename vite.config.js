import { defineConfig } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  esbuild: {
    jsx: 'transform',
    jsxFactory: 'React.createElement',
    jsxFragment: 'React.Fragment',
    include: /\.[jt]sx?$/,
  },
  resolve: {
    alias: {
      'react': path.resolve(__dirname, 'src/lib/react-shim.js'),
      'react-dom/client': path.resolve(__dirname, 'src/lib/react-dom-client-shim.js'),
      'react-dom': path.resolve(__dirname, 'src/lib/react-dom-shim.js'),
    },
  },
  server: { open: true },
});
