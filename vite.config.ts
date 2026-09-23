import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";

// Fonte ÚNICA da versão: o campo "version" do package.json. Nada de número de
// versão duplicado em outro arquivo — ver docs/VERSIONING.md.
const pkg = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf-8")) as {
  version: string;
};

// Commit do build. Em deploy na Vercel vem pronto de VERCEL_GIT_COMMIT_SHA
// (variável de sistema, exposta ao build automaticamente); em build local cai
// para o git da máquina; se nada disso existir, fica vazio e a UI omite.
const resolveCommit = (): string => {
  const fromVercel = process.env.VERCEL_GIT_COMMIT_SHA;
  if (fromVercel) return fromVercel.slice(0, 7);
  try {
    return execSync("git rev-parse --short=7 HEAD", { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
  } catch {
    return "";
  }
};

// Ambiente do build: 'production' | 'preview' | 'development' vêm da Vercel
// (VERCEL_ENV). Fora da Vercel é 'local'. Só isso aparece na UI — nenhuma
// outra variável de ambiente é embutida no bundle.
const resolveEnv = (): string => process.env.VERCEL_ENV || "local";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
  },
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __BUILD_COMMIT__: JSON.stringify(resolveCommit()),
    __BUILD_ENV__: JSON.stringify(resolveEnv()),
  },
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
