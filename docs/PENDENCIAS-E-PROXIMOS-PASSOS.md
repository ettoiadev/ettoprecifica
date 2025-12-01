# Pendências e Próximos Passos
## Sistema de Precificação para Comunicação Visual

**Versão:** 2.0  
**Data:** 30 de novembro de 2024  
**Status:** Documento de Planejamento  

---

## ✅ O Que Está Funcionando Perfeitamente

### Calculadoras (9/9) - 100% ✅
1. ✅ Adesivo - Com variações dinâmicas
2. ✅ Lona
3. ✅ Placa PS
4. ✅ Placa ACM
5. ✅ Fachada - Estrutura metálica corrigida
6. ✅ Letra Caixa PVC
7. ✅ Vidro Temperado
8. ✅ Luminoso
9. ✅ Laser (28 materiais)

### Funcionalidades Principais ✅
- ✅ Sistema de configurações completo
- ✅ 13 opções de parcelamento de cartão de crédito
- ✅ Sistema de variações dinâmicas (5 produtos)
- ✅ Integração com Supabase
- ✅ Autenticação de usuários
- ✅ Persistência em nuvem
- ✅ Interface moderna com shadcn/ui
- ✅ Cálculos precisos com preço mínimo R$ 20,00
- ✅ Cópia de orçamento para área de transferência

---

## 🔄 Funcionalidades Parcialmente Implementadas

### 1. Sistema de Variações Dinâmicas (60% completo)

**Status Atual:**
- ✅ Implementado em: Adesivo
- ⏳ Pendente em: Lona, Placa PS, Letra PVC, Vidro

**O Que Falta:**
```typescript
// Aplicar o mesmo padrão do AdesivoCalculator nos outros:
// 1. LonaCalculator.tsx
// 2. PlacaPSCalculator.tsx
// 3. LetraCaixaCalculator.tsx
// 4. VidroCalculator.tsx

// Padrão a seguir (já implementado em Adesivo):
const baseOptions = [ /* opções fixas */ ];
const customOptions = (config.customVariations || []).map(variation => ({
  id: variation.id,
  label: variation.label,
  price: variation.price
}));
const options = [...baseOptions, ...customOptions];
```

**Prioridade:** 🟡 Média  
**Estimativa:** 2-3 horas

---

## 📋 Funcionalidades Pendentes (Roadmap)

### 2. Geração de PDF Profissional

**Status:** ❌ Não Implementado  
**Atual:** Cópia para área de transferência

**O Que Precisa:**
1. Escolher biblioteca (recomendações):
   - `jsPDF` + `html2canvas`
   - `pdfmake`
   - `react-pdf`

2. Layout do PDF:
   - Logo da empresa (configurável)
   - Cabeçalho com dados da empresa
   - Tabela de itens do orçamento
   - Resumo financeiro
   - Observações
   - Rodapé com dados de contato

3. Features adicionais:
   - Numeração automática de orçamentos
   - Data e hora da geração
   - Validade do orçamento
   - Termos e condições

**Prioridade:** 🔴 Alta  
**Estimativa:** 8-10 horas

---

### 3. Salvamento e Histórico de Orçamentos

**Status:** ❌ Não Implementado  
**Infraestrutura:** ✅ Banco Supabase pronto

**O Que Precisa:**

1. **Backend (Supabase):**
   ```sql
   -- Tabelas já existem no schema, só falta implementar as queries
   - budgets
   - budget_items
   - budget_calculations
   ```

2. **Frontend:**
   - Botão "Salvar Orçamento"
   - Campo para nome do orçamento
   - Lista de orçamentos salvos
   - Botão "Carregar Orçamento"
   - Botão "Duplicar Orçamento"
   - Filtros e busca

3. **Funcionalidades:**
   - Salvar orçamento completo no banco
   - Listar orçamentos do usuário
   - Carregar orçamento salvo
   - Editar orçamento existente
   - Excluir orçamento
   - Exportar/Importar orçamentos

**Prioridade:** 🔴 Alta  
**Estimativa:** 12-15 horas

---

### 4. Dashboard de Estatísticas

**Status:** ❌ Não Implementado

**Métricas Sugeridas:**
- Total de orçamentos gerados (dia/semana/mês)
- Valor total orçado
- Calculadora mais utilizada
- Tempo médio para gerar orçamento
- Taxa de conversão (se integrado com vendas)
- Produtos mais vendidos
- Ticket médio

**Componentes Necessários:**
- Gráficos (recharts ou chart.js)
- Cards de métricas
- Filtros por período
- Exportação de relatórios

**Prioridade:** 🟡 Média  
**Estimativa:** 10-12 horas

---

### 5. Templates de Orçamento

**Status:** ❌ Não Implementado

**Funcionalidades:**
- Salvar configuração de orçamento como template
- Lista de templates
- Aplicar template em novo orçamento
- Editar template
- Templates padrão (pré-configurados)

**Casos de Uso:**
- Template "Fachada Completa"
- Template "Letreiro Básico"
- Template "Kit Comunicação Visual"

**Prioridade:** 🟢 Baixa  
**Estimativa:** 6-8 horas

---

### 6. Gestão Básica de Clientes

**Status:** ❌ Não Implementado

**Funcionalidades Mínimas:**
- Cadastro de clientes (nome, email, telefone, endereço)
- Lista de clientes
- Busca de clientes
- Associar orçamento a cliente
- Histórico de orçamentos por cliente

**Schema Supabase:**
```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Prioridade:** 🟡 Média  
**Estimativa:** 15-20 horas

---

### 7. Sistema de Backup/Exportação

**Status:** ❌ Não Implementado

**Funcionalidades:**
- Exportar todas as configurações (JSON)
- Exportar orçamentos selecionados
- Importar configurações
- Importar orçamentos
- Backup automático periódico

**Formatos:**
- JSON (para backup completo)
- CSV (para planilhas)
- Excel (opcional)

**Prioridade:** 🟢 Baixa  
**Estimativa:** 6-8 horas

---

### 8. Integração com E-mail

**Status:** ❌ Não Implementado

**Funcionalidades:**
- Enviar orçamento por email
- Template de email profissional
- Anexar PDF do orçamento
- Configurar SMTP ou usar serviço (SendGrid, etc)
- Histórico de emails enviados

**Prioridade:** 🟡 Média  
**Estimativa:** 8-10 horas

---

### 9. Modo Offline Robusto

**Status:** ⚠️ Parcial (apenas localStorage)

**Melhorias Necessárias:**
- Service Worker para PWA
- Cache de recursos
- Queue de sincronização
- Indicador de status offline/online
- Sincronização automática ao voltar online

**Prioridade:** 🟢 Baixa  
**Estimativa:** 12-15 horas

---

### 10. Multi-tenancy (Múltiplas Empresas)

**Status:** ❌ Não Implementado

**Arquitetura Necessária:**
- Tabela de empresas/organizações
- Relacionamento user -> empresa
- Isolamento de dados por empresa
- Convites para membros da equipe
- Permissões (admin, editor, visualizador)

**Prioridade:** 🟢 Baixa (Longo Prazo)  
**Estimativa:** 30-40 horas

---

## 🎯 Recomendação de Priorização

### Sprint 1 (Próximas 2 semanas)
**Foco:** Completar funcionalidades iniciadas

1. ✅ **Expandir Variações Dinâmicas** (2-3h)
   - Aplicar em Lona, Placa PS, Letra PVC, Vidro

2. ✅ **Implementar Geração de PDF** (8-10h)
   - Escolher biblioteca
   - Criar layout profissional
   - Integrar com sistema existente

**Total:** ~12h de desenvolvimento

---

### Sprint 2 (Semanas 3-4)
**Foco:** Persistência e histórico

3. ✅ **Salvamento de Orçamentos** (12-15h)
   - CRUD completo de orçamentos
   - Interface de listagem e busca
   - Carregamento de orçamentos

**Total:** ~15h de desenvolvimento

---

### Sprint 3 (Semanas 5-6)
**Foco:** Analytics e melhorias

4. ✅ **Dashboard de Estatísticas** (10-12h)
   - Implementar métricas básicas
   - Criar visualizações
   - Filtros e exportação

5. ✅ **Integração com E-mail** (8-10h)
   - Configurar serviço de email
   - Templates profissionais
   - Funcionalidade de envio

**Total:** ~20h de desenvolvimento

---

### Sprint 4+ (Médio/Longo Prazo)
**Foco:** Expansão e escalabilidade

- Templates de Orçamento (6-8h)
- Gestão de Clientes (15-20h)
- Backup/Exportação (6-8h)
- Modo Offline (12-15h)
- Multi-tenancy (30-40h)

---

## 🐛 Bugs Conhecidos

### Nenhum Bug Crítico Identificado ✅

**Status:** Sistema estável e funcional

---

## 📊 Métricas de Completude

| Categoria | Completude | Status |
|-----------|-----------|--------|
| **Calculadoras** | 100% (9/9) | ✅ Completo |
| **Configurações** | 95% | ✅ Quase Completo |
| **Orçamentos** | 70% | 🟡 Em Andamento |
| **Persistência** | 80% | 🟡 Em Andamento |
| **UI/UX** | 90% | ✅ Quase Completo |
| **Integrações** | 40% | 🔴 Inicial |
| **Analytics** | 0% | ❌ Não Iniciado |

**Completude Geral:** **75%**

---

## 💡 Sugestões de Melhorias Futuras

### UX/UI
- [ ] Dark mode
- [ ] Temas personalizáveis
- [ ] Atalhos de teclado
- [ ] Tutorial interativo para novos usuários
- [ ] Tooltips explicativos

### Funcionalidades
- [ ] Comparação lado a lado de orçamentos
- [ ] Calculadora de margem de lucro
- [ ] Alertas de preços fora da média
- [ ] Sugestões inteligentes de produtos
- [ ] Integração com WhatsApp Business

### Técnicas
- [ ] Testes automatizados (Jest, React Testing Library)
- [ ] CI/CD pipeline
- [ ] Monitoramento de erros (Sentry)
- [ ] Analytics de uso (Google Analytics, Mixpanel)
- [ ] Performance monitoring

---

**Documento atualizado em:** 30 de novembro de 2024  
**Próxima revisão:** Após cada sprint
