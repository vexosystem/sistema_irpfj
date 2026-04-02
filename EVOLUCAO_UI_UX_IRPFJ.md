# Evolucao UI UX IRPFJ

## Resumo das melhorias

Esta evolucao refinou o sistema IRPFJ sem alterar a arquitetura principal baseada em `Next.js + Firebase + Cloud Functions`.

As melhorias entregues foram:

- tema `dark/light` persistente com `localStorage`
- visual global mais consistente e mais legivel
- dashboard com leitura mais confiavel
- navegacao mais clara no fluxo de exercicios anuais
- remocao completa do upload interno de documentos
- substituicao do upload por `driveLink` obrigatorio no exercicio anual
- visualizacao funcional da credencial gov com mostrar, ocultar e copiar
- atualizacao segura da senha gov no formulario de exercicio
- formulario de exercicio reorganizado por secoes

## O que foi removido

Foram removidos os recursos de documentos internos e upload:

- `src/services/documents.service.ts`
- `src/components/documents/DocumentsSection.tsx`
- `src/lib/validators/document.ts`
- `src/types/document.ts`

Tambem houve desativacao completa do Storage:

- `storage.rules` agora bloqueia todo acesso

E houve remocao das regras de subcolecao de documentos no Firestore:

- `clients/{clientId}/annualRecords/{recordId}/documents`

## O que foi adicionado

### Tema persistente

Arquivos novos:

- `src/components/layout/ThemeProvider.tsx`
- `src/hooks/useTheme.ts`

Comportamento:

- tema padrao `dark`
- alternancia pelo header
- persistencia local
- aplicacao por classe global no `html`

### Novo modelo de documentos

O upload foi substituido por:

- campo obrigatorio `driveLink` no exercicio anual

Beneficios:

- reduz complexidade operacional
- remove dependencia de Storage para arquivos internos
- mantem acesso simples via Google Drive

### Melhorias no fluxo gov

Na tela de detalhe do exercicio anual agora existe:

- carregamento explicito da credencial gov
- exibicao de login gov
- exibicao da senha com mostrar/ocultar
- copia para clipboard

No formulario agora existe:

- campo `Atualizar senha gov`
- campo de senha com uso opcional em edicao

## Impacto no sistema

### Positivo

- menos friccao no cadastro de exercicios
- menos complexidade com upload interno
- melhor confiabilidade visual e operacional
- fluxo de credencial gov mais claro para uso diario
- navegacao mais previsivel

### Impacto no modelo de dados

O exercicio anual agora exige:

- `driveLink`

Se existirem registros antigos sem esse campo, eles devem ser atualizados antes de editar o registro pelo app.

## Novas regras de negocio

### Exercicios anuais

Agora um exercicio anual depende de:

- `ano`
- `login gov`
- `driveLink`
- `status`
- `tipo de resultado`
- `valor`
- `informacao de pagamento`

### Senha gov

Regras novas:

- no cadastro novo, a senha gov entra com `updateGovPassword = true`
- na edicao, a senha so e atualizada quando o checkbox de atualizacao estiver marcado
- o login gov pode ser alterado sem troca de senha
- a senha continua protegida via Cloud Functions

### Documentos

Regras novas:

- nao existe mais upload interno no sistema
- a referencia documental oficial do exercicio passa a ser o `driveLink`

## Arquivos alterados

- `tailwind.config.ts`
- `src/app/globals.css`
- `src/app/layout.tsx`
- `src/components/layout/AppProviders.tsx`
- `src/components/layout/ThemeProvider.tsx`
- `src/hooks/useTheme.ts`
- `src/components/layout/AppShell.tsx`
- `src/components/layout/AuthGuard.tsx`
- `src/components/ui/Card.tsx`
- `src/components/ui/Button.tsx`
- `src/components/ui/Input.tsx`
- `src/components/ui/Select.tsx`
- `src/components/ui/Textarea.tsx`
- `src/components/ui/Badge.tsx`
- `src/components/ui/FormField.tsx`
- `src/components/ui/Checkbox.tsx`
- `src/types/annualRecord.ts`
- `src/lib/validators/annual-record.ts`
- `src/services/annualRecords.service.ts`
- `src/services/clients.service.ts`
- `src/lib/firebase/client.ts`
- `src/components/annual-records/AnnualRecordForm.tsx`
- `src/components/annual-records/AnnualRecordsList.tsx`
- `src/components/clients/ClientForm.tsx`
- `src/components/clients/ClientsList.tsx`
- `src/app/(private)/dashboard/page.tsx`
- `src/app/(private)/clients/[clientId]/page.tsx`
- `src/app/(private)/clients/[clientId]/annual-records/[recordId]/page.tsx`
- `src/app/(private)/clients/[clientId]/annual-records/new/page.tsx`
- `src/app/(private)/clients/[clientId]/annual-records/[recordId]/edit/page.tsx`
- `src/app/(private)/clients/new/page.tsx`
- `src/app/(private)/clients/[clientId]/edit/page.tsx`
- `firestore.rules`
- `storage.rules`

## Instrucoes de deploy

### 1. Publicar rules do Firestore e Storage

```bash
firebase deploy --only firestore:rules,storage
```

### 2. Publicar Cloud Functions

As functions continuam sendo usadas para credencial gov:

```bash
cd functions
npm install
npm run build
cd ..
firebase deploy --only functions
```

### 3. Publicar frontend na Vercel

Depois das rules e functions:

- subir commit no repositorio
- aguardar novo deploy da Vercel

## Checklist de validacao

### Tema

- alternar dark/light no header
- recarregar a pagina e confirmar persistencia

### Dashboard

- validar total de clientes
- validar pendentes
- validar pagos
- validar nao pagos

### Clientes

- criar cliente
- editar cliente
- buscar por nome, CPF e email

### Exercicios anuais

- criar exercicio com `driveLink`
- editar exercicio
- usar botao `Voltar para clientes`
- duplicar exercicio

### Credenciais gov

- salvar senha no cadastro
- editar exercicio sem trocar senha
- editar exercicio trocando senha
- carregar credencial na tela de detalhe
- mostrar senha
- ocultar senha
- copiar login
- copiar senha

### Drive

- abrir `driveLink` na tela de detalhe
- abrir `driveLink` na listagem de exercicios

## Validacoes executadas localmente

Foram executados:

- `npm run build`
- `npm run typecheck`
- `npm run build` em `functions`

Resultado:

- frontend compilando
- typecheck aprovado
- functions compilando
