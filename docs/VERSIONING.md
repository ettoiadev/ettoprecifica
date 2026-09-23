# Versionamento e releases — ettoprecifica

Como a versão do sistema é definida, exibida e publicada. Processo deliberadamente
simples: **GitHub + Vercel**, sem ferramenta externa, sem pipeline extra.

## 1. Conceitos (não confundir)

| Termo | O que é |
|---|---|
| **Commit** | Uma alteração de código. Não muda a versão. |
| **Deploy** | Publicação feita pela Vercel. Todo push gera um. Não muda a versão. |
| **Release** | Uma versão estável, publicada em produção e validada. **Só ela ganha número novo e tag.** |

Consequência prática: a versão **não sobe a cada commit**. Vários commits (e vários
deploys de preview) se acumulam até formarem uma release.

## 2. Padrão de versão

[Semantic Versioning](https://semver.org/lang/pt-BR/): `MAJOR.MINOR.PATCH`.

| Parte | Quando subir | Exemplo |
|---|---|---|
| **PATCH** | Correção de bug, ajuste visual, melhoria pequena | `2.0.0` → `2.0.1` |
| **MINOR** | Funcionalidade nova, compatível com o que já existe | `2.0.1` → `2.1.0` |
| **MAJOR** | Mudança estrutural ou que quebra o uso atual | `2.9.3` → `3.0.0` |

Na dúvida entre PATCH e MINOR: se o vendedor vai **perceber que ganhou algo
novo**, é MINOR. Se ele só vai notar que algo **parou de estar errado**, é PATCH.

### Versão atual e por que ela começa em 2.0.0

Quando o versionamento foi formalizado (23/09/2026), o `package.json` já trazia
`2.0.0` e o sistema já estava em uso diário em produção. Manter esse número foi
decisão consciente: baixar para `0.x` diria que o sistema não está pronto (falso),
e trocar por outro número arbitrário só jogaria fora a referência que já existia.
**`2.0.0` é o marco zero**; a disciplina SemVer vale a partir da próxima release.

## 3. Fonte única da versão

O campo `version` do **`package.json`**. Só ele.

```
"version": "2.0.0"
```

O `vite.config.ts` lê esse campo no build e injeta em três constantes globais
(`__APP_VERSION__`, `__BUILD_COMMIT__`, `__BUILD_ENV__`), consumidas pela
aplicação via `src/lib/version.ts`. **Nunca escreva o número da versão em outro
arquivo** — nenhuma tela, nenhum texto fixo. Se precisar exibir em algum lugar
novo, importe de `src/lib/version.ts`.

## 4. Identificação do build

| Dado | De onde vem | Fallback |
|---|---|---|
| Versão | `package.json` | — |
| Build (commit) | `VERCEL_GIT_COMMIT_SHA` (variável de sistema da Vercel), cortado em 7 caracteres | `git rev-parse --short=7 HEAD` em build local; vazio se não houver git |
| Ambiente | `VERCEL_ENV` (`production` / `preview` / `development`) | `local` fora da Vercel |

Nada além disso é embutido no bundle — sem tokens, sem chaves, sem URL interna.

> Se o campo "Build" aparecer vazio em produção, o motivo provável é a opção
> **Automatically expose System Environment Variables** estar desligada em
> Vercel → Project Settings → Environment Variables. Ligue-a e refaça o deploy.

## 5. Onde a versão aparece

- **Cabeçalho**: `v2.0.0` discreto ao lado do nome do sistema. Em ambiente que
  **não** é produção, aparece também um badge (`Preview`, `Local`) — assim dá
  para saber de imediato que aquela aba não é a produção.
- **Configurações → Geral → Sobre**: versão, build e ambiente completos.

Ambos seguem o Design System (`docs/DESIGN_SYSTEM.md`) e usam componentes já
existentes (`Badge` do shadcn/ui, tipografia e cores dos tokens). Não criar um
componente próprio só para mostrar versão.

## 6. Branch de produção

**`main`** é a branch de produção (é a branch default do repositório —
`origin/HEAD → origin/main`). Todo merge em `main` gera deploy de produção na
Vercel; qualquer outra branch ou PR gera **Preview Deploy**, que não muda a
versão e é identificado pelo badge na interface.

> Confirmar uma vez em Vercel → Project Settings → Git → *Production Branch* que
> está mesmo `main`. Essa configuração vive no painel da Vercel, não no repositório.

## 7. Processo de release

1. Desenvolvimento concluído e testado (`tsc --noEmit` e `vite build` limpos).
2. Decidir se é **PATCH**, **MINOR** ou **MAJOR** (tabela da seção 2).
3. Subir a versão — **não** edite o `package.json` na mão:
   ```bash
   npm run release:patch    # 2.0.0 -> 2.0.1
   npm run release:minor    # 2.0.1 -> 2.1.0
   npm run release:major    # 2.1.0 -> 3.0.0
   ```
   Esses scripts usam `npm version --no-git-tag-version`: alteram só o
   `package.json` (e o `package-lock.json`), **sem** criar commit nem tag — a tag
   vem depois, só quando a produção estiver validada.
4. Mover as linhas de `## [Não lançado]` do `CHANGELOG.md` para uma seção nova
   com o número da versão.
5. Commitar a release:
   ```bash
   git add package.json package-lock.json CHANGELOG.md
   git commit -m "chore(release): v2.0.1"
   ```
6. `git push origin main`.
7. Aguardar o deploy da Vercel concluir.
8. **Validar em produção** — abrir o sistema e conferir em Configurações → Geral
   se a versão e o build exibidos são os esperados.
9. Só então criar a tag, apontando para o commit da release:
   ```bash
   git tag v2.0.1
   git push origin v2.0.1
   ```

Se a validação do passo 8 falhar, **não crie a tag**: corrija, gere um novo
commit e repita a partir do passo 6 (a versão já subiu e pode continuar a mesma,
já que ela nunca chegou a ser marcada como release).

## 8. Git Tags

- Formato: `v` + versão. Ex.: `v2.0.1`, `v2.1.0`, `v3.0.0`.
- Uma tag por release, apontando para o commit exato publicado.
- Criadas **manualmente**, depois de validar a produção (passo 9 acima).
- Não existe tag no repositório até hoje (`git tag -l` vazio em 23/09/2026) — a
  primeira será criada na primeira release feita por este processo.

Listar releases: `git tag -l` · Ver o que entrou numa tag: `git show v2.0.1`.

## 9. Voltar para uma release anterior

A Vercel é o caminho mais rápido e não mexe no repositório:

**Opção A — rollback pela Vercel (recomendado, imediato).**
Vercel → Deployments → localizar o deploy da versão boa → menu `…` →
**Promote to Production** (ou *Instant Rollback*). Produção volta na hora,
sem tocar no git. Serve para apagar incêndio.

**Opção B — reverter no código (quando o problema precisa sumir do histórico).**
```bash
git revert <sha-do-commit-problema>    # cria um commit que desfaz o anterior
git push origin main
```
Depois trate como uma nova release PATCH (a versão sobe, não volta).

> Não use `git reset --hard` nem force-push em `main` para desfazer release
> publicada: reescrever histórico de branch compartilhada quebra o repositório
> de quem já puxou. Reverter é sempre preferível a apagar.

Para inspecionar o código de uma release antiga sem alterar nada:
```bash
git checkout v2.0.0     # entra em detached HEAD, só leitura
git checkout main       # volta
```

## 10. O que deliberadamente NÃO temos

Sem pipeline de CI/CD próprio, sem ferramenta de release management, sem bump
automático de versão por commit, sem changelog gerado por robô. O fluxo é
GitHub + Vercel + os passos da seção 7. Se algum dia isso apertar, o candidato
natural é gerar a tag no passo 9 por GitHub Action — mas só quando o processo
manual incomodar de verdade.
