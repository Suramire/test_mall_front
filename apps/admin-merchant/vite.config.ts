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
    port: 3002,
    proxy: {
      // 联调时转发到后端（mock 阶段可注释）
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
});
