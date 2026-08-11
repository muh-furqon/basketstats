# Dokumentasi & Rekapitulasi Fitur: BasketSTATS V1

## 📌 Ringkasan Proyek
**BasketBallistic (BasketSTATS)** adalah aplikasi pencatat statistik pertandingan bola basket di pinggir lapangan (*courtside*) yang dirancang khusus untuk perangkat seluler dan tablet. Aplikasi ini beroperasi dengan prinsip **Offline-First**, menyimpan seluruh riwayat aksi (*play-by-play*) secara lokal di browser menggunakan **IndexedDB (Dexie.js)**, dan dapat mengunggah ringkasan statistik (*Box Score*) secara agregat ke **Google Sheets** melalui **Google Apps Script (GAS)**.

---

## 🚀 Fitur Utama & Pengalaman Pengguna (UX Overhaul)

### 1. Dashboard Pertandingan & Riwayat Match
- **Tampilan Utama (Matches Dashboard):** Menampilkan daftar kartu pertandingan yang telah dicatat lengkap dengan tanggal, status pertandingan (*Live* / *Selesai*), status sinkronisasi (*Synced* / *Pending Sync*), serta skor akhir kedua tim.
- **Filter & Pencarian:** Fitur penyaringan pertandingan berdasarkan status (`Semua`, `Sedang Berlangsung`, `Selesai`) dan pencarian cepat berdasarkan nama tim.
- **Navigasi Jelas:** Menghindari kebingungan tombol "semua fitur dalam satu halaman" dengan alur navigasi terpisah yang mudah diakses (Dashboard ↔ Tracker ↔ Team Rapport).

### 2. Setup Pertandingan Interaktif (Popup Modal)
- **Konfigurasi Tim:** Input Nama Tim Kandang (*Home*) dan Tim Tandang (*Away*).
- **Detail Roster Pemain:** 
  - Input Nomor Jersey (`#`).
  - Nama Pemain.
  - **Posisi Pemain:** Pilihan posisi basket standar (`PG`, `SG`, `SF`, `PF`, `C`).
  - **Status Awal (Starter / Cadangan):** Penanda pemain lima awal (*Starter On Court*) atau cadangan (*Bench*) langsung dari modal setup, sehingga saat pertandingan dimulai, pemain awal langsung aktif berada di lapangan.
- **Preset Demo Roster:** Tombol cepat untuk memuat roster sampel (misal: Lakers vs Warriors) untuk kebutuhan pengujian instan.

### 3. Siklus Pertandingan (Match Lifecycle & Safety Locking)
- **Status `Belum Dimulai` (not_started):**
  - Pertandingan baru yang dibuat tidak langsung mencatat waktu sampai pengawas/pelatih menekan tombol hijau mencolok **`▶ Start Match`**.
  - Menekan **Start Match** akan mengubah status menjadi `ongoing` dan menjalankan timer pertandingan secara otomatis.
- **Status `Sedang Berlangsung` (ongoing):**
  - Tombol berubah menjadi merah tegas **`🏁 Finish Match`**.
  - Dilengkapi dialog konfirmasi (*"Apakah Anda yakin ingin menyelesaikan pertandingan ini?"*) untuk mencegah misklik yang tidak disengaja.
- **Status `Selesai` (finished):**
  - Pertandingan dikunci (*Locked*) dan tidak dapat diubah lagi untuk menjaga integritas data riwayat.
  - Pengguna langsung diarahkan ke laporan lengkap **Team Rapport & Box Score**.

### 4. Pencatat Statistik Lapangan (Courtside Tracker)
- **Responsivitas 0ms (Zero Tap Delay):** Menggunakan utilitas `touch-action: manipulation;` untuk memastikan responsivitas instan tanpa *double-tap zoom*.
- **Screen Wake Lock:** Mencegah layar HP/tablet mati atau *sleep* selama pertandingan berlangsung.
- **Target Pemain Aktif:** Visualisasi jelas mengenai pemain mana yang sedang dipilih sebelum menekan tombol aksi.
- **Action Pad Terstruktur Warna:**
  - **Poin & Tembakan (Hijau/Amber/Teal):** `+2 PT`, `2PT Miss`, `+3 PT`, `3PT Miss`, `+1 FT`, `FT Miss`.
  - **Rebound & Pertahanan (Biru/Cyan/Ungu):** `Def Rebound`, `Off Rebound`, `Steal`, `Block`.
  - **Playmaking & Pelanggaran (Indigo/Merah):** `Assist`, `Turnover`, `Personal Foul`.
- **Modal Assist Otomatis:** Saat tombol tembakan masuk (`+2 PT` atau `+3 PT`) ditekan, aplikasi secara otomatis menampilkan modal untuk memilih pemain pemberi *Assist*.
- **Pembatalan Aksi (Undo):** Tombol *Undo* untuk menghapus aksi terakhir jika terjadi kesalahan input.

### 5. Aturan Waktu Bermain Turnamen (Tournament 6-Minute Rule)
- **Ketentuan Turnamen:** Membantu pelatih/pengawas mematuhi aturan turnamen di mana setiap pemain wajib bermain minimal **6 menit akumulatif** (360 detik) dari Kuarter 1 hingga Kuarter 3.
- **Timer Pertandingan Otomatis (Live Match Clock):** Menghitung waktu bermain secara *real-time* hanya untuk pemain yang sedang berstatus **On Court**.
- **Sistem Substitusi Drag & Drop Pemain:**
  - Panel roster terbagi menjadi dua zona drop visual: **🏀 On Court Lineup (Maks 5)** dan **🪑 Bench Roster (Cadangan)**.
  - Cukup **drag (tarik)** kartu pemain dari Bench dan **drop (lepas)** ke pemain On Court untuk melakukan substitusi pemain secara langsung.
  - Efek visual animasi saat melakukan drag & drop (`border emas putus-putus bersinar`).
  - Mendukung ketukan 1-tap (*touch fallback*) untuk kenyamanan pengguna layar HP/tablet.
- **Indikator Visual Sangat Jelas:**
  - 🟢 **Terpenuhi (>= 6 Min):** Lencana hijau dengan tanda centang `✓ 6m Met` dan border hijau bersinar.
  - 🟡 **Dalam Proses (< 6 Min, Q1-Q3):** Progress bar animasi yang terisi secara *real-time* dengan penunjuk waktu.
  - 🔴 **Peringatan Penalti Kuarter 4 (Q4 Risk):** Lencana peringatan merah berkedip `⚠️ Q4 Penalty Risk` jika pemain memasuki Kuarter 4 namun belum mencapai batas minimal 6 menit.

### 6. Laporan Lanjutan Match & Rapport Tim (Post-Match Rapport & Analytics)
Tampilan Box Score ditingkatkan menjadi dokumen **Laporan Pertandingan (Team Rapport)** dengan 3 tab utama:
1. **Tab Team Rapport & Analytics:**
   - **Game Performers / Stat Leaders:** Kartu khusus untuk **MVP Candidate**, **Top Scorer** (Pencetak Poin Terbanyak), **Rebounds Leader** (Pemain Rebound Terbanyak), dan **Assists Leader** (Pemberi Assist Terbanyak).
   - **Tren Skor Per Kuarter:** Perbandingan perolehan poin kedua tim di Q1, Q2, Q3, Q4, dan OT.
   - **Metrik Efisiensi Tim:** Perbandingan persentase tembakan FG%, 3P%, FT%, **eFG%** (*Effective Field Goal%*), dan **TS%** (*True Shooting%*).
2. **Tab Individual Box Scores:**
   - Tabel statistik lengkap pemain yang mencakup Posisi (`POS`), Poin, Rebound (Off-Def), Assist, Steal, Block, Turnover, Personal Foul, FG (M/A, %), 3PT (M/A, %), FT (M/A, %), eFG%, dan TS%.
   - Ringkasan total statistik tim pada baris paling bawah.
3. **Tab Play Timeline:**
   - Log kronologis seluruh kejadian pertandingan yang dapat ditinjau berdasarkan kuarter.

---

## 🛠️ Arsitektur Teknologi & Backend Google Sheets

- **Frontend:** React 18, Tailwind CSS v4, Lucide React Icons.
- **Lokal Database:** Dexie.js (IndexedDB wrapper) dengan skema:
  - `games`: `id, date, status, syncStatus`
  - `players`: `id, gameId, teamId, jerseyNumber, position, isStarter`
  - `playByPlay`: `id, gameId, timestamp, quarter, teamId, playerId, eventType, assistPlayerId, syncStatus`
- **Backend Sync (Google Apps Script - `gas/Code.gs`):**
  - Menggunakan metode `POST` tanpa preflight CORS.
  - Penguncian skrip (*Script Lock*) untuk mencegah *race condition*.
  - Menulis batch data ke tab Google Sheets: `Games`, `PlayByPlay`, dan `BoxScore`.
  - Mencatat kolom Posisi (`Position`), `eFG%`, dan `TS%` secara otomatis ke dalam spreadsheet.

---

## 📋 Catatan Penggunaan
- Untuk menjalankan secara lokal: `npm run dev`
- Untuk memverifikasi build produksi: `npm run build`
