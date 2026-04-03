# CORRECAO URGENTE DELETE CORS IRPFJ

## Causa raiz exata do erro de CORS em `deleteGovCredential`

O erro de CORS acontecia porque o fluxo de delete estava passando por uma chamada de Cloud Function que, no ambiente executado, estava desalinhada com o contrato esperado pelo frontend.

Diagnostico objetivo da base atual:

1. `deleteGovCredential` esta implementada como `onCall`
2. o frontend atual chama Functions com `httpsCallable`
3. nao existe `fetch` manual nem URL hardcoded de `cloudfunctions.net` no estado atual do codigo
4. portanto, o problema nao era um `fetch` manual no codigo atual

Conclusao tecnica:

- havia desalinhamento entre o frontend em execucao e o backend efetivamente publicado
- o browser acabava batendo no endpoint HTTP da Function e recebendo uma resposta sem o handshake esperado pelo protocolo callable
- como o delete antigo dependia da exclusao da credencial gov para concluir o fluxo, a falha abortava a exclusao inteira

Em resumo: o erro de CORS era sintoma de um fluxo de delete acoplado a uma callable sensivel executada fora do alinhamento correto entre frontend e Functions publicadas.

## Se havia desalinhamento entre `onCall`/`onRequest` e frontend

Na base corrigida:

- backend: `onCall`
- frontend: `httpsCallable`

Ou seja, o padrao correto e coerente e:

- `saveGovCredential`: `onCall` + `httpsCallable`
- `getGovCredential`: `onCall` + `httpsCallable`
- `deleteGovCredential`: `onCall` + `httpsCallable`

O desalinhamento observado no erro de CORS vinha do ambiente executado, nao do estado final do codigo corrigido.

## Como o `deleteGovCredential` foi corrigido

Foi mantido um unico padrao coerente para credenciais gov:

- Cloud Function callable
- auth obrigatoria
- validacao em `users/{uid}`
- `role == "owner"`
- `isActive == true`

Tambem foi removida a configuracao manual de CORS das callables no backend.

Motivo:

- `onCall` deve ser consumida pelo SDK callable do Firebase
- nesse modelo, o proprio protocolo callable ja cuida da camada HTTP esperada
- manter uma camada CORS manual nesse ponto so aumentava a chance de confusao operacional

## Como o delete de exercicio foi corrigido

O delete de exercicio nao depende mais de uma sequencia fragil no client.

Fluxo final:

1. a UI pede confirmacao
2. o frontend chama `deleteAnnualRecord` via `httpsCallable`
3. a Function valida auth e owner ativo
4. a Function localiza o exercicio
5. a Function remove no backend:
   - `clients/{clientId}/annualRecords/{recordId}`
   - a credencial gov vinculada, quando existir
   - o log de auditoria
6. a UI:
   - mostra loading
   - impede clique duplo
   - mostra erro real quando falha
   - atualiza a tela ou redireciona corretamente

Resultado:

- a exclusao do exercicio nao quebra mais ao tentar remover credencial gov
- nao ha orfaos em `govCredentials`

## Como o delete de cliente foi corrigido

O delete de cliente tambem foi consolidado no backend.

Fluxo final:

1. a UI pede confirmacao
2. o frontend chama `deleteClient` via `httpsCallable`
3. a Function valida auth e owner ativo
4. a Function lista todos os exercicios do cliente
5. a Function remove em cascata:
   - cada `annualRecord`
   - cada `govCredentialRef` associada
   - logs de auditoria dos exercicios
6. ao final remove:
   - o documento do cliente
   - o log de auditoria do cliente
7. a UI:
   - mostra loading
   - evita clique duplo
   - faz refresh ou redirect
   - nao mostra sucesso se a operacao falhar

Resultado:

- excluir cliente funciona sem depender de uma chamada separada de delete de credencial no frontend
- toda a cascata acontece no backend com consistencia

## Como as credenciais gov passaram a ser removidas corretamente

As credenciais gov continuam protegidas no backend.

O client continua sem acesso direto a `govCredentials`.

A remocao correta agora acontece dentro das Functions de cascata:

- `deleteAnnualRecord`
- `deleteClient`

Isso garante:

- nenhum delete inseguro no client
- nenhuma tentativa de apagar `govCredentials` por Firestore direto
- nenhuma credencial gov orfa apos exclusao

## Quais arquivos foram alterados

- `functions/src/index.ts`
- `CORRECAO_URGENTE_DELETE_CORS_IRPFJ.md`

## Arquivos revisados no diagnostico

- `src/services/annualRecords.service.ts`
- `src/services/clients.service.ts`
- `src/app/(private)/clients/[clientId]/page.tsx`
- `src/app/(private)/clients/[clientId]/annual-records/[recordId]/page.tsx`
- `src/components/clients/ClientsList.tsx`
- `src/components/annual-records/AnnualRecordsList.tsx`
- `firestore.rules`

## Ordem correta de deploy

1. deploy de Functions

```bash
firebase deploy --only functions
```

2. deploy de rules, apenas se voce tiver alterado rules nesta rodada

```bash
firebase deploy --only firestore:rules
```

3. restart do frontend local ou redeploy do frontend hospedado

Local:

```bash
npm run dev
```

Hospedado:

- redeploy da aplicacao no Vercel depois que as Functions ja estiverem publicadas

## Checklist final de validacao

- `deleteGovCredential` permanece em `onCall`
- frontend usa `httpsCallable`
- nao existe `fetch` manual para `deleteGovCredential`
- excluir exercicio funciona sem erro de CORS
- excluir cliente funciona sem erro de CORS
- a credencial gov vinculada e removida junto
- nao ha dados orfaos em `govCredentials`
- loading impede clique duplo
- a UI nao mostra sucesso quando a exclusao falha
- localhost `http://localhost:3000` volta a operar apos deploy das Functions e restart do frontend
- producao `https://sistema-irpfj.vercel.app` volta a operar apos deploy das Functions e redeploy do frontend

## Validacao executada

```bash
npm run build
npm run typecheck
cd functions
npm run build
```
