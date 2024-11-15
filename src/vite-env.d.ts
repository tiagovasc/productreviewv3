/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OPENAI_API_KEY: string;
  readonly VITE_YOUTUBE_API_KEY: string;
  readonly VITE_PERPLEXITY_API_KEY: string;
  readonly VITE_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '*.png' {
  const value: string;
  export default value;
}