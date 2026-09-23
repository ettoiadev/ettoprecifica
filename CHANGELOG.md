# Changelog

Mudanças relevantes do ettoprecifica, organizadas por release.
Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/);
versionamento conforme [Semantic Versioning](https://semver.org/lang/pt-BR/).

O processo de release está em [`docs/VERSIONING.md`](docs/VERSIONING.md).
Só entra aqui o que importa para quem **usa** o sistema — refatoração interna
que não muda nada na tela não precisa de linha própria.

## [Não lançado]

### Adicionado
- Aba **Fachada** com preço por m² editável em Configurações (tipos de ACM e
  de lona, cada um com preço e valor mínimo próprios).
- Exibição da versão do sistema no cabeçalho e bloco **Sobre** em
  Configurações → Geral (versão, build e ambiente).

### Melhorado
- Padronização visual de todas as calculadoras: campos, caixas de seleção e
  botões passaram a ser os mesmos em todas as abas.
- Interface mais sóbria e com menos ruído (sem gradientes decorativos nem
  fundo animado), no padrão de sistema administrativo.
- Títulos de aba não aparecem mais duplicados na tela.
- Nomes dos tipos de adesivo maiores, para leitura mais rápida no atendimento.

## [2.0.0] — marco inicial do versionamento

Estado do sistema em produção quando o versionamento formal foi adotado
(23/09/2026). As mudanças anteriores a esta data não foram reconstruídas
retroativamente — o histórico detalhado está no git e no `CLAUDE.md`.

Resumo do que o sistema faz nesta versão:

- Calculadoras de Adesivos, Lona, Placas (PS e ACM), Fachada, ACM 3D, Letra
  Caixa, Vidro, Luminoso, Laser, DTF e Cavaletes.
- Preço manual editável em Configurações para Adesivos, Lona, Placas, Fachada,
  Laser, DTF e Etiquetas; demais produtos precificados pelo motor da skill.
- Nota fiscal embutida por padrão, com opção de remover a alíquota por orçamento.
- Deslocamento calculado por CEP (distância e custo), opcional por orçamento.
- Carrinho de cotação acumulando itens de qualquer aba e cópia de orçamento
  pronta para enviar ao cliente.
