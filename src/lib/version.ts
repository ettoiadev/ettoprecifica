// Identificação do build. Os três valores são injetados em tempo de build pelo
// `define` do vite.config.ts — a versão vem do package.json (fonte única) e o
// commit/ambiente vêm da Vercel. Nenhuma credencial, token ou URL interna é
// exposta aqui: só o que pode aparecer na tela para o vendedor.
// Ver docs/VERSIONING.md.

export const APP_NAME = 'ettoprecifica';
export const APP_VERSION = __APP_VERSION__;
/** SHA curto do commit publicado. Vazio quando o build não teve git disponível. */
export const BUILD_COMMIT = __BUILD_COMMIT__;
export const BUILD_ENV = __BUILD_ENV__;

export const isProduction = BUILD_ENV === 'production';

/** Rótulo do ambiente em português, para exibição. */
export const ENV_LABEL: Record<string, string> = {
  production: 'Produção',
  preview: 'Preview',
  development: 'Desenvolvimento',
  local: 'Local',
};

export const envLabel = (): string => ENV_LABEL[BUILD_ENV] ?? BUILD_ENV;

/** "v2.0.0" — usado no cabeçalho. */
export const versionLabel = (): string => `v${APP_VERSION}`;
