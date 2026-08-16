/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ENABLE_SANDBOX_AUTH?: string;
  readonly VITE_OTHER_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
