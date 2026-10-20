import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Le mode « demo » produit un seul fichier HTML autonome pour l'aperçu partagé.
export default defineConfig(({ mode }) => ({
  plugins: mode === 'demo' ? [react(), viteSingleFile()] : [react()],
  build: mode === 'demo' ? { outDir: 'dist-demo', emptyOutDir: true } : undefined,
  test: { environment: 'node' }
}));
