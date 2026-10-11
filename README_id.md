# pondok-ai

Sebelumnya bernama local-ai-stack. Pondok berarti tempat bernaung sederhana.

[English](README.md) · **Bahasa Indonesia** · [한국어](README_ko.md) · [العربية](README_ar.md) · [Español](README_es.md) · [中文](README_zh.md) · [Français](README_fr.md) · [日本語](README_ja.md) · [Deutsch](README_de.md) · [Português](README_pt.md) · [Русский](README_ru.md) · [हिन्दी](README_hi.md) · [Türkçe](README_tr.md) · [Italiano](README_it.md) · [Tiếng Việt](README_vi.md)

Terjemahan dibuat oleh mesin dan mungkin tertinggal dari README bahasa Inggris.

<p align="center">
  <a href="#quickstart">Mulai Cepat</a> •
  <a href="#features">Fitur</a> •
  <a href="#presets">Preset</a> •
  <a href="#cli-commands">Perintah CLI</a> •
  <a href="#api-gateway">API Gateway</a> •
  <a href="#examples">Contoh</a> •
  <a href="#docs">Dokumentasi</a>
</p>

---

## Overview

`pondok-ai` adalah toolkit CLI dan orkestrasi container yang mudah digunakan, dirancang untuk menjalankan lingkungan AI pribadi secara langsung di komputer lokal Anda dengan konfigurasi seminimal mungkin.

Didukung oleh **Docker Compose v2**, `pondok-ai` menyediakan LLM lokal, antarmuka chat, pencarian vektor, penyimpanan database, dan API Gateway yang kompatibel dengan OpenAI hanya dalam hitungan detik.

Prompt, percakapan, dan embedding diproses di komputer Anda. Namun, pengunduhan image container dan bobot model tetap memerlukan koneksi internet.

```bash
npx pondok-ai init
npx pondok-ai up
```

---

## Fitur

- **Pemrosesan Lokal**: Prompt, percakapan, embedding, dan inferensi berjalan di perangkat keras Anda. Pengunduhan awal image container dan model memerlukan koneksi internet.
- ⚡ **Konfigurasi Praktis**: Mendeteksi OS, arsitektur, RAM, dan GPU secara otomatis, termasuk Apple Metal dan NVIDIA CUDA.
- **Preset Modular**: Pilih mulai dari antarmuka chat ringan (`minimal`), stack RAG (`standard`), hingga pipeline otomatisasi AI (`full`).
- **Gateway yang Kompatibel dengan OpenAI**: Hubungkan OpenAI SDK standar atau LangChain langsung ke `http://localhost:8000/v1` tanpa perlu mengubah kode.
- **Manajer Model Bawaan**: Unduh, tampilkan daftar, periksa, dan hapus model dengan peringatan keamanan penggunaan RAM dan ruang disk.
- **Diagnostik Bawaan**: Perintah `doctor` membantu mendeteksi konflik port, status Docker daemon, dan keterbatasan sumber daya sebelum menimbulkan masalah.

---

## Arsitektur

```text
┌───────────────────────────────────────────────────────────────┐
│                       Mesin Host (CLI)                        │
│                                                               │
│   Port 3000                 Port 8000           Port 5678     │
│       │                         │                   │         │
└───────┼─────────────────────────┼───────────────────┼─────────┘
        ▼                         ▼                   ▼
  ┌───────────┐             ┌───────────┐       ┌───────────┐
  │ Open      │             │ API       │       │ n8n       │
  │ WebUI     │             │ Gateway   │       │ (Full)    │
  └─────┬─────┘             └─────┬─────┘       └─────┬─────┘
        │                         │                   │
        ├─────────────────────────┼───────────────────┤
        ▼                         ▼                   ▼
  ┌───────────┐             ┌───────────┐       ┌───────────┐
  │ Ollama    │             │ Qdrant    │       │ Postgres  │
  │ (LLM)     │             │ (Vektor)  │       │ (Data)    │
  └───────────┘             └───────────┘       └───────────┘
```

---

## Preset

| Preset | Layanan yang Disertakan | RAM Minimum | Direkomendasikan Untuk |
|---|---|---|---|
| **`minimal`** | Ollama, Open WebUI | 8 GB | Chat lokal, eksperimen ringan |
| **`standard`** *(default)* | Ollama, Open WebUI, PostgreSQL, Qdrant, API Gateway | 16 GB | Pipeline RAG, pengembangan aplikasi, pengganti API OpenAI |
| **`full`** | Semua layanan Standard + mesin otomatisasi n8n | 16+ GB | Agen AI otonom, otomatisasi alur kerja visual |

---

## Mulai Cepat

### Mulai Cepat via npx

**Prasyarat:** Node.js 22 atau lebih baru, Docker, dan Docker Compose v2.

#### 1. Inisialisasi stack

```bash
# Wizard konfigurasi interaktif dengan deteksi perangkat keras otomatis
npx pondok-ai init

# Atau jalankan tanpa interaksi dengan memilih preset
npx pondok-ai init --preset standard --yes
```

#### 2. Jalankan layanan dengan pemeriksaan kesehatan otomatis

```bash
npx pondok-ai up
```

Setelah layanan berjalan, akses stack Anda melalui alamat berikut:

- **Open WebUI**: [http://localhost:3000](http://localhost:3000)
- **API Gateway**: [http://localhost:8000](http://localhost:8000)
- **Ollama**: [http://localhost:11434](http://localhost:11434)
- **Qdrant**: [http://localhost:6333/dashboard](http://localhost:6333/dashboard) *(jika port telah dipetakan)*

#### 3. Deteksi Perangkat Keras dan Rekomendasi Model

```bash
# Dapatkan rekomendasi model berdasarkan RAM dan VRAM perangkat Anda
npx pondok-ai model recommend

# Instal model dengan pemeriksaan awal penggunaan memori dan ruang disk
npx pondok-ai model install llama3.2:3b
```

### Skrip penginstal (eksperimental, belum dicakup oleh CI)

#### macOS & Linux

```bash
curl -fsSL https://raw.githubusercontent.com/rasidi3112/pondok-ai/main/scripts/install.sh | bash
```

#### Windows (PowerShell)

```powershell
iwr -useb https://raw.githubusercontent.com/rasidi3112/pondok-ai/main/scripts/install.ps1 | iex
```

---

## Perintah CLI

| Perintah | Deskripsi |
|---|---|
| `pondok-ai init` | Menjalankan wizard konfigurasi interaktif dengan deteksi perangkat keras |
| `pondok-ai up` | Memvalidasi konfigurasi Compose, menjalankan container, dan menunggu pemeriksaan kesehatan |
| `pondok-ai down` | Menghentikan dan menghapus container stack |
| `pondok-ai start` | Menjalankan kembali container yang sudah ada dan sedang berhenti |
| `pondok-ai stop` | Menghentikan container yang sedang berjalan |
| `pondok-ai restart` | Memulai ulang container stack |
| `pondok-ai status` | Menampilkan status kesehatan container dan URL layanan |
| `pondok-ai logs [service]` | Menampilkan log layanan (`-f` untuk mengikuti log secara langsung) |
| `pondok-ai doctor` | Mendiagnosis Docker, RAM, GPU/VRAM, port, dan memberikan rekomendasi model |
| `pondok-ai update` | Mengunduh ulang image dengan versi yang telah ditentukan, disertai pencadangan otomatis dan pemeriksaan kesehatan |
| `pondok-ai backup` | Mencadangkan konfigurasi dan volume data dengan pemeriksaan integritas SHA-256. Cadangan tidak dienkripsi |
| `pondok-ai restore <path>` | Memulihkan cadangan setelah memeriksa integritas SHA-256. Cadangan tidak dienkripsi |
| `pondok-ai reset` | Mengatur ulang stack. Volume tetap dipertahankan kecuali opsi `--delete-data` digunakan |
| `pondok-ai config` | Memeriksa atau mengedit konfigurasi aktif |
| `pondok-ai model list` | Menampilkan daftar model yang telah diunduh |
| `pondok-ai model recommend` | Memberikan rekomendasi model berdasarkan RAM, VRAM, dan ruang disk |
| `pondok-ai model install <name>` | Mengunduh model baru dengan pemeriksaan awal ketersediaan sumber daya |
| `pondok-ai model remove <name>` | Menghapus model yang telah terpasang |
| `pondok-ai model status` | Memeriksa kebutuhan sumber daya setiap model |

Image container menggunakan versi yang telah ditentukan secara eksplisit. Perintah `pondok-ai update` memperbarui image sesuai versi yang dikonfigurasi, bukan secara otomatis memilih versi rilis yang lebih baru.

Setelah memperbarui CLI ke versi yang lebih baru, jalankan `pondok-ai update --upgrade-images` untuk memigrasikan hanya tag image default lama milik CLI. Nilai image khusus yang telah dikonfigurasi akan tetap dipertahankan.

---

## API Gateway

API Gateway menyediakan endpoint REST yang kompatibel dengan OpenAI dan dapat digunakan sebagai pengganti langsung dalam integrasi yang sudah ada.

Sebelum memanggil endpoint `/v1/`, atur `PONDOK_AI_API_KEY` menggunakan nilai `API_SECRET_KEY` yang dihasilkan oleh sistem.

Secara default, gateway membatasi permintaan terautentikasi ke endpoint `/v1/` sebanyak 120 permintaan per menit untuk setiap klien (IP sumber dan API key).

Jika diperlukan, Anda dapat mengubah batas tersebut melalui variabel `RATE_LIMIT_MAX_REQUESTS` dan `RATE_LIMIT_WINDOW_MS` di dalam file `.env`.

### Contoh Permintaan API

```bash
curl http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $PONDOK_AI_API_KEY" \
  -d '{
    "model": "llama3.2:3b",
    "messages": [
      { "role": "user", "content": "Halo dari stack AI lokal pribadi saya!" }
    ]
  }'
```

### Menggunakan OpenAI Node.js SDK Resmi

```typescript
import OpenAI from 'openai';

const apiKey = process.env.PONDOK_AI_API_KEY;
if (!apiKey) {
  throw new Error('Set PONDOK_AI_API_KEY to your generated API_SECRET_KEY.');
}

const openai = new OpenAI({
  baseURL: 'http://localhost:8000/v1',
  apiKey,
});

const completion = await openai.chat.completions.create({
  model: 'llama3.2:3b',
  messages: [{ role: 'user', content: 'Jelaskan komputasi kuantum dalam satu kalimat.' }],
});

console.log(completion.choices[0].message.content);
```

---

## Contoh Penggunaan

- [`examples/openai-compat/`](./examples/openai-compat): Contoh integrasi menggunakan OpenAI SDK tanpa perubahan besar pada kode.
- [`examples/rag-example/`](./examples/rag-example): Pipeline RAG lengkap menggunakan database vektor Qdrant dan embedding dari Ollama.

---

## Teruji di CI

Setiap pull request menjalankan pengujian menyeluruh (end-to-end) di GitHub Actions (amd64 dan arm64): init, up, penarikan model sangat kecil (smollm:135m, sekitar 90 MB), pendaftaran via /v1/models, permintaan non-streaming /v1/chat/completions, pembatasan laju (401 dan 429), dan pemeriksaan bahwa halaman awal Open WebUI merespons. Belum dicakup: respons streaming, embeddings, akselerasi GPU, dan host macOS/Windows.

---

## Keterbatasan yang diketahui

- Belum diuji pada host macOS atau Windows nyata. Di Apple Silicon, container Docker tidak dapat menggunakan GPU dan pondok-ai menjalankan Ollama di dalam Docker, sehingga inferensi di sana hanya menggunakan CPU.
- Akselerasi GPU tidak dicakup oleh CI.
- Respons streaming dan embeddings belum dicakup oleh CI.
- Image-nya berukuran besar (beberapa GB). Siapkan ruang disk kosong yang cukup; workspace cloud 32 GB dengan 19 GB kosong pernah kehabisan ruang saat mengekstrak image Ollama.

---

## Dokumentasi

- [Ikhtisar Arsitektur](./docs/architecture.md)
- [Referensi API Gateway](./docs/api-reference.md)
- [Panduan Konfigurasi](./docs/configuration.md)
- [Pengaturan Akselerasi GPU (Metal / CUDA)](./docs/gpu-setup.md)
- [Pemecahan Masalah dan Diagnostik](./docs/troubleshooting.md)

---

## Kontribusi

Kontribusi sangat terbuka! Silakan baca [`CONTRIBUTING.md`](./CONTRIBUTING.md) untuk memulai.

## Lisensi

[MIT](./LICENSE) © 2026 kontributor pondok-ai
