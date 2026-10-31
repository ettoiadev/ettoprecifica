import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  // reference-ui e clone de terceiros (gitignorado, so para consulta visual) e
  // .playwright sao scripts de verificacao em Node, nao codigo da aplicacao.
  // Sem isto o lint falha em codigo que nao e nosso — 8 dos 14 erros vinham
  // de regras do Next que nem estao instaladas aqui — e deixa de servir de
  // portao no CI.
  { ignores: ["dist", "reference-ui/**", ".playwright/**", "supabase/functions/**"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "@typescript-eslint/no-unused-vars": "off",
    },
  }
);
