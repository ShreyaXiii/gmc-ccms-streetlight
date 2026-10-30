/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_CCMS_API_BASE_URL: string;
  readonly VITE_DEFAULT_TARIFF_PER_KWH: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

