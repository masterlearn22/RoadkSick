Maaf atas kendala tombol **Buka** pada panel Canvas di browser Anda. Berikut adalah isi lengkap dari dokumen **WALKTHROUGH\_ANTIGRAVITY\_ROADSICK.md** secara langsung di ruang obrolan ini agar bisa langsung Anda baca dan salin (*copy-paste*) ke dalam proyek atau *prompt* **Antigravity**:

### **Spesifikasi Teknis & Walkthrough AI Agent (Antigravity): Integrasi Sistem Web GIS RoadkSick**

Dokumen ini adalah panduan eksekusi menyeluruh untuk **AI Agent (Antigravity)** guna menyempurnakan dan mengintegrasikan repositori [masterlearn22/RoadkSick](https://github.com/masterlearn22/RoadkSick) agar sesuai sepenuhnya dengan kebutuhan **Proposal Skripsi**:  
**Judul Skripsi:** *Implementasi Algoritma YOLOv8 dan Sensor Wearable untuk Pemetaan Kerusakan Permukaan Jalan Berbasis Web GIS dengan Pengujian Spasial RMSE (Studi Kasus: Jalur Lintas Kendaraan Rute Surabaya – Jombang \- Mojokerto)*  
**Penyusun:** Surya Dwi Satria (NIM 434231048\) — D4 Teknik Informatika, Universitas Airlangga

### **1\. Ringkasan Audit Kode Saat Ini vs Kebutuhan Proposal Skripsi**

Kerangka antarmuka pengguna (*frontend*) berbasis React 19, Vite, Tailwind CSS, Zustand, dan React-Leaflet pada [masterlearn22/RoadkSick](https://github.com/masterlearn22/RoadkSick) sudah tersedia, namun **masih berjalan menggunakan data statis (*mock*)** dan belum mengimplementasikan alur inti dari kebaruan (*novelty*) penelitian.

| Komponen Sistem | Kebutuhan Proposal Skripsi (Bab 1–3) | Kondisi Saat Ini di Repo RoadkSick | Status & Gap Integrasi |
| :---- | :---- | :---- | :---- |
| **Database & Cloud Storage** | Penyimpanan persisten untuk data deteksi citra, koordinat GNSS, rute perjalanan, dan pengujian RMSE menggunakan **Supabase** | @supabase/supabase-js belum terinstal di [package.json](https://github.com/masterlearn22/RoadkSick/blob/main/package.json); aplikasi memakai [src/services/mockApi.js](https://www.google.com/search?q=https://github.com/masterlearn22/RoadkSick/blob/main/src/services/mockApi.js) dan file JSON statis di src/data/ | **Belum Terintegrasi** — Perlu instalasi SDK Supabase, pembuatan skema tabel PostgreSQL, Storage Bucket, dan *service layer* Supabase |
| **Klasifikasi Objek YOLOv8** | Dibatasi tepat pada **4 jenis kerusakan**: Retak Memanjang (longitudinal\_crack), Retak Buaya (alligator\_crack), Aspal Bergelombang (rutting), dan Tambalan Tidak Rata (patches) (Bab 1.5 Poin 1\) | [src/data/damageTypes.js](https://github.com/masterlearn22/RoadkSick/blob/main/src/data/damageTypes.js) mendefinisikan **5 jenis kerusakan** (masih menyertakan pothole / Lubang Jalan) dan belum terhubung ke mesin inferensi YOLOv8 | **Perlu Penyesuaian** — Hapus/nonaktifkan kelas pothole dari skema utama dan hubungkan endpoint deteksi ke backend YOLOv8 / Supabase |
| **Distribusi Tugas: Kamera HP \+ Smartwatch GNSS (Novelty Utama)** | Perekaman visual oleh kamera HP di sepeda motor terpisah dari pelacakan koordinat oleh **Smartwatch Supercalla Onyx (Dual-Frequency GPS \+ BeiDou)**, lalu digabungkan di sistem (Bab 1.1, 1.2, 1.3) | Belum ada fitur unggah log GNSS (.gpx / .csv / .tcx) maupun algoritma pencocokan waktu (*timestamp synchronization / interpolation*) antara frame video/foto dengan log smartwatch | **Belum Ada (Kritis)** — Wajib dibuat modul parser GPX/CSV dan mesin sinkronisasi berbasis *timestamp* \+ *time offset* ($\Delta t$) |
| **Pemetaan Web GIS Studi Kasus** | Pemetaan interaktif pada jalur lintas kendaraan rute **Surabaya – Jombang – Mojokerto** beserta visualisasi lintasan (*trajectory*) smartwatch | MapPage.jsx sudah memakai react-leaflet, namun belum memiliki layer lintasan GPX smartwatch, filter segmen rute Surabaya–Jombang–Mojokerto, dan vektor error RMSE | **Perlu Pengembangan** — Tambahkan *polyline* lintasan GNSS, filter segmen rute studi kasus, dan *dual-marker* (Prediksi vs Ground Truth) |
| **Pengujian Spasial RMSE** | Mengukur selisih jarak aktual (meter) antara koordinat ekstraksi GNSS smartwatch di Web GIS dengan letak kerusakan sesungguhnya di lapangan (*ground truth*) dengan target presisi $<3m$ | [src/utils/coordinates.js](https://github.com/masterlearn22/RoadkSick/blob/main/src/utils/coordinates.js) (Haversine) dan [src/utils/rmse.js](https://github.com/masterlearn22/RoadkSick/blob/main/src/utils/rmse.js) sudah ada, tetapi hanya membaca src/data/mockRMSE.json dan belum memiliki form input/impor *ground truth* ke Supabase | **Perlu Integrasi CRUD** — Hubungkan kalkulator RMSE dengan tabel Supabase, tambahkan form input koordinat lapangan, dan visualisasi garis selisih jarak di peta |

### **2\. Arsitektur Alur Data Sistem (Target Integrasi)**

AI Agent harus mengimplementasikan alur kerja **Distribusi Tugas (*Task Distribution Pipeline*)** berikut di dalam aplikasi:

> 1. **Akuisisi Lapangan (Input Pengguna di DetectionPage.jsx):**  
   * **Input Visual:** Pengguna mengunggah rekaman video perjalanan (.mp4/.mov) atau kumpulan citra frame (.jpg/.png) dari kamera HP yang dipasang pada sepeda motor beserta informasi waktu perekaman (*timestamp*).  
   * **Input Spasial Wearable:** Pengguna mengunggah file log lintasan GNSS (.gpx atau .csv) yang diekspor dari **Smartwatch Supercalla Onyx (GPS \+ BeiDou)**.  
> 2. **Deteksi Visual YOLOv8 & Ekstraksi Timestamp:**  
   * Frame citra diproses oleh model **YOLOv8** (melalui layanan FastAPI Python lokal/cloud atau ONNX Runtime) untuk mendeteksi 4 kelas kerusakan (longitudinal\_crack, alligator\_crack, rutting, patches), menghasilkan *bounding box*, *confidence score*, dan *timestamp* frame (${t}_{frame}$).  
> 3. **Sinkronisasi Spasial-Temporal (Time-Series Matching & Interpolation):**  
   * Sistem mencocokkan waktu deteksi frame (${t}_{sync}={t}_{frame}+\Delta {t}_{offset}$) terhadap deret waktu log GNSS Smartwatch Supercalla Onyx.  
   * Jika ${t}_{sync}$ berada di antara dua titik log GNSS (${t}_{1}$ dan ${t}_{2}$), sistem melakukan **interpolasi linear spasial** untuk mendapatkan koordinat $(La{t}_{gnss},Ln{g}_{gnss})$ yang presisi pada milidetik/detik tersebut.  
> 4. **Penyimpanan Persisten ke Supabase:**  
   * Citra hasil deteksi (*cropped/annotated frame*) dan file log GNSS diunggah ke **Supabase Storage**.  
   * Metadata sesi survei, titik lintasan GNSS, dan titik kerusakan jalan disimpan ke **Supabase PostgreSQL Database**.  
> 5. **Visualisasi Web GIS & Evaluasi Spasial RMSE (MapPage.jsx & InventoryPage.jsx):**  
   * Peta Leaflet menampilkan rute perjalanan (Surabaya – Mojokerto – Jombang), titik kerusakan berwarna sesuai 4 kelas, serta perbandingan posisi terhadap titik **Ground Truth Lapangan** menggunakan rumus **Haversine** dan **RMSE**.

### **3\. Instruksi Tahap demi Tahap untuk AI Agent (Antigravity)**

#### **Tahap 1: Instalasi Dependensi & Konfigurasi Supabase Client**

> 1. Instal paket @supabase/supabase-js dan papaparse (untuk parsing log CSV GNSS) di root proyek:  
>    Bash  
>    npm install @supabase/supabase-js papaparse

> 2. Perbarui file .env dan buat .env.example dengan variabel lingkungan berikut:  
>    Cuplikan kode  
>    VITE\_USE\_MOCK=false  
>    VITE\_SUPABASE\_URL=https\://YOUR\_PROJECT\_ID.supabase.co  
>    VITE\_SUPABASE\_ANON\_KEY=YOUR\_SUPABASE\_ANON\_KEY  
>    VITE\_YOLO\_API\_URL=http\://localhost:8000

> 3. Buat file inisialisasi klien Supabase di src/lib/supabaseClient.js:  
>    JavaScript  
>    import { createClient } from '@supabase/supabase-js';

>    const supabaseUrl \= import.meta.env.VITE\_SUPABASE\_URL;  
>    const supabaseAnonKey \= import.meta.env.VITE\_SUPABASE\_ANON\_KEY;

>    if (\!supabaseUrl || \!supabaseAnonKey) {  
>      console.warn('Supabase URL atau Anon Key belum dikonfigurasi di file .env');  
>    }

>    export const supabase \= createClient(  
>      supabaseUrl || 'https\://placeholder.supabase.co',  
>      supabaseAnonKey || 'placeholder-key'  
>    );

#### **Tahap 2: Pembuatan Skema Database & Storage Supabase**

Buat folder supabase/ di root proyek dan simpan skema SQL berikut di supabase/schema.sql (untuk dijalankan pada **Supabase SQL Editor**):

SQL  
\-- 1\. Enable UUID extension  
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\-- 2\. Enum untuk 4 Kelas Kerusakan Jalan sesuai Batasan Masalah Proposal Skripsi Bab 1.5  
DO \$\$ BEGIN  
    CREATE TYPE damage\_class\_enum AS ENUM (  
        'longitudinal\_crack', \-- Retak Memanjang  
        'alligator\_crack',    \-- Retak Buaya  
        'rutting',            \-- Aspal Bergelombang / Alur Roda  
        'patches'             \-- Tambalan Tidak Rata  
    );  
EXCEPTION  
    WHEN duplicate\_object THEN null;  
END \$\$;

\-- 3\. Tabel Sesi Survei Lapangan (Rute Surabaya \- Jombang \- Mojokerto)  
CREATE TABLE IF NOT EXISTS public.survey\_sessions (  
    id UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),  
    session\_name VARCHAR(255) NOT NULL,  
    route\_corridor VARCHAR(100) NOT NULL DEFAULT 'Surabaya \- Mojokerto \- Jombang',  
    route\_segment VARCHAR(100), \-- Contoh: 'Surabaya \- Krian', 'Krian \- Mojokerto', 'Mojokerto \- Jombang'  
    camera\_device VARCHAR(100) DEFAULT 'Smartphone Dashcam (Motor)',  
    gnss\_device VARCHAR(100) DEFAULT 'Smartwatch Supercalla Onyx (Dual-Freq GPS \+ BeiDou)',  
    time\_offset\_ms INTEGER DEFAULT 0, \-- Kalibrasi selisih waktu kamera vs jam tangan (ms)  
    gpx\_file\_url TEXT,  
    survey\_date TIMESTAMPTZ DEFAULT NOW(),  
    total\_distance\_km NUMERIC(8, 2) DEFAULT 0,  
    notes TEXT,  
    created\_at TIMESTAMPTZ DEFAULT NOW()  
);

\-- 4\. Tabel Log Titik Trajectory GNSS Smartwatch (Supercalla Onyx)  
CREATE TABLE IF NOT EXISTS public.gnss\_track\_points (  
    id UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),  
    session\_id UUID NOT NULL REFERENCES public.survey\_sessions(id) ON DELETE CASCADE,  
    recorded\_at TIMESTAMPTZ NOT NULL,  
    latitude DOUBLE PRECISION NOT NULL,  
    longitude DOUBLE PRECISION NOT NULL,  
    altitude DOUBLE PRECISION,  
    speed\_mps DOUBLE PRECISION,  
    hdop DOUBLE PRECISION, \-- Horizontal Dilution of Precision  
    satellite\_system VARCHAR(50) DEFAULT 'GPS+BeiDou',  
    created\_at TIMESTAMPTZ DEFAULT NOW()  
);

CREATE INDEX IF NOT EXISTS idx\_gnss\_session\_time ON public.gnss\_track\_points(session\_id, recorded\_at);

\-- 5\. Tabel Data Deteksi Kerusakan Jalan (YOLOv8 \+ Koordinat Tersinkronisasi)  
CREATE TABLE IF NOT EXISTS public.road\_damages (  
    id UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),  
    session\_id UUID REFERENCES public.survey\_sessions(id) ON DELETE SET NULL,  
    damage\_type damage\_class\_enum NOT NULL,  
    confidence DOUBLE PRECISION NOT NULL CHECK (confidence \>= 0 AND confidence \<= 1),  
    severity VARCHAR(20) DEFAULT 'sedang' CHECK (severity IN ('ringan', 'sedang', 'berat')),  
    bbox JSONB, \-- Format: {"x": 120, "y": 240, "w": 300, "h": 150}  
    image\_url TEXT,  
    captured\_at TIMESTAMPTZ NOT NULL, \-- Timestamp frame kamera  
    \-- Koordinat utama dari hasil sinkronisasi GNSS Smartwatch Supercalla Onyx  
    latitude DOUBLE PRECISION NOT NULL,  
    longitude DOUBLE PRECISION NOT NULL,  
    \-- Koordinat opsional dari GPS bawaan HP (sebagai pembanding riset)  
    phone\_latitude DOUBLE PRECISION,  
    phone\_longitude DOUBLE PRECISION,  
    \-- Informasi lokasi jalan  
    road\_name VARCHAR(255),  
    route\_segment VARCHAR(100) DEFAULT 'Surabaya \- Jombang \- Mojokerto',  
    interpolation\_delta\_ms INTEGER, \-- Selisih waktu dengan titik log GNSS terdekat (ms)  
    status VARCHAR(30) DEFAULT 'terdeteksi' CHECK (status IN ('terdeteksi', 'terverifikasi', 'diperbaiki')),  
    created\_at TIMESTAMPTZ DEFAULT NOW()  
);

CREATE INDEX IF NOT EXISTS idx\_damages\_type ON public.road\_damages(damage\_type);  
CREATE INDEX IF NOT EXISTS idx\_damages\_segment ON public.road\_damages(route\_segment);

\-- 6\. Tabel Pengujian Spasial RMSE (Validasi Lapangan Ground Truth)  
CREATE TABLE IF NOT EXISTS public.rmse\_evaluations (  
    id UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),  
    damage\_id UUID NOT NULL UNIQUE REFERENCES public.road\_damages(id) ON DELETE CASCADE,  
    sample\_code VARCHAR(50), \-- Contoh: 'SBY-MJK-001'  
    \-- Koordinat Sistem (GNSS Smartwatch Supercalla Onyx di Web GIS)  
    system\_lat DOUBLE PRECISION NOT NULL,  
    system\_lng DOUBLE PRECISION NOT NULL,  
    \-- Koordinat Aktual Lapangan (Ground Truth Pengukuran Langsung)  
    ground\_truth\_lat DOUBLE PRECISION NOT NULL,  
    ground\_truth\_lng DOUBLE PRECISION NOT NULL,  
    \-- Koordinat Pembanding GPS HP (Opsional untuk pembuktian hipotesis Bab 1.1)  
    phone\_gps\_lat DOUBLE PRECISION,  
    phone\_gps\_lng DOUBLE PRECISION,  
    \-- Hasil Perhitungan Haversine Error (Meter)  
    error\_distance\_m DOUBLE PRECISION NOT NULL,  
    squared\_error\_m2 DOUBLE PRECISION NOT NULL,  
    phone\_error\_distance\_m DOUBLE PRECISION,  
    field\_notes TEXT,  
    evaluated\_at TIMESTAMPTZ DEFAULT NOW()  
);

\-- 7\. Row Level Security (RLS) untuk akses baca/tulis publik selama pengembangan skripsi  
ALTER TABLE public.survey\_sessions ENABLE ROW LEVEL SECURITY;  
ALTER TABLE public.gnss\_track\_points ENABLE ROW LEVEL SECURITY;  
ALTER TABLE public.road\_damages ENABLE ROW LEVEL SECURITY;  
ALTER TABLE public.rmse\_evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public all on survey\_sessions" ON public.survey\_sessions FOR ALL USING (true) WITH CHECK (true);  
CREATE POLICY "Allow public all on gnss\_track\_points" ON public.gnss\_track\_points FOR ALL USING (true) WITH CHECK (true);  
CREATE POLICY "Allow public all on road\_damages" ON public.road\_damages FOR ALL USING (true) WITH CHECK (true);  
CREATE POLICY "Allow public all on rmse\_evaluations" ON public.rmse\_evaluations FOR ALL USING (true) WITH CHECK (true);

\-- 8\. Storage Buckets (jalankan atau buat via Dashboard Storage Supabase)  
INSERT INTO storage.buckets (id, name, public) VALUES ('damage-images', 'damage-images', true) ON CONFLICT DO NOTHING;  
INSERT INTO storage.buckets (id, name, public) VALUES ('gnss-tracks', 'gnss-tracks', true) ON CONFLICT DO NOTHING;

#### **Tahap 3: Penyelarasan Kelas Kerusakan Jalan ([src/data/damageTypes.js](https://github.com/masterlearn22/RoadkSick/blob/main/src/data/damageTypes.js) & src/utils/damageTypes.js)**

Sesuai **Bab 1.1 dan Bab 1.5 (Batasan Masalah Poin 1\)** pada proposal skripsi:  
*"Objek Deteksi: Jenis kerusakan jalan yang dideteksi dibatasi pada retak memanjang (longitudinal cracks), retak buaya (alligator cracks), aspal bergelombang (rutting), dan tambalan yang tidak rata (patches)."*

> 1. Buka [src/data/damageTypes.js](https://github.com/masterlearn22/RoadkSick/blob/main/src/data/damageTypes.js) dan src/utils/damageTypes.js.  
> 2. Hapus entri pothole dari daftar aktif DAMAGE\_TYPES sehingga hanya menyisakan **4 kelas resmi skripsi** dengan skema warna dan kode kelas YOLOv8 (0–3) sebagai berikut:  
>    JavaScript  
>    export const DAMAGE\_TYPES \= {  
>      longitudinal\_crack: {  
>        id: 'longitudinal\_crack',  
>        yoloClassId: 0,  
>        code: 'D00',  
>        label: 'Retak Memanjang',  
>        englishLabel: 'Longitudinal Crack',  
>        color: '\#F59E0B', // Amber  
>        description: 'Retakan sejajar dengan arah lajur lalu lintas jalan aspal'  
>      },  
>      alligator\_crack: {  
>        id: 'alligator\_crack',  
>        yoloClassId: 1,  
>        code: 'D20',  
>        label: 'Retak Buaya',  
>        englishLabel: 'Alligator Crack',  
>        color: '\#EF4444', // Red  
>        description: 'Retakan saling berhubungan membentuk pola menyerupai kulit buaya'  
>      },  
>      rutting: {  
>        id: 'rutting',  
>        yoloClassId: 2,  
>        code: 'D30',  
>        label: 'Aspal Bergelombang',  
>        englishLabel: 'Rutting',  
>        color: '\#8B5CF6', // Purple  
>        description: 'Penurunan/deformasi memanjang pada lintasan jejak roda kendaraan berat'  
>      },  
>      patches: {  
>        id: 'patches',  
>        yoloClassId: 3,  
>        code: 'D44',  
>        label: 'Tambalan Tidak Rata',  
>        englishLabel: 'Patches',  
>        color: '\#3B82F6', // Blue  
>        description: 'Area perbaikan/tambalan aspal yang permukaannya tidak rata dengan lapisan sekitar'  
>      }  
>    };

> 3. Perbarui seluruh referensi di src/data/mockDetections.json, src/data/mockDashboard.json, dan filter di MapPage.jsx serta InventoryPage.jsx agar tidak lagi menampilkan pothole.

#### **Tahap 4: Implementasi Modul Sinkronisasi GNSS Smartwatch Supercalla Onyx (src/utils/gnssSync.js)**

Bagian ini merepresentasikan **kebaruan (*novelty*) penelitian** di **Rumusan Masalah \#2**. Buat file baru src/utils/gnssSync.js yang menangani:

* **Parsing File .gpx (XML)** dan **.csv** dari Smartwatch Supercalla Onyx (mengambil lat, lon, ele, time, dan hdop).  
* **Pencocokan Timestamp & Interpolasi Spasial Linear (matchFrameToGNSS)**: mencocokkan frameTimestamp (waktu frame video/foto saat kerusakan terdeteksi YOLOv8) \+ timeOffsetMs terhadap dua titik GNSS pengapit ${P}_{1}({t}_{1},la{t}_{1},ln{g}_{1})$ dan ${P}_{2}({t}_{2},la{t}_{2},ln{g}_{2})$ di mana ${t}_{1}\leq targetTime\leq {t}_{2}$.

JavaScript  
import Papa from 'papaparse';  
import { haversineDistance } from './coordinates';

/\*\*  
 \* Parse file GPX dari Smartwatch Supercalla Onyx menjadi array titik GNSS terurut waktu  
 \*/  
export function parseGPXTrack(gpxText) {  
  const parser \= new DOMParser();  
  const xmlDoc \= parser.parseFromString(gpxText, 'text/xml');  
  const trkpts \= Array.from(xmlDoc.getElementsByTagName('trkpt'));

  const points \= trkpts.map((pt) \=\> {  
    const lat \= parseFloat(pt.getAttribute('lat'));  
    const lng \= parseFloat(pt.getAttribute('lon'));  
    const eleNode \= pt.getElementsByTagName('ele')\[0\];  
    const timeNode \= pt.getElementsByTagName('time')\[0\];  
    const hdopNode \= pt.getElementsByTagName('hdop')\[0\];

    const timestamp \= timeNode ? new Date(timeNode.textContent).getTime() : null;  
    return {  
      latitude: lat,  
      longitude: lng,  
      altitude: eleNode ? parseFloat(eleNode.textContent) : null,  
      hdop: hdopNode ? parseFloat(hdopNode.textContent) : null,  
      recorded\_at: timeNode ? timeNode.textContent : null,  
      timestampMs: timestamp  
    };  
  }).filter((p) \=\> \!isNaN(p.latitude) && \!isNaN(p.longitude) && p.timestampMs \!== null);

  return points.sort((a, b) \=\> a.timestampMs \- b.timestampMs);  
}

/\*\*  
 \* Parse file CSV log GNSS dari Smartwatch menjadi array titik GNSS terurut waktu  
 \*/  
export function parseCSVTrack(csvText) {  
  const result \= Papa.parse(csvText, { header: true, skipEmptyLines: true });  
  const points \= result.data.map((row) \=\> {  
    const lat \= parseFloat(row.latitude || row.lat || row.Latitude);  
    const lng \= parseFloat(row.longitude || row.lon || row.lng || row.Longitude);  
    const timeStr \= row.timestamp || row.time || row.recorded\_at || row.Time;  
    const timestampMs \= timeStr ? new Date(timeStr).getTime() : null;

    return {  
      latitude: lat,  
      longitude: lng,  
      altitude: parseFloat(row.altitude || row.ele || 0) || null,  
      hdop: parseFloat(row.hdop || 0) || null,  
      recorded\_at: timeStr ? new Date(timestampMs).toISOString() : null,  
      timestampMs  
    };  
  }).filter((p) \=\> \!isNaN(p.latitude) && \!isNaN(p.longitude) && p.timestampMs \!== null);

  return points.sort((a, b) \=\> a.timestampMs \- b.timestampMs);  
}

/\*\*  
 \* Mencocokkan timestamp frame visual kamera (YOLOv8) dengan koordinat GNSS Smartwatch  
 \* menggunakan Interpolasi Linear Spasial-Temporal  
 \*/  
export function matchFrameToGNSS(frameTimestampMs, trackPoints, timeOffsetMs \= 0, maxToleranceMs \= 15000) {  
  if (\!trackPoints || trackPoints.length \=== 0) return null;

  const targetTime \= frameTimestampMs \+ timeOffsetMs;

  if (targetTime \< trackPoints\[0\].timestampMs \- maxToleranceMs ||  
      targetTime \> trackPoints\[trackPoints.length \- 1\].timestampMs \+ maxToleranceMs) {  
    return null;  
  }

  if (targetTime \<= trackPoints\[0\].timestampMs) {  
    return {  
      latitude: trackPoints\[0\].latitude,  
      longitude: trackPoints\[0\].longitude,  
      deltaMs: Math.abs(targetTime \- trackPoints\[0\].timestampMs),  
      method: 'nearest\_edge'  
    };  
  }  
  if (targetTime \>= trackPoints\[trackPoints.length \- 1\].timestampMs) {  
    const last \= trackPoints\[trackPoints.length \- 1\];  
    return {  
      latitude: last.latitude,  
      longitude: last.longitude,  
      deltaMs: Math.abs(targetTime \- last.timestampMs),  
      method: 'nearest\_edge'  
    };  
  }

  let low \= 0;  
  let high \= trackPoints.length \- 1;  
  while (low \<= high) {  
    const mid \= Math.floor((low \+ high) / 2);  
    if (trackPoints\[mid\].timestampMs \=== targetTime) {  
      return {  
        latitude: trackPoints\[mid\].latitude,  
        longitude: trackPoints\[mid\].longitude,  
        deltaMs: 0,  
        method: 'exact'  
      };  
    } else if (trackPoints\[mid\].timestampMs \< targetTime) {  
      low \= mid \+ 1;  
    } else {  
      high \= mid \- 1;  
    }  
  }

  const p1 \= trackPoints\[high\];  
  const p2 \= trackPoints\[low\];  
  const span \= p2.timestampMs \- p1.timestampMs;  
  const ratio \= span \> 0 ? (targetTime \- p1.timestampMs) / span : 0;

  return {  
    latitude: p1.latitude \+ ratio \* (p2.latitude \- p1.latitude),  
    longitude: p1.longitude \+ ratio \* (p2.longitude \- p1.longitude),  
    deltaMs: Math.min(Math.abs(targetTime \- p1.timestampMs), Math.abs(p2.timestampMs \- targetTime)),  
    method: 'linear\_interpolation'  
  };  
}

/\*\*  
 \* Menghitung total panjang lintasan survei (km) dari daftar titik GNSS  
 \*/  
export function calculateTrackDistanceKm(trackPoints) {  
  if (\!trackPoints || trackPoints.length \< 2) return 0;  
  let totalMeters \= 0;  
  for (let i \= 1; i \< trackPoints.length; i++) {  
    totalMeters \+= haversineDistance(  
      trackPoints\[i \- 1\].latitude,  
      trackPoints\[i \- 1\].longitude,  
      trackPoints\[i\].latitude,  
      trackPoints\[i\].longitude  
    );  
  }  
  return \+(totalMeters / 1000).toFixed(2);  
}

#### **Tahap 5: Refactoring Service Layer ke Supabase (src/services/supabaseService.js & src/services/index.js)**

> 1. Buat src/services/supabaseService.js yang mengimplementasikan seluruh fungsi yang dibutuhkan oleh Zustand store (useDetectionStore, useMapStore, useAppStore) secara langsung ke **Supabase**:  
   * createSurveySession(sessionData) & uploadGNSSLog(sessionId, trackPoints, rawFile)  
   * uploadDamageImage(file) ke bucket damage-images dan mengembalikan publicUrl  
   * saveDetection(detectionPayload) ke tabel road\_damages  
   * getAllDetections(filters) dari tabel road\_damages (mendukung filter damage\_type, route\_segment, severity, dan rentang tanggal)  
   * getDashboardStats() yang menghitung agregasi total kerusakan per kelas (longitudinal\_crack, alligator\_crack, rutting, patches), distribusi per segmen rute (**Surabaya – Krian**, **Krian – Mojokerto**, **Mojokerto – Jombang**), serta nilai rata-rata RMSE terbaru dari Supabase  
   * getMapMarkers(filters) & getSurveyTracks(sessionId) untuk merender marker kerusakan sekaligus *polyline* lintasan GNSS Supercalla Onyx di MapPage.jsx  
   * getRMSEData() & upsertGroundTruth({ damage\_id, ground\_truth\_lat, ground\_truth\_lng, phone\_gps\_lat, phone\_gps\_lng, field\_notes }) yang otomatis menghitung haversineDistance (error\_distance\_m dan squared\_error\_m2) lalu menyimpannya ke tabel rmse\_evaluations.  
> 2. Di src/services/index.js, arahkan ekspor utama ke supabaseService ketika VITE\_USE\_MOCK \=== 'false' (dengan fallback otomatis ke mockApi jika kredensial .env belum diisi).

#### **Tahap 6: Penyempurnaan Halaman Deteksi & Sinkronisasi (src/pages/DetectionPage.jsx)**

Ubah DetectionPage.jsx agar mencerminkan metode **Distribusi Tugas (Kamera \+ Smartwatch Wearable)** sesuai Bab 1.3 Tujuan Penelitian Poin 2:

> 1. **Panel 1 — Konfigurasi Sesi & Unggah Log GNSS Smartwatch (Supercalla Onyx):**  
   * Input nama sesi survei dan pilihan segmen koridor: Surabaya – Sidoarjo/Krian, Krian – Bypass Mojokerto, atau Mojokerto – Mojoagung – Jombang.  
   * Dropzone unggah file .gpx atau .csv dari Smartwatch Supercalla Onyx.  
   * Tampilkan ringkasan otomatis setelah file dipilih: jumlah titik satelit GNSS (GPS+BeiDou), rentang waktu perekaman (start\_time s/d end\_time), dan panjang lintasan (km).  
   * Input **Kalibrasi Time Offset ($\Delta t$ dalam detik/milidetik)** untuk menyamakan jam kamera HP dengan jam Smartwatch Supercalla Onyx.  
> 2. **Panel 2 — Unggah Visual Kamera (Video / Frame Gambar) & Deteksi YOLOv8:**  
   * Ekstrak *timestamp* frame (dari metadata EXIF DateTimeOriginal / waktu awal video \+ *frame timecode*, atau input manual waktu perekaman).  
   * Kirim frame ke endpoint inferensi **YOLOv8** (POST /detect/image atau /detect/video pada backend FastAPI YOLOv8).  
   * Panggil fungsi matchFrameToGNSS(frameTimestamp, gnssPoints, timeOffsetMs) untuk menyematkan koordinat $(La{t}_{gnss},Ln{g}_{gnss})$ dari Smartwatch Supercalla Onyx secara otomatis ke setiap deteksi.  
   * Simpan hasil deteksi \+ foto *bounding box* \+ koordinat GNSS tersinkronisasi ke **Supabase** melalui tombol **"Simpan Hasil Sinkronisasi ke Web GIS"**.

#### **Tahap 7: Penyempurnaan Web GIS (src/pages/MapPage.jsx) & Evaluasi Spasial RMSE ([src/utils/rmse.js](https://github.com/masterlearn22/RoadkSick/blob/main/src/utils/rmse.js) / InventoryPage.jsx)**

> 1. **Fokus Area Peta (MapPage.jsx):**  
   * Atur koordinat tengah default peta Leaflet ke koridor **Surabaya – Mojokerto – Jombang** (center: \[-7.4664, 112.4338\], zoom: 11).  
   * Tambahkan **Layer Toggle**:  
     * **Layer 1:** Marker Kerusakan Jalan (4 Kelas YOLOv8) dengan popup berisi foto *bounding box*, jenis kerusakan, *confidence score*, waktu deteksi, koordinat GNSS Supercalla Onyx, dan selisih jarak RMSE.  
     * **Layer 2:** Polyline Trajectory GNSS Smartwatch (menampilkan jejak rute perjalanan sepeda motor dari tabel gnss\_track\_points).  
     * **Layer 3:** Vektor Error Spasial RMSE (menampilkan titik *Ground Truth* lapangan dengan ikon target khusus beserta garis putus-putus penghubung ke titik prediksi Web GIS dan label jarak meleset dalam meter).  
> 2. **Modul Pengujian Spasial RMSE Interaktif:**  
   * Tambahkan tab atau modal **"Validasi Lapangan & Uji Spasial RMSE"** di mana peneliti dapat memilih titik deteksi dan memasukkan koordinat aktual hasil pengukuran lapangan (**Ground Truth Latitude & Longitude**) serta (opsional) koordinat GPS HP standar.  
   * Sistem langsung menghitung dan menampilkan selisih jarak per titik ${d}_{i}$ (meter), kuadrat error ${d}_{i}^{2}$ (${m}^{2}$), nilai total **RMSE**, serta indikator apakah memenuhi target akurasi $RMSE<3,00meter$.  
   * Sediakan tombol **Export Tabel Pengujian RMSE (CSV)** untuk langsung dilampirkan ke Bab 4 Skripsi.

#### **Tahap 8: Penyediaan Microservice Backend YOLOv8 (backend/main.py)**

Agar endpoint /detect/image dan /detect/video di [src/services/api.js](https://github.com/masterlearn22/RoadkSick/blob/main/src/services/api.js) benar-benar menjalankan model **YOLOv8**, buat folder backend/ berisi layanan ringan **FastAPI \+ Ultralytics YOLOv8**:

> 1. Buat backend/requirements.txt:  
>    Plaintext  
>    fastapi\>=0.110.0  
>    uvicorn\>=0.29.0  
>    ultralytics\>=8.2.0  
>    python-multipart\>=0.0.9  
>    pillow\>=10.3.0  
>    opencv-python-headless\>=4.9.0.80

> 2. Buat backend/main.py yang memuat bobot model YOLOv8 kustom (best.pt yang dilatih pada 4 kelas: 0: longitudinal\_crack, 1: alligator\_crack, 2: rutting, 3: patches), menyediakan endpoint POST /api/detect/image dan POST /api/detect/video dengan CORS aktif untuk frontend Vite (http\://localhost:5173), dan mengembalikan JSON daftar *bounding box* beserta gambar beranotasi.

### **4\. Checklist Verifikasi Akhir untuk AI Agent (Definition of Done)**

* \[ \] @supabase/supabase-js dan papaparse sudah terinstal di package.json dan proyek berhasil di-*build* (npm run build) tanpa error.  
* \[ \] File supabase/schema.sql tersedia lengkap dengan 4 tabel (survey\_sessions, gnss\_track\_points, road\_damages, rmse\_evaluations) dan 2 Storage Bucket.  
* \[ \] Daftar kelas di src/data/damageTypes.js dan src/utils/damageTypes.js sudah disesuaikan menjadi tepat **4 kelas sesuai Batasan Masalah Proposal** (longitudinal\_crack, alligator\_crack, rutting, patches).  
* \[ \] Modul src/utils/gnssSync.js berfungsi melakukan parsing .gpx/.csv dari Smartwatch Supercalla Onyx dan menginterpolasi koordinat berdasarkan *timestamp* frame deteksi YOLOv8.  
* \[ \] DetectionPage.jsx memiliki alur unggah terpisah namun tersinkronisasi antara **File Visual Kamera HP** dan **File Track GNSS Smartwatch**.  
* \[ \] MapPage.jsx berpusat di jalur lintas **Surabaya – Mojokerto – Jombang**, menampilkan *polyline* rute GNSS, marker 4 kelas kerusakan, serta visualisasi garis selisih jarak (*error vector*) terhadap titik *Ground Truth*.  
* \[ \] Perhitungan **RMSE (meter)** terhubung ke database Supabase, dapat menerima input koordinat *Ground Truth* lapangan secara langsung, dan dapat diekspor ke CSV untuk kebutuhan tabel pengujian Bab 4 Skripsi.