# Script de Correção - Calculadoras

## Problema
Campos de largura e altura usando `useState<number>(0)` impedem valores decimais pequenos como 0.05

## Solução
Mudar estado para `string` e converter apenas nos cálculos

## Calculadoras para Corrigir:
- [x] AdesivoCalculator ✅
- [x] LonaCalculator ✅
- [ ] PlacaPSCalculator
- [ ] PlacaACMCalculator
- [ ] LetraCaixaCalculator
- [ ] VidroCalculator

## Mudanças Necessárias:

### 1. Estado
```typescript
// ANTES:
const [largura, setLargura] = useState<number>(0);
const [altura, setAltura] = useState<number>(0);

// DEPOIS:
const [largura, setLargura] = useState<string>('');
const [altura, setAltura] = useState<string>('');
const larguraNum = parseFloat(largura) || 0;
const alturaNum = parseFloat(altura) || 0;
```

### 2. Cálculos
```typescript
// ANTES:
const area = largura * altura;

// DEPOIS:
const area = larguraNum * alturaNum;
```

### 3. Display
```typescript
// ANTES:
<span>{largura.toFixed(2)} x {altura.toFixed(2)} m</span>

// DEPOIS:
<span>{larguraNum.toFixed(2)} x {alturaNum.toFixed(2)} m</span>
```

### 4. Handlers
```typescript
// ANTES:
value={largura || ''}
onChange={(e) => setLargura(parseFloat(e.target.value) || 0)}

// DEPOIS:
value={largura}
onChange={(e) => setLargura(e.target.value)}
```
