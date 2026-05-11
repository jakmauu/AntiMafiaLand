# Alur Demo Anti-Mafia Land System

Panduan ini dipakai untuk menjalankan demo dari awal sampai akhir, mulai dari admin membuat data tanah, user melakukan request transfer, sampai ownership berpindah ke user penerima.

## 1. Persiapan Akun

Siapkan 3 akun untuk demo:

| Peran | Fungsi | Wallet |
|---|---|---|
| Admin | Register land, validate risk, approve/execute transfer | Wallet admin |
| User 1 | Pemilik awal tanah dan pengaju transfer | Wallet user 1 |
| User 2 | Penerima tanah | Wallet user 2 |

Semua wallet harus berada di network:

```text
Sepolia
```

Wallet yang perlu punya SepoliaETH:

```text
Admin wallet: wajib
User 1 wallet: wajib
User 2 wallet: tidak wajib jika hanya menerima tanah dan cek data
```

## 2. Link Aplikasi

Frontend:

```text
https://fe-production-4faa.up.railway.app/
```

Backend:

```text
https://antimafialand-production.up.railway.app/
```

Backend health check:

```text
https://antimafialand-production.up.railway.app/health
```

Sepolia Etherscan contract:

```text
https://sepolia.etherscan.io/address/0x217a398AE7BC3ca510E0f6220D5d810A8BC53c1D
```

## 3. Alur Admin: Register Land

1. Buka frontend.
2. Login sebagai admin.
3. Buka MetaMask.
4. Pilih wallet admin.
5. Pastikan network MetaMask adalah Sepolia.
6. Klik tombol `Connect Wallet`.
7. Pastikan dashboard menampilkan wallet admin.
8. Pada form `Admin: Register Land`, isi data:

```text
Owner: address wallet User 1
Metadata URI: ipfs://tanah-demo-1
Price: 1000
```

9. Klik `Register Land`.
10. Tunggu transaksi berhasil.
11. Simpan `Land ID` yang baru dibuat.

Catatan:

```text
Owner harus wallet User 1, bukan wallet admin.
```

## 4. Cek Land Setelah Register

1. Pada bagian `Land Lookup`, isi:

```text
Land ID: ID tanah yang baru dibuat
```

2. Klik `Get Land`.
3. Pastikan hasilnya:

```text
landId: sesuai ID tanah
owner: wallet User 1
metadataURI: ipfs://tanah-demo-1
price: 1000
exists: true
```

## 5. Alur User 1: Request Transfer

1. Logout dari akun admin.
2. Login sebagai User 1.
3. Buka MetaMask.
4. Pilih wallet User 1.
5. Pastikan network MetaMask adalah Sepolia.
6. Klik `Connect Wallet`.
7. Pastikan dashboard menampilkan wallet User 1.
8. Pada form `User: Request Transfer`, isi:

```text
Land ID: ID tanah milik User 1
Recipient: address wallet User 2
```

9. Klik `Request Transfer`.
10. Approve transaksi di MetaMask.
11. Tunggu transaksi sukses.

Catatan penting:

```text
Request Transfer hanya bisa dilakukan oleh wallet yang menjadi owner tanah.
Jika wallet yang connect bukan owner tanah, akan muncul error "Not land owner".
```

## 6. Cek Transfer Setelah Request

1. Pada bagian `Transfer Lookup`, isi:

```text
Land ID: ID tanah yang diajukan transfer
```

2. Klik `Get Transfer`.
3. Pastikan hasilnya:

```text
from: wallet User 1
to: wallet User 2
statusLabel: Pending
riskLabel: Low
```

## 7. Alur Admin: Validate Risk

1. Logout dari User 1.
2. Login kembali sebagai admin.
3. Buka MetaMask.
4. Pilih wallet admin.
5. Klik `Connect Wallet`.
6. Pada form `Admin: Validate Risk`, isi:

```text
Land ID: ID tanah yang sedang pending
Risk Score: 25
```

7. Klik `Validate Risk`.
8. Tunggu transaksi berhasil.

Hasil risk score:

| Risk Score | Risk Level | Status |
|---|---|---|
| 0-30 | Low | Approved |
| 31-70 | Medium | Pending |
| 71-100 | High | Frozen |

Untuk demo paling aman gunakan:

```text
Risk Score: 25
```

## 8. Alur Admin: Execute Transfer

1. Setelah risk divalidasi dan status menjadi `Approved`, buka bagian `Admin Actions`.
2. Isi:

```text
Land ID: ID tanah yang sudah approved
```

3. Klik `Execute Approved`.
4. Tunggu transaksi berhasil.

Setelah ini, owner tanah akan berpindah dari User 1 ke User 2.

## 9. Cek Owner Setelah Transfer

1. Pada bagian `Land Lookup`, isi:

```text
Land ID: ID tanah yang sudah dieksekusi
```

2. Klik `Get Land`.
3. Pastikan owner berubah menjadi:

```text
owner: wallet User 2
```

Ini membuktikan bahwa transfer tanah berhasil di smart contract.

## 10. Alur User 2: Cek Kepemilikan

1. Logout dari admin.
2. Login sebagai User 2.
3. Buka MetaMask.
4. Pilih wallet User 2.
5. Klik `Connect Wallet`.
6. Pada `Land Lookup`, isi Land ID yang sama.
7. Klik `Get Land`.
8. Pastikan owner adalah wallet User 2.

User 2 tidak perlu melakukan transaksi jika hanya melihat hasil transfer.

## 11. Alur Singkat Untuk Presentasi

Gunakan narasi ini saat demo:

```text
Admin mendaftarkan tanah ke wallet User 1.
User 1 sebagai pemilik tanah mengajukan transfer ke wallet User 2.
Admin memvalidasi risiko transaksi.
Jika risiko rendah, admin mengeksekusi transfer.
Setelah transaksi selesai, owner tanah berubah menjadi User 2 di smart contract Sepolia.
```

## 12. Error Yang Sering Muncul

### Error: Not land owner

Penyebab:

```text
Wallet yang connect bukan owner dari Land ID tersebut.
```

Solusi:

```text
Switch MetaMask ke wallet owner tanah, lalu klik Connect Wallet lagi.
```

### Error: Insufficient funds

Penyebab:

```text
Wallet tidak punya SepoliaETH untuk gas fee.
```

Solusi:

```text
Top up SepoliaETH dari faucet.
```

### MetaMask Tidak Terdeteksi

Penyebab:

```text
Extension MetaMask belum aktif, browser belum unlock, atau site belum diberi izin connect.
```

Solusi:

```text
Buka MetaMask, unlock wallet, refresh website, lalu klik Connect Wallet.
```

### Network Salah

Penyebab:

```text
MetaMask sedang berada di network selain Sepolia.
```

Solusi:

```text
Switch network MetaMask ke Sepolia.
```

## 13. Checklist Sebelum Demo

Pastikan semua ini sudah siap:

- Backend Railway aktif.
- Frontend Railway aktif.
- Backend health check menunjukkan contract dan database tersedia.
- MetaMask admin berada di Sepolia.
- MetaMask User 1 berada di Sepolia.
- MetaMask User 2 berada di Sepolia.
- Admin punya SepoliaETH.
- User 1 punya SepoliaETH.
- Contract address di dashboard sama dengan contract Sepolia.
- Gunakan Land ID baru agar demo tidak bentrok dengan data lama.

