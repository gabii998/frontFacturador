/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_AFIP_CF_ID_THRESHOLD?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

