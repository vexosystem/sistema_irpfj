# Correcao Implantacao Firebase Vercel IRPFJ

## Resumo executivo

Os erros de producao nao estavam ligados a ausencia de Firestore. O banco existia e ja aceitava escrita. A causa raiz principal era a combinacao de:

- bootstrap incompleto do documento `users/{uid}`
- rules dependentes de `users/{uid}` para autorizar leitura do restante do sistema
- tentativa de ler dashboard e colecoes privadas antes de o owner estar sincronizado
- uso de agregacao `count()` no dashboard, que acabava batendo justamente no fluxo que falhava primeiro
- configuracao de callable functions sem endurecimento explicito de origem, deixando o deploy suscetivel a comportamento inconsistente entre ambientes

Com as correcoes aplicadas, o sistema passa a:

- sincronizar o owner de forma consistente logo apos o login
- aguardar o bootstrap antes de liberar telas privadas
- autorizar corretamente `clients`, `annualRecords` e `documents`
- bloquear colecoes sensiveis no client
- eliminar a dependencia do `runAggregationQuery` no dashboard
- manter `saveGovCredential` e `getGovCredential` seguros no backend com Secret Manager e criptografia

## Causa raiz por problema

### 1. `Missing or insufficient permissions`

Causa raiz:

- as rules protegiam praticamente todo o sistema com base em `get(/users/{uid})`
- o hook de autenticacao disparava `syncOwnerUser`, mas nao aguardava sua conclusao
- o app liberava as telas privadas imediatamente apos detectar `request.auth`
- quando o dashboard, listagem de clientes e demais telas faziam leitura, o documento `users/{uid}` ainda nao existia ou ainda nao estava pronto
- pior: o bootstrap inicial do owner tentava fazer `getDoc(users/{uid})`, mas as rules antigas nem permitiam essa leitura inicial, entao o sync podia falhar logo na primeira execucao

Impacto:

- 403 em leituras de `clients`
- 403 em `collectionGroup`
- 403 em agregacoes do dashboard

### 2. Dashboard falhando em `runAggregationQuery`

Causa raiz:

- o dashboard usava `getCountFromServer()` em `clients`
- essa chamada usa `runAggregationQuery`
- como o owner ainda nao estava bootstrapado quando a leitura acontecia, a agregacao falhava antes mesmo de o restante do app estabilizar

Correcao adotada:

- o dashboard passou a usar `getDocs()` normal para total de clientes
- isso removeu a dependencia operacional da agregacao
- a regra continua compativel com leitura autenticada do owner, mas o dashboard nao depende mais desse endpoint especifico

### 3. Erro de CORS em `saveGovCredential`

Causa raiz:

- o projeto ja estava estruturado para `httpsCallable`, que e o fluxo correto para esse caso
- em producao, havia sintoma de chamada sem cabecalho CORS adequado no endpoint callable
- isso normalmente aparece quando o deploy da function nao esta completamente alinhado com o frontend atual ou quando o endpoint callable nao foi endurecido para as origens esperadas

Correcao adotada:

- mantive a estrategia correta com `onCall` + `httpsCallable`
- adicionei `cors` explicito nas Functions v2
- restringi as origens para:
  - `https://sistema-irpfj.vercel.app`
  - `http://localhost:3000`
- preservei autenticacao obrigatoria pelo contexto callable

### 4. Fluxo sensivel de credencial gov

Causa raiz:

- o fluxo em si ja estava arquiteturalmente correto no backend
- o problema operacional estava na autorizacao do owner e na estabilidade da callable em producao

Correcao adotada:

- mantive criptografia backend-only com `aes-256-gcm`
- mantive segredo em `GOV_CREDENTIAL_ENCRYPTION_KEY`
- mantive gravacao em `govCredentials`
- mantive `auditLogs` e `credentialAccessLogs`
- mantive bloqueio total do client sobre `govCredentials`

## Estrategia adotada para Functions

Foi mantido o modelo `onCall` com `httpsCallable`.

Motivos tecnicos:

- autentica automaticamente via Firebase Auth
- reduz risco de implementar `fetch` manual inseguro
- simplifica validacao de contexto autenticado
- e a opcao mais coerente com o frontend atual, que ja usava `httpsCallable`

Tambem foi adicionada validacao mais estrita de payload e `cors` explicito para evitar divergencia de deploy entre ambientes.

## Arquivos alterados

- `firestore.rules`
- `storage.rules`
- `functions/src/index.ts`
- `src/lib/auth/auth-client.ts`
- `src/hooks/useAuth.ts`
- `src/components/layout/AuthGuard.tsx`
- `src/lib/utils/firebase-error.ts`
- `src/services/clients.service.ts`
- `src/services/annualRecords.service.ts`
- `src/services/documents.service.ts`
- `src/store/useClientsStore.ts`
- `src/app/(private)/dashboard/page.tsx`
- `src/components/clients/ClientsList.tsx`
- `src/components/documents/DocumentsSection.tsx`
- `src/app/(private)/clients/[clientId]/page.tsx`
- `src/app/(private)/clients/[clientId]/annual-records/[recordId]/page.tsx`

## Correcoes realizadas

### `firestore.rules`

Foi reestruturado o modelo de autorizacao para:

- exigir autenticacao em todo o fluxo privado
- autorizar apenas owner ativo
- permitir bootstrap do proprio documento `users/{uid}`
- permitir leitura do proprio `users/{uid}` para o sync inicial
- manter bloqueio total de `govCredentials`
- manter bloqueio de escrita client-side em `auditLogs`
- manter bloqueio de escrita client-side em `credentialAccessLogs`
- validar shape minimo de escrita em:
  - `users`
  - `clients`
  - `annualRecords`
  - `documents`

### `storage.rules`

Foi alinhado o Storage com o mesmo conceito de owner ativo do Firestore:

- somente owner autenticado pode ler/deletar arquivos
- somente owner autenticado pode enviar arquivos
- limite de 10 MB preservado
- tipos permitidos preservados:
  - PDF
  - JPG
  - PNG

### `functions/src/index.ts`

Foram feitas as seguintes correcoes:

- manutencao de `onCall`
- inclusao de `cors` explicito nas origens autorizadas
- validacao estrita dos payloads
- validacao segura do secret
- validacao segura do owner antes de salvar ou ler credenciais
- preservacao de logs e criptografia

### `src/lib/auth/auth-client.ts`

O bootstrap do owner foi corrigido para:

- ler primeiro o documento `users/{uid}`
- criar quando nao existir
- atualizar sem sobrescrever `createdAt`
- validar o resultado do sync apos a escrita

### `src/hooks/useAuth.ts`

O hook agora:

- espera a sincronizacao do owner terminar
- expõe `isOwnerReady`
- expõe erro de bootstrap
- nao libera a aplicacao privada enquanto o owner nao estiver pronto

### `src/components/layout/AuthGuard.tsx`

O guard agora:

- redireciona para login quando nao ha usuario
- segura o render enquanto o bootstrap do owner nao terminou
- encerra sessao e volta ao login quando o perfil do owner falha

### `src/services/clients.service.ts`

Correcoes:

- remocao de `getCountFromServer()` no dashboard
- total de clientes agora via leitura comum
- validacao de CPF duplicado via `where("cpfDigits", "==", ...)`
- tratamento de erro mais claro

### `src/services/annualRecords.service.ts`

Correcoes:

- tratamento de erro mais claro
- encapsulamento das callable functions
- manutencao segura de `saveGovCredential`
- manutencao segura de `getGovCredential`

### `src/services/documents.service.ts`

Correcoes:

- tratamento de erro claro para listar, enviar, baixar e excluir
- manutencao do fluxo atual com Firestore + Storage

### Componentes e paginas privadas

Correcoes:

- exibicao de erros nas telas
- refresh mais robusto
- menor risco de falha silenciosa em producao

## Impacto das correcoes

### Positivo

- login passa a estabilizar o owner antes de liberar o sistema
- dashboard deixa de falhar no endpoint de agregacao
- leituras em `clients`, `annualRecords` e `documents` passam a usar autorizacao coerente com a arquitetura
- callable functions passam a ficar alinhadas ao frontend da Vercel
- fluxo de credenciais gov continua seguro

### Compatibilidade

- nao houve remocao de funcionalidades
- nao houve mudanca de arquitetura para segredo no frontend
- nao houve simplificacao insegura
- o projeto permaneceu em `Next.js + Firebase + Functions + Secret Manager`

## Validacoes executadas

Validacoes feitas localmente:

- `npm run typecheck`
- `npm run build` na raiz
- `npm run build` em `functions`

Resultado:

- typecheck do frontend aprovado
- build do frontend aprovado
- build das functions aprovado

## Como publicar as correcoes

### 1. Deploy das Functions

Na raiz do projeto:

```bash
cd functions
npm install
npm run build
cd ..
firebase deploy --only functions
```

### 2. Deploy das Rules

Na raiz do projeto:

```bash
firebase deploy --only firestore:rules,storage
```

### 3. Deploy da Vercel

Depois de Functions e Rules:

- publique o commit no repositório conectado
- deixe a Vercel gerar um novo deploy
- confirme que as variaveis de ambiente continuam configuradas

## Ordem correta de deploy

1. `functions`
2. `firestore.rules` e `storage.rules`
3. `Vercel`

Essa ordem reduz risco de frontend novo bater em backend antigo.

## Checklist final de validacao em producao

### Autenticacao

- confirmar login com owner
- confirmar criacao ou atualizacao de `users/{uid}`
- confirmar `role == "owner"`
- confirmar `isActive == true`

### Dashboard

- confirmar carregamento sem erro `permission-denied`
- confirmar total de clientes
- confirmar contagem de pendentes
- confirmar contagem de pagos
- confirmar contagem de nao pagos

### Clientes

- listar clientes
- cadastrar cliente
- editar cliente
- validar bloqueio de CPF duplicado

### Exercicios anuais

- criar exercicio anual
- editar exercicio anual
- duplicar exercicio anual
- abrir detalhe do exercicio

### Documentos

- subir PDF
- subir JPG
- subir PNG
- baixar documento
- excluir documento
- confirmar bloqueio para tipos nao permitidos
- confirmar bloqueio acima de 10 MB

### Credencial gov

- salvar credencial gov sem erro de CORS
- visualizar credencial gov
- confirmar gravacao em `govCredentials`
- confirmar gravacao em `auditLogs`
- confirmar gravacao em `credentialAccessLogs`

### Seguranca

- confirmar que o client nao consegue ler `govCredentials`
- confirmar que o client nao consegue escrever em `auditLogs`
- confirmar que o client nao consegue escrever em `credentialAccessLogs`

## Observacoes finais

O problema principal nao era inexistencia de Firestore, e sim o descompasso entre:

- rules dependentes do owner
- bootstrap do owner
- tempo de carregamento das telas privadas

Com as correcoes aplicadas, a autorizacao passa a seguir o fluxo real do sistema, o dashboard deixa de depender de agregacao sensivel no primeiro carregamento e as callable functions ficam coerentes com o deploy na Vercel.
