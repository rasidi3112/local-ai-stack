# pondok-ai — Troubleshooting Guide

Common issues and resolutions when running `pondok-ai`.

---

## 1. Environment Diagnostic (`doctor`)

Before manual troubleshooting, always run the built-in diagnostic tool:

```bash
pondok-ai doctor
```

This verifies:
- Docker daemon status and version
- Docker Compose v2 availability
- Total and available RAM (warns if < 8GB)
- Disk space availability (warns if < 10GB)
- Hardware acceleration (Metal / CUDA)
- Port availability (checks for conflicts on 3000, 8000, 11434, etc.)

---

## 2. Common Scenarios

### Docker daemon is not running
**Error**: `Cannot connect to the Docker daemon at unix:///var/run/docker.sock`
**Solution**:
- **macOS / Windows**: Start Docker Desktop from Applications.
- **Linux**: Start the service via `sudo systemctl start docker`.

---

### Port Conflict (e.g. Port 3000 or 11434 already in use)
**Error**: `Bind for 127.0.0.1:11434 failed: port is already allocated`
**Solution**:
1. Check what is using the port:
   ```bash
   lsof -i :11434  # macOS / Linux
   netstat -ano | findstr 11434  # Windows
   ```
2. If another native Ollama instance is running, you can stop it:
   ```bash
   killall ollama  # or brew services stop ollama
   ```
3. Or edit the port mapping in `pondok-ai.json`:
   ```json
   "services": {
     "ollama": {
       "port": 11435
     }
   }
   ```
   Then run `pondok-ai up`.

---

### Out of Memory (OOM) / Model Pull Fails
**Symptom**: Model download aborts or container restarts during inference.
**Solution**:
- Ensure you have selected a model that fits your hardware. Recommended model tiers:
  - **4GB–8GB RAM**: `llama3.2:1b`, `tinyllama`, `phi3:mini`
  - **8GB–16GB RAM**: `llama3.2:3b`, `mistral:7b`
  - **16GB–32GB RAM**: `llama3.1:8b`, `codellama:7b`
  - **32GB+ RAM**: `llama3.1:70b` (quantized)

---

### Checking Container Logs
To inspect live logs from any service:
```bash
# View logs from all services
pondok-ai logs

# View logs from a specific service (e.g., ollama, openwebui, api)
pondok-ai logs ollama

# Follow logs in real time
pondok-ai logs -f api
```

---

### Clean Reset
If your Docker state or containers become corrupted:
```bash
# Remove containers and networks (preserves data volumes)
pondok-ai down

# Complete reset with prompt to remove data volumes
pondok-ai reset
```
