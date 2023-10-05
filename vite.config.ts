import { defineConfig } from 'vite';
import viteTsconfigPaths from 'vite-tsconfig-paths';
import dts from 'vite-plugin-dts';

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    lib: {
      entry: "src/index.ts",
      name: "pnpm-workspace-export",
      fileName: "index",
      formats: ["es"],
    },
    rollupOptions: {
      external: ["fs/promises"],
    },
  },
  plugins: [
    viteTsconfigPaths(),
    dts({
      insertTypesEntry: true,
    }),
  ],
});
