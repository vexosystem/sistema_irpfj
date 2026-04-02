# Correcao Permissoes e DriveLink Opcional IRPFJ

## Causa raiz do bloqueio de permissao

O sistema estava mais restritivo do que o fluxo real exigia por dois motivos principais:

1. as `firestore.rules` estavam validando escrita de forma excessivamente rígida para o uso diário
2. o fluxo de telas privadas dependia de readiness do owner, mas algumas leituras ainda precisavam ficar explicitamente acopladas a esse estado

Na prática, isso gerava a sensação de que o usuário autenticado não tinha permissão para operar, mesmo estando no fluxo legítimo de uso.

### Ajuste aplicado

As rules foram simplificadas para preservar segurança nas áreas sensíveis e aliviar o restante:

- `govCredentials` continua totalmente bloqueada no client
- `auditLogs` continua bloqueada para escrita client-side
- `credentialAccessLogs` continua bloqueada para escrita client-side
- `clients` e `annualRecords` continuam restritos ao owner ativo
- validações de escrita foram mantidas, porém menos rígidas do que antes
- `driveLink` agora aceita string vazia sem bloquear create/update

Também foi reforçado o carregamento da lista de clientes apenas após `isOwnerReady`.

## Por que `driveLink` estava obrigatório indevidamente

O campo foi tornado obrigatório em três camadas ao mesmo tempo:

- validator Zod
- model/types
- rules do Firestore

Isso fazia o sistema bloquear o cadastro e a edição de exercício anual quando o usuário não tinha link do Drive para informar.

Esse comportamento estava incorreto para a regra real de negócio.

### Regra corrigida

Agora:

- `driveLink` existe no modelo
- `driveLink` é opcional
- quando preenchido, precisa ser uma URL válida
- quando vazio, o exercício anual salva normalmente
- a UI mostra estado neutro quando não houver link

## Arquivos alterados

- `firestore.rules`
- `src/lib/validators/annual-record.ts`
- `src/types/annualRecord.ts`
- `src/services/annualRecords.service.ts`
- `src/components/annual-records/AnnualRecordForm.tsx`
- `src/components/annual-records/AnnualRecordsList.tsx`
- `src/components/clients/ClientsList.tsx`
- `src/app/(private)/clients/[clientId]/annual-records/[recordId]/page.tsx`

## Regras de negócio corrigidas

### Permissões

- usuário autenticado continua dependendo de `users/{uid}`
- acesso ao sistema continua baseado em owner ativo
- coleções sensíveis continuam protegidas
- dashboard, clientes e exercícios anuais não devem mais sofrer bloqueio indevido por validação excessiva

### DriveLink

- o campo continua visível no formulário
- o campo passa a ser opcional
- se vazio, não bloqueia submit
- se preenchido, precisa ser URL válida
- na tela de detalhe:
  - com link: exibe ação para abrir em nova aba
  - sem link: exibe `Nenhum link do Google Drive informado`

## Impacto da correção

- o fluxo de dashboard e clientes fica mais aderente ao uso real
- a edição e criação de exercícios anuais deixa de falhar por ausência de `driveLink`
- o sistema continua seguro onde realmente importa
- a credencial gov continua protegida no backend

## Checklist final de validação

### Dashboard

- abrir dashboard sem mensagem indevida de permissão
- validar cards com dados carregados

### Clientes

- abrir listagem de clientes
- editar cliente
- confirmar ausência de bloqueio indevido

### Exercícios anuais

- criar exercício com `driveLink` vazio
- editar exercício com `driveLink` vazio
- criar exercício com `driveLink` preenchido
- abrir detalhe com link
- abrir detalhe sem link

### Segurança

- confirmar bloqueio de `govCredentials` no client
- confirmar bloqueio de escrita client-side em `auditLogs`
- confirmar bloqueio de escrita client-side em `credentialAccessLogs`

## Validações executadas

Foram executados:

- `npm run build`
- `npm run typecheck`
- `npm run build` em `functions`

Resultado:

- frontend compilando
- typecheck aprovado
- functions compilando
