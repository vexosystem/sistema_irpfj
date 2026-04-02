# Implementacao de Delete de Clientes e Exercicios IRPFJ

## Resumo

Foi implementada a exclusao de clientes e exercicios anuais com hard delete controlado, mantendo a arquitetura atual baseada em:

- Next.js
- Firestore
- Cloud Functions
- autorizacao por owner
- credenciais gov protegidas no backend

## Como o delete foi implementado

### Exclusao de exercicio anual

Fluxo final:

1. a UI pede confirmacao explicita
2. o service chama a Cloud Function `deleteAnnualRecord`
3. a function valida autenticacao e owner ativo
4. a function remove a credencial gov vinculada, se existir
5. a function remove `clients/{clientId}/annualRecords/{recordId}`
6. a function registra auditoria
7. a UI atualiza ou redireciona

### Exclusao de cliente

Fluxo final:

1. a UI pede confirmacao explicita
2. o service chama a Cloud Function `deleteClient`
3. a function valida autenticacao e owner ativo
4. a function lista todos os `annualRecords` do cliente
5. cada exercicio e removido em cascata, junto com sua credencial gov
6. depois disso o documento `clients/{clientId}` e removido
7. a function registra auditoria
8. a UI atualiza a lista ou redireciona para `/clients`

## Como foi tratada a exclusao em cascata

### Cliente

Ao excluir um cliente, o backend remove:

- o documento do cliente
- todos os exercicios anuais desse cliente
- todas as credenciais em `govCredentials` referenciadas por esses exercicios

Isso evita registros orfaos no banco.

### Exercicio anual

Ao excluir um exercicio anual, o backend remove:

- o documento do exercicio
- a credencial gov associada em `govCredentials`, quando existente

## Como credenciais gov foram removidas

As credenciais continuam bloqueadas no client por rules.

A remocao foi feita por Cloud Functions seguras:

- `deleteGovCredential`
- `deleteAnnualRecord`
- `deleteClient`

Com isso:

- nenhum segredo foi movido para o frontend
- o client nao ganha acesso direto a `govCredentials`
- a exclusao continua sujeita a auth + owner ativo

## Melhoria adicional de consistencia

O fluxo de `saveGovCredential` tambem foi reforcado.

Quando uma senha gov e atualizada:

- a nova credencial e criada
- o `annualRecord` passa a apontar para a nova referencia
- a credencial anterior e removida, se existir

Isso evita acúmulo de credenciais antigas sem uso.

## Arquivos alterados

- `functions/src/index.ts`
- `src/services/clients.service.ts`
- `src/services/annualRecords.service.ts`
- `src/components/clients/ClientsList.tsx`
- `src/components/annual-records/AnnualRecordsList.tsx`
- `src/app/(private)/clients/[clientId]/page.tsx`
- `src/app/(private)/clients/[clientId]/annual-records/[recordId]/page.tsx`
- `firestore.rules`

## Impactos no sistema

- clientes agora podem ser excluidos com limpeza completa
- exercicios anuais agora podem ser excluidos com limpeza da credencial relacionada
- a UI ganhou confirmacao obrigatoria antes da remocao
- botoes entram em loading durante a exclusao
- o sistema permanece consistente e sem acesso inseguro a colecoes sensiveis

## Regras de seguranca

As rules foram ajustadas para permitir delete do owner em:

- `clients`
- `annualRecords`

E continuam bloqueando no client:

- `govCredentials`
- escrita em `auditLogs`
- escrita em `credentialAccessLogs`

## Fluxo completo de delete na UI

### Lista de clientes

- botao `Excluir`
- confirmacao clara
- loading no botao
- refresh automatico da lista apos sucesso

### Detalhe do cliente

- botao `Excluir cliente`
- confirmacao clara informando que todos os exercicios e dados relacionados serao removidos
- loading no botao
- redirecionamento para `/clients`

### Lista de exercicios

- botao `Excluir`
- confirmacao clara
- loading por item
- refresh da lista apos sucesso

### Detalhe do exercicio

- botao `Excluir exercicio`
- confirmacao clara
- loading no botao
- redirecionamento para o detalhe do cliente

## Checklist de validacao

- exclusao de exercicio remove o documento do exercicio
- exclusao de exercicio remove a credencial gov associada
- exclusao de cliente remove o cliente
- exclusao de cliente remove todos os exercicios do cliente
- exclusao de cliente remove todas as credenciais relacionadas
- delete exige usuario autenticado
- delete exige owner ativo
- colecao `govCredentials` continua inacessivel no frontend
- botao de delete mostra loading e evita clique duplo
- confirmacao aparece antes de qualquer exclusao

## Validacoes executadas

```bash
npm run build
npm run typecheck
cd functions
npm run build
```
