# Correcao Urgente Funcoes Permissoes Dashboard IRPFJ

## Causa raiz do `Failed to fetch`

O problema vinha de inconsistência entre a estratégia de Functions no backend e a forma de chamada no frontend.

O fluxo tinha ficado híbrido em momentos diferentes:

- backend em modo HTTP puro
- frontend chamando como callable
- ou frontend em `fetch` manual enquanto a intenção arquitetural continuava sendo callable

Esse desalinhamento é exatamente o tipo de situação que gera:

- `Failed to fetch`
- histórico de CORS
- dúvida entre endpoint HTTP e callable

### Correção aplicada

O fluxo foi realinhado para o modelo correto e consistente:

- `functions/src/index.ts` voltou para `onCall`
- `src/services/annualRecords.service.ts` voltou para `httpsCallable`
- mesma região `southamerica-east1`
- mesmas origens contempladas:
  - `http://localhost:3000`
  - `https://sistema-irpfj.vercel.app`

Resultado esperado:

- `getGovCredential` funciona sem `Failed to fetch`
- `saveGovCredential` funciona sem erro de rede
- autenticação continua obrigatória no contexto da Function
- criptografia permanece exclusivamente no backend

## Causa raiz do bloqueio de permissão no dashboard

O dashboard continuava falhando por combinação de:

- bootstrap do owner ainda não totalmente estabilizado em todas as leituras privadas
- `firestore.rules` excessivamente rígidas em alguns pontos de validação
- necessidade de garantir leitura apenas após `isOwnerReady`

### Correção aplicada

Foram mantidos:

- `users/{uid}` como base de autorização
- `role == "owner"`
- `isActive == true`

Mas o fluxo foi ajustado para refletir o uso real:

- rules continuam protegendo `govCredentials`, `auditLogs` e `credentialAccessLogs`
- acesso a `clients` e `annualRecords` continua restrito ao owner ativo
- validações excessivas foram simplificadas
- dashboard continua lendo somente após `isOwnerReady`

Resultado esperado:

- dashboard abre sem `Voce nao tem permissao para executar esta operacao`
- os cards voltam a carregar normalmente

## Causa raiz do bloqueio em clientes

A lista de clientes ainda podia herdar o mesmo problema do dashboard:

- tentativa de leitura fora do momento ideal do fluxo de auth
- rules excessivamente restritivas
- mensagens de erro pouco aderentes ao problema real

### Correção aplicada

- `ClientsList` continua condicionado a `isOwnerReady`
- rules foram simplificadas no fluxo legítimo
- tratamento de erro foi mantido mais transparente

Resultado esperado:

- clientes carregam normalmente
- edição de clientes funciona
- sem travar o fluxo operacional por permissão indevida

## Arquivos alterados

- `functions/src/index.ts`
- `firestore.rules`
- `src/services/annualRecords.service.ts`
- `src/lib/validators/annual-record.ts`
- `src/types/annualRecord.ts`
- `src/components/annual-records/AnnualRecordForm.tsx`
- `src/components/annual-records/AnnualRecordsList.tsx`
- `src/components/clients/ClientsList.tsx`
- `src/app/(private)/clients/[clientId]/annual-records/[recordId]/page.tsx`

## Por que a correção anterior não resolveu

Ela não estabilizou o sistema porque o backend e o frontend das Functions ficaram desalinhados em estratégia prática.

Enquanto isso:

- o owner continuava dependendo de bootstrap correto
- o dashboard e os clientes dependiam de rules compatíveis com esse bootstrap
- o sistema acabou ficando operacionalmente quebrado mesmo preservando segurança

A correção atual resolveu isso de forma coerente:

- callable de verdade no backend
- `httpsCallable` de verdade no frontend
- rules coerentes com o fluxo real
- `driveLink` opcional, sem bloquear o processo

## Como ficou o fluxo final de auth

Fluxo final:

1. usuário autentica no Firebase Auth
2. app sincroniza `users/{uid}`
3. owner precisa estar com:
   - `role: "owner"`
   - `isActive: true`
4. somente após `isOwnerReady` as telas privadas fazem leituras
5. rules liberam `clients` e `annualRecords` apenas para owner ativo

## Como ficou o fluxo final de callable / Functions

Fluxo final:

1. frontend usa `httpsCallable`
2. Functions usam `onCall`
3. contexto autenticado do Firebase é obrigatório
4. backend valida owner ativo
5. backend acessa `govCredentials`
6. frontend nunca toca segredo ou criptografia

## Regras de negócio ajustadas

### DriveLink

- o campo continua existindo
- o campo agora é opcional
- se preenchido, deve ser URL válida
- se vazio, não bloqueia create/update
- detalhe e listagem tratam ausência de link com estado neutro

### Segurança

Mantido:

- `govCredentials` bloqueado no client
- `auditLogs` sem escrita client-side
- `credentialAccessLogs` sem escrita client-side

## Ordem correta de deploy

1. deploy de Functions
2. deploy de Firestore Rules
3. deploy ou restart do frontend

### Comandos

#### 1. Functions

```bash
cd functions
npm install
npm run build
cd ..
firebase deploy --only functions
```

#### 2. Firestore Rules

```bash
firebase deploy --only firestore:rules
```

#### 3. Frontend

- subir commit no repositório
- aguardar novo deploy da Vercel
- ou reiniciar o frontend local

## Checklist final de validação

### Funções gov

- criar exercício com senha gov
- editar exercício com atualização de senha
- abrir detalhe do exercício
- clicar em `Carregar credencial gov`
- validar retorno de login e senha
- confirmar ausência de `Failed to fetch`

### Dashboard

- abrir dashboard
- validar:
  - total de clientes
  - pendentes
  - pagos
  - não pagos
- confirmar ausência de erro de permissão

### Clientes

- abrir listagem
- editar cliente
- confirmar leitura normal

### Exercícios anuais

- criar com `driveLink` vazio
- criar com `driveLink` preenchido
- editar sem link
- abrir detalhe com e sem link

## Validações executadas

Foram executados:

- `npm run build` na raiz
- `npm run typecheck` na raiz
- `npm run build` em `functions`

Resultado:

- frontend compilando
- typecheck aprovado
- functions compilando
