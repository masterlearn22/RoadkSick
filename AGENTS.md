# Aturan Workflow Proyek RoadSick

## Aturan Git & Deployment
1. **Selalu Commit & Push**: Setiap kali ada perubahan kode atau fitur (frontend/backend/konfigurasi), WAJIB melakukan `git commit` dengan pesan yang deskriptif dan langsung `git push origin main`.
2. **Update GitHub Pages**: Jika perubahan mempengaruhi frontend, pastikan untuk melakukan build dan deploy ke branch `gh-pages` (`npm run build && npx gh-pages -d dist`).
3. **Database Supabase**: Frontend secara default terhubung langsung ke Supabase Cloud live, hindari fallback ke data dummy kecuali jika diminta untuk mode simulasi.
