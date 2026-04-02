# Correcao Urgente do Dashboard IRPFJ

## Resumo

O bloqueio do dashboard nao estava mais concentrado nas Cloud Functions. O problema real ficou no fluxo entre bootstrap do owner, leitura inicial do dashboard e compatibilidade das regras com documentos legados do proprio owner. Isso fazia a tela entrar em erro de permissao e, em seguida, permanecer zerada.

## Causa raiz do bloqueio do dashboard

1. O bootstrap do owner ainda podia ficar instavel logo apos o login.
2. A sincronizacao do documento `users/{uid}` dependia de uma leitura/escrita que nem sempre refletia imediatamente no cliente.
3. As rules do proprio owner estavam rigidas para atualizacao quando havia documentos antigos sem `createdAt`, o que podia interromper a estabilizacao do owner.
4. O dashboard tentava carregar usando uma estrategia de leitura mais fragil para o estado atual do projeto.

## Causa raiz do zero indevido

O dashboard mostrava `0` porque a leitura podia falhar antes de concluir, e a UI nao separava com clareza os estados de:

- carregando
- erro real
- vazio real

Com isso, o usuario via cards zerados ou uma mensagem de permissao persistente mesmo quando o problema era a leitura nao estabilizada.

## Arquivos alterados

- `firestore.rules`
- `src/lib/auth/auth-client.ts`
- `src/services/clients.service.ts`
- `src/app/(private)/dashboard/page.tsx`

## Como a autorizacao foi estabilizada

### `src/lib/auth/auth-client.ts`

- a sincronizacao do owner passou a usar `getDocFromServer`
- o documento `users/{uid}` agora e confirmado apos a escrita
- foi adicionado um pequeno ciclo de confirmacao para garantir que o owner esteja realmente persistido com:
  - `role: "owner"`
  - `isActive: true`
  - `email` coerente

Isso evita liberar o dashboard antes de o owner estar pronto de verdade.

### `firestore.rules`

- o bootstrap e a leitura do proprio `users/{uid}` foram preservados
- a atualizacao do owner foi ajustada para aceitar documentos legados sem `createdAt`
- o acesso de owner ativo a `clients` e `annualRecords` foi mantido
- as colecoes sensiveis continuam bloqueadas:
  - `govCredentials`
  - `auditLogs` com escrita client-side bloqueada
  - `credentialAccessLogs` com escrita client-side bloqueada

## Como a query do dashboard foi corrigida

### `src/services/clients.service.ts`

A leitura do dashboard foi simplificada para um fluxo mais robusto:

1. listar `clients`
2. para cada cliente, listar `clients/{clientId}/annualRecords`
3. calcular localmente:
   - total de clientes
   - pendentes
   - pagos
   - nao pagos

Essa abordagem evita depender de uma leitura mais fragil para o estado atual e respeita melhor as rules existentes por documento/subcolecao.

## Como a UI do dashboard foi corrigida

### `src/app/(private)/dashboard/page.tsx`

- separacao explicita entre `loading`, `error` e `loaded`
- nao exibe zero silenciosamente quando a leitura falha
- mostra mensagem real de erro com botao de nova tentativa
- so mostra estado vazio quando a leitura concluiu com sucesso e realmente nao ha clientes

## Por que a correcao anterior nao resolveu por completo

A correcao anterior melhorou partes do fluxo, mas ainda deixava duas brechas:

1. o owner podia nao estar realmente confirmado no servidor no momento da primeira leitura privada
2. as rules do proprio owner continuavam sensiveis a dados legados, especialmente em atualizacao

Com isso, o dashboard ainda podia cair em `permission-denied` e permanecer sem dados.

## Fluxo final do dashboard

1. usuario autentica
2. `users/{uid}` e criado ou sincronizado
3. o cliente confirma o owner no servidor
4. a area privada libera o acesso
5. o dashboard carrega clientes
6. o dashboard percorre os exercicios anuais e calcula os indicadores
7. a UI diferencia sucesso, vazio real e erro real

## Checklist de validacao final

- login com owner autenticado
- confirmacao de existencia de `users/{uid}`
- dashboard abrindo sem mensagem de permissao indevida
- total de clientes refletindo o Firestore real
- total de pendentes refletindo os exercicios nao finalizados
- total de pagos refletindo `servicePaid == true`
- total de nao pagos refletindo `servicePaid != true`
- estado de erro aparecendo apenas quando ha falha real
- estado vazio aparecendo apenas quando a leitura conclui sem clientes

## Comandos de validacao

```bash
npm run build
npm run typecheck
cd functions
npm run build
```

## Ordem recomendada para publicar

1. publicar `firestore.rules`
2. publicar o frontend atualizado
3. validar login e dashboard em localhost e producao
