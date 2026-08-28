/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MP_USER_APPID?: string;
  readonly VITE_ENABLE_DEV_LOGIN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
