# pondok-ai

[English](README.md) · [Bahasa Indonesia](README_id.md) · [한국어](README_ko.md) · [العربية](README_ar.md) · [Español](README_es.md) · [中文](README_zh.md) · [Français](README_fr.md) · [日本語](README_ja.md) · [Deutsch](README_de.md) · [Português](README_pt.md) · [Русский](README_ru.md) · [हिन्दी](README_hi.md) · [Türkçe](README_tr.md) · [Italiano](README_it.md) · **Tiếng Việt**

<p align="center">
  <strong>Chạy stack AI riêng tư của riêng bạn trên máy local chỉ với một lệnh.</strong>
</p>

<p align="center">
  <a href="#khởi-động-nhanh">Khởi Động Nhanh</a> •
  <a href="#tính-năng">Tính Năng</a> •
  <a href="#cấu-hình-sẵn">Cấu Hình Sẵn</a> •
  <a href="#lệnh-cli">Lệnh CLI</a> •
  <a href="#api-gateway">API Gateway</a> •
  <a href="#ví-dụ">Ví Dụ</a> •
  <a href="#tài-liệu">Tài Liệu</a>
</p>

---

## Tổng Quan

`pondok-ai` là một bộ công cụ CLI và điều phối container thân thiện với nhà phát triển, không ma sát, khởi động một môi trường AI hoàn chỉnh và riêng tư trực tiếp trên máy trạm local của bạn.

Được hỗ trợ bởi **Docker Compose v2**, `pondok-ai` cung cấp cho bạn các LLM local, giao diện chat, tìm kiếm vector, lưu trữ cơ sở dữ liệu và API gateway tương thích OpenAI trong vài giây. Các prompt, chat và embedding được xử lý trên máy của bạn; việc kéo image container và trọng số model yêu cầu kết nối internet.

```bash
npx pondok-ai init
npx pondok-ai up
```

---

## Tính Năng

-  **Xử Lý Local**: Prompt, chat, embedding và suy luận chạy trên phần cứng của bạn. Việc kéo image container và tải model ban đầu yêu cầu truy cập internet.
- ⚡ **Không Ma Sát Thiết Lập**: Tự động phát hiện hệ điều hành, kiến trúc, RAM và GPU (Apple Metal / NVIDIA CUDA).
-  **Cấu Hình Sẵn Mô-đun**: Mở rộng từ giao diện chat nhẹ (`minimal`) đến stack RAG doanh nghiệp (`standard`) hoặc pipeline tự động hóa tự trị (`full`).
-  **Gateway Tương Thích OpenAI**: Chỉ các SDK OpenAI chuẩn hoặc LangChain trực tiếp tới `http://localhost:8000/v1` mà không cần viết lại mã.
-  **Trình Quản Lý Model Tích Hợp**: Kéo, liệt kê, kiểm tra và xóa các model với cảnh báo an toàn RAM/đĩa tích hợp.
-  **Chẩn Đoán Tự Sửa Chữa**: Lệnh `doctor` tích hợp chẩn đoán xung đột cổng, trạng thái daemon Docker và giới hạn tài nguyên trước khi bạn gặp sự cố.

---

## Kiến Trúc

```
┌───────────────────────────────────────────────────────────────┐
│                  Máy Chủ (CLI)                                │
│                                                               │
│   Cổng 3000             Cổng 8000           Cổng 5678         │
│       │                     │                   │             │
└───────┼─────────────────────┼───────────────────┼─────────────┘
        ▼                     ▼                   ▼
  ┌───────────┐         ┌───────────┐       ┌───────────┐
  │ Open      │         │ API       │       │ n8n       │
  │ WebUI     │         │ Gateway   │       │ (Full)    │
  └─────┬─────┘         └─────┬─────┘       └─────┬─────┘
        │                     │                   │
        ├─────────────────────┼───────────────────┤
        ▼                     ▼                   ▼
  ┌───────────┐         ┌───────────┐       ┌───────────┐
  │ Ollama    │         │ Qdrant    │       │ Postgres  │
  │ (LLMs)    │         │ (Vector)  │       │ (Trạng    │
  │           │         │           │       │  thái)    │
  └───────────┘         └───────────┘       └───────────┘
```

---

## Cấu Hình Sẵn

| Cấu Hình Sẵn | Dịch Vụ Bao Gồm | RAM Tối Thiểu | Khuyến Nghị Cho |
|---|---|---|---|
| **`minimal`** | Ollama, Open WebUI | 8 GB | Chat local nhanh, thử nghiệm nhẹ |
| **`standard`** *(mặc định)* | Ollama, Open WebUI, PostgreSQL, Qdrant, API Gateway | 16 GB | Pipeline RAG, phát triển ứng dụng, thay thế OpenAI |
| **`full`** | Standard + công cụ tự động hóa n8n | 16+ GB | Agent AI tự trị, tự động hóa quy trình làm việc trực quan |

---

## Khởi Động Nhanh

### Cài Đặt Tự Động Một Lệnh

#### macOS và Linux
```bash
curl -fsSL https://raw.githubusercontent.com/rasidi3112/pondok-ai/main/scripts/install.sh | bash
```

#### Windows (PowerShell)
```powershell
iwr -useb https://raw.githubusercontent.com/rasidi3112/pondok-ai/main/scripts/install.ps1 | iex
```

### Khởi Động Nhanh Thủ Công qua npx

Điều kiện tiên quyết: Node.js 22 trở lên, Docker và Docker Compose v2.

#### 1. Khởi tạo stack
```bash
# Trình hướng dẫn thiết lập tương tác với phát hiện phần cứng tự động
npx pondok-ai init

# Hoặc không tương tác với cấu hình sẵn đã chọn
npx pondok-ai init --preset standard --yes
```

#### 2. Khởi động dịch vụ với kiểm tra sức khỏe tự động
```bash
npx pondok-ai up
```

Sau khi chạy, truy cập stack của bạn:
- **Open WebUI**: [http://localhost:3000](http://localhost:3000)
- **API Gateway**: [http://localhost:8000](http://localhost:8000)
- **Ollama**: [http://localhost:11434](http://localhost:11434)
- **Qdrant**: [http://localhost:6333/dashboard](http://localhost:6333/dashboard) *(khi được ánh xạ)*

#### 3. Phát Hiện Phần Cứng Thông Minh và Đề Xuất Model
```bash
# Nhận đề xuất nhận biết phần cứng thông minh dựa trên RAM/VRAM của bạn
npx pondok-ai model recommend

# Cài đặt model với kiểm tra an toàn bộ nhớ và đĩa trước khi bay
npx pondok-ai model install llama3.2:3b
```

---

## Lệnh CLI

| Lệnh | Mô Tả |
|---|---|
| `pondok-ai init` | Chạy trình hướng dẫn cấu hình tương tác với phát hiện phần cứng |
| `pondok-ai up` | Xác thực cấu hình Compose, khởi động container và chờ kiểm tra sức khỏe |
| `pondok-ai down` | Dừng và xóa các container của stack |
| `pondok-ai start` | Khởi động các container đã dừng hiện có |
| `pondok-ai stop` | Dừng các container đang chạy |
| `pondok-ai restart` | Khởi động lại các container của stack |
| `pondok-ai status` | Hiển thị tình trạng sức khỏe container và URL |
| `pondok-ai logs [dịch-vụ]` | Xem logs (dùng `-f` để stream) |
| `pondok-ai doctor` | Chẩn đoán Docker, RAM, GPU/VRAM, cổng và đề xuất model |
| `pondok-ai update` | Kéo lại các image đã ghim được cấu hình với sao lưu tự động và kiểm tra sức khỏe |
| `pondok-ai backup` | Sao lưu cấu hình và volume dữ liệu với kiểm tra toàn vẹn SHA-256 (không mã hóa) |
| `pondok-ai restore <đường-dẫn>` | Khôi phục từ bản sao lưu được kiểm tra toàn vẹn SHA-256 (không mã hóa) |
| `pondok-ai reset` | Đặt lại stack (bảo toàn volume trừ khi chỉ định `--delete-data`) |
| `pondok-ai config` | Kiểm tra hoặc chỉnh sửa cấu hình đang hoạt động |
| `pondok-ai model list` | Liệt kê các model đã tải xuống |
| `pondok-ai model recommend` | Đề xuất model phù hợp với phần cứng (RAM, VRAM, Đĩa) |
| `pondok-ai model install <tên>` | Kéo model mới với kiểm tra an toàn tài nguyên trước khi bay |
| `pondok-ai model remove <tên>` | Xóa model đã cài đặt |
| `pondok-ai model status` | Kiểm tra dấu vết tài nguyên của model |

Các image được ghim vào các phiên bản rõ ràng. `pondok-ai update` làm mới các phiên bản đã cấu hình; nó không chọn các bản phát hành mới hơn. Sau khi cài đặt CLI mới hơn, chạy `pondok-ai update --upgrade-images` để chỉ di chuyển các thẻ image mặc định cũ của CLI. Các giá trị image tùy chỉnh được bảo toàn.

---

## API Gateway

API Gateway cung cấp các endpoint REST tương thích OpenAI sẵn sàng sử dụng:

Đặt `PONDOK_AI_API_KEY` thành `API_SECRET_KEY` đã tạo trước khi gọi endpoint `/v1/*`.

Gateway giới hạn các yêu cầu `/v1/*` đã xác thực theo IP nguồn ở mức 120 yêu cầu mỗi phút theo mặc định. Cấu hình `RATE_LIMIT_MAX_REQUESTS` và `RATE_LIMIT_WINDOW_MS` trong `.env` nếu client local của bạn cần giới hạn khác.

```bash
curl http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $PONDOK_AI_API_KEY" \
  -d '{
    "model": "llama3.2:3b",
    "messages": [
      { "role": "user", "content": "Xin chào từ stack AI local riêng tư của tôi!" }
    ]
  }'
```

### Sử Dụng với SDK Node.js Chính Thức của OpenAI
```typescript
import OpenAI from 'openai';

const apiKey = process.env.PONDOK_AI_API_KEY;
if (!apiKey) {
  throw new Error('Đặt PONDOK_AI_API_KEY thành API_SECRET_KEY đã tạo của bạn.');
}

const openai = new OpenAI({
  baseURL: 'http://localhost:8000/v1',
  apiKey,
});

const completion = await openai.chat.completions.create({
  model: 'llama3.2:3b',
  messages: [{ role: 'user', content: 'Giải thích điện toán lượng tử trong một câu.' }],
});

console.log(completion.choices[0].message.content);
```

---

## Ví Dụ

- [`examples/openai-compat/`](./examples/openai-compat): Script tích hợp SDK OpenAI sẵn sàng sử dụng.
- [`examples/rag-example/`](./examples/rag-example): Pipeline RAG đầu cuối đến cuối sử dụng cơ sở dữ liệu vector Qdrant và embedding Ollama.

---

## Tài Liệu

- [Tổng Quan Kiến Trúc](./docs/architecture.md)
- [Tham Khảo API Gateway](./docs/api-reference.md)
- [Hướng Dẫn Cấu Hình](./docs/configuration.md)
- [Thiết Lập Tăng Tốc GPU (Metal / CUDA)](./docs/gpu-setup.md)
- [Khắc Phục Sự Cố và Chẩn Đoán](./docs/troubleshooting.md)

---

## Đóng Góp

Chào đón các đóng góp! Xem [CONTRIBUTING.md](./CONTRIBUTING.md) để bắt đầu.

## Giấy Phép

[MIT](./LICENSE) © 2026 những người đóng góp cho pondok-ai
