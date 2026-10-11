# pondok-ai — Configuration Guide

`pondok-ai` manages configuration using a project-local `pondok-ai.json` file alongside a companion `.env` file for sensitive keys.

---

## Configuration File (`pondok-ai.json`)

When you run `pondok-ai init` (or non-interactively via `pondok-ai init --preset <preset> --yes`), this file is generated in your project root:

```json
{
  "version": 1,
  "projectName": "pondok-ai",
  "preset": "standard",
  "network": {
    "bindAddress": "127.0.0.1",
    "gatewayPort": 8000
  },
  "gpu": {
    "enabled": false,
    "type": "none"
  },
  "services": {
    "ollama": {
      "enabled": true,
      "port": 11434,
      "defaultModel": "llama3.2:3b"
    },
    "openwebui": {
      "enabled": true,
      "port": 3000
    },
    "postgres": {
      "enabled": true,
      "port": 5432,
      "database": "localaistack",
      "username": "localaistack"
    },
    "qdrant": {
      "enabled": true,
      "port": 6333
    },
    "api": {
      "enabled": true,
      "port": 8000
    },
    "n8n": {
      "enabled": false,
      "port": 5678
    }
  }
}
```

---

## Configuration Schema

### Top-Level Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `version` | number | Yes | Schema version (currently `1`). |
| `projectName` | string | Yes | Prefix used for Docker containers, networks, and volumes. |
| `preset` | string | Yes | Preset chosen: `minimal`, `standard`, or `full`. |
| `network` | object | Yes | Network configuration (host binding and ports). |
| `gpu` | object | Yes | Hardware acceleration configuration. |
| `services` | object | Yes | Per-service configuration map. |

### Network Options

```json
"network": {
  "bindAddress": "127.0.0.1",
  "gatewayPort": 8000
}
```

- **`bindAddress`**: Default is `127.0.0.1` (strict localhost security). Change to `0.0.0.0` only if you intend to expose services to a local LAN.
- **`gatewayPort`**: Port assigned to the API Gateway.

### GPU Options

```json
"gpu": {
  "enabled": true,
  "type": "cuda"
}
```

- **`enabled`**: Whether hardware acceleration is enabled for Ollama.
- **`type`**: `"metal"` (Apple Silicon M-series), `"cuda"` (NVIDIA GPUs on Linux/WSL2), or `"none"`.

---

## Environment Variables (`.env`)

Secrets and dynamically generated credentials are stored in `.env` (which is automatically added to `.gitignore`):

| Variable | Description |
|---|---|
| `POSTGRES_PASSWORD` | Cryptographically random password for the PostgreSQL instance. |
| `API_SECRET_KEY` | Bearer token secret for the API Gateway. |
| `CORS_ORIGINS` | Optional comma-separated allowlist of browser origins for the API Gateway. Empty by default. |
| `RATE_LIMIT_MAX_REQUESTS` | Maximum authenticated `/v1/*` requests per source IP in each fixed window. Defaults to `120`. |
| `RATE_LIMIT_WINDOW_MS` | API Gateway rate-limit window duration in milliseconds. Defaults to `60000` (one minute). |
| `N8N_ENCRYPTION_KEY` | 32-character encryption key for n8n credentials storage. |

---

## CLI Configuration Management

You can inspect and update your configuration anytime using the CLI:

```bash
# View active configuration
pondok-ai config

# Toggle services or change settings interactively
pondok-ai config --edit

# Diagnose configuration issues
pondok-ai doctor
```

### Pinned image upgrades

Service images are pinned to explicit versions. `pondok-ai update` only re-pulls the image versions in the current configuration. After installing a newer CLI release, use `pondok-ai update --upgrade-images` to migrate the previous CLI defaults to its new pins. Custom image values are not changed.
