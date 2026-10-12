# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Security
- Updated fastify to 5.12.5 to address published advisories (request validation and authentication bypass issues, and denial of service).

## [0.3.0] - 2026-10-12

- BREAKING: renamed from local-ai-stack to pondok-ai (npm package, CLI command, config directory .pondok-ai, container names pondok-ai-*). Existing 0.2.x stacks are not migrated automatically. The old package name is deprecated.

## [0.2.4] - 2026-10-11

### Fixed
- Replaced missing `curl` in Ollama container health check with `ollama list` (`["CMD", "ollama", "list"]`) to prevent services from failing startup due to unhealthy status.
- Replaced missing `curl` in Qdrant container health check with bash TCP socket probe (`["CMD", "bash", "-c", ":> /dev/tcp/127.0.0.1/6333"]`). Note that this health check only verifies that the TCP port is open and listening.
- Replaced missing `curl` in API Gateway container health check with Node.js built-in fetch probe (`["CMD", "node", "-e", "fetch('http://127.0.0.1:8000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]`) compatible with the Alpine base image.

## [0.2.3] - 2026-10-11

- Version bump only; published without the healthcheck fixes, so `up` fails in this version.

## [0.2.2] - 2026-10-11

- Version bump only; published without the healthcheck fixes, so `up` fails in this version.

## [0.2.1] - 2026-10-11

- Version bump only; published without the healthcheck fixes, so `up` fails in this version.

## [0.2.0] - 2026-10-11

### Added
- Configurable in-memory, per-source-IP rate limiting for authenticated API Gateway `/v1/*` requests.

### Changed
- Pinned service and gateway build images to explicit versions. `update` now refreshes configured pins; `update --upgrade-images` migrates legacy default tags without overwriting custom image values.

### Fixed
- Corrected backup and restore documentation: backups are integrity-checked with SHA-256, are not encrypted, and do not provide cryptographic authenticity guarantees.

---

## [0.1.0] - 2026-10-09

### Added
- **Interactive & Non-Interactive CLI**:
  - `init` command with interactive wizard, hardware auto-detection, and preset flags (`--preset`, `--yes`).
  - `up`, `down`, `start`, `stop`, `restart` lifecycle orchestration with pre-flight compose syntax validation and active service readiness polling.
  - `backup` command creating encrypted/hashed backups of configs and Docker persistent volumes with a cryptographic SHA-256 `manifest.json`.
  - `restore` command restoring stack state and volumes with pre-restore SHA-256 integrity verification (`--verify-only`).
  - `update` command performing safe image upgrades with automated pre-update backups and health verification.
  - `status` command showing container health and active URL table.
  - `logs` command supporting service filtering and follow mode (`-f`).
  - `doctor` command diagnosing Docker, RAM, GPU/VRAM, ports, and model recommendations.
  - `reset` command with data-safety guarantees (preserves persistent volumes by default unless `--delete-data` is explicitly passed).
  - `config` command to inspect and modify stack options.
  - `model` command suite (`list`, `recommend`, `install`, `remove`, `status`) with hardware-aware fit evaluations (Compatible, Tight, Incompatible) and safety guards.
- **Cross-Platform One-Command Installers**:
  - `scripts/install.sh`: Automated prerequisite detection (Docker, Node, Curl) and installation for macOS and Linux.
  - `scripts/install.ps1`: Automated PowerShell installer and prerequisite validator for Windows.
- **Smart Hardware Detection & Model Recommendations**:
  - Auto-detection of Apple Silicon Metal unified memory limits, NVIDIA CUDA VRAM via `nvidia-smi`, AMD ROCm, and CPU/RAM/Disk metrics.
  - Tailored Ollama model recommendations based on actual host capacity.
- **Privacy & Security Hardening**:
  - Default `127.0.0.1` binding on all service ports to prevent accidental LAN exposure.
  - File permission enforcement (`0600`) on generated `.env` credential files on Unix platforms.
  - Guarded data deletion requiring interactive confirmation and explicit flags.
- **Service Presets**:
  - `minimal`: Ollama + Open WebUI.
  - `standard`: Ollama + Open WebUI + PostgreSQL + Qdrant + API Gateway.
  - `full`: Standard + n8n automation engine.
- **OpenAI-Compatible API Gateway**:
  - `POST /v1/chat/completions` with streaming SSE and tool parameters.
  - `POST /v1/embeddings` for vector embeddings.
  - `GET /v1/models` and `GET /models` listing available local models.
  - `GET /health` and `GET /status` active probes.
- **Comprehensive Documentation & Examples**:
  - Complete architectural blueprint, configuration manual, GPU acceleration manual, and troubleshooting guide.
  - RAG vector ingestion and query code examples.
  - OpenAI SDK drop-in replacement example.
