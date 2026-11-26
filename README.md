# RoadSick — Web GIS Deteksi Kerusakan Permukaan Jalan Real-Time

**Judul Skripsi:**  
*Implementasi dan Analisis Perbandingan Algoritma YOLO untuk Deteksi Kerusakan Permukaan Jalan Berbasis Web GIS (Studi Kasus: Jalur Lintas Kendaraan Rute Jombang - Surabaya)*

**Penyusun:** Surya Dwi Satria (NIM 434231048)  
**Program Studi:** D4 Teknik Informatika, Departemen Teknik, Fakultas Vokasi, Universitas Airlangga (2026)

---

## Ringkasan Sistem

**RoadSick Web GIS** adalah aplikasi berbasis web yang mengintegrasikan **Real-Time Object Detection** (menggunakan model YOLO varian nano terbaik hasil komparasi enam generasi: `YOLOv8n`, `YOLOv9t`, `YOLOv10n`, `YOLO11n`, `YOLOv12n`, dan `YOLO26n`) dengan **Web Geolocation API** dan **Leaflet.js** untuk mendeteksi serta memetakan kerusakan permukaan jalan secara otomatis pada koridor **Jombang – Surabaya (±90 km)**.

### 4 Kelas Kerusakan Jalan Resmi
1. **Jalan Berlubang (`pothole` / `Potholes`)** — `#EF4444`
2. **Jalan Tidak Rata (`rutting` / `Rutting & Patches`)** — `#8B5CF6`
3. **Retak Buaya (`alligator_crack` / `Alligator Cracks`)** — `#EA580C`
4. **Retak Memanjang (`longitudinal_crack` / `Longitudinal Cracks`)** — `#F59E0B`

### Fitur Utama Aplikasi
1. **Dashboard Survei (`/dashboard`)**: Ringkasan total temuan, kondisi berat, rata-rata *confidence score*, grafik distribusi 4 kelas, grafik tren bulanan, dan daftar temuan terbaru dari Supabase Cloud.
2. **Deteksi Real-Time (`/detection`)**: Satu-satunya mode pendeteksi berbasis *live camera stream* (`getUserMedia`) + pelacakan koordinat GPS perangkat (`Web Geolocation API`), overlay *bounding box* real-time, metrik **FPS & latensi (ms)**, foto bukti ber-watermark geotag otomatis, dan penyimpanan ke Supabase.
3. **Peta Web GIS (`/map`)**: Peta interaktif Leaflet.js (OpenStreetMap & Citra Satelit Esri) dengan filter 4 kelas kerusakan, segmen rute pengujian (Tahap 1 KM 0–30 Jombang–Mojokerto, Tahap 2 KM 30–60 Mojokerto–Krian, Tahap 3 KM 60–90 Krian–Surabaya), tingkat keparahan, dan pop-up detail foto bukti.
4. **Riwayat Deteksi (`/inventory`)**: Tabel inventori interaktif dengan pencarian, filter, pratinjau detail foto, serta ekspor data ke format **CSV** dan **GeoJSON**.

---

## Menjalankan Aplikasi

```bash
# 1. Install dependensi frontend
npm install

# 2. Jalankan development server (desktop)
npm run dev

# 3. Jalankan HTTPS server untuk pengujian kamera & GPS di smartphone via WiFi lokal
npm run dev:mobile

# 4. Linter & Build produksi
npm run lint
npm run build
```

### Menjalankan Backend Inferensi YOLO (Python FastAPI)
```bash
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
> **Catatan Database Supabase:** Pastikan nilai enum `'pothole'` sudah ditambahkan ke `damage_class_enum` pada Supabase SQL Editor dengan menjalankan perintah di [`supabase/schema.sql`](supabase/schema.sql).
