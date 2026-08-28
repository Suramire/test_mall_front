/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  /** 是否启用 Mock（默认 false，真实 API 优先） */
  readonly VITE_ENABLE_MOCK?: string;
  /** 商家管理后台地址（代客登录 SSO 跳转目标） */
  readonly VITE_MC_ADMIN_URL?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
