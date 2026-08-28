import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // 拆分体积最大的三个依赖，避免单 chunk 超 1MB：
        // echarts 仅工作台用到，独立成块后其它页面不必加载
        manualChunks: {
          vue: ['vue', 'vue-router', 'pinia'],
          'element-plus': ['element-plus'],
          echarts: ['echarts'],
        },
      },
    },
  },
  server: {
    port: 3001,
    proxy: {
      // 真实联调：转发到本地后端（8001 为平台端联调实例，避开 8000 上的其他 agent）
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
});
