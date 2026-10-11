# pondok-ai

[English](README.md) · [Bahasa Indonesia](README_id.md) · **한국어** · [العربية](README_ar.md) · [Español](README_es.md) · [中文](README_zh.md) · [Français](README_fr.md) · [日本語](README_ja.md) · [Deutsch](README_de.md) · [Português](README_pt.md) · [Русский](README_ru.md) · [हिन्दी](README_hi.md) · [Türkçe](README_tr.md) · [Italiano](README_it.md) · [Tiếng Việt](README_vi.md)

<p align="center">
  <a href="#quickstart">빠른 시작</a> •
  <a href="#features">주요 기능</a> •
  <a href="#presets">프리셋</a> •
  <a href="#cli-commands">CLI 명령어</a> •
  <a href="#api-gateway">API 게이트웨이</a> •
  <a href="#examples">예제</a> •
  <a href="#docs">문서</a>
</p>

---

## Overview

`pondok-ai`은 개발자가 로컬 워크스테이션에서 완전한 프라이빗 AI 환경을 간편하게 실행할 수 있도록 지원하는 CLI 및 컨테이너 오케스트레이션 도구입니다.

**Docker Compose v2**를 기반으로 `pondok-ai`은 로컬 LLM, 채팅 UI, 벡터 검색, 데이터베이스 영속성 및 OpenAI 호환 API 게이트웨이를 몇 초 만에 실행합니다. 프롬프트, 채팅 및 임베딩 처리는 로컬 머신에서 수행되지만, 컨테이너 이미지와 모델 가중치를 다운로드하려면 인터넷 연결이 필요합니다.

```bash
npx pondok-ai init
npx pondok-ai up
```

---

## Features

- **로컬 처리**: 프롬프트, 채팅, 임베딩 및 추론은 사용자의 하드웨어에서 실행됩니다. 초기 컨테이너 이미지와 모델 다운로드에는 인터넷 연결이 필요합니다.
- ⚡ **간편한 설정**: 운영체제, 아키텍처, RAM 및 GPU(Apple Metal / NVIDIA CUDA)를 자동으로 감지합니다.
- **모듈식 프리셋**: 가벼운 채팅 인터페이스(`minimal`)부터 엔터프라이즈 RAG 스택(`standard`), 자율 자동화 파이프라인(`full`)까지 필요에 따라 확장할 수 있습니다.
- **OpenAI 호환 게이트웨이**: 표준 OpenAI SDK 또는 LangChain을 `[http://localhost:8000/v1](http://localhost:8000/v1)`에 연결하면 코드를 거의 수정하지 않고 사용할 수 있습니다.
- **내장 모델 관리자**: RAM 및 디스크 사용량에 대한 안전 경고와 함께 모델을 다운로드하고, 목록을 조회하고, 세부 정보를 확인하고, 삭제할 수 있습니다.
- **자가 진단 기능**: 내장된 `doctor` 명령어로 포트 충돌, Docker 데몬 상태 및 리소스 제한을 진단하여 문제를 사전에 확인할 수 있습니다.

---

## Architecture

```text
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

| 프리셋 | 포함 서비스 | 최소 RAM | 권장 용도 |
|---|---|---|---|
| **`minimal`** | Ollama, Open WebUI | 8 GB | 로컬 채팅 및 가벼운 실험 |
| **`standard`** *(기본값)* | Ollama, Open WebUI, PostgreSQL, Qdrant, API Gateway | 16 GB | RAG 파이프라인, 애플리케이션 개발, OpenAI 대체 환경 |
| **`full`** | Standard + n8n 자동화 엔진 | 16+ GB | 자율 AI 에이전트 및 시각적 워크플로 자동화 |

---

## Quickstart

### 원클릭 자동 설치

#### macOS 및 Linux

```bash
curl -fsSL https://raw.githubusercontent.com/rasidi3112/pondok-ai/main/scripts/install.sh | bash
```

#### Windows (PowerShell)

```powershell
iwr -useb https://raw.githubusercontent.com/rasidi3112/pondok-ai/main/scripts/install.ps1 | iex
```

### npx를 사용한 수동 빠른 시작

필수 환경: Node.js 22 이상, Docker 및 Docker Compose v2.

#### 1. 스택 초기화

```bash
# 하드웨어 자동 감지를 지원하는 대화형 설정 마법사
npx pondok-ai init

# 또는 원하는 프리셋을 지정하여 비대화형으로 초기화
npx pondok-ai init --preset standard --yes
```

#### 2. 상태 확인을 자동으로 수행하며 서비스 시작

```bash
npx pondok-ai up
```

실행 후 다음 주소에서 각 서비스에 접속할 수 있습니다.

- **Open WebUI**: [http://localhost:3000](http://localhost:3000)
- **API Gateway**: [http://localhost:8000](http://localhost:8000)
- **Ollama**: [http://localhost:11434](http://localhost:11434)
- **Qdrant**: [http://localhost:6333/dashboard](http://localhost:6333/dashboard) *(포트가 매핑된 경우)*

#### 3. 스마트 하드웨어 감지 및 모델 추천

```bash
# RAM 및 VRAM을 기반으로 하드웨어에 적합한 모델 추천 받기
npx pondok-ai model recommend

# 메모리 및 디스크 사전 점검 후 모델 설치
npx pondok-ai model install llama3.2:3b
```

---

## CLI Commands

| 명령어 | 설명 |
|---|---|
| `pondok-ai init` | 하드웨어 감지 기능이 포함된 대화형 설정 마법사 실행 |
| `pondok-ai up` | Compose 설정을 검증하고 컨테이너를 실행한 후 상태 확인이 완료될 때까지 대기 |
| `pondok-ai down` | 스택 컨테이너를 중지하고 제거 |
| `pondok-ai start` | 기존에 중지된 컨테이너 시작 |
| `pondok-ai stop` | 실행 중인 컨테이너 중지 |
| `pondok-ai restart` | 스택 컨테이너 재시작 |
| `pondok-ai status` | 컨테이너 상태 및 접속 URL 표시 |
| `pondok-ai logs [service]` | 로그 확인 (`-f` 옵션으로 실시간 로그 출력) |
| `pondok-ai doctor` | Docker, RAM, GPU/VRAM, 포트 및 모델 추천 관련 문제 진단 |
| `pondok-ai update` | 자동 백업 및 상태 확인을 수행하며 설정된 이미지 버전을 다시 다운로드 |
| `pondok-ai backup` | SHA-256 무결성 검사를 포함하여 설정과 데이터 볼륨 백업 (암호화되지 않음) |
| `pondok-ai restore <path>` | SHA-256 무결성 검사를 통해 백업 복원 (암호화되지 않음) |
| `pondok-ai reset` | 스택 초기화 (`--delete-data`를 지정하지 않으면 볼륨 데이터 유지) |
| `pondok-ai config` | 현재 활성 설정 확인 또는 편집 |
| `pondok-ai model list` | 다운로드된 모델 목록 표시 |
| `pondok-ai model recommend` | RAM, VRAM 및 디스크 용량에 맞는 모델 추천 |
| `pondok-ai model install <name>` | 리소스 사전 점검 후 새 모델 다운로드 |
| `pondok-ai model remove <name>` | 설치된 모델 삭제 |
| `pondok-ai model status` | 모델별 리소스 사용량 확인 |

이미지는 명시적인 버전으로 고정되어 있습니다. `pondok-ai update`는 설정된 버전을 새로 다운로드할 뿐, 자동으로 최신 릴리스를 선택하지 않습니다. 최신 CLI를 설치한 후 `pondok-ai update --upgrade-images`를 실행하면 CLI의 기존 기본 이미지 태그만 새 버전으로 마이그레이션합니다. 사용자 지정 이미지 설정은 그대로 유지됩니다.

---

## API Gateway

API Gateway는 OpenAI REST API와 호환되는 엔드포인트를 제공합니다.

`/v1/*` 엔드포인트를 호출하기 전에 생성된 `API_SECRET_KEY` 값을 `PONDOK_AI_API_KEY`에 설정하세요.

게이트웨이는 기본적으로 소스 IP별 인증된 `/v1/*` 요청을 분당 120회로 제한합니다. 로컬 클라이언트에 다른 제한이 필요한 경우 `.env` 파일에서 `RATE_LIMIT_MAX_REQUESTS` 및 `RATE_LIMIT_WINDOW_MS`를 설정할 수 있습니다.

```bash
curl http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $PONDOK_AI_API_KEY" \
  -d '{
    "model": "llama3.2:3b",
    "messages": [
      { "role": "user", "content": "나만의 프라이빗 로컬 AI 스택에서 보내는 인사입니다!" }
    ]
  }'
```

### 공식 OpenAI Node.js SDK 사용

```typescript
import OpenAI from 'openai';

const apiKey = process.env.PONDOK_AI_API_KEY;

if (!apiKey) {
  throw new Error('PONDOK_AI_API_KEY에 생성된 API_SECRET_KEY 값을 설정하세요.');
}

const openai = new OpenAI({
  baseURL: 'http://localhost:8000/v1',
  apiKey,
});

const completion = await openai.chat.completions.create({
  model: 'llama3.2:3b',
  messages: [
    { role: 'user', content: '양자 컴퓨팅을 한 문장으로 설명해 주세요.' }
  ],
});

console.log(completion.choices[0].message.content);
```

---

## Examples

- [`examples/openai-compat/`](./examples/openai-compat): OpenAI SDK와 호환되는 통합 스크립트 예제.
- [`examples/rag-example/`](./examples/rag-example): Qdrant 벡터 데이터베이스와 Ollama 임베딩을 사용하는 전체 RAG 파이프라인 예제.

---

## Documentation

- [아키텍처 개요](./docs/architecture.md)
- [API Gateway 참조 문서](./docs/api-reference.md)
- [설정 가이드](./docs/configuration.md)
- [GPU 가속 설정 (Metal / CUDA)](./docs/gpu-setup.md)
- [문제 해결 및 진단](./docs/troubleshooting.md)

---

## Contributing

기여를 환영합니다! 시작하려면 [CONTRIBUTING.md](./CONTRIBUTING.md)를 확인하세요.

## License

[MIT](./LICENSE) © 2026 pondok-ai 기여자
