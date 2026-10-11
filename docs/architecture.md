# pondok-ai — Architecture Overview

`pondok-ai` is a developer-friendly, zero-friction tool for running an enterprise-grade private AI stack locally using Docker and Docker Compose v2.

---

## High-Level Topology

```
┌───────────────────────────────────────────────────────────────┐
│                       Host Environment                        │
│                                                               │
│   CLI: npx pondok-ai [up | down | status | doctor | ...] │
│                                                               │
│   Port 3000                 Port 8000           Port 5678    │
│       │                         │                   │         │
└───────┼─────────────────────────┼───────────────────┼─────────┘
        │                         │                   │
┌───────┼─────────────────────────┼───────────────────┼─────────┐
│       ▼                         ▼                   ▼         │
│  ┌──────────┐              ┌──────────┐       ┌──────────┐    │
│  │ Open     │              │ API      │       │ n8n      │    │
│  │ WebUI    │              │ Gateway  │       │ (Full)   │    │
│  └────┬─────┘              └────┬─────┘       └────┬─────┘    │
│       │                         │                  │          │
│       │   Docker Bridge Network (pondok-ai-network) │          │
│       ├─────────────────────────┼──────────────────┤          │
│       ▼                         ▼                  ▼          │
│  ┌──────────┐              ┌──────────┐       ┌──────────┐    │
│  │ Ollama   │              │ Qdrant   │       │ Postgres │    │
│  │ (LLMs)   │              │ (Vector) │       │ (State)  │    │
│  └──────────┘              └──────────┘       └──────────┘    │
│                                                               │
│                     Internal & Local Only                     │
└───────────────────────────────────────────────────────────────┘
```

---

## Core Components

### 1. CLI Engine (`src/`)
Built with TypeScript and Commander.js, compiled to ESM using `tsup`.
- **System Detection & Hardware Intelligence (`src/system/`)**: Detects OS (macOS, Linux, Windows), CPU architecture, system RAM, disk headroom, and GPU acceleration (Apple Silicon Metal unified memory limits, NVIDIA CUDA via `nvidia-smi`, AMD ROCm). Evaluates and recommends Ollama models with pre-flight safety warnings.
- **Configuration Manager (`src/config/`)**: Reads and manages `pondok-ai.json` and `.env` in the current workspace or home directory, enforcing strict Unix permissions (`chmod 0600`).
- **Docker Compose Generator & Validator (`src/docker/`)**: Generates deterministic, type-safe `docker-compose.yml` dynamically and validates Compose configuration syntax before boot.
- **Service Health Diagnostics (`src/docker/health.ts`)**: Proactively polls HTTP health endpoints with timeouts and progressive terminal spinners before marking stack ready.
- **Lifecycle & Backup Engine (`src/commands/backup.ts`, `src/commands/restore.ts`)**: Performs reproducible configuration and Docker volume archives that are integrity-checked with SHA-256 (not encrypted).
- **Model Management (`src/commands/model.ts`)**: Direct lifecycle management for Ollama models with pre-install hardware fit checks and recommendation intelligence.

### 2. Service Presets
`pondok-ai` supports 3 tiered presets:

1. **`minimal`**:
   - Designed for fast experimentation and personal chat.
   - Services: **Ollama** + **Open WebUI**.
   - Minimum RAM: 8GB (4GB free recommended).
2. **`standard`** (Default):
   - Designed for local AI app development, embeddings, and RAG pipelines.
   - Services: **Ollama** + **Open WebUI** + **PostgreSQL** + **Qdrant** + **API Gateway**.
   - Minimum RAM: 16GB (8GB free recommended).
3. **`full`**:
   - Complete autonomous AI agent and workflow stack.
   - Services: **Standard** + **n8n** (visual workflow automation).
   - Minimum RAM: 16GB+ (12GB free recommended).

---

## Security & Data Integrity Model

Security and user data safety are core architectural pillars:
- **Localhost Binding**: All exposed container ports bind exclusively to `127.0.0.1` by default to prevent unintended local network exposure.
- **Credential Protection**: The generated `.env` file containing secrets is restricted to `0600` permissions (`u=rw,go=`) on Unix systems.
- **Network Isolation**: Databases (PostgreSQL, Qdrant) communicate inside the private Docker network (`pondok-ai-network`) and do not expose ports to the host by default unless explicitly configured.
- **Data Preservation Guarantee**: Container reset operations (`reset` command) preserve persistent storage volumes by default. Deleting volumes requires both an explicit `--delete-data` flag and double user confirmation.
- **Backup Integrity Checks**: Backups verify file and volume tarballs against SHA-256 checksums before restore to detect partial copies or corruption. Backups are not encrypted, and the manifest does not provide cryptographic authenticity.
- **Local Processing**: Prompts, chats, and embeddings are processed on the user's machine. Pulling container images and model weights requires internet access.
