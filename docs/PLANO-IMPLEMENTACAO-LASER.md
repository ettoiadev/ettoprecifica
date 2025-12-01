# 📋 Plano de Implementação: Menu Laser

## 🎯 Objetivo

Criar um novo menu "Laser" com funcionalidade completa de calculadora de preços, seguindo a mesma estrutura dos menus existentes (ex: Placa PS), com integração ao Supabase e sistema de configurações.

---

## 📊 Materiais a Serem Implementados

Baseado na tabela fornecida, os materiais serão organizados em categorias:

### **Acrílico Cristal**
- 2mm - R$ 200,00/m²
- 3mm - R$ 280,00/m²
- 5mm - R$ 450,00/m²
- 8mm - R$ 850,00/m²
- 10mm - R$ 950,00/m²

### **Acrílico Colorido**
- 3mm - R$ 290,00/m²
- 5mm - R$ 340,00/m²
- 8mm - R$ 800,00/m²
- 10mm - R$ 1.190,00/m²

### **Acrílico Preto/Fumê**
- 3mm - R$ 150,00/m²
- 5mm - R$ 180,00/m²
- 8mm - R$ 830,00/m²

### **PS Cristal**
- 1mm - R$ 110,00/m²
- 2mm - R$ 180,00/m²
- 3mm - R$ 350,00/m²

### **PSAI Branco**
- 1mm/0mm - R$ 150,00/m²
- 2mm - R$ 120,00/m²
- 3mm - R$ 160,00/m²

### **PSAI Colorido**
- 2mm - R$ 180,00/m²

### **MDF**
- 3mm - R$ 130,00/m²
- 6mm - R$ 90,00/m²
- 9mm - R$ 90,00/m²

### **Outros Materiais**
- PE 3mm - R$ 130,00/m²
- PETG 3mm - R$ 260,00/m²
- Espelhado Prata 2mm - R$ 300,00/m²
- Espelhado Prata/Dourado 3mm - R$ 360,00/m²

**Total: 28 materiais diferentes**

---

## 🛠️ Estrutura de Implementação

### **Passo 1: Definição de Tipos (pricing.ts)**

Criar interface `LaserConfig` com todos os materiais:

```typescript
export interface LaserConfig {
  // Acrílico Cristal
  acrilicoCristal2mm: number;
  acrilicoCristal3mm: number;
  acrilicoCristal5mm: number;
  acrilicoCristal8mm: number;
  acrilicoCristal10mm: number;
  
  // Acrílico Colorido
  acrilicoColorido3mm: number;
  acrilicoColorido5mm: number;
  acrilicoColorido8mm: number;
  acrilicoColorido10mm: number;
  
  // Acrílico Preto/Fumê
  acrilicoPretoFume3mm: number;
  acrilicoPretoFume5mm: number;
  acrilicoPretoFume8mm: number;
  
  // PS Cristal
  psCristal1mm: number;
  psCristal2mm: number;
  psCristal3mm: number;
  
  // PSAI Branco
  psaiBranco1mm: number;
  psaiBranco2mm: number;
  psaiBranco3mm: number;
  
  // PSAI Colorido
  psaiColorido2mm: number;
  
  // MDF
  mdf3mm: number;
  mdf6mm: number;
  mdf9mm: number;
  
  // Outros
  pe3mm: number;
  petg3mm: number;
  espelhadoPrata2mm: number;
  espelhadoPrataDourado3mm: number;
}
```

**Adicionar ao PricingConfig:**
```typescript
export interface PricingConfig {
  // ... configs existentes
  laser: LaserConfig;  // NOVO
}
```

**Adicionar valores padrão:**
```typescript
export const defaultConfig: PricingConfig = {
  // ... configs existentes
  laser: {
    acrilicoCristal2mm: 200.0,
    acrilicoCristal3mm: 280.0,
    acrilicoCristal5mm: 450.0,
    acrilicoCristal8mm: 850.0,
    acrilicoCristal10mm: 950.0,
    acrilicoColorido3mm: 290.0,
    acrilicoColorido5mm: 340.0,
    acrilicoColorido8mm: 800.0,
    acrilicoColorido10mm: 1190.0,
    acrilicoPretoFume3mm: 150.0,
    acrilicoPretoFume5mm: 180.0,
    acrilicoPretoFume8mm: 830.0,
    psCristal1mm: 110.0,
    psCristal2mm: 180.0,
    psCristal3mm: 350.0,
    psaiBranco1mm: 150.0,
    psaiBranco2mm: 120.0,
    psaiBranco3mm: 160.0,
    psaiColorido2mm: 180.0,
    mdf3mm: 130.0,
    mdf6mm: 90.0,
    mdf9mm: 90.0,
    pe3mm: 130.0,
    petg3mm: 260.0,
    espelhadoPrata2mm: 300.0,
    espelhadoPrataDourado3mm: 360.0,
  }
}
```

---

### **Passo 2: Componente LaserCalculator.tsx**

Estrutura similar ao PlacaPSCalculator:

```typescript
import React, { useState, useEffect } from 'react';
import { LaserConfig, formatCurrency, calculateMinimumCharge, PricingConfig } from '../../types/pricing';
import BudgetSummaryExtended from '../BudgetSummaryExtended';

interface Props {
  config: LaserConfig;
  fullConfig: PricingConfig;
}

const LaserCalculator: React.FC<Props> = ({ config, fullConfig }) => {
  const [largura, setLargura] = useState<string>('');
  const [altura, setAltura] = useState<string>('');
  const [quantidade, setQuantidade] = useState<number>(1);
  const [materialSelecionado, setMaterialSelecionado] = useState<string>('');
  const [total, setTotal] = useState<number>(0);

  // Cálculos de área
  const larguraNum = parseFloat(largura) || 0;
  const alturaNum = parseFloat(altura) || 0;
  const area = larguraNum * alturaNum;
  const areaTotal = area * quantidade;

  // useEffect para cálculo do total
  useEffect(() => {
    if (area > 0 && materialSelecionado && quantidade > 0) {
      const precoM2 = config[materialSelecionado as keyof LaserConfig];
      const subtotal = area * precoM2 * quantidade;
      setTotal(calculateMinimumCharge(subtotal));
    } else {
      setTotal(0);
    }
  }, [largura, altura, quantidade, materialSelecionado, config]);

  // Organizar materiais por categoria para exibição
  const materiaisPorCategoria = {
    'Acrílico Cristal': [
      { key: 'acrilicoCristal2mm', label: '2mm' },
      { key: 'acrilicoCristal3mm', label: '3mm' },
      { key: 'acrilicoCristal5mm', label: '5mm' },
      { key: 'acrilicoCristal8mm', label: '8mm' },
      { key: 'acrilicoCristal10mm', label: '10mm' },
    ],
    'Acrílico Colorido': [
      { key: 'acrilicoColorido3mm', label: '3mm' },
      { key: 'acrilicoColorido5mm', label: '5mm' },
      { key: 'acrilicoColorido8mm', label: '8mm' },
      { key: 'acrilicoColorido10mm', label: '10mm' },
    ],
    // ... mais categorias
  };

  return (
    <div className="p-6">
      {/* Inputs de dimensões e quantidade */}
      {/* Radio buttons organizados por categoria */}
      {/* BudgetSummaryExtended */}
    </div>
  );
};

export default LaserCalculator;
```

**Características:**
- ✅ Inputs para largura, altura e quantidade
- ✅ Cálculo automático de área unitária e total
- ✅ Radio buttons organizados por categoria de material
- ✅ Preço mínimo de R$ 20,00 aplicado automaticamente
- ✅ Integração com BudgetSummaryExtended
- ✅ Nome do produto dinâmico (ex: "Laser Acrílico Cristal 3mm")

---

### **Passo 3: Adicionar Tab no ModernTabs.tsx**

Adicionar novo tab com ícone apropriado:

```typescript
import { Zap } from 'lucide-react';  // Ícone de Laser

const tabs = [
  // ... tabs existentes
  {
    id: 'laser',
    label: 'Laser',
    icon: Zap,  // Ícone de raio/laser
    color: 'from-pink-500 to-rose-500'
  }
];
```

---

### **Passo 4: Atualizar Index.tsx**

**Import:**
```typescript
import LaserCalculator from '../components/calculators/LaserCalculator';
```

**Adicionar no getTabTitle:**
```typescript
const titles: Record<string, string> = {
  // ... títulos existentes
  'laser': 'Calculadora de Laser',
};
```

**Adicionar no renderCalculator:**
```typescript
case 'laser':
  return <LaserCalculator config={config.laser} fullConfig={config} />;
```

---

### **Passo 5: Configurações no settingsConfig.ts**

Adicionar seção completa de configuração:

```typescript
{
  title: "Laser",
  section: "laser",
  fields: [
    // Acrílico Cristal
    { key: 'acrilicoCristal2mm', label: 'Acrílico Cristal 2mm', unit: 'm²' },
    { key: 'acrilicoCristal3mm', label: 'Acrílico Cristal 3mm', unit: 'm²' },
    { key: 'acrilicoCristal5mm', label: 'Acrílico Cristal 5mm', unit: 'm²' },
    { key: 'acrilicoCristal8mm', label: 'Acrílico Cristal 8mm', unit: 'm²' },
    { key: 'acrilicoCristal10mm', label: 'Acrílico Cristal 10mm', unit: 'm²' },
    
    // Acrílico Colorido
    { key: 'acrilicoColorido3mm', label: 'Acrílico Colorido 3mm', unit: 'm²' },
    { key: 'acrilicoColorido5mm', label: 'Acrílico Colorido 5mm', unit: 'm²' },
    { key: 'acrilicoColorido8mm', label: 'Acrílico Colorido 8mm', unit: 'm²' },
    { key: 'acrilicoColorido10mm', label: 'Acrílico Colorido 10mm', unit: 'm²' },
    
    // ... todos os 28 materiais
  ]
}
```

---

## 📁 Arquivos a Serem Modificados/Criados

### **Modificados:**
1. ✅ `src/types/pricing.ts` - Adicionar LaserConfig
2. ✅ `src/components/ModernTabs.tsx` - Adicionar tab Laser
3. ✅ `src/pages/Index.tsx` - Adicionar rota e renderização
4. ✅ `src/components/settings/settingsConfig.ts` - Adicionar configurações

### **Criados:**
1. ✅ `src/components/calculators/LaserCalculator.tsx` - Novo componente
2. ✅ `docs/IMPLEMENTACAO-LASER.md` - Documentação completa

---

## 🎨 Interface do Usuário

### **Layout da Calculadora**

```
┌─────────────────────────────────────────────────────────┐
│ Calculadora de Laser                                    │
│ Configure o material e informe as dimensões.            │
├─────────────────────┬───────────────────────────────────┤
│ Dimensões           │ Resumo do Orçamento               │
│ ┌─────┬──────┬────┐ │                                   │
│ │Larg.│Altura│Qtd.│ │ Dimensões: 0.50 x 0.30 m         │
│ │0.50 │ 0.30 │ 1  │ │ Quantidade: 1 unidade(s)          │
│ └─────┴──────┴────┘ │ Área unitária: 0.15 m²            │
│                     │ Área total: 0.15 m²               │
│ Material            │ Material: Acrílico Cristal 3mm    │
│ ┌─────────────────┐ │                                   │
│ │☐ Acrílico       │ │ Subtotal: R$ 42,00                │
│ │  Cristal        │ │                                   │
│ │  ◉ 2mm  200,00  │ │ ☑ Nota Fiscal (+15%)              │
│ │  ○ 3mm  280,00  │ │ Taxa: +R$ 6,30                    │
│ │  ○ 5mm  450,00  │ │                                   │
│ │  ...            │ │ Custos Cartão: Não aplicar        │
│ │☐ Acrílico       │ │                                   │
│ │  Colorido       │ │ Custo de Instalação: Nenhuma      │
│ │  ...            │ │                                   │
│ │☐ MDF            │ │ Total Final: R$ 48,30             │
│ │  ...            │ │                                   │
│ └─────────────────┘ │ [Copiar Orçamento]                │
└─────────────────────┴───────────────────────────────────┘
```

---

## 🔄 Fluxo de Funcionamento

### **1. Usuário Preenche Dados**
- Largura: 0.50m
- Altura: 0.30m  
- Quantidade: 1
- Material: Acrílico Cristal 3mm (R$ 280,00/m²)

### **2. Sistema Calcula**
```
Área = 0.50 × 0.30 = 0.15 m²
Subtotal = 0.15 × 280 × 1 = R$ 42,00
Total com Mínimo = max(42, 20) = R$ 42,00
```

### **3. Aplica Taxas (se selecionadas)**
- Nota Fiscal (+15%): R$ 6,30
- Parcelamento (se aplicado)
- Instalação (se aplicado)

### **4. Exibe Resumo**
- Total Final: R$ 48,30
- Botão Copiar gera texto formatado

---

## 💾 Integração com Supabase

### **Automática:**
- ✅ Ao salvar configurações, `configService.savePricingConfig()` envia para Supabase
- ✅ Estrutura JSON no banco:
```json
{
  "user_id": "uuid",
  "config": {
    "adesivo": { ... },
    "lona": { ... },
    "laser": {
      "acrilicoCristal2mm": 200.0,
      "acrilicoCristal3mm": 280.0,
      ...
    }
  }
}
```

**Sem necessidade de modificar o schema do banco** - JSON suporta novos campos automaticamente.

---

## ✅ Checklist de Validação

Antes de considerar a implementação completa:

### **Funcionalidade:**
- [ ] Calculadora exibe corretamente os 28 materiais
- [ ] Cálculo de área está correto
- [ ] Preço mínimo de R$ 20,00 é aplicado
- [ ] Seleção de material atualiza o total
- [ ] Quantidade multiplica corretamente
- [ ] Nome do produto aparece no orçamento copiado

### **Interface:**
- [ ] Tab "Laser" aparece no menu
- [ ] Ícone apropriado está visível
- [ ] Layout responsivo funciona
- [ ] Materiais organizados por categoria

### **Configurações:**
- [ ] Painel de configurações exibe seção "Laser"
- [ ] Todos os 28 materiais são editáveis
- [ ] Valores salvos persistem

### **Integração:**
- [ ] Configurações salvas no Supabase
- [ ] Configurações carregadas ao abrir app
- [ ] Fallback para localStorage funciona
- [ ] Toast de sucesso/erro aparece

### **Banco de Dados:**
- [ ] Config salva corretamente no Supabase
- [ ] Config carrega ao fazer login
- [ ] Sincronização funciona entre dispositivos

---

## 🚀 Ordem de Execução

### **Fase 1: Estrutura Base (30min)**
1. Atualizar `pricing.ts` com LaserConfig
2. Adicionar valores padrão no defaultConfig
3. Adicionar ao settingsConfig.ts

### **Fase 2: Componente (60min)**
4. Criar LaserCalculator.tsx
5. Implementar lógica de cálculo
6. Organizar materiais por categoria
7. Criar interface de seleção

### **Fase 3: Integração (20min)**
8. Adicionar tab no ModernTabs
9. Adicionar rota no Index.tsx
10. Adicionar título

### **Fase 4: Testes (20min)**
11. Compilar aplicação
12. Testar cálculos
13. Testar configurações
14. Testar Supabase

### **Fase 5: Documentação (10min)**
15. Criar documentação completa
16. Atualizar README se necessário

**Tempo total estimado: ~2h20min**

---

## 📊 Benefícios da Implementação

### **Para o Usuário:**
- ✅ Novo serviço de precificação (Laser)
- ✅ 28 materiais diferentes disponíveis
- ✅ Cálculos automáticos e precisos
- ✅ Configurações personalizáveis

### **Para o Sistema:**
- ✅ Mantém padrão de código existente
- ✅ Reutiliza componentes (BudgetSummaryExtended)
- ✅ Integração automática com Supabase
- ✅ Escalável para novos materiais

### **Manutenção:**
- ✅ Código organizado e documentado
- ✅ Fácil adicionar novos materiais
- ✅ Fácil ajustar preços
- ✅ Sistema de backup automático

---

## 🎯 Resultado Esperado

Ao final da implementação, o usuário terá:

1. ✅ **Novo menu "Laser"** no sistema
2. ✅ **28 materiais** configuráveis
3. ✅ **Calculadora funcional** com cálculo por m²
4. ✅ **Integração completa** com Supabase
5. ✅ **Interface consistente** com outros menus
6. ✅ **Configurações salvas** na nuvem
7. ✅ **Orçamentos copiáveis** com formatação

---

## 📝 Notas Importantes

### **Preços:**
- Todos os materiais usam cálculo por m²
- Preço mínimo de R$ 20,00 aplicado automaticamente
- Valores padrão baseados na tabela fornecida

### **Organização:**
- Materiais organizados por categoria na interface
- Facilita localização para o usuário
- Mantém interface limpa e organizada

### **Escalabilidade:**
- Fácil adicionar novos materiais no futuro
- Basta adicionar no LaserConfig e settingsConfig
- Sem necessidade de alterar banco de dados

---

**Status:** Pronto para implementação  
**Prioridade:** Alta  
**Complexidade:** Média  
**Tempo Estimado:** 2h20min

---

**Próximo Passo:** Executar implementação seguindo este plano! 🚀
