# JARVIS Financeiro — passo a passo para colocar no ar

Site com cadastro e senha para cada pessoa, dados em PostgreSQL e hospedagem na Vercel.
Cada usuário vê somente os próprios dados.

## 1. Banco de dados (Neon, plano gratuito)
1. Crie uma conta em https://neon.tech e um projeto novo.
2. Copie a **connection string** (começa com `postgresql://`).
3. Abra o **SQL Editor** do Neon, cole o conteúdo do arquivo `schema.sql` e execute.

## 2. Código no GitHub
1. Crie uma conta em https://github.com e um repositório novo (privado serve).
2. Envie todos os arquivos desta pasta para o repositório.

## 3. Publicar na Vercel (plano gratuito)
1. Crie uma conta em https://vercel.com (pode entrar com o GitHub).
2. **Add New → Project** e escolha o repositório.
3. Em **Environment Variables**, adicione:
   - `DATABASE_URL` = a connection string do Neon
   - `JWT_SECRET` = uma frase longa e aleatória (30+ caracteres), só sua
4. Clique em **Deploy**. A Vercel gera um endereço `https://seu-projeto.vercel.app`.

Mande esse endereço para quem quiser: cada pessoa clica em "Criar minha conta" e usa em qualquer celular ou computador.

## Testar no computador (opcional)
`npm i -g vercel`, depois `npm install`, crie um arquivo `.env` com as duas variáveis e rode `vercel dev`.

## Comandos do JARVIS IA
"registrei uma montagem de hardware por R$ 250" · "gastei R$ 40 com cabo" · "meta de 5000" · "relatório"
