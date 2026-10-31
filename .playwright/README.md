# Verificação no navegador

Esta pasta é a rede de proteção do sistema. Ela existe porque **quase nenhum
defeito importante deste projeto foi pego pelo compilador**: preço que some,
peça que não entra no encaixe, campo sem rótulo, caixa que não alterna, chip
com o dobro da largura — todos apareceram medindo no navegador.

## Como rodar

```bash
npm test          # suíte rápida (~2 min)
npm run test:tudo # inclui os testes de encaixe, que levam minutos
```

O runner (`executar.mjs`) sobe o `vite` sozinho se ele não estiver de pé, roda
cada teste num processo próprio e **sai com código ≠ 0 se algum reprovar**.
Para rodar um só:

```bash
node .playwright/teste-folgas.mjs
node .playwright/executar.mjs --só=encaixe
```

## Por que `dev-preview.html`

As calculadoras são renderizadas **sem login** em `/dev-preview.html?tab=lona`.
Sem isso, todo teste teria que autenticar no Supabase. O arquivo não entra no
build de produção (o `vite build` gera só `index.html`).

É preciso um `.env.local` com as credenciais públicas do `.env.example`.

## O que cada teste protege

| arquivo | o que reprova |
|---|---|
| `smoke-todas-abas.mjs` | aba que quebra ao abrir, em qualquer uma das 11 |
| `auditoria-ui.mjs` | campo sem nome acessível; `<label>` apontando para nada |
| `verifica-chips.mjs` | preço na tela ≠ área × preço do chip × NF |
| `larguras-chips.mjs` | lista de produto fora do padrão de largura das outras |
| `teste-clique-caixa.mjs` | caixa que não alterna ao clicar no texto |
| `shot-adesivos-ordem.mjs` | ordem e largura dos blocos da aba Adesivos |
| `teste-dxf.mjs` | parser de DXF: área lida ≠ área exata da figura |
| `teste-ordem-fachada.mjs` | reordenar a lista mexendo na escolha do vendedor |
| `teste-toldo.mjs` | contas de solda, viseira e laterais do toldo |
| `teste-folgas.mjs` | folga real entre peças/borda menor que a pedida |
| `teste-sobreposicao.mjs` | peça em cima de peça (preço menor que o real) |
| `teste-encaixe-ui.mjs` | fluxo de arquivo → encaixe → preço, ponta a ponta |
| `teste-paralelo.mjs` | encaixe em paralelo ≠ encaixe em série |
| `teste-cache-nfp.mjs` | cache de NFP alterando a área cobrada |

## Fixtures

`fixtures/` tem os arquivos de prova, **feitos à mão de propósito** para forçar
os casos difíceis:

- `letreiro.svg` — grupo com `transform`, letra com vazado em subpath relativo
  e traço aberto que deve ser descartado.
- `frase-13-formas.svg` — 36 peças em 13 formas distintas, que é o caso que
  realmente pesa no encaixe (letras repetidas não custam, letras diferentes
  sim). Gerado por `fixtures/gera-letreiro13.mjs`.
- `pecas.dxf` — bulge de 90°, arruela (furo), triângulo em 3 `LINE` soltas
  (testa a costura por pontas) e bloco via `INSERT`. Cada figura tem **área
  exata conhecida**, conferida por `teste-dxf.mjs`. Gerado por
  `fixtures/gera-dxf.mjs`.

**Área esperada de curva é a do polígono achatado, não a da curva exata.**
Achatar com tolerância de 0,8mm corta para dentro de propósito: um círculo de
r=40 em 16 lados dá 4898 mm², não os 5026 do círculo. Conferir contra a curva
exata reprovaria o parser por fazer exatamente o que deve.

## Ao escrever um teste novo

1. **Saia com `process.exit(1)` quando reprovar.** Imprimir "FALHOU" e sair 0
   faz o runner dar tudo verde — já aconteceu aqui.
2. **Meça o número, não a aparência.** Captura de tela não reprova nada.
3. **Confira que o teste sabe falhar**: quebre o código de propósito uma vez e
   veja o teste reprovar. Um teste que compara `null` com `null` passa sempre —
   também já aconteceu aqui, no `teste-cache-nfp`.
