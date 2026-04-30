# Panduan Menjalankan Project + Push ke GitHub

Panduan ini untuk project di folder `d:\Proyek Blockchain` dan repo tujuan:
`https://github.com/jakmauu/AntiMafiaLand`

## 1) Prasyarat

- Node.js 20+ (disarankan LTS terbaru)
- npm
- Git
- (Opsional) Database PostgreSQL/Supabase untuk backend Prisma

Cek versi cepat:

```powershell
node -v
npm -v
git --version
```

## 2) Struktur Program (yang akan dijalankan)

- Smart contract Hardhat: folder root (`contracts`, `scripts`, `hardhat.config.ts`)
- Backend API Express + Prisma: `backend/`
- Frontend React + Vite: `frontend/`

## 3) Install Dependency

Jalankan dari root project:

```powershell
cd "d:\Proyek Blockchain"
npm install
```

Install dependency backend:

```powershell
cd "d:\Proyek Blockchain\backend"
npm install
```

Install dependency frontend:

```powershell
cd "d:\Proyek Blockchain\frontend"
npm install
```

## 4) Setup Environment Variables

### 4.1 Hardhat (root)

File `hardhat.config.ts` memakai:
- `SEPOLIA_RPC_URL`
- `SEPOLIA_PRIVATE_KEY`

Set sementara di PowerShell (hanya sesi terminal aktif):

```powershell
$env:SEPOLIA_RPC_URL="https://sepolia.infura.io/v3/KEY_KAMU"
$env:SEPOLIA_PRIVATE_KEY="0xPRIVATE_KEY_KAMU"
```

Atau pakai hardhat keystore:

```powershell
cd "d:\Proyek Blockchain"
npx hardhat keystore set SEPOLIA_RPC_URL
npx hardhat keystore set SEPOLIA_PRIVATE_KEY
```

### 4.2 Backend env

Sudah ada template: `backend/.env.example`

Copy lalu isi nilai asli:

```powershell
cd "d:\Proyek Blockchain\backend"
Copy-Item .env.example .env
```

Isi minimal yang wajib:

```env
PORT=3001
RPC_URL=http://127.0.0.1:8545
CONTRACT_ADDRESS=0xAlamatKontrakHasilDeploy
ADMIN_PRIVATE_KEY=0xPrivateKeyAdmin
DEFAULT_OWNER_PRIVATE_KEY=0xPrivateKeyOwnerOpsional
DATABASE_URL=postgresql://user:password@host:5432/dbname?sslmode=require
DIRECT_URL=postgresql://user:password@host:5432/dbname?sslmode=require
```

### 4.3 Frontend env

Copy template frontend:

```powershell
cd "d:\Proyek Blockchain\frontend"
Copy-Item .env.example .env
```

Isi:

```env
VITE_API_BASE_URL=http://localhost:3001
```

## 5) Menjalankan Semua Program (lokal)

Gunakan 4 terminal agar rapi.

### Terminal A - Jalankan local blockchain node

```powershell
cd "d:\Proyek Blockchain"
npx hardhat node
```

### Terminal B - Compile dan deploy contract

```powershell
cd "d:\Proyek Blockchain"
npx hardhat compile
npx hardhat run scripts/deploy-terrachain.ts --network localhost
```

Catat alamat contract dari output deploy, lalu update `backend/.env` pada `CONTRACT_ADDRESS`.

### Terminal C - Jalankan backend

```powershell
cd "d:\Proyek Blockchain\backend"
npm run db:generate
npm run db:migrate -- --name init_core_schema
npm run dev
```

Cek health endpoint:

```powershell
curl http://localhost:3001/health
```

### Terminal D - Jalankan frontend

```powershell
cd "d:\Proyek Blockchain\frontend"
npm run dev
```

Buka: `http://localhost:5173`

## 6) Menjalankan Test Smart Contract

```powershell
cd "d:\Proyek Blockchain"
npx hardhat test
```

## 7) Panduan Push ke Repo GitHub `jakmauu/AntiMafiaLand`

Pastikan kamu berada di root project:

```powershell
cd "d:\Proyek Blockchain"
```

### 7.1 Inisialisasi git lokal (jika belum)

```powershell
git init
```

### 7.2 Set branch utama

```powershell
git branch -M main
```

### 7.3 Hubungkan remote repo GitHub

```powershell
git remote add origin https://github.com/jakmauu/AntiMafiaLand.git
```

Kalau remote `origin` sudah ada:

```powershell
git remote set-url origin https://github.com/jakmauu/AntiMafiaLand.git
```

### 7.4 Tambah file dan commit

```powershell
git add .
git commit -m "Initial project import: AntiMafiaLand"
```

### 7.5 Push ke GitHub

```powershell
git push -u origin main
```

## 8) Jika Push Ditolak (Repo sudah berisi file)

Jika repo GitHub sudah ada isi (misalnya README dari GitHub), lakukan:

```powershell
git pull origin main --rebase
```

Lalu push lagi:

```powershell
git push -u origin main
```

## 9) Keamanan Penting

- Jangan commit file `.env` yang berisi private key.
- Gunakan `.env.example` untuk template.
- Jika private key terlanjur bocor, segera ganti wallet/credential.

---

Kalau kamu mau, setelah ini kita bisa lanjut langsung eksekusi langkah git di atas satu per satu sampai berhasil push.
