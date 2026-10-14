# Shopee Boost

Frontend statis PWA Shopee Boost yang dipublikasikan melalui GitHub Pages. API, analisis produk, dan narasi AI tetap menggunakan backend Render yang sudah ada: `https://shopeeboost-ai-studio.onrender.com`.

## URL publik

`https://shopppit1-tech.github.io/shopee-boost/`

## Deployment

Push ke branch `main` akan menjalankan GitHub Actions, membangun Vite dengan `VITE_BASE_PATH=/shopee-boost/`, lalu memublikasikan direktori `dist/` ke GitHub Pages. Variabel `VITE_API_BASE_URL` pada workflow menunjuk ke layanan Render.

Repo ini hanya berisi frontend dan aset publik; tidak menyertakan server backend atau kredensial. Untuk mengubah API/server, gunakan repo privat `shopppit1-tech/shopeeboost-ai-studio`.
