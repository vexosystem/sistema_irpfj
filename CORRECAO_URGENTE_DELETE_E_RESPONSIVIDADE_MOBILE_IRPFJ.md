# CORRECAO URGENTE DELETE E RESPONSIVIDADE MOBILE IRPFJ

## Escopo executado

A correcao foi mantida estritamente em dois eixos:

- delete de clientes
- delete de exercicios anuais
- responsividade mobile real nas telas e componentes pedidos

Nao houve reescrita do projeto, troca de stack ou simplificacao da arquitetura atual.

## Causa raiz exata do delete nao funcionar

O problema central estava na forma como o delete era orquestrado:

1. o frontend tentava coordenar a exclusao em varias etapas
2. a entidade principal (`client` ou `annualRecord`) era apagada no client
3. a parte sensivel (`govCredentials`) so podia ser apagada via Cloud Function
4. isso deixava o fluxo dependente de multiplas chamadas separadas, sem uma operacao de cascata centralizada no backend
5. qualquer falha intermediaria interrompia o delete inteiro antes da conclusao
6. na pratica, o sistema ficava fragil para:
   - falha da callable de credencial
   - inconsistencias de referencia `govCredentialRef`
   - delete parcial iniciado pelo client
   - erro refletido de forma generica na UI

Em resumo: a exclusao das entidades principais de trabalho estava sendo conduzida no client, enquanto a exclusao do dado sensivel obrigatoriamente passava pelo backend. Essa divisao quebrava a consistencia do fluxo.

## Como o delete de exercicio foi corrigido

O fluxo de exclusao do exercicio foi concentrado em backend seguro:

1. a UI exige confirmacao obrigatoria
2. o service `src/services/annualRecords.service.ts` chama a Cloud Function `deleteAnnualRecord`
3. a Function valida:
   - usuario autenticado
   - `users/{uid}`
   - `role == "owner"`
   - `isActive == true`
4. a Function localiza `clients/{clientId}/annualRecords/{recordId}`
5. a Function remove no mesmo fluxo:
   - o `annualRecord`
   - a `govCredential` associada, quando existir
   - o log de auditoria correspondente
6. a UI:
   - bloqueia clique duplo com loading
   - mostra erro real quando falha
   - faz refresh da lista no detalhe do cliente
   - redireciona corretamente quando o delete parte da tela de detalhe do exercicio

## Como o delete de cliente foi corrigido

O fluxo de exclusao do cliente tambem foi centralizado no backend:

1. a UI exige confirmacao obrigatoria
2. o service `src/services/clients.service.ts` chama a Cloud Function `deleteClient`
3. a Function valida auth e owner ativo
4. a Function lista todos os `annualRecords` do cliente
5. para cada exercicio, remove:
   - o documento do exercicio
   - a credencial gov vinculada, quando existir
   - o log de auditoria do exercicio removido
6. ao final remove:
   - o documento `clients/{clientId}`
   - o log de auditoria do cliente
7. a UI:
   - mostra loading durante a exclusao
   - evita clique duplo
   - redireciona para `/clients`
   - exibe feedback de sucesso apos o redirect

## Como as credenciais gov relacionadas foram tratadas

As credenciais continuam protegidas no backend.

Nao foi aberto acesso direto do client para `govCredentials`.

O tratamento final ficou assim:

- leitura da credencial continua via `getGovCredential`
- salvamento da credencial continua via `saveGovCredential`
- exclusao associada agora acontece no backend durante:
  - `deleteAnnualRecord`
  - `deleteClient`

Com isso:

- nao ha tentativa insegura de delete direto da colecao sensivel pelo client
- nao ficam credenciais orfas ao excluir exercicios
- nao ficam credenciais orfas ao excluir clientes

## Review das rules

`firestore.rules` foi revisado.

Conclusao:

- as rules ja estavam coerentes para owner ativo operar `clients` e `annualRecords`
- `govCredentials` continua totalmente bloqueada no client
- `auditLogs` e `credentialAccessLogs` continuam protegidos contra escrita no frontend

Nao foi necessario afrouxar seguranca nem mudar o modelo de autorizacao.

## Quais arquivos foram alterados

- `functions/src/index.ts`
- `src/services/annualRecords.service.ts`
- `src/services/clients.service.ts`
- `src/components/layout/AppShell.tsx`
- `src/app/layout.tsx`
- `src/app/globals.css`
- `src/components/clients/ClientsList.tsx`
- `src/components/annual-records/AnnualRecordsList.tsx`
- `src/components/clients/ClientForm.tsx`
- `src/components/annual-records/AnnualRecordForm.tsx`
- `src/app/(private)/dashboard/page.tsx`
- `src/app/(private)/clients/[clientId]/page.tsx`
- `src/app/(private)/clients/[clientId]/annual-records/[recordId]/page.tsx`
- `src/app/(private)/clients/[clientId]/annual-records/new/page.tsx`
- `src/app/(private)/clients/[clientId]/annual-records/[recordId]/edit/page.tsx`
- `CORRECAO_URGENTE_DELETE_E_RESPONSIVIDADE_MOBILE_IRPFJ.md`

## Quais telas mobile foram ajustadas

- dashboard
- lista de clientes
- detalhe do cliente
- novo exercicio
- edicao de exercicio
- detalhe do exercicio
- formularios de cliente e exercicio
- shell global com header, navegacao e area de acoes

## Quais padroes responsivos foram adotados

Foram adotados padroes reais de uso mobile, e nao apenas reducao de fonte:

1. tabelas desktop mantidas apenas para `md+`
2. no mobile, listagens passaram a usar cards empilhados
3. botoes principais passaram a ocupar largura total no mobile quando necessario
4. header e acoes do `AppShell` passaram a quebrar corretamente por linha
5. navegacao superior passou a permitir scroll horizontal controlado sem estourar layout
6. containers e `main` passaram a trabalhar com `min-w-0`, largura total e protecao contra overflow horizontal
7. textos longos como email, login gov, senha e links passaram a quebrar corretamente
8. formularios passaram a manter empilhamento confortavel e areas de toque adequadas
9. feedback de sucesso e erro foi mantido visivel tambem em telas pequenas

## Como validar o fluxo completo

### Excluir exercicio pela lista do cliente

1. abrir um cliente
2. clicar em `Excluir` em um exercicio
3. confirmar
4. verificar loading no botao
5. verificar remocao do card ou linha apos refresh
6. verificar mensagem de sucesso
7. verificar no Firestore que o `annualRecord` sumiu
8. verificar que a `govCredential` vinculada tambem sumiu

### Excluir exercicio pela tela de detalhe

1. abrir o detalhe do exercicio
2. clicar em `Excluir exercicio`
3. confirmar
4. verificar loading no botao
5. verificar redirect para o detalhe do cliente
6. verificar feedback de sucesso na tela do cliente
7. verificar ausencia do exercicio na lista

### Excluir cliente pela lista

1. abrir `/clients`
2. clicar em `Excluir`
3. confirmar
4. verificar loading no botao
5. verificar remocao da lista apos refresh
6. verificar que os exercicios do cliente sumiram
7. verificar que as credenciais gov relacionadas sumiram

### Excluir cliente pela tela de detalhe

1. abrir o detalhe do cliente
2. clicar em `Excluir cliente`
3. confirmar
4. verificar loading
5. verificar redirect para `/clients`
6. verificar feedback de sucesso apos o redirect
7. verificar remocao do cliente, dos exercicios e das credenciais associadas

### Validacao mobile

1. abrir o sistema em largura de celular
2. validar dashboard sem corte horizontal
3. validar lista de clientes em cards com acoes acessiveis
4. validar detalhe do cliente sem botoes fora da viewport
5. validar formularios com campos empilhados e botoes clicaveis
6. validar detalhe do exercicio com credencial visivel sem quebrar layout
7. validar navegacao e header sem overflow

## Checklist final de teste

- delete de exercicio funciona pelo detalhe do cliente
- delete de exercicio funciona pela tela de detalhe do exercicio
- delete de cliente funciona pela lista
- delete de cliente funciona pela tela de detalhe
- `govCredentials` continua inacessivel diretamente no client
- credenciais gov relacionadas sao removidas no backend
- nao ha dados orfaos apos delete
- loading impede clique duplo
- erro tecnico real aparece na UI
- feedback de sucesso aparece apos refresh ou redirect
- dashboard funciona em mobile
- lista de clientes funciona em mobile
- detalhe do cliente funciona em mobile
- novo exercicio funciona em mobile
- edicao de exercicio funciona em mobile
- detalhe do exercicio funciona em mobile
- navegacao global funciona em mobile

## Validacoes executadas

```bash
npm run build
npm run typecheck
cd functions
npm run build
```
