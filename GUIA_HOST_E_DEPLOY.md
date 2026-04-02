# Guia Passo a Passo para Rodar em Host e Fazer Deploy

Este documento mostra como subir o sistema IRPFJ em um host e como publicar a aplicacao em producao.

## 1. Visao rapida da arquitetura

O projeto possui duas partes:

- `raiz do projeto`: aplicacao `Next.js 15`
- `functions/`: `Firebase Cloud Functions`

O frontend usa Firebase para:

- Authentication
- Firestore
- Storage
- Cloud Functions na regiao `southamerica-east1`

Importante:

- a pagina inicial usa `redirect` do Next.js no servidor
- por isso, o frontend deve ser hospedado em ambiente com suporte a Node.js/SSR
- nao e recomendavel publicar esse frontend como site estatico simples

## 2. Pre-requisitos

Antes de iniciar, tenha instalado:

- `Node.js 20`
- `npm`
- `Firebase CLI`

Comandos:

```bash
npm install -g firebase-tools
firebase login
```

## 3. Variaveis de ambiente

Crie um arquivo `.env.local` na raiz do projeto com base no `.env.example`.

Exemplo:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### Como obter esses dados

#### Variaveis `NEXT_PUBLIC_FIREBASE_*`

No console do Firebase:

1. Acesse `Configuracoes do projeto`
2. Abra a secao `Seus apps`
3. Selecione o app Web
4. Copie as chaves do SDK

#### `FIREBASE_CLIENT_EMAIL` e `FIREBASE_PRIVATE_KEY`

No console do Firebase:

1. Entre em `Configuracoes do projeto`
2. Abra `Contas de servico`
3. Gere uma nova chave privada
4. Use os campos do JSON baixado

Mapeamento:

- `client_email` -> `FIREBASE_CLIENT_EMAIL`
- `private_key` -> `FIREBASE_PRIVATE_KEY`

Observacao:

- mantenha os `\n` dentro da chave privada
- nunca suba esse arquivo para repositorio publico

## 4. Configuracao do Firebase para o projeto

No Firebase, confirme que o projeto possui:

- Authentication habilitado com `Email/Password`
- Firestore Database criado
- Storage habilitado
- Cloud Functions habilitado

Depois, conecte a pasta local ao projeto:

```bash
firebase use --add
```

Selecione o projeto correto.

## 5. Rodando localmente

### 5.1 Instalar dependencias

Na raiz:

```bash
npm install
```

Na pasta `functions`:

```bash
cd functions
npm install
cd ..
```

### 5.2 Rodar o frontend localmente

Na raiz:

```bash
npm run dev
```

O sistema abrira em:

```text
http://localhost:3000
```

### 5.3 Rodar as Cloud Functions no emulador

Em outro terminal:

```bash
cd functions
npm run build
cd ..
firebase emulators:start --only functions
```

Observacao importante:

- o frontend esta configurado para chamar Functions em `southamerica-east1`
- se quiser testar 100% local com emulador, sera preciso adaptar o client Firebase para usar `connectFunctionsEmulator`
- como isso nao esta configurado hoje, o fluxo mais simples de desenvolvimento e:
  - rodar o frontend localmente
  - usar as Functions ja deployadas no Firebase

## 6. Build de producao

Na raiz:

```bash
npm run build
```

Para subir o servidor Next em producao:

```bash
npm run start
```

Por padrao, ele atende na porta `3000`.

## 7. Como rodar em host proprio

Este e o caminho ideal quando voce quer usar:

- VPS Linux
- servidor dedicado
- host com acesso a Node.js

### 7.1 Subir o codigo no servidor

No host:

1. Instale `Node.js 20`
2. Instale `Firebase CLI`
3. Envie o projeto para o servidor
4. Crie o arquivo `.env.local`

### 7.2 Instalar dependencias no servidor

Na raiz do projeto:

```bash
npm install
```

Na pasta `functions`:

```bash
cd functions
npm install
npm run build
cd ..
```

### 7.3 Gerar a build do Next.js

```bash
npm run build
```

### 7.4 Iniciar a aplicacao

Opcao simples:

```bash
npm run start
```

Opcao recomendada com PM2:

```bash
npm install -g pm2
pm2 start npm --name sistema-irpfj -- start
pm2 save
```

### 7.5 Publicar atras de Nginx

Configure o Nginx para apontar para:

```text
http://127.0.0.1:3000
```

Fluxo recomendado:

1. dominio aponta para o servidor
2. Nginx recebe porta `80/443`
3. Nginx faz proxy para o Next.js na `3000`
4. SSL pode ser emitido com `certbot`

## 8. Deploy recomendado para producao

O caminho mais estavel para este projeto e:

- frontend `Next.js` na `Vercel`
- `Cloud Functions`, `Firestore Rules` e `Storage Rules` no `Firebase`

Isso separa bem o app web da infraestrutura do Firebase.

## 9. Deploy do frontend na Vercel

### 9.1 Publicar o repositorio

Suba o codigo para GitHub, GitLab ou Bitbucket.

### 9.2 Importar o projeto na Vercel

1. Acesse a Vercel
2. Clique em `Add New Project`
3. Importe o repositorio
4. A Vercel deve detectar automaticamente `Next.js`

### 9.3 Configurar variaveis de ambiente

Na Vercel, adicione:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY=...
```

### 9.4 Fazer o deploy

Depois de salvar as variaveis:

1. clique em `Deploy`
2. aguarde o build finalizar
3. teste a URL gerada

## 10. Deploy das Functions e regras do Firebase

### 10.1 Definir o secret obrigatorio

As Functions usam o secret:

```text
GOV_CREDENTIAL_ENCRYPTION_KEY
```

Crie esse secret no Firebase:

```bash
firebase functions:secrets:set GOV_CREDENTIAL_ENCRYPTION_KEY
```

Digite uma chave forte de criptografia.

### 10.2 Build das Functions

```bash
cd functions
npm install
npm run build
cd ..
```

### 10.3 Deploy das Functions

```bash
firebase deploy --only functions
```

### 10.4 Deploy das regras do Firestore e Storage

```bash
firebase deploy --only firestore:rules,storage
```

Se quiser publicar tudo de uma vez:

```bash
firebase deploy
```

## 11. Checklist de producao

Antes de considerar o sistema publicado, valide:

- login com usuario owner funcionando
- leitura e gravacao no Firestore funcionando
- upload no Storage funcionando
- criacao e leitura de credenciais via Cloud Functions funcionando
- secret `GOV_CREDENTIAL_ENCRYPTION_KEY` configurado
- variaveis `NEXT_PUBLIC_FIREBASE_*` corretas
- dominio final autorizado no Firebase Authentication

## 12. Ajustes importantes no Firebase Authentication

No console do Firebase Authentication, adicione os dominios autorizados:

- dominio da Vercel
- dominio proprio, se existir
- `localhost`, para desenvolvimento

Sem isso, o login pode falhar.

## 13. Comandos rapidos

### Desenvolvimento

```bash
npm run dev
```

### Build do frontend

```bash
npm run build
```

### Iniciar frontend em producao

```bash
npm run start
```

### Build das functions

```bash
cd functions
npm run build
```

### Deploy das functions

```bash
firebase deploy --only functions
```

### Deploy completo do Firebase

```bash
firebase deploy
```

## 14. Recomendacao final

Se voce quer o caminho mais simples e profissional:

1. hospede o `Next.js` na `Vercel`
2. mantenha `Firestore`, `Storage` e `Cloud Functions` no `Firebase`
3. use um projeto Firebase de producao separado do ambiente de testes

Se quiser controle total do servidor:

1. use uma `VPS` com `Node.js 20`
2. rode o Next.js com `PM2`
3. coloque `Nginx` na frente
4. mantenha as Cloud Functions no Firebase

Esse projeto, no estado atual, fica melhor com arquitetura hibrida:

- app web em host com suporte a Node
- backend serverless no Firebase
