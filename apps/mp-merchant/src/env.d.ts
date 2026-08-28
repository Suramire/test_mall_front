/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MP_MERCHANT_APPID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
