# 🛣️ RoadSick - Web GIS Pemetaan & Deteksi Kerusakan Jalan

Aplikasi **RoadSick (Web GIS)** adalah sistem berbasis web yang dirancang untuk mendeteksi, mengklasifikasi, memetakan, serta mengevaluasi ketelitian posisi kerusakan jalan secara spasial. Sistem ini menggabungkan teknologi **Computer Vision (YOLOv8)** untuk identifikasi visual kerusakan jalan dan **Sistem Informasi Geografis (Web GIS)** untuk visualisasi persebaran titik serta uji akurasi posisi (**RMSE - Root Mean Square Error**).

Proyek ini dikembangkan sebagai bagian dari **Penelitian / Skripsi (Tugas Akhir) Program Sarjana (S-1)**.

---

## 📑 Daftar Isi
1. [Latar Belakang & Tujuan Sistem](#-latar-belakang--tujuan-sistem)
2. [Alur Kerja Sistem (Workflow Skripsi)](#-alur-kerja-sistem-workflow-skripsi)
3. [Teknologi yang Digunakan](#-teknologi-yang-digunakan)
4. [Penjelasan Lengkap Struktur Folder & Setiap File](#-penjelasan-lengkap-struktur-folder--setiap-file)
   - [File Konfigurasi Utama (Root)](#1-file-konfigurasi-utama-root)
   - [Halaman Utama (`src/pages/`)](#2-halaman-utama-srcpages)
   - [Komponen Antarmuka (`src/components/`)](#3-komponen-antarmuka-srccomponents)
   - [Manajemen State (`src/store/`)](#4-manajemen-state-global-srcstore)
   - [Layanan API & Data Simulasi (`src/services/` & `src/data/`)](#5-layanan-api--data-simulasi-srcservices--srcdata)
   - [Fungsi Utilitas & Rumus Matematis (`src/utils/`)](#6-fungsi-utilitas--rumus-matematis-srcutils)
5. [Konsep Teoretis untuk Laporan & Sidang Skripsi](#-konsep-teoretis-untuk-laporan--sidang-skripsi)
   - [5 Jenis Kerusakan Jalan](#a-5-klasifikasi-kerusakan-jalan)
   - [Rumus Jarak Haversine & Uji Ketelitian RMSE](#b-uji-ketelitian-geometris-rmse)
6. [Panduan Menjalankan Aplikasi](#-panduan-menjalankan-aplikasi)

---

## 🎯 Latar Belakang & Tujuan Sistem

Inspeksi kondisi jalan konvensional sering kali dilakukan secara manual (survei visual lapangan), yang membutuhkan waktu lama, biaya tinggi, serta rawan subjektivitas petugas.

Sistem **RoadSick** hadir untuk menjawab permasalahan tersebut dengan:
1. **Otomatisasi Deteksi:** Menggunakan model deep learning (YOLOv8) untuk mendeteksi jenis dan tingkat keparahan kerusakan jalan dari foto, rekaman video, atau kamera *real-time*.
2. **Pemetaan Spasial (Web GIS):** Menempatkan titik kerusakan pada peta interaktif Kota Bandung berbasis koordinat GPS (lintang/bujur) yang diekstrak langsung dari metadata foto (EXIF).
3. **Analisis Statistik & Inventori:** Menyajikan sebaran data, tren bulanan, dan tabel inventarisasi kondisi aset jalan.
4. **Validasi Akurasi Geospasial (RMSE):** Menguji seberapa akurat titik koordinat yang dihasilkan sistem dibanding koordinat pengukuran lapangan (*ground truth*).

---

## 🔄 Alur Kerja Sistem (Workflow Skripsi)

```
[ Input Pengguna ]
  ├── Unggah Foto (Ekstraksi GPS dari EXIF)
  ├── Unggah Video (Ekstraksi Frame Otomatis)
  └── Kamera Real-Time (Streaming Kendaraan)
          │
          ▼
[ Pipeline Computer Vision (YOLOv8) ]
  ├── Deteksi Objek (Bounding Box)
  ├── Klasifikasi 5 Jenis Kerusakan Jalan
  └── Perhitungan Skor Keyakinan (Confidence Score)
          │
          ▼
[ Penyimpanan & Pemrosesan Data ]
  ├── Penyimpanan Atribut Kerusakan (Tingkat Keparahan, Tanggal, Jalur)
  └── Integrasi Koordinat Geospasial (Latitude, Longitude)
          │
          ├─────────────────────────┬─────────────────────────┐
          ▼                         ▼                         ▼
  [ 📊 Dashboard ]           [ 🗺️ Web GIS ]           [ 📐 Uji RMSE ]
   Statistik & Tren           Peta Sebaran &            Validasi Selisih Jarak
   Kerusakan Jalan            Filter Spasial            Sistem vs Ground Truth
```

---

## 🛠️ Teknologi yang Digunakan

* **Frontend Framework:** React 19 + Vite (kinerja cepat dengan Hot Module Replacement)
* **Styling & UI:** Tailwind CSS v4 (desain modern, responsif, dan elegan)
* **Web GIS Library:** Leaflet & React-Leaflet (peta interaktif berbasis OpenStreetMap)
* **Visualisasi Grafik:** Recharts (diagram lingkaran dan grafik tren kerusakan)
* **Tabel Data:** TanStack Table v8 (tabel inventori interaktif, sorting, dan paginasi)
* **Manajemen State Global:** Zustand (penyimpanan state reaktif yang ringan)
* **Ekstraksi Geospasial:** `exif-js` (membaca koordinat GPS dari file foto kamera/smartphone)
* **Komunikasi Backend:** Axios (dukungan transisi mulus antara mode Mock/Simulasi dan API Nyata)

---

## 📂 Penjelasan Lengkap Struktur Folder & Setiap File

Berikut adalah penjelasan fungsional dari seluruh file yang ada di dalam proyek:

### 1. File Konfigurasi Utama (Root)
* **`.env`**
  Menyimpan variabel lingkungan (*environment variables*). Berisi flag `VITE_USE_MOCK=true` (untuk mengaktifkan mode simulasi saat belum terhubung ke server backend Python/YOLO) dan `VITE_API_BASE_URL` (URL endpoint backend API).
* **`package.json`**
  Daftar pustaka dependensi (library) pihak ketiga yang dipakai dalam proyek, serta skrip perintah (`dev`, `build`, `lint`).
* **`vite.config.js`**
  File konfigurasi bundler Vite untuk menjalankan server lokal dan melakukan kompilasi proyek React.
* **`tailwind.config.js` & `postcss.config.js`**
  Konfigurasi sistem styling Tailwind CSS dan pemrosesan CSS.
* **`index.html`**
  Halaman kerangka HTML utama tempat aplikasi React dirender ke elemen `<div id="root"></div>`.
* **`.oxlintrc.json`**
  Konfigurasi linter Oxlint untuk menjaga kerapian dan konsistensi kode JavaScript.

---

### 2. Berkas Inti Aplikasi (`src/`)
* **`src/main.jsx`**
  Titik masuk (*entry point*) eksekusi JavaScript pertama kali yang memasang React DOM ke elemen HTML.
* **`src/App.jsx`**
  Pusat perutean (*routing*) aplikasi menggunakan `react-router-dom`. Mengatur navigasi halaman:
  * `/dashboard` ➡️ Halaman Ringkasan Statistik
  * `/detection` ➡️ Halaman Deteksi Gambar/Video/Realtime
  * `/map` ➡️ Halaman Peta Web GIS
  * `/inventory` ➡️ Halaman Data Tabel & Uji RMSE
* **`src/index.css` & `src/App.css`**
  Gaya dasar styling global aplikasi, konfigurasi font, serta kustomisasi layer Leaflet.

---

### 3. Halaman Utama (`src/pages/`)
* **`DashboardPage.jsx`**
  Halaman dashboard eksekutif untuk melihat ringkasan kondisi jalan: kartu metrik total kerusakan, diagram proporsi jenis kerusakan, grafik tren bulanan, dan daftar deteksi terbaru.
* **`DetectionPage.jsx`**
  Halaman kerja untuk melakukan proses inferensi/deteksi kerusakan jalan dengan model YOLOv8 melalui 3 metode (Foto, Video, Streaming Kamera).
* **`MapPage.jsx`**
  Halaman utama Web GIS. Menampilkan peta Kota Bandung dengan titik-titik kerusakan jalan, panel filter spasial (berdasarkan jenis kerusakan, tingkat keparahan, rentang tanggal), serta legenda peta.
* **`InventoryPage.jsx`**
  Halaman manajemen data inventarisasi jalan. Terdiri atas dua tab: **Tabel Data Deteksi Lengkap** dan **Tabel Pengujian Validasi RMSE**.

---

### 4. Komponen Antarmuka (`src/components/`)

#### A. Layout (`src/components/layout/`)
* **`AppShell.jsx`**: Kerangka utama pembungkus aplikasi (menggabungkan Sidebar, Topbar, dan konten halaman).
* **`Sidebar.jsx`**: Bilah navigasi samping untuk berpindah menu (Dashboard, Deteksi, Peta GIS, Inventori).
* **`Topbar.jsx`**: Bilah navigasi atas yang menampilkan status sistem, judul, dan profil pengguna/peneliti.
* **`PageContainer.jsx`**: Template pembungkus halaman standar agar memiliki header, judul, dan margin yang seragam.

#### B. Peta Web GIS (`src/components/map/`)
* **`GISMap.jsx`**: Komponen peta interaktif Leaflet. Mengatur titik tengah (Bandung: `-6.917, 107.619`), level perbesaran (*zoom*), tile layer OpenStreetMap, dan penempatan marker.
* **`DamageMarker.jsx`**: Komponen penanda (*marker*) pada peta. Ikon dan warnanya disesuaikan secara dinamis menurut jenis kerusakan.
* **`MarkerPopup.jsx`**: Jendela informasi (*popup*) yang muncul saat titik marker di peta diklik. Menampilkan foto kondisi lapangan, jenis kerusakan, tingkat keparahan, koordinat GPS, dan tanggal deteksi.
* **`MapLegend.jsx`**: Kotak legenda peta di pojok kiri bawah yang menjelaskan arti warna/simbol marker beserta jumlah titiknya.

#### C. Deteksi & Analisis (`src/components/detection/`)
* **`DetectionTabs.jsx`**: Pengatur tab untuk memilih mode inferensi (Citra Foto, Video, atau Real-Time).
* **`ImageUploadMode.jsx`**: Form unggah foto kerusakan jalan. Dilengkapi fungsi otomatis membaca data GPS (Latitude & Longitude) dari metadata EXIF kamera handphone/kamera survei.
* **`VideoUploadMode.jsx`**: Form unggah file video survei jalan untuk dianalisis per frame.
* **`RealTimeMode.jsx`**: Simulasi deteksi langsung (*live streaming*) dari kamera kendaraan yang sedang melaju.
* **`BoundingBoxCanvas.jsx`**: Komponen kanvas HTML5 untuk menggambar kotak pembatas (*bounding box*) di atas foto hasil deteksi YOLOv8 beserta label dan akurasinya.
* **`DamageLabel.jsx`**: Label tag penunjuk jenis kerusakan yang terdeteksi.
* **`DetectionLog.jsx`**: Daftar log riwayat deteksi yang baru saja diproses.
* **`DetectionSummary.jsx`**: Ringkasan ringkas jumlah objek kerusakan yang ditemukan dalam satu kali pengujian.

#### D. Dashboard Visualisasi (`src/components/dashboard/`)
* **`OverviewStats.jsx`**: Kartu-kartu ringkasan angka metrik (Total Titik Kerusakan, Titik Kritis/High, Tingkat Akurasi Model, Wilayah Terbanyak).
* **`DamageTypeChart.jsx`**: Grafik donat/pie chart (menggunakan Recharts) yang memperlihatkan persentase sebaran jenis kerusakan.
* **`TrendChart.jsx`**: Grafik garis tren kerusakan jalan dari bulan ke bulan.
* **`RecentDetections.jsx`**: Tabel mini yang menampilkan beberapa deteksi paling baru.

#### E. Inventori & Validasi RMSE (`src/components/inventory/`)
* **`DataTable.jsx`**: Tabel data inventarisasi jalan dengan fitur pencarian teks, pengurutan kolom (*sorting*), paginasi, dan tombol aksi detail.
* **`FilterPanel.jsx`**: Panel penyaring data inventori berdasarkan jenis, keparahan, dan metode input.
* **`RMSETable.jsx`**: Tabel perbandingan koordinat sistem vs koordinat acuan lapangan (*Ground Truth*). Menghitung selisih jarak per titik dalam meter dan menampilkan nilai akhir **Total RMSE (Meter)**.

#### F. Komponen Bersama (`src/components/common/`)
* **`Badge.jsx`**: Komponen lencana warna untuk status keparahan (High, Medium, Low) dan jenis kerusakan.
* **`Button.jsx`**: Tombol serbaguna dengan berbagai variasi gaya (primary, secondary, danger, outline).
* **`Card.jsx`**: Kontainer kartu berlatar putih dengan bayangan halus (*box-shadow*).
* **`DropZone.jsx`**: Area drag-and-drop interaktif untuk mempermudah pengguna menjatuhkan file foto/video.
* **`Modal.jsx`**: Jendela dialog melayang (*pop-up dialog*) untuk menampilkan detail atau pratinjau.
* **`ProgressBar.jsx`**: Bilah penunjuk progres persentase (misalnya saat proses inferensi model berjalan).
* **`StatCard.jsx`**: Komponen kartu statistik dengan ikon, angka besar, dan indikator persentase kenaikan/penurunan.
* **`TabSwitcher.jsx`**: Tombol beralih tab horizontal.
* **`LoadingOverlay.jsx`**: Indikator animasi loading saat data sedang dimuat dari server.

---

### 5. Manajemen State Global (`src/store/`)
Menggunakan **Zustand** untuk menyimpan data bersama antarhalaman tanpa perlu *prop drilling*:
* **`useAppStore.js`**: Menyimpan status global aplikasi (status loading, mode simulasi aktif/non-aktif, notifikasi toast).
* **`useDetectionStore.js`**: Menyimpan hasil pengujian deteksi aktif (foto yang sedang diunggah, daftar bounding box yang ditemukan, log hasil inferensi).
* **`useMapStore.js`**: Menyimpan status peta Web GIS (daftar semua marker titik jalan, marker yang sedang dipilih pengguna, koordinat pusat peta, zoom level, serta status filter yang aktif).

---

### 6. Layanan API & Data Simulasi (`src/services/` & `src/data/`)
* **`src/services/apiClient.js`**: Instance Axios dengan konfigurasi interceptor error dan base URL.
* **`src/services/api.js`**: Fungsi pemanggilan endpoint HTTP nyata ke server backend Python/FastAPI/Flask (misalnya: `/api/detect`, `/api/markers`).
* **`src/services/mockApi.js`**: API tiruan berbasis Promise lokal. Sangat berguna agar aplikasi tetap dapat berjalan penuh untuk demo skripsi meskipun backend AI belum dinyalakan.
* **`src/services/index.js`**: Gerbang pemilih otomatis antara `api.js` atau `mockApi.js` bergantung pada konfigurasi file `.env`.
* **`src/data/mockDashboard.json`**: Data sampel statistik ringkasan dan tren untuk tampilan dashboard.
* **`src/data/mockDetections.json`**: Data sampel riwayat deteksi titik jalan di Kota Bandung lengkap dengan koordinat dan jenis kerusakan.
* **`src/data/mockRMSE.json`**: Data sampel koordinat sistem vs koordinat lapangan untuk pengujian ketelitian spasial.
* **`src/data/damageTypes.js`**: Metadata jenis kerusakan, ikon, warna, dan deskripsi penjelasan.

---

### 7. Fungsi Utilitas & Rumus Matematis (`src/utils/`)
* **`coordinates.js`**
  Berisi rumus geodesi **Haversine Formula**:
  $$\Delta \sigma = 2 \arcsin \left( \sqrt{\sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)} \right)$$
  $$d = R \cdot \Delta \sigma$$
  Digunakan untuk menghitung jarak akurat di atas permukaan bumi antara dua titik koordinat GPS (dalam satuan meter).
* **`rmse.js`**
  Berisi implementasi rumus **Root Mean Square Error (RMSE)**:
  $$\text{RMSE} = \sqrt{\frac{1}{N} \sum_{i=1}^{N} (d_i)^2}$$
  Di mana $d_i$ adalah selisih jarak spasial (Haversine distance) antara koordinat hasil sistem dengan koordinat *Ground Truth* pada titik ke-$i$.
* **`damageTypes.js`**
  Konfigurasi standar penamaan ramah pengguna (*user-friendly*), palet warna penanda di peta, dan kelas styling Tailwind.
* **`formatters.js`**
  Fungsi pembantu untuk memformat tampilan angka desimal koordinat, format tanggal Indonesia, persentase nilai keyakinan (*confidence*), dan ukuran file.
* **`constants.js`**
  Konstanta default aplikasi (seperti koordinat default Kota Bandung `-6.917, 107.619`).

---

## 📚 Konsep Teoretis untuk Laporan & Sidang Skripsi

### A. 5 Klasifikasi Kerusakan Jalan
Model pendeteksi dilatih untuk mengenali 5 kategori kerusakan perkerasan lentur (*flexible pavement*) yang umum ditemui di Indonesia:

1. **Lubang Jalan *(Pothole)*:** Cekungan mangkuk pada lapisan aspal yang terkelupas. Merupakan kategori paling berisiko bagi pengendara roda dua.
2. **Retak Memanjang *(Longitudinal Crack)*:** Retakan garis tunggal memanjang yang sejajar dengan arah sumbu lajur jalan.
3. **Retak Kulit Buaya *(Alligator Crack)*:** Rangkaian retak saling terhubung membentuk anyaman menyerupai sisik buaya akibat kelelahan struktur jalan (*fatigue*).
4. **Jejak Roda Amblas *(Rutting)*:** Cekungan memanjang pada alur lintasan roda kendaraan akibat beban berlebih (*overloading*).
5. **Tambalan Rusak *(Patches)*:** Area bekas perbaikan tambal aspal lama yang tidak rata atau mulai mengalami retak kembali di batas sambungannya.

### B. Uji Ketelitian Geometris (RMSE)
Dalam penelitian pemetaan Web GIS, menguji ketelitian letak titik kerusakan adalah hal wajib untuk membuktikan keandalan sistem:
* **Koordinat Sistem:** Diperoleh dari modul GPS perangkat kamera / pembacaan metadata EXIF foto.
* **Ground Truth:** Diperoleh dari pengukuran langsung di lapangan menggunakan alat ukur berketelitian tinggi (GPS Geodetik / RTK atau GCP acuan).
* **Nilai RMSE:** Menggambarkan standar deviasi dari selisih jarak. Semakin kecil nilai RMSE (mendekati 0 meter), maka sistem pemetaan dianggap semakin teliti dan valid.

---

## 🚀 Panduan Menjalankan Aplikasi

### 1. Persyaratan Sistem
* Node.js versi 18 atau lebih baru.
* Web Browser modern (Google Chrome, Microsoft Edge, Mozilla Firefox).

### 2. Instalasi Dependensi
Buka terminal pada direktori proyek, lalu jalankan:
```bash
npm install
```

### 3. Menjalankan Server Lokal (Development)
Jalankan perintah berikut:
```bash
npm run dev
```
Setelah berhasil dijalankan, buka alamat URL lokal di browser Anda (biasanya `http://localhost:5173` atau `http://localhost:5174`).

### 4. Beralih Antara Mode Simulasi dan Backend Nyata
Atur pada file [`.env`](file:///.env):
* **Mode Simulasi (Tanpa Backend):**
  ```env
  VITE_USE_MOCK=true
  ```
* **Mode Backend Nyata (Terkoneksi ke YOLOv8 API Server):**
  ```env
  VITE_USE_MOCK=false
  VITE_API_BASE_URL=http://localhost:8000/api
  ```

---

*Dokumentasi ini disusun secara terstruktur untuk mempermudah penyusunan Bab 3 (Metodologi Penelitian) dan Bab 4 (Implementasi Sistem & Pembahasan Hasil) pada naskah skripsi.*
