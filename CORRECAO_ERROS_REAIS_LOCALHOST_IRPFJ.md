# Correcao Erros Reais Localhost IRPFJ

## Diagnostico objetivo

Os erros reais observados em localhost tinham tres causas principais:

1. `getGovCredential` estava desalinhado entre frontend e backend.
2. o dashboard fazia leitura antes de o owner estar realmente pronto.
3. a tela de clientes herdava falhas de bootstrap/autorizacao e exibia erro genérico.

## Causa raiz de cada erro

### 1. CORS quebrado em `getGovCredential`

Causa raiz:

- o frontend usava `httpsCallable`
- no navegador, a chamada efetiva estava indo para o endpoint HTTP da function
- em localhost, o endpoint estava respondendo sem o `Access-Control-Allow-Origin` esperado
- isso indicava desalinhamento prático entre a estrategia escolhida no frontend e o comportamento real do endpoint publicado

Correcao aplicada:

- `saveGovCredential` e `getGovCredential` foram migradas para `onRequest`
- foi implementado CORS explicito para:
  - `http://localhost:3000`
  - `https://sistema-irpfj.vercel.app`
- foi mantida a seguranca backend-only
- a autenticacao agora ocorre via `Authorization: Bearer <idToken>`
- o frontend passou a chamar as Functions via `fetch` autenticado com `currentUser.getIdToken()`

Resultado esperado:

- `getGovCredential` funciona em localhost
- `getGovCredential` funciona na Vercel
- sem expor segredo no frontend

### 2. Dashboard com falta de permissao

Causa raiz:

- o app depende de `users/{uid}` com `role == "owner"` e `isActive == true`
- o bootstrap do owner existia, mas o dashboard disparava leitura antes da readiness final
- o `DashboardPage` executava `useEffect` proprio antes de o fluxo protegido estar estabilizado

Correcao aplicada:

- foi criado um `AuthProvider` compartilhado para evitar multiplas assinaturas independentes do estado auth
- `useAuth` agora consome um contexto unico
- o dashboard passou a ler somente quando `isOwnerReady === true`
- o fluxo protegido ficou centralizado e mais previsivel

Resultado esperado:

- sem leitura prematura de `clients` e `annualRecords`
- sem `permission-denied` causado por corrida de bootstrap

### 3. Tela de clientes com erro generico

Causa raiz:

- a falha de owner/bootstrap impactava as leituras protegidas
- o app convertia algumas falhas para mensagens pouco especificas
- parte do comportamento ruim vinha do estado de auth fragmentado

Correcao aplicada:

- unificacao do estado auth em provider unico
- melhoria no tradutor de erros do Firebase e das Functions
- preservacao do erro real quando util, sem mascarar tudo como falha de servidor

Resultado esperado:

- mensagens mais aderentes ao erro real
- listagem de clientes sem cair em erro generico causado por bootstrap incompleto

## Arquivos alterados

- `functions/src/index.ts`
- `src/services/annualRecords.service.ts`
- `src/components/layout/AuthProvider.tsx`
- `src/hooks/useAuth.ts`
- `src/components/layout/AppProviders.tsx`
- `src/lib/utils/firebase-error.ts`
- `src/app/(private)/dashboard/page.tsx`
- `src/app/(private)/clients/[clientId]/annual-records/[recordId]/page.tsx`

## O que foi corrigido em cada arquivo

### `functions/src/index.ts`

- migracao de `onCall` para `onRequest`
- implementacao de CORS explicito
- suporte a `OPTIONS`
- validacao de `Authorization Bearer`
- verificacao do ID token com `firebase-admin/auth`
- manutencao da verificacao de owner ativo
- manutencao da criptografia de credenciais gov
- manutencao dos logs de auditoria e acesso

### `src/services/annualRecords.service.ts`

- remocao da dependencia de `httpsCallable`
- implementacao de `fetch` autenticado para as Functions
- construcao da URL da function com base no `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- tratamento de resposta HTTP padronizado
- traducao dos codigos reais de erro das Functions

### `src/components/layout/AuthProvider.tsx`

- novo provider global de autenticacao
- estado unico de:
  - `user`
  - `loading`
  - `isOwnerReady`
  - `error`

### `src/hooks/useAuth.ts`

- simplificacao do hook para consumir o contexto global
- eliminacao de assinaturas repetidas e concorrentes do auth state

### `src/components/layout/AppProviders.tsx`

- passou a registrar `AuthProvider` junto do `ThemeProvider`

### `src/lib/utils/firebase-error.ts`

- suporte a erros com `code` mesmo quando nao vierem como `FirebaseError`
- melhor traducao de:
  - `functions/permission-denied`
  - `functions/unauthenticated`
  - `functions/not-found`
  - `functions/data-loss`
  - `functions/failed-precondition`

### `src/app/(private)/dashboard/page.tsx`

- leitura do dashboard somente apos `isOwnerReady`
- remocao da corrida entre montagem da pagina e autorizacao final

### `src/app/(private)/clients/[clientId]/annual-records/[recordId]/page.tsx`

- leitura do exercicio anual somente apos `isOwnerReady`
- manutencao do fluxo de credencial gov
- ajuste visual do placeholder da senha mascarada

## Por que `getGovCredential` falhava

Falhava porque o navegador estava chamando o endpoint HTTP publicado da function, mas o backend nao estava respondendo com CORS funcional para a origem `http://localhost:3000` dentro do fluxo real observado.

A correcao tornou esse fluxo explicitamente HTTP autenticado, com:

- `POST`
- `Authorization: Bearer <idToken>`
- `Access-Control-Allow-Origin` controlado
- preflight `OPTIONS` tratado corretamente

## Por que dashboard e clientes falhavam

Eles falhavam porque as leituras protegidas eram iniciadas antes da conclusao garantida do bootstrap de `users/{uid}`.

Como as rules dependem de owner ativo, qualquer leitura precoce podia cair em `permission-denied`.

A correcao separou claramente:

1. autenticacao do Firebase
2. sincronizacao do owner
3. readiness para telas privadas
4. leitura dos dados privados

## Comandos de deploy

### Functions

```bash
cd functions
npm install
npm run build
cd ..
firebase deploy --only functions
```

### Rules

```bash
firebase deploy --only firestore:rules
```

### Frontend

Depois de publicar Functions e Rules:

- subir commit no repositorio
- aguardar o deploy da Vercel

## Checklist final de validacao

### Auth / owner

- login com owner funcionando
- `users/{uid}` existente
- `role == "owner"`
- `isActive == true`

### Dashboard

- abre sem `permission-denied`
- total de clientes correto
- pendentes corretos
- pagos corretos
- nao pagos corretos

### Clientes

- tela de clientes abre sem erro generico
- listagem funciona
- busca funciona

### Credencial gov

- abrir detalhe do exercicio
- clicar em `Carregar credencial gov`
- sem erro de CORS em localhost
- login gov carregado
- senha gov carregada
- copiar login funciona
- copiar senha funciona

## Validacoes executadas localmente

Foram executados:

- `npm run build` na raiz
- `npm run typecheck` na raiz
- `npm run build` em `functions`

Resultado:

- frontend compilando
- typecheck aprovado
- functions compilando
