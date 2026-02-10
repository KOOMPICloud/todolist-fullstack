/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_KOOMPI_PROVIDER_CLIENT_ID: string
  readonly VITE_KOOMPI_PROVIDER_REDIRECT_URI: string
  readonly VITE_API_URL: string
  // Add more environment variables as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
