# Correcao Urgente do Delete IRPFJ

## Resumo

A correcao foi concentrada exclusivamente no fluxo de delete de clientes e exercicios anuais.

O problema principal era que a exclusao das entidades principais passou a depender de Cloud Functions novas para apagar `clients` e `annualRecords`, quando a propria arquitetura atual ja permite ao owner excluir essas entidades diretamente via Firestore. Isso aumentou o ponto de falha do fluxo e fez o delete parar de funcionar quando o backend e o frontend ficaram desalinhados.

## Causa raiz exata do delete nao funcionar

1. o frontend estava dependendo de callables novas para excluir as entidades principais de trabalho:
   - `deleteClient`
   - `deleteAnnualRecord`
2. isso criou um acoplamento desnecessario entre UI e deploy dessas Functions
3. na pratica, qualquer desalinhamento entre frontend e backend bloqueava a exclusao inteira
4. a parte realmente sensivel do fluxo era apenas `govCredentials`, que deve continuar protegida no backend

## Como o delete de exercicio foi corrigido

O fluxo final ficou assim:

1. a UI confirma a exclusao
2. o service busca o `annualRecord`
3. se existir `govCredentialRef`, o service chama a Function segura `deleteGovCredential`
4. depois disso o proprio documento `clients/{clientId}/annualRecords/{recordId}` e removido diretamente pelo Firestore
5. a UI atualiza ou redireciona corretamente

Arquivos envolvidos:

- `src/services/annualRecords.service.ts`
- `src/app/(private)/clients/[clientId]/annual-records/[recordId]/page.tsx`
- `src/app/(private)/clients/[clientId]/page.tsx`

## Como o delete de cliente foi corrigido

O fluxo final ficou assim:

1. a UI confirma a exclusao
2. o service lista todos os `annualRecords` do cliente
3. cada exercicio e removido pela mesma cadeia segura:
   - exclui credencial gov associada via Function
   - exclui o documento do exercicio via Firestore
4. quando todos os exercicios terminam, o documento `clients/{clientId}` e removido
5. a UI faz refresh da lista ou redireciona para `/clients`

Arquivos envolvidos:

- `src/services/clients.service.ts`
- `src/services/annualRecords.service.ts`
- `src/components/clients/ClientsList.tsx`
- `src/app/(private)/clients/[clientId]/page.tsx`

## Como credenciais gov relacionadas foram tratadas

As credenciais continuam protegidas no backend.

O frontend nao apaga `govCredentials` diretamente.

O fluxo final usa apenas:

- `deleteGovCredential` via Cloud Function

Com isso:

- a colecao sensivel continua protegida
- nao ha credenciais orfas quando o exercicio e excluido
- nao ha credenciais orfas quando o cliente inteiro e excluido

## Quais arquivos foram alterados

- `src/services/clients.service.ts`
- `src/services/annualRecords.service.ts`
- `functions/src/index.ts`
- `CORRECAO_URGENTE_DELETE_IRPFJ.md`

## Regras e seguranca

As `firestore.rules` ja estavam coerentes para permitir delete de:

- `clients`
- `annualRecords`

por owner ativo.

E continuam bloqueando diretamente no client:

- `govCredentials`
- escrita em `auditLogs`
- escrita em `credentialAccessLogs`

## Como validar o fluxo completo

### Excluir exercicio

1. abrir o detalhe de um exercicio
2. clicar em `Excluir exercicio`
3. confirmar
4. verificar redirecionamento para o cliente
5. verificar que o exercicio sumiu da lista
6. verificar que a credencial associada foi removida do backend

### Excluir cliente

1. abrir o detalhe de um cliente
2. clicar em `Excluir cliente`
3. confirmar
4. verificar redirecionamento para `/clients`
5. verificar que o cliente sumiu da lista
6. verificar que os exercicios desse cliente foram removidos
7. verificar que as credenciais associadas foram removidas

## Checklist final de teste

- excluir exercicio remove o documento correto
- excluir exercicio remove a credencial gov associada
- excluir cliente remove o cliente
- excluir cliente remove todos os exercicios vinculados
- excluir cliente remove todas as credenciais gov vinculadas
- delete continua exigindo owner autenticado
- a UI nao fica travada apos delete
- o redirecionamento apos exclusao funciona
- nao ha dados orfaos em `govCredentials`

## Validacoes executadas

```bash
npm run build
npm run typecheck
cd functions
npm run build
```
