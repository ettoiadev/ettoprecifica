# reference-ui/

Material de referência visual **só para consulta durante o desenvolvimento**.
Não faz parte da aplicação: não é importado por nenhum código em `src/`, não
entra no bundle (`vite build` não olha para fora de `src/`/`public/`) e não é
versionado no git (ver `.gitignore`) — é grande demais e é código de terceiros,
não nosso, para carregar no histórico do repo.

## O que tem aqui

`orbynadmin/` — clone raso (`--depth 1`) de [masondevx/orbynadmin](https://github.com/masondevx/orbynadmin),
um template de admin dashboard MIT-licensed (Next.js + Tailwind + shadcn/ui).
Serve como referência de **estrutura de página, composição e densidade** — não
de branding, nem de cores, nem de conteúdo. Ver `/docs/DESIGN_SYSTEM.md` e
`/docs/PAGE_PATTERNS.md` para o que foi extraído dele e adaptado ao ettoprecifica.

## Se a pasta não existir (checkout novo)

```bash
mkdir -p reference-ui
git clone --depth 1 https://github.com/masondevx/orbynadmin.git reference-ui/orbynadmin
rm -rf reference-ui/orbynadmin/.git
```

Não rode `npm install` nem `npm run dev` dentro dela a menos que esteja
estudando o template isoladamente — não precisa estar funcionando para servir
de referência de leitura.

## Regra de uso

Nunca importar componentes ou copiar arquivos daqui direto para `src/`. Ler,
entender o padrão, e reimplementar adaptado ao Design System do ettoprecifica
(`/docs/DESIGN_SYSTEM.md`) usando os componentes shadcn/ui que já temos em
`src/components/ui/`.
