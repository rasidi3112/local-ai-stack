# pondok-ai

[English](README.md) · [Bahasa Indonesia](README_id.md) · [한국어](README_ko.md) · [العربية](README_ar.md) · [Español](README_es.md) · **中文** · [Français](README_fr.md) · [日本語](README_ja.md) · [Deutsch](README_de.md) · [Português](README_pt.md) · [Русский](README_ru.md) · [हिन्दी](README_hi.md) · [Türkçe](README_tr.md) · [Italiano](README_it.md) · [Tiếng Việt](README_vi.md)

<p align="center">
  <strong>使用一条命令在本地运行您自己的私有 AI 堆栈。</strong>
</p>

<p align="center">
  <a href="#快速开始">快速开始</a> •
  <a href="#特性">特性</a> •
  <a href="#预设配置">预设配置</a> •
  <a href="#cli-命令">CLI 命令</a> •
  <a href="#api-网关">API 网关</a> •
  <a href="#示例">示例</a> •
  <a href="#文档">文档</a>
</p>

---

## 概述

`pondok-ai` 是一个对开发者友好、零摩擦的 CLI 和容器编排工具包,可直接在您的本地工作站上启动完整的私有 AI 环境。

由 **Docker Compose v2** 提供支持,`pondok-ai` 为您提供本地 LLM、聊天 UI、向量搜索、数据库持久化和与 OpenAI 兼容的 API 网关,只需几秒钟。提示、聊天和嵌入在您的机器上处理;拉取容器镜像和模型权重需要互联网连接。

```bash
npx pondok-ai init
npx pondok-ai up
```

---

## 特性

-  **本地处理**:提示、聊天、嵌入和推理在您的硬件上运行。初始容器镜像拉取和模型下载需要互联网访问。
- ⚡ **零设置摩擦**:自动检测操作系统、架构、RAM 和 GPU(Apple Metal / NVIDIA CUDA)。
-  **模块化预设**:从轻量级聊天界面(`minimal`)扩展到企业级 RAG 堆栈(`standard`)或自主自动化管道(`full`)。
-  **OpenAI 兼容网关**:将标准 OpenAI SDK 或 LangChain 直接指向 `http://localhost:8000/v1`,无需重写代码。
-  **内置模型管理器**:拉取、列出、检查和删除模型,并提供内置的 RAM/磁盘安全警告。
-  **自我修复诊断**:内置 `doctor` 命令可在您遇到问题之前诊断端口冲突、Docker 守护程序状态和资源限制。

---

## 架构

```
┌───────────────────────────────────────────────────────────────┐
│                      主机 (CLI)                               │
│                                                               │
│   端口 3000             端口 8000           端口 5678          │
│       │                     │                   │             │
└───────┼─────────────────────┼───────────────────┼─────────────┘
        ▼                     ▼                   ▼
  ┌───────────┐         ┌───────────┐       ┌───────────┐
  │ Open      │         │ API       │       │ n8n       │
  │ WebUI     │         │ 网关      │       │ (完整版)   │
  └─────┬─────┘         └─────┬─────┘       └─────┬─────┘
        │                     │                   │
        ├─────────────────────┼───────────────────┤
        ▼                     ▼                   ▼
  ┌───────────┐         ┌───────────┐       ┌───────────┐
  │ Ollama    │         │ Qdrant    │       │ Postgres  │
  │ (LLMs)    │         │ (向量)    │       │ (状态)    │
  └───────────┘         └───────────┘       └───────────┘
```

---

## 预设配置

| 预设 | 包含的服务 | 最小 RAM | 推荐用于 |
|---|---|---|---|
| **`minimal`** | Ollama, Open WebUI | 8 GB | 快速本地聊天、轻量级实验 |
| **`standard`** *(默认)* | Ollama, Open WebUI, PostgreSQL, Qdrant, API 网关 | 16 GB | RAG 管道、应用开发、OpenAI 替代品 |
| **`full`** | Standard + n8n 自动化引擎 | 16+ GB | 自主 AI 代理、可视化工作流自动化 |

---

## 快速开始

### 自动化一键安装

#### macOS 和 Linux
```bash
curl -fsSL https://raw.githubusercontent.com/rasidi3112/pondok-ai/main/scripts/install.sh | bash
```

#### Windows (PowerShell)
```powershell
iwr -useb https://raw.githubusercontent.com/rasidi3112/pondok-ai/main/scripts/install.ps1 | iex
```

### 通过 npx 手动快速开始

前提条件:Node.js 22 或更高版本、Docker 和 Docker Compose v2。

#### 1. 初始化堆栈
```bash
# 带硬件自动检测的交互式设置向导
npx pondok-ai init

# 或使用选定的预设进行非交互式设置
npx pondok-ai init --preset standard --yes
```

#### 2. 启动服务并进行自动健康检查
```bash
npx pondok-ai up
```

运行后,访问您的堆栈:
- **Open WebUI**: [http://localhost:3000](http://localhost:3000)
- **API 网关**: [http://localhost:8000](http://localhost:8000)
- **Ollama**: [http://localhost:11434](http://localhost:11434)
- **Qdrant**: [http://localhost:6333/dashboard](http://localhost:6333/dashboard) *(映射时)*

#### 3. 智能硬件检测和模型推荐
```bash
# 根据您的 RAM/VRAM 获取智能硬件感知推荐
npx pondok-ai model recommend

# 安装模型并进行预检内存和磁盘安全检查
npx pondok-ai model install llama3.2:3b
```

---

## CLI 命令

| 命令 | 描述 |
|---|---|
| `pondok-ai init` | 运行带硬件检测的交互式配置向导 |
| `pondok-ai up` | 验证 Compose 配置、启动容器并等待健康检查 |
| `pondok-ai down` | 停止并删除堆栈容器 |
| `pondok-ai start` | 启动现有已停止的容器 |
| `pondok-ai stop` | 停止正在运行的容器 |
| `pondok-ai restart` | 重启堆栈容器 |
| `pondok-ai status` | 显示容器健康状况和 URL |
| `pondok-ai logs [服务]` | 查看日志(使用 `-f` 进行流式传输) |
| `pondok-ai doctor` | 诊断 Docker、RAM、GPU/VRAM、端口和模型推荐 |
| `pondok-ai update` | 重新拉取配置的固定镜像并进行自动备份和健康检查 |
| `pondok-ai backup` | 备份配置和数据卷并进行 SHA-256 完整性检查(未加密) |
| `pondok-ai restore <路径>` | 从 SHA-256 完整性检查的备份中恢复(未加密) |
| `pondok-ai reset` | 重置堆栈(除非指定 `--delete-data`,否则保留卷) |
| `pondok-ai config` | 检查或编辑活动配置 |
| `pondok-ai model list` | 列出已下载的模型 |
| `pondok-ai model recommend` | 根据硬件定制的模型推荐(RAM、VRAM、磁盘) |
| `pondok-ai model install <名称>` | 拉取新模型并进行预检资源安全检查 |
| `pondok-ai model remove <名称>` | 删除已安装的模型 |
| `pondok-ai model status` | 检查模型资源占用 |

镜像固定到明确的版本。`pondok-ai update` 刷新配置的版本;它不会选择更新的版本。安装更新的 CLI 后,运行 `pondok-ai update --upgrade-images` 仅迁移 CLI 的旧版默认镜像标签。自定义镜像值将被保留。

---

## API 网关

API 网关提供即插即用的 OpenAI REST 端点:

在调用 `/v1/*` 端点之前,将 `PONDOK_AI_API_KEY` 设置为生成的 `API_SECRET_KEY`。

网关默认将每个源 IP 的经过身份验证的 `/v1/*` 请求限制为每分钟 120 个请求。如果您的本地客户端需要不同的限制,请在 `.env` 中配置 `RATE_LIMIT_MAX_REQUESTS` 和 `RATE_LIMIT_WINDOW_MS`。

```bash
curl http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $PONDOK_AI_API_KEY" \
  -d '{
    "model": "llama3.2:3b",
    "messages": [
      { "role": "user", "content": "你好,来自我的私有本地 AI 堆栈!" }
    ]
  }'
```

### 与官方 OpenAI Node.js SDK 一起使用
```typescript
import OpenAI from 'openai';

const apiKey = process.env.PONDOK_AI_API_KEY;
if (!apiKey) {
  throw new Error('将 PONDOK_AI_API_KEY 设置为您生成的 API_SECRET_KEY。');
}

const openai = new OpenAI({
  baseURL: 'http://localhost:8000/v1',
  apiKey,
});

const completion = await openai.chat.completions.create({
  model: 'llama3.2:3b',
  messages: [{ role: 'user', content: '用一句话解释量子计算。' }],
});

console.log(completion.choices[0].message.content);
```

---

## 示例

- [`examples/openai-compat/`](./examples/openai-compat):即插即用的 OpenAI SDK 集成脚本。
- [`examples/rag-example/`](./examples/rag-example):使用 Qdrant 向量数据库和 Ollama 嵌入的端到端 RAG 管道。

---

## 文档

- [架构概述](./docs/architecture.md)
- [API 网关参考](./docs/api-reference.md)
- [配置指南](./docs/configuration.md)
- [GPU 加速设置(Metal / CUDA)](./docs/gpu-setup.md)
- [故障排除和诊断](./docs/troubleshooting.md)

---

## 贡献

欢迎贡献!查看 [CONTRIBUTING.md](./CONTRIBUTING.md) 开始。

## 许可证

[MIT](./LICENSE) © 2026 pondok-ai 贡献者
