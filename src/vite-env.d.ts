/// <reference types="vite/client" />

// Injetados em tempo de build pelo `define` do vite.config.ts.
// Fonte da versão: package.json. Ver docs/VERSIONING.md.
declare const __APP_VERSION__: string;
/** SHA curto (7 chars) do commit que gerou o build. Vazio se indisponível. */
declare const __BUILD_COMMIT__: string;
/** 'production' | 'preview' | 'development' (Vercel) ou 'local'. */
declare const __BUILD_ENV__: string;
