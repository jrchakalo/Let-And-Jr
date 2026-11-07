# 💍 Let-And-Jr — Site de Casamento de Letícia & Júnior

Site de casamento *mobile-first* com contagem regressiva, informações do evento, confirmação de presença (RSVP) por convite individual, nossa história e lista de presentes integrada ao Mercado Pago, além de um painel administrativo para os noivos gerenciarem convidados e presentes em tempo real.

> 🔒 Este repositório é um template funcional, mas **os segredos ficam fora do código**. Faça um fork e configure suas variáveis de ambiente (abaixo) para o seu próprio evento.

## ✨ Funcionalidades

- **Página pública:** informação do evento, localização, nossa história e contagem regressiva em tempo real.
- **RSVP por convite:** cada família recebe um link único com token para confirmar presença individual de cada convidado, sem login.
- **Lista de presentes com cotas:** itens individuais ou cotas de vale-presente, com acompanhamento das contribuições por item.
- **Checkout Mercado Pago:** pagamento via Pix e cartão com confirmação automática via webhook assinado (HMAC-SHA256).
- **Painel administrativo (`/admin`):** gerencie famílias, convidados, RSVPs manuais e presentes, com atualização em tempo real (Supabase Realtime).
- **Área restrita `/evento`:** checkout separado para o dia do evento, protegido por senha.
- **Cron job:** liberação automática de reservas de presentes expiradas (Vercel Cron, protegido por `CRON_SECRET`).

## 🚀 Tecnologias Utilizadas

- **[Next.js 15](https://nextjs.org/)** - App Router, Server Components e API Routes.
- **[TypeScript](https://www.typescriptlang.org/)** - Tipagem estática em todo o projeto.
- **[Tailwind CSS](https://tailwindcss.com/)** - Estilização utilitária.
- **[Supabase](https://supabase.com/)** - Banco PostgreSQL com Row Level Security (RLS) e Realtime.
- **[Mercado Pago](https://www.mercadopago.com.br/developers)** - Processamento de pagamentos via Pix e cartão.
- **[Vercel](https://vercel.com/)** - Deploy e cron jobs.

## 🛠️ Configuração Local

### 1. Clone o repositório

```bash
git clone https://github.com/jrchakalo/Let-And-Jr.git
cd Let-And-Jr
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

Crie um arquivo `.env.local` a partir do exemplo e preencha com suas credenciais:

```bash
cp .env.local.example .env.local
```

```env
# Banco de Dados (Supabase)
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role_secret

# Pagamentos (Mercado Pago) — https://www.mercadopago.com.br/developers
MERCADOPAGO_ACCESS_TOKEN=seu_access_token
MERCADOPAGO_WEBHOOK_SECRET=seu_webhook_secret

# URL base da aplicação (usada nos callbacks do Mercado Pago)
NEXT_PUBLIC_BASE_URL=https://seu-site.vercel.app

# Segurança dos painéis /admin e /evento
ADMIN_PASSWORD=senha_segura_para_os_paineis

# Proteção do endpoint de cron (opcional) — gere com: openssl rand -base64 32
CRON_SECRET=secret_do_cron
```

### 4. Configure o banco de dados

As migrations estão em [supabase/migrations](supabase/migrations):

```bash
npx supabase link --project-ref SEU_PROJECT_REF
npx supabase db push
```

### 5. Execute o servidor de desenvolvimento

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000). O painel do admin fica em [http://localhost:3000/admin](http://localhost:3000/admin).

## ☁️ Deploy

Este projeto é otimizado para a [Vercel](https://vercel.com/).

Para colocar em produção, importe o repositório no painel da Vercel e preencha as variáveis de ambiente (Environment Variables) antes do deploy. O cron job de liberação de reservas está configurado em [vercel.json](vercel.json) e o agendamento é `0 9 * * *` (diariamente às 9:00).

## 🔒 Segurança

- As credenciais ficam **exclusivamente por variáveis de ambiente** — nenhuma chave está no código.
- O painel admin e a área `/evento` usam cookies `httpOnly` e comparação não sujeita a *timing attack* (`crypto.timingSafeEqual`), com rate limit de tentativas.
- As policies de RLS do Supabase seguem o mínimo de permissão: a chave anon (pública) só consegue **ler** a lista de presentes; dados pessoais (famílias, convidados e contribuições) só são acessíveis no servidor, com a chave de service role.

---

*Desenvolvido com carinho e ansiedade para o melhor dia da minha vida.*

## Autor

[<img src="https://avatars.githubusercontent.com/jrchakalo?v=4" width=115><br><sub>Júnior Silva</sub>](https://github.com/jrchakalo)
