# Project Update Slides - Anti-Mafia Land System

## Slide 1 - Title

**Anti-Mafia Land System**

Project Deployment & Feature Update

Kelompok 5  
Teknik Komputer - Universitas Indonesia

## Slide 2 - Current Status

Project sudah berhasil masuk tahap online deployment.

Komponen yang sudah selesai:

- Frontend sudah deploy ke Railway
- Backend sudah deploy ke Railway
- Smart contract sudah deploy ke Ethereum Sepolia
- Database sudah aktif dan terhubung
- MetaMask wallet sudah terintegrasi
- Flow transaksi sudah berhasil diuji end-to-end

## Slide 3 - Smart Contract Deployment

Smart contract `TerraChainSimple` sudah dideploy ke Ethereum Sepolia testnet.

Status:

- Network: Ethereum Sepolia
- RPC provider: Infura
- Contract address sudah terhubung ke backend
- Contract dapat dipanggil dari backend dan frontend
- Fungsi utama sudah berhasil diuji: register land, request transfer, validate risk, execute transfer

## Slide 4 - Backend Deployment

Backend sudah dideploy ke Railway.

Backend digunakan untuk:

- Menyediakan API untuk frontend
- Menghubungkan aplikasi ke smart contract Sepolia
- Menjalankan fungsi admin
- Mengelola login dan register user
- Menghubungkan aplikasi ke database

Status backend:

- Sepolia RPC terhubung
- Contract address terdeteksi
- Admin private key terdeteksi
- Database URL terdeteksi

## Slide 5 - Frontend Deployment

Frontend React.js sudah dideploy ke Railway.

Fitur frontend:

- Login dan register
- Dashboard admin dan user
- Connect MetaMask wallet
- Register land
- Request transfer
- Validate risk
- Execute transfer
- Land lookup dan transfer lookup

Frontend sudah terhubung ke backend Railway dan dapat diakses melalui public URL.

## Slide 6 - Database & Authentication

Database sudah aktif dan digunakan untuk menyimpan akun.

Fitur auth yang sudah berjalan:

- Register akun baru
- Login admin
- Login user
- Penyimpanan role `admin` dan `user`
- Password disimpan dalam bentuk hash
- Session user disimpan di frontend

Database mendukung pemisahan akses antara admin dan user.

## Slide 7 - Wallet Integration

MetaMask sudah berhasil diintegrasikan.

Fungsi wallet:

- Connect wallet ke frontend
- Menggunakan network Sepolia
- Menandatangani transaksi user
- Mengirim request transfer ke smart contract

Testing wallet:

- Account 1 digunakan sebagai owner land
- Account 2 digunakan sebagai recipient
- Request transfer berhasil dikirim melalui MetaMask

## Slide 8 - Feature Checklist

Fitur yang sudah selesai:

- Login admin
- Login user
- Register akun
- Register land
- Request transfer
- Validate risk
- Approve pending transfer
- Execute approved transfer
- Freeze transfer
- Land lookup
- Transfer lookup
- Connect wallet

Semua fitur utama sudah dapat digunakan melalui web online.

## Slide 9 - End-to-End Test Result

Flow yang sudah berhasil diuji:

1. Admin login
2. Admin register land ke Account 1
3. User login
4. User connect MetaMask Account 1
5. User request transfer ke Account 2
6. Transfer status menjadi `Pending`
7. Admin validate risk dengan score 25
8. Transfer status menjadi `Approved`
9. Admin execute transfer
10. Owner land berubah ke Account 2

## Slide 10 - System Architecture

Arsitektur saat ini:

Frontend Railway

Backend Railway

Database online

Infura Sepolia RPC

Smart contract Sepolia

MetaMask wallet

Semua komponen sudah saling terhubung dan tidak lagi membutuhkan Hardhat node lokal untuk demo.



## Slide 11 - Conclusion & Demo Readiness

Project Anti-Mafia Land System sudah siap untuk demo online.

Status akhir:

- Frontend online
- Backend online
- Database connected
- Smart contract deployed on Sepolia
- Wallet integration working
- Admin and user features working
- End-to-end transfer flow successful

