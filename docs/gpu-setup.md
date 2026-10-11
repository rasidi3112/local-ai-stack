# pondok-ai — GPU Acceleration Setup Guide

Accelerating local LLM inference with a GPU drastically reduces latency and boosts token generation throughput. `pondok-ai` auto-detects your host GPU during initialization and configures Docker Compose accordingly.

---

## 1. Apple Silicon (macOS M1 / M2 / M3 / M4)

### How it works
Apple Silicon uses unified memory shared across CPU and Metal GPU cores. Ollama natively leverages Metal acceleration when running on macOS.

### Docker on macOS
Docker Desktop on macOS runs containers inside a lightweight Linux hypervisor. Containerized Ollama cannot directly access Apple Metal GPU devices via Docker virtualization.

### Recommended Approaches for Mac Users:
1. **CPU Emulation in Docker**:
   - For models under 7B (such as `llama3.2:3b` or `phi3:mini`), modern Apple Silicon CPUs generate 15–25 tokens/second even without GPU passthrough in Docker.
2. **Native Host Ollama (Maximum Performance)**:
   - Run Ollama natively on macOS: `brew install ollama && ollama serve`
   - In `pondok-ai.json`, disable the Docker Ollama container (`"services": { "ollama": { "enabled": false } }`) and point Open WebUI & API Gateway to `http://host.docker.internal:11434`.

---

## 2. NVIDIA GPUs (Linux & Windows WSL2)

NVIDIA GPU acceleration within Docker requires the **NVIDIA Container Toolkit**.

### Prerequisites:
1. NVIDIA Drivers installed on host (`nvidia-smi` should output GPU stats).
2. [NVIDIA Container Toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html) installed and configured.

### Quick Setup for Ubuntu / Debian:
```bash
# 1. Configure the repository
curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey | sudo gpg --dearmor -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg \
  && curl -s -L https://nvidia.github.io/libnvidia-container/stable/deb/nvidia-container-toolkit.list | \
    sed 's#deb https://#deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://#g' | \
    sudo tee /etc/apt/sources.list.d/nvidia-container-toolkit.list

# 2. Install nvidia-container-toolkit
sudo apt-get update
sudo apt-get install -y nvidia-container-toolkit

# 3. Configure Docker runtime & restart daemon
sudo nvidia-ctk runtime configure --runtime=docker
sudo systemctl restart docker
```

### Verification:
```bash
docker run --rm --gpus all nvidia/cuda:12.0.0-base-ubuntu22.04 nvidia-smi
```

### Enabling in `pondok-ai`:
When NVIDIA GPU is detected during `pondok-ai init`, the CLI prompts:
```
? Enable GPU acceleration? Yes
```
This adds the `deploy.resources.reservations.devices` block to the Ollama compose definition:
```yaml
deploy:
  resources:
    reservations:
      devices:
        - driver: nvidia
          count: all
          capabilities: [gpu]
```

---

## 3. Diagnosing GPU Issues

Run the diagnostic doctor tool to inspect your environment:
```bash
pondok-ai doctor
```
If GPU acceleration fails or is unavailable, `pondok-ai` gracefully falls back to CPU inference without crashing.
