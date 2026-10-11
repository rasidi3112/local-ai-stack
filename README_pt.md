# pondok-ai

[English](README.md) · [Bahasa Indonesia](README_id.md) · [한국어](README_ko.md) · [العربية](README_ar.md) · [Español](README_es.md) · [中文](README_zh.md) · [Français](README_fr.md) · [日本語](README_ja.md) · [Deutsch](README_de.md) · **Português** · [Русский](README_ru.md) · [हिन्दी](README_hi.md) · [Türkçe](README_tr.md) · [Italiano](README_it.md) · [Tiếng Việt](README_vi.md)

<p align="center">
  <strong>Execute sua própria pilha de IA privada localmente com um único comando.</strong>
</p>

<p align="center">
  <a href="#início-rápido">Início Rápido</a> •
  <a href="#recursos">Recursos</a> •
  <a href="#presets">Presets</a> •
  <a href="#comandos-cli">Comandos CLI</a> •
  <a href="#gateway-api">Gateway API</a> •
  <a href="#exemplos">Exemplos</a> •
  <a href="#documentação">Documentação</a>
</p>

---

## Visão Geral

`pondok-ai` é um kit de ferramentas CLI e orquestração de contêineres amigável para desenvolvedores e sem atrito que inicializa um ambiente de IA completo e privado diretamente em sua estação de trabalho local.

Alimentado por **Docker Compose v2**, `pondok-ai` oferece LLMs locais, interface de chat, busca vetorial, persistência de banco de dados e um gateway API compatível com OpenAI em segundos. Prompts, chats e embeddings são processados em sua máquina; baixar imagens de contêiner e pesos de modelo requer conexão com a internet.

```bash
npx pondok-ai init
npx pondok-ai up
```

---

## Recursos

-  **Processamento Local**: Prompts, chats, embeddings e inferência são executados em seu hardware. Download inicial de imagens de contêiner e modelos requer acesso à internet.
- ⚡ **Zero Atrito de Configuração**: Detecta automaticamente SO, arquitetura, RAM e GPU (Apple Metal / NVIDIA CUDA).
-  **Presets Modulares**: Escale de uma interface de chat leve (`minimal`) para uma pilha RAG empresarial (`standard`) ou um pipeline de automação autônomo (`full`).
-  **Gateway Compatível com OpenAI**: Aponte SDKs OpenAI padrão ou LangChain diretamente para `http://localhost:8000/v1` sem reescrever código.
-  **Gerenciador de Modelos Integrado**: Baixe, liste, inspecione e remova modelos com avisos de segurança de RAM/disco integrados.
-  **Diagnósticos Auto-Reparáveis**: O comando `doctor` integrado diagnostica colisões de porta, status do daemon Docker e limites de recursos antes de você encontrar problemas.

---

## Arquitetura

```
┌───────────────────────────────────────────────────────────────┐
│                  Máquina Host (CLI)                           │
│                                                               │
│   Porta 3000            Porta 8000          Porta 5678        │
│       │                     │                   │             │
└───────┼─────────────────────┼───────────────────┼─────────────┘
        ▼                     ▼                   ▼
  ┌───────────┐         ┌───────────┐       ┌───────────┐
  │ Open      │         │ Gateway   │       │ n8n       │
  │ WebUI     │         │ API       │       │ (Full)    │
  └─────┬─────┘         └─────┬─────┘       └─────┬─────┘
        │                     │                   │
        ├─────────────────────┼───────────────────┤
        ▼                     ▼                   ▼
  ┌───────────┐         ┌───────────┐       ┌───────────┐
  │ Ollama    │         │ Qdrant    │       │ Postgres  │
  │ (LLMs)    │         │ (Vetor)   │       │ (Estado)  │
  └───────────┘         └───────────┘       └───────────┘
```

---

## Presets

| Preset | Serviços Incluídos | RAM Mín | Recomendado Para |
|---|---|---|---|
| **`minimal`** | Ollama, Open WebUI | 8 GB | Chat local rápido, experimentação leve |
| **`standard`** *(padrão)* | Ollama, Open WebUI, PostgreSQL, Qdrant, Gateway API | 16 GB | Pipelines RAG, desenvolvimento de apps, substituição de OpenAI |
| **`full`** | Standard + motor de automação n8n | 16+ GB | Agentes de IA autônomos, automação de fluxo visual |

---

## Início Rápido

### Instalação Automatizada com Um Comando

#### macOS e Linux
```bash
curl -fsSL https://raw.githubusercontent.com/rasidi3112/pondok-ai/main/scripts/install.sh | bash
```

#### Windows (PowerShell)
```powershell
iwr -useb https://raw.githubusercontent.com/rasidi3112/pondok-ai/main/scripts/install.ps1 | iex
```

### Início Rápido Manual via npx

Pré-requisitos: Node.js 22 ou posterior, Docker e Docker Compose v2.

#### 1. Inicializar a pilha
```bash
# Assistente de configuração interativo com detecção automática de hardware
npx pondok-ai init

# Ou não interativo com um preset escolhido
npx pondok-ai init --preset standard --yes
```

#### 2. Iniciar serviços com verificações automáticas de saúde
```bash
npx pondok-ai up
```

Uma vez em execução, acesse sua pilha:
- **Open WebUI**: [http://localhost:3000](http://localhost:3000)
- **Gateway API**: [http://localhost:8000](http://localhost:8000)
- **Ollama**: [http://localhost:11434](http://localhost:11434)
- **Qdrant**: [http://localhost:6333/dashboard](http://localhost:6333/dashboard) *(quando mapeado)*

#### 3. Detecção Inteligente de Hardware e Recomendações de Modelos
```bash
# Obtenha recomendações inteligentes baseadas em seu RAM/VRAM
npx pondok-ai model recommend

# Instale modelo com verificação prévia de segurança de memória e disco
npx pondok-ai model install llama3.2:3b
```

---

## Comandos CLI

| Comando | Descrição |
|---|---|
| `pondok-ai init` | Executar assistente de configuração interativo com detecção de hardware |
| `pondok-ai up` | Validar configuração do Compose, iniciar contêineres e aguardar verificações de saúde |
| `pondok-ai down` | Parar e remover contêineres da pilha |
| `pondok-ai start` | Iniciar contêineres parados existentes |
| `pondok-ai stop` | Parar contêineres em execução |
| `pondok-ai restart` | Reiniciar contêineres da pilha |
| `pondok-ai status` | Mostrar saúde dos contêineres e URLs |
| `pondok-ai logs [serviço]` | Ver logs (`-f` para transmitir) |
| `pondok-ai doctor` | Diagnosticar Docker, RAM, GPU/VRAM, portas e recomendações de modelos |
| `pondok-ai update` | Baixar novamente imagens fixadas configuradas com backup automático e verificações de saúde |
| `pondok-ai backup` | Backup de configurações e volumes de dados com verificações de integridade SHA-256 (não criptografado) |
| `pondok-ai restore <caminho>` | Restaurar de um backup verificado com integridade SHA-256 (não criptografado) |
| `pondok-ai reset` | Resetar pilha (preserva volumes a menos que `--delete-data` seja especificado) |
| `pondok-ai config` | Inspecionar ou editar configuração ativa |
| `pondok-ai model list` | Listar modelos baixados |
| `pondok-ai model recommend` | Recomendações de modelos adaptadas ao hardware (RAM, VRAM, Disco) |
| `pondok-ai model install <nome>` | Baixar novo modelo com verificações prévias de segurança de recursos |
| `pondok-ai model remove <nome>` | Deletar modelo instalado |
| `pondok-ai model status` | Inspecionar pegadas de recursos dos modelos |

As imagens são fixadas em versões explícitas. `pondok-ai update` atualiza as versões configuradas; não seleciona versões mais recentes. Após instalar uma CLI mais recente, execute `pondok-ai update --upgrade-images` para migrar apenas as tags de imagem padrão legadas da CLI. Valores de imagem personalizados são preservados.

---

## Gateway API

O Gateway API fornece endpoints REST compatíveis com OpenAI:

Defina `PONDOK_AI_API_KEY` para o `API_SECRET_KEY` gerado antes de chamar um endpoint `/v1/*`.

O gateway limita solicitações autenticadas `/v1/*` por IP de origem a 120 solicitações por minuto por padrão. Configure `RATE_LIMIT_MAX_REQUESTS` e `RATE_LIMIT_WINDOW_MS` em `.env` se seu cliente local precisar de limites diferentes.

```bash
curl http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $PONDOK_AI_API_KEY" \
  -d '{
    "model": "llama3.2:3b",
    "messages": [
      { "role": "user", "content": "Olá da minha pilha de IA local privada!" }
    ]
  }'
```

### Usando com o SDK Node.js Oficial da OpenAI
```typescript
import OpenAI from 'openai';

const apiKey = process.env.PONDOK_AI_API_KEY;
if (!apiKey) {
  throw new Error('Defina PONDOK_AI_API_KEY para seu API_SECRET_KEY gerado.');
}

const openai = new OpenAI({
  baseURL: 'http://localhost:8000/v1',
  apiKey,
});

const completion = await openai.chat.completions.create({
  model: 'llama3.2:3b',
  messages: [{ role: 'user', content: 'Explique computação quântica em uma frase.' }],
});

console.log(completion.choices[0].message.content);
```

---

## Exemplos

- [`examples/openai-compat/`](./examples/openai-compat): Script de integração direta do SDK OpenAI.
- [`examples/rag-example/`](./examples/rag-example): Pipeline RAG de ponta a ponta usando banco de dados vetorial Qdrant e embeddings Ollama.

---

## Documentação

- [Visão Geral da Arquitetura](./docs/architecture.md)
- [Referência do Gateway API](./docs/api-reference.md)
- [Guia de Configuração](./docs/configuration.md)
- [Configuração de Aceleração GPU (Metal / CUDA)](./docs/gpu-setup.md)
- [Solução de Problemas e Diagnósticos](./docs/troubleshooting.md)

---

## Contribuindo

Contribuições são bem-vindas! Confira [CONTRIBUTING.md](./CONTRIBUTING.md) para começar.

## Licença

[MIT](./LICENSE) © 2026 contribuidores do pondok-ai
