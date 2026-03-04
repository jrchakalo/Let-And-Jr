# Letícia & Júnior

Site de casamento com:
- Página pública (informações do evento)
- RSVP por convite com token
- Lista de presentes (incluindo cotas)
- Checkout Mercado Pago
- Admin para convidados/presentes
- Checkout separado para dia do evento (`/evento`)

## Stack

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- Supabase (Postgres + API)
- Mercado Pago
- Vercel (deploy + cron)

## Requisitos

- Node.js 20+
- Conta no Supabase
- Conta no Mercado Pago (token de produção/sandbox)

## Rodar localmente

1. Instale dependências:

```bash
npm install
```

2. Crie seu `.env.local` a partir do exemplo:

```bash
cp .env.local.example .env.local
```

3. Preencha as variáveis de ambiente no `.env.local`.

4. Rode o projeto:

```bash
npm run dev
```

## Variáveis de ambiente

Use o arquivo [.env.local.example](.env.local.example) como referência.

Obrigatórias para produção:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `MERCADOPAGO_ACCESS_TOKEN`
- `NEXT_PUBLIC_BASE_URL`
- `ADMIN_PASSWORD`

Opcional:
- `CRON_SECRET`

## Banco de dados (Supabase)

As migrations ficam em [supabase/migrations](supabase/migrations).

Para aplicar no projeto remoto:

```bash
npx supabase link --project-ref SEU_PROJECT_REF
npx supabase db push
```

Para conferir se local e remoto estão alinhados:

```bash
npx supabase migration list
``