# pondok-ai — API Gateway Reference

The API Gateway runs at `http://localhost:8000` (by default) and provides an OpenAI-compatible REST API interface. Any software that supports custom `OPENAI_BASE_URL` (such as LangChain, LlamaIndex, LiteLLM, Continue.dev, or the official OpenAI SDKs) can interact seamlessly with your pondok-ai stack.

---

## Base URL
```
http://localhost:8000
```

---

## Authentication
All `/v1/*` endpoints require the `API_SECRET_KEY` generated during `pondok-ai init`:
```http
Authorization: Bearer <your-secret-key>
```

Set an application-specific environment variable such as `PONDOK_AI_API_KEY` to that value instead of hard-coding it. `/health` remains unauthenticated for Docker health checks.

The gateway accepts `Host` headers for `localhost`, `127.0.0.1`, and the internal Docker service name `api` only. Browser access is disabled by default; set `CORS_ORIGINS` to a comma-separated allowlist of complete origins when it is needed.

Authenticated `/v1/*` requests are rate-limited per source IP. The default is `120` requests per `60000` milliseconds; adjust `RATE_LIMIT_MAX_REQUESTS` and `RATE_LIMIT_WINDOW_MS` in `.env` if needed. `/health` and CORS preflight requests are not counted.

---

## Endpoints

### 1. Chat Completions (OpenAI Compatible)
**`POST /v1/chat/completions`**

Supports both standard and server-sent events (SSE) streaming responses.

#### Request Body
```json
{
  "model": "llama3.2:3b",
  "messages": [
    { "role": "system", "content": "You are a helpful coding assistant." },
    { "role": "user", "content": "Write a TypeScript function to reverse a string." }
  ],
  "temperature": 0.7,
  "max_tokens": 512,
  "stream": false
}
```

#### Response (Non-Streaming)
```json
{
  "id": "chatcmpl-1728445100000",
  "object": "chat.completion",
  "created": 1728445100,
  "model": "llama3.2:3b",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "function reverseString(str: string): string {\n  return str.split('').reverse().join('');\n}"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 28,
    "completion_tokens": 22,
    "total_tokens": 50
  }
}
```

#### Streaming Request
Set `"stream": true`. The response streams standard OpenAI `data: {...}\n\n` chunks ending with `data: [DONE]\n\n`.

---

### 2. Embeddings (OpenAI Compatible)
**`POST /v1/embeddings`**

Generate dense vector embeddings using local embedding models (e.g., `nomic-embed-text` or `all-minilm`).

#### Request Body
```json
{
  "model": "nomic-embed-text",
  "input": "Local AI is fast and private."
}
```

#### Response
```json
{
  "object": "list",
  "data": [
    {
      "object": "embedding",
      "index": 0,
      "embedding": [0.0124, -0.0532, 0.0891, "..."]
    }
  ],
  "model": "nomic-embed-text",
  "usage": {
    "prompt_tokens": 0,
    "total_tokens": 0
  }
}
```

---

### 3. List Models
**`GET /v1/models`**

Lists all models currently pulled and available in Ollama.

#### Response
```json
{
  "object": "list",
  "data": [
    {
      "id": "llama3.2:3b",
      "object": "model",
      "created": 1728440000,
      "owned_by": "local"
    }
  ]
}
```

---

### 4. Health Check
**`GET /health`**

Performs active downstream readiness probes against Ollama and Qdrant.

#### Response
```json
{
  "status": "healthy",
  "timestamp": "2026-10-09T04:00:00.000Z",
  "checks": {
    "api": { "status": "healthy" },
    "ollama": { "status": "healthy" },
    "qdrant": { "status": "healthy" }
  }
}
```

---

### 5. Runtime Status & Metrics
**`GET /status`**

Returns gateway memory consumption, uptime, and configuration endpoints.
