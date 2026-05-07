# TerraChain Backend

## Setup

```bash
npm install
```

Copy `.env.example` to `.env`.

## Run

```bash
npm run dev
```

## Auth

- `POST /auth/register`
- `POST /auth/login`

User data disimpan di SQLite (`DB_PATH`, default `backend/data/app.db`).

Default seed admin:
- email: `admin@terrachain.local`
- password: `admin123`

## Blockchain endpoints

- `GET /health`
- `GET /config`
- `GET /lands/:landId`
- `GET /transfers/:landId`
- `POST /admin/register-land`
- `POST /admin/validate-risk`
- `POST /admin/approve-transfer`
- `POST /admin/execute-transfer`
- `POST /admin/freeze-transfer`
