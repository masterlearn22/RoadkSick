# 🗺️ Rencana Eksekusi Walkthrough RoadSick

## Tahap 1: Instalasi Dependensi & Konfigurasi Supabase Client
- [x] Install `@supabase/supabase-js` dan `papaparse`
- [x] Update `.env` dan buat `.env.example`
- [x] Buat `src/lib/supabaseClient.js`

## Tahap 2: Skema Database & Storage Supabase
- [x] Buat `supabase/schema.sql` (4 tabel + 2 bucket)

## Tahap 3: Penyelarasan Kelas Kerusakan (4 kelas, hapus pothole)
- [x] Update `src/data/damageTypes.js`
- [x] Update `src/utils/damageTypes.js`
- [x] Update `src/data/mockDetections.json`
- [x] Update `src/data/mockDashboard.json`
- [x] Update referensi di `useMapStore.js`, `mockApi.js`

## Tahap 4: Modul GNSS Sync (`src/utils/gnssSync.js`)
- [x] GPX parser
- [x] CSV parser (papaparse)
- [x] `matchFrameToGNSS()` interpolasi linear
- [x] `calculateTrackDistanceKm()`

## Tahap 5: Supabase Service Layer
- [x] Buat `src/services/supabaseService.js`
- [x] Update `src/services/index.js`

## Tahap 6: Penyempurnaan DetectionPage.jsx
- [x] Panel 1: Konfigurasi Sesi + Unggah GNSS
- [x] Panel 2: Unggah Visual + Deteksi YOLOv8 + Sinkronisasi

## Tahap 7: Penyempurnaan MapPage.jsx & RMSE
- [x] Peta fokus Surabaya–Mojokerto–Jombang
- [x] Layer toggle (Marker, Polyline GNSS, Error Vector RMSE)
- [x] Modal RMSE interaktif + Export CSV

## Tahap 8: Backend YOLOv8
- [x] `backend/requirements.txt`
- [x] `backend/main.py` (FastAPI + Ultralytics)

## Verifikasi
- [x] `npm run build` tanpa error (Vite build sukses)
