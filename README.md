# local-ai-stack

**English** · [Bahasa Indonesia](README_id.md) · [한국어](README_ko.md) · [العربية](README_ar.md) · [Español](README_es.md) · [中文](README_zh.md) · [Français](README_fr.md) · [日本語](README_ja.md) · [Deutsch](README_de.md) · [Português](README_pt.md) · [Русский](README_ru.md) · [हिन्दी](README_hi.md) · [Türkçe](README_tr.md) · [Italiano](README_it.md) · [Tiếng Việt](README_vi.md)

Translations are machine-generated and may lag behind the English README.

<p align="center">
  <strong>Run your own private AI stack locally with one command.</strong>
</p>

<p align="center">
  <a href="#quickstart">Quickstart</a> •
  <a href="#features">Features</a> •
  <a href="#presets">Presets</a> •
  <a href="#cli-commands">CLI Commands</a> •
  <a href="#api-gateway">API Gateway</a> •
  <a href="#examples">Examples</a> •
  <a href="#docs">Documentation</a>
</p>

---

## Overview

`local-ai-stack` is a developer-friendly, zero-friction CLI and container orchestration toolkit that boots a complete, private AI environment directly on your local workstation.

Powered by **Docker Compose v2**, `local-ai-stack` gives you local LLMs, chat UI, vector search, database persistence, and an OpenAI-compatible API gateway in seconds. Prompts, chats, and embeddings are processed on your machine; pulling container images and model weights requires an internet connection.

```bash
npx local-ai-stack init
npx local-ai-stack up
```

---

## Features

-  **Local Processing**: Prompts, chats, embeddings, and inference run on your hardware. Initial container image pulls and model downloads require internet access.
- ⚡ **Zero Setup Friction**: Automatically detects OS, architecture, RAM, and GPU (Apple Metal / NVIDIA CUDA).
-  **Modular Presets**: Scale from a lightweight chat interface (`minimal`) to a RAG stack (`standard`) or an autonomous automation pipeline (`full`).
-  **OpenAI-Compatible Gateway**: Point standard OpenAI SDKs or LangChain directly to `http://localhost:8000/v1` with zero code rewrites.
-  **Built-in Model Manager**: Pull, list, inspect, and remove models with built-in RAM/disk safety warnings.
-  **Built-in Diagnostics**: Built-in `doctor` command diagnoses port collisions, Docker daemon status, and resource limits before you run into issues.

---

## Architecture

```
┌───────────────────────────────────────────────────────────────┐
│                      Host Machine (CLI)                       │
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
  │ (LLMs)    │             │ (Vector)  │       │ (State)   │
  └───────────┘             └───────────┘       └───────────┘
```

---

## Presets

| Preset | Services Included | Min RAM | Recommended For |
|---|---|---|---|
| **`minimal`** | Ollama, Open WebUI | 8 GB | Quick local chat, lightweight experimentation |
| **`standard`** *(default)* | Ollama, Open WebUI, PostgreSQL, Qdrant, API Gateway | 16 GB | RAG pipelines, app development, OpenAI replacement |
| **`full`** | Standard + n8n automation engine | 16+ GB | Autonomous AI agents, visual workflow automation |

---

## Quickstart

### Quickstart via npx

Prerequisites: Node.js 22 or later, Docker, and Docker Compose v2.

#### 1. Initialize the stack
```bash
# Interactive setup wizard with hardware auto-detection
npx local-ai-stack init

# Or non-interactive with a chosen preset
npx local-ai-stack init --preset standard --yes
```

#### 2. Start services with automated health checks
```bash
npx local-ai-stack up
```

Once running, access your stack:
- **Open WebUI**: [http://localhost:3000](http://localhost:3000)
- **API Gateway**: [http://localhost:8000](http://localhost:8000)
- **Ollama**: [http://localhost:11434](http://localhost:11434)
- **Qdrant**: [http://localhost:6333/dashboard](http://localhost:6333/dashboard) *(when mapped)*

#### 3. Smart Hardware Detection & Model Recommendations
```bash
# Get smart hardware-aware recommendations based on your RAM/VRAM
npx local-ai-stack model recommend

# Install model with pre-flight memory and disk safety check
npx local-ai-stack model install llama3.2:3b
```

### Installer scripts (experimental, not covered by CI)

#### macOS & Linux
```bash
curl -fsSL https://raw.githubusercontent.com/rasidi3112/local-ai-stack/main/scripts/install.sh | bash
```

#### Windows (PowerShell)
```powershell
iwr -useb https://raw.githubusercontent.com/rasidi3112/local-ai-stack/main/scripts/install.ps1 | iex
```

---

## CLI Commands

| Command | Description |
|---|---|
| `local-ai-stack init` | Run interactive configuration wizard with hardware detection |
| `local-ai-stack up` | Validate Compose config, boot containers, and wait for health checks |
| `local-ai-stack down` | Stop and remove stack containers |
| `local-ai-stack start` | Start existing stopped containers |
| `local-ai-stack stop` | Stop running containers |
| `local-ai-stack restart` | Restart stack containers |
| `local-ai-stack status` | Show container health and URLs |
| `local-ai-stack logs [service]` | View logs (`-f` to stream) |
| `local-ai-stack doctor` | Diagnose Docker, RAM, GPU/VRAM, ports, and model recommendations |
| `local-ai-stack update` | Re-pull configured pinned images with automated backup and health checks |
| `local-ai-stack backup` | Backup configs and data volumes with SHA-256 integrity checks (not encrypted) |
| `local-ai-stack restore <path>` | Restore from a SHA-256 integrity-checked backup (not encrypted) |
| `local-ai-stack reset` | Reset stack (preserves volumes unless `--delete-data` is specified) |
| `local-ai-stack config` | Inspect or edit active configuration |
| `local-ai-stack model list` | List downloaded models |
| `local-ai-stack model recommend` | Hardware-tailored model recommendations (RAM, VRAM, Disk) |
| `local-ai-stack model install <name>` | Pull a new model with pre-flight resource safety checks |
| `local-ai-stack model remove <name>` | Delete an installed model |
| `local-ai-stack model status` | Inspect model resource footprints |

Images are pinned to explicit versions. `local-ai-stack update` refreshes the configured versions; it does not select newer releases. After installing a newer CLI, run `local-ai-stack update --upgrade-images` to migrate only the CLI's legacy default image tags. Custom image values are preserved.

---

## API Gateway

The API Gateway provides drop-in OpenAI REST endpoints:

Set `LOCAL_AI_API_KEY` to the generated `API_SECRET_KEY` before calling a `/v1/*` endpoint.

The gateway limits authenticated `/v1/*` requests per client (source IP and API key) to 120 requests per minute by default. Configure `RATE_LIMIT_MAX_REQUESTS` and `RATE_LIMIT_WINDOW_MS` in `.env` if your local client needs different limits.

```bash
curl http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LOCAL_AI_API_KEY" \
  -d '{
    "model": "llama3.2:3b",
    "messages": [
      { "role": "user", "content": "Hello from my private local AI stack!" }
    ]
  }'
```

### Using with the Official OpenAI Node.js SDK
```typescript
import OpenAI from 'openai';

const apiKey = process.env.LOCAL_AI_API_KEY;
if (!apiKey) {
  throw new Error('Set LOCAL_AI_API_KEY to your generated API_SECRET_KEY.');
}

const openai = new OpenAI({
  baseURL: 'http://localhost:8000/v1',
  apiKey,
});

const completion = await openai.chat.completions.create({
  model: 'llama3.2:3b',
  messages: [{ role: 'user', content: 'Explain quantum computing in one sentence.' }],
});

console.log(completion.choices[0].message.content);
```

---

## Examples

- [`examples/openai-compat/`](./examples/openai-compat): Drop-in OpenAI SDK integration script.
- [`examples/rag-example/`](./examples/rag-example): End-to-end RAG pipeline using Qdrant vector database and Ollama embeddings.

---

## Tested in CI

Every pull request runs an end-to-end test on GitHub Actions (amd64 and arm64): init, up, pull a very small model (smollm:135m, about 90 MB), list it via /v1/models, a non-streaming /v1/chat/completions request, rate limiting (401 and 429), and a check that Open WebUI's start page responds. Not covered yet: streaming responses, embeddings, GPU acceleration, and macOS/Windows hosts.

---

## Documentation

- [Architecture Overview](./docs/architecture.md)
- [API Gateway Reference](./docs/api-reference.md)
- [Configuration Guide](./docs/configuration.md)
- [GPU Acceleration Setup (Metal / CUDA)](./docs/gpu-setup.md)
- [Troubleshooting & Diagnostics](./docs/troubleshooting.md)

---

## Contributing

Contributions are welcomed! Check out [CONTRIBUTING.md](./CONTRIBUTING.md) to get started.

## License

[MIT](./LICENSE) © 2026 local-ai-stack contributors
