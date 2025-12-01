
# Configuração do Banco de Dados Neon

## Passo a Passo para Configuração

### 1. Criar Conta no Neon Database
1. Acesse [https://neon.tech](https://neon.tech)
2. Crie uma conta gratuita
3. Crie um novo projeto

### 2. Obter String de Conexão
1. No dashboard do Neon, acesse "Connection Details"
2. Copie a connection string (formato: `postgresql://user:password@host/database?sslmode=require`)

### 3. Configurar Variáveis de Ambiente
Adicione a seguinte variável de ambiente no Vercel:

```
VITE_DATABASE_URL=sua_connection_string_aqui
```

### 4. Deploy no Vercel
1. Conecte seu repositório ao Vercel
2. Configure a variável de ambiente `VITE_DATABASE_URL`
3. Faça o deploy

### 5. Migração Automática
A aplicação executará as migrações automaticamente na primeira execução.

## Estrutura do Banco de Dados

### Tabelas Criadas:
- **users**: Usuários do sistema
- **pricing_configs**: Configurações de preços por usuário
- **budget_settings**: Configurações de observações de orçamento
- **budgets**: Orçamentos salvos
- **budget_items**: Itens dos orçamentos
- **budget_calculations**: Cálculos e configurações dos orçamentos

### Funcionalidades Implementadas:
- ✅ Schema completo do banco de dados
- ✅ Migrações automáticas
- ✅ Serviços para operações CRUD
- ✅ Hook para inicialização do banco
- ✅ Tratamento de erros
- ✅ Índices para performance

## Próximos Passos (Futuras Implementações)

### 1. Sistema de Autenticação
- Implementar login/registro de usuários
- Integração com provedores OAuth

### 2. Migração de Dados
- Sistema para migrar dados do localStorage
- Backup/restore de configurações

### 3. Recursos Avançados
- Templates de orçamento
- Histórico de alterações
- Dashboard de estatísticas
- Exportação avançada

## Comandos Úteis

```bash
# Gerar migrações (quando necessário)
npx drizzle-kit generate:pg

# Executar migrações manualmente
npx drizzle-kit push:pg

# Visualizar esquema do banco
npx drizzle-kit studio
```

## Estrutura de Arquivos Criados

```
src/
├── lib/
│   └── db/
│       ├── schema.ts          # Esquema das tabelas
│       ├── connection.ts      # Conexão com Neon
│       └── migrations.ts      # Scripts de migração
├── services/
│   ├── budgetService.ts       # CRUD de orçamentos
│   └── configService.ts       # CRUD de configurações
└── hooks/
    └── useDatabase.ts         # Hook para inicialização
```

## Notas Importantes

1. **SSL**: A conexão com Neon sempre usa SSL
2. **Backup**: Neon oferece backups automáticos
3. **Escalabilidade**: Suporta múltiplos usuários simultâneos
4. **Performance**: Índices criados automaticamente
5. **Segurança**: Todas as operações usam prepared statements

## Troubleshooting

### Erro de Conexão
- Verifique se a `VITE_DATABASE_URL` está correta
- Confirme se o projeto Neon está ativo
- Teste a conexão diretamente no Neon Console

### Problemas de Migração
- Verifique os logs do console
- Confirme se as permissões estão corretas
- Tente executar as migrações manualmente
