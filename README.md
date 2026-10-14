# Shopee Boost

Frontend statis PWA Shopee Boost yang dipublikasikan melalui GitHub Pages. API, analisis produk, dan narasi AI tetap menggunakan backend Render yang sudah ada: `https://shopeeboost-ai-studio.onrender.com`.

## URL publik

`https://shopppit1-tech.github.io/shopee-boost/`

## Deployment

GitHub Pages mengambil file statis langsung dari branch `main`, folder root. Untuk memperbarui halaman, bangun frontend dengan `VITE_BASE_PATH=/shopee-boost/` dan `VITE_API_BASE_URL=https://shopeeboost-ai-studio.onrender.com`, lalu salin isi `dist/` ke root dan push ke `main`.

Repo ini hanya berisi frontend dan aset publik; tidak menyertakan server backend atau kredensial. Untuk mengubah API/server, gunakan repo privat `shopppit1-tech/shopeeboost-ai-studio`.
