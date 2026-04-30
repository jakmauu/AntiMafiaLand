# TerraChain Backend

## 1) Install

```bash
npm install
```

## 2) Configure env

Copy `.env.example` to `.env`, then fill:

- `RPC_URL`: JSON-RPC endpoint (local hardhat node by default)
- `CONTRACT_ADDRESS`: deployed `TerraChainSimple` contract address
- `ADMIN_PRIVATE_KEY`: private key for account with admin/validator role
- `DEFAULT_OWNER_PRIVATE_KEY` (optional): owner key untuk auto workflow demo
- `DATABASE_URL`: Supabase Postgres URL (pooler, include `?sslmode=require`)
- `DIRECT_URL`: direct URL for migrations (or pooler fallback)

## 3) Run

```bash
npm run dev
```

Backend starts at `http://localhost:3001`.

## Database (Prisma)

Run these commands from `backend/`:

```bash
npm run db:generate
npm run db:migrate -- --name init_core_schema
```

For production deploy:

```bash
npm run db:deploy
```

## Available endpoints

- `GET /health`
- `POST /risk/score`
- `GET /lands/:landId`
- `GET /transfers/:landId`
- `POST /admin/register-land`
- `POST /admin/validate-risk`
- `POST /admin/approve-transfer`
- `POST /admin/execute-transfer`
- `POST /admin/freeze-transfer`
- `POST /workflow/auto-transfer`
