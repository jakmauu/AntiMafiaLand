# TerraChain Frontend

React + Vite dashboard untuk proyek Anti-Mafia Land System.

## Setup

```bash
npm install
```

Copy env:

```bash
cp .env.example .env
```

Isi `VITE_API_BASE_URL` jika backend bukan di `http://localhost:3001`.

## Run

```bash
npm run dev
```

Buka `http://localhost:5173`.

## Fitur UI

- Backend health check
- Dynamic risk scoring
- Register land (admin endpoint)
- Lookup land data
- Lookup transfer data
- Admin actions: approve / execute / freeze transfer
