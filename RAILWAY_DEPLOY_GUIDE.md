# Railway Deploy Guide

## Backend Service

Create a Railway service from this repo and set the service root directory to:

```txt
backend
```

Set environment variables:

```env
PORT=3001
RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
CONTRACT_ADDRESS=YOUR_SEPOLIA_CONTRACT_ADDRESS
ADMIN_PRIVATE_KEY=YOUR_METAMASK_PRIVATE_KEY
JWT_SECRET=replace_with_a_long_random_secret
DATABASE_URL=YOUR_POSTGRES_CONNECTION_STRING
```

Add a Railway Postgres database, then copy its `DATABASE_URL` into the backend service variables.

Use these Railway commands/settings:

```txt
Build command: npm install
Start command: npm run start
```

After deploy, open:

```txt
https://YOUR-BACKEND.up.railway.app/health
```

## Frontend Service

Create another Railway service from the same repo and set the service root directory to:

```txt
frontend
```

Set environment variable:

```env
VITE_API_BASE_URL=https://YOUR-BACKEND.up.railway.app
```

Use these Railway commands/settings:

```txt
Build command: npm install && npm run build
Start command: npm run start
```

After deploy, open the frontend Railway URL and click `Check Backend`.

## MetaMask

Use network:

```txt
Sepolia
```

Make sure the wallet has Sepolia ETH for user transactions.
