# pondok-ai

[English](README.md) · [Bahasa Indonesia](README_id.md) · [한국어](README_ko.md) · [العربية](README_ar.md) · **Español** · [中文](README_zh.md) · [Français](README_fr.md) · [日本語](README_ja.md) · [Deutsch](README_de.md) · [Português](README_pt.md) · [Русский](README_ru.md) · [हिन्दी](README_hi.md) · [Türkçe](README_tr.md) · [Italiano](README_it.md) · [Tiếng Việt](README_vi.md)

<p align="center">
  <strong>Ejecuta tu propia pila de IA privada localmente con un solo comando.</strong>
</p>

<p align="center">
  <a href="#inicio-rápido">Inicio Rápido</a> •
  <a href="#características">Características</a> •
  <a href="#configuraciones-predefinidas">Configuraciones Predefinidas</a> •
  <a href="#comandos-cli">Comandos CLI</a> •
  <a href="#gateway-api">Gateway API</a> •
  <a href="#ejemplos">Ejemplos</a> •
  <a href="#documentación">Documentación</a>
</p>

---

## Descripción General

`pondok-ai` es un kit de herramientas CLI y orquestación de contenedores amigable para desarrolladores y sin fricciones que inicia un entorno de IA completo y privado directamente en tu estación de trabajo local.

Impulsado por **Docker Compose v2**, `pondok-ai` te proporciona LLMs locales, interfaz de chat, búsqueda vectorial, persistencia de base de datos y un gateway API compatible con OpenAI en segundos. Los prompts, chats y embeddings se procesan en tu máquina; descargar imágenes de contenedores y pesos de modelos requiere conexión a internet.

```bash
npx pondok-ai init
npx pondok-ai up
```

---

## Características

-  **Procesamiento Local**: Prompts, chats, embeddings e inferencia se ejecutan en tu hardware. La descarga inicial de imágenes de contenedores y modelos requiere acceso a internet.
- ⚡ **Configuración Sin Fricciones**: Detecta automáticamente SO, arquitectura, RAM y GPU (Apple Metal / NVIDIA CUDA).
-  **Configuraciones Modulares**: Escala desde una interfaz de chat ligera (`minimal`) hasta una pila RAG empresarial (`standard`) o un pipeline de automatización autónomo (`full`).
-  **Gateway Compatible con OpenAI**: Apunta SDKs estándar de OpenAI o LangChain directamente a `http://localhost:8000/v1` sin reescribir código.
-  **Gestor de Modelos Integrado**: Descarga, lista, inspecciona y elimina modelos con advertencias de seguridad de RAM/disco integradas.
-  **Diagnósticos Auto-Reparables**: El comando `doctor` integrado diagnostica colisiones de puertos, estado del daemon de Docker y límites de recursos antes de que encuentres problemas.

---

## Arquitectura

```
┌───────────────────────────────────────────────────────────────┐
│                  Máquina Anfitrión (CLI)                      │
│                                                               │
│   Puerto 3000           Puerto 8000         Puerto 5678       │
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
  │ (LLMs)    │         │ (Vector)  │       │ (Estado)  │
  └───────────┘         └───────────┘       └───────────┘
```

---

## Configuraciones Predefinidas

| Configuración | Servicios Incluidos | RAM Mín | Recomendado Para |
|---|---|---|---|
| **`minimal`** | Ollama, Open WebUI | 8 GB | Chat local rápido, experimentación ligera |
| **`standard`** *(predeterminado)* | Ollama, Open WebUI, PostgreSQL, Qdrant, Gateway API | 16 GB | Pipelines RAG, desarrollo de apps, reemplazo de OpenAI |
| **`full`** | Standard + motor de automatización n8n | 16+ GB | Agentes de IA autónomos, automatización de flujos visuales |

---

## Inicio Rápido

### Instalación Automatizada con Un Comando

#### macOS y Linux
```bash
curl -fsSL https://raw.githubusercontent.com/rasidi3112/pondok-ai/main/scripts/install.sh | bash
```

#### Windows (PowerShell)
```powershell
iwr -useb https://raw.githubusercontent.com/rasidi3112/pondok-ai/main/scripts/install.ps1 | iex
```

### Inicio Rápido Manual vía npx

Prerrequisitos: Node.js 22 o posterior, Docker y Docker Compose v2.

#### 1. Inicializar la pila
```bash
# Asistente de configuración interactivo con detección automática de hardware
npx pondok-ai init

# O no interactivo con una configuración predefinida elegida
npx pondok-ai init --preset standard --yes
```

#### 2. Iniciar servicios con verificaciones automáticas de salud
```bash
npx pondok-ai up
```

Una vez en ejecución, accede a tu pila:
- **Open WebUI**: [http://localhost:3000](http://localhost:3000)
- **Gateway API**: [http://localhost:8000](http://localhost:8000)
- **Ollama**: [http://localhost:11434](http://localhost:11434)
- **Qdrant**: [http://localhost:6333/dashboard](http://localhost:6333/dashboard) *(cuando esté mapeado)*

#### 3. Detección Inteligente de Hardware y Recomendaciones de Modelos
```bash
# Obtén recomendaciones inteligentes basadas en tu RAM/VRAM
npx pondok-ai model recommend

# Instala modelo con verificación previa de seguridad de memoria y disco
npx pondok-ai model install llama3.2:3b
```

---

## Comandos CLI

| Comando | Descripción |
|---|---|
| `pondok-ai init` | Ejecutar asistente de configuración interactivo con detección de hardware |
| `pondok-ai up` | Validar configuración de Compose, iniciar contenedores y esperar verificaciones de salud |
| `pondok-ai down` | Detener y eliminar contenedores de la pila |
| `pondok-ai start` | Iniciar contenedores detenidos existentes |
| `pondok-ai stop` | Detener contenedores en ejecución |
| `pondok-ai restart` | Reiniciar contenedores de la pila |
| `pondok-ai status` | Mostrar salud de contenedores y URLs |
| `pondok-ai logs [servicio]` | Ver registros (`-f` para transmitir) |
| `pondok-ai doctor` | Diagnosticar Docker, RAM, GPU/VRAM, puertos y recomendaciones de modelos |
| `pondok-ai update` | Volver a descargar imágenes fijadas configuradas con backup automático y verificaciones de salud |
| `pondok-ai backup` | Backup de configuraciones y volúmenes de datos con verificaciones de integridad SHA-256 (no encriptado) |
| `pondok-ai restore <ruta>` | Restaurar desde un backup verificado con integridad SHA-256 (no encriptado) |
| `pondok-ai reset` | Reiniciar pila (preserva volúmenes a menos que se especifique `--delete-data`) |
| `pondok-ai config` | Inspeccionar o editar configuración activa |
| `pondok-ai model list` | Listar modelos descargados |
| `pondok-ai model recommend` | Recomendaciones de modelos adaptadas al hardware (RAM, VRAM, Disco) |
| `pondok-ai model install <nombre>` | Descargar un nuevo modelo con verificaciones previas de seguridad de recursos |
| `pondok-ai model remove <nombre>` | Eliminar un modelo instalado |
| `pondok-ai model status` | Inspeccionar huellas de recursos de modelos |

Las imágenes están fijadas a versiones explícitas. `pondok-ai update` actualiza las versiones configuradas; no selecciona versiones más nuevas. Después de instalar una CLI más nueva, ejecuta `pondok-ai update --upgrade-images` para migrar solo las etiquetas de imagen predeterminadas heredadas de la CLI. Los valores de imagen personalizados se preservan.

---

## Gateway API

El Gateway API proporciona endpoints REST compatibles con OpenAI:

Establece `PONDOK_AI_API_KEY` con el `API_SECRET_KEY` generado antes de llamar a un endpoint `/v1/*`.

El gateway limita las solicitudes autenticadas `/v1/*` por IP de origen a 120 solicitudes por minuto de forma predeterminada. Configura `RATE_LIMIT_MAX_REQUESTS` y `RATE_LIMIT_WINDOW_MS` en `.env` si tu cliente local necesita límites diferentes.

```bash
curl http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $PONDOK_AI_API_KEY" \
  -d '{
    "model": "llama3.2:3b",
    "messages": [
      { "role": "user", "content": "¡Hola desde mi pila de IA local privada!" }
    ]
  }'
```

### Usando con el SDK Oficial de Node.js de OpenAI
```typescript
import OpenAI from 'openai';

const apiKey = process.env.PONDOK_AI_API_KEY;
if (!apiKey) {
  throw new Error('Establece PONDOK_AI_API_KEY con tu API_SECRET_KEY generado.');
}

const openai = new OpenAI({
  baseURL: 'http://localhost:8000/v1',
  apiKey,
});

const completion = await openai.chat.completions.create({
  model: 'llama3.2:3b',
  messages: [{ role: 'user', content: 'Explica la computación cuántica en una oración.' }],
});

console.log(completion.choices[0].message.content);
```

---

## Ejemplos

- [`examples/openai-compat/`](./examples/openai-compat): Script de integración directa con SDK de OpenAI.
- [`examples/rag-example/`](./examples/rag-example): Pipeline RAG de extremo a extremo usando base de datos vectorial Qdrant y embeddings de Ollama.

---

## Documentación

- [Descripción General de la Arquitectura](./docs/architecture.md)
- [Referencia del Gateway API](./docs/api-reference.md)
- [Guía de Configuración](./docs/configuration.md)
- [Configuración de Aceleración GPU (Metal / CUDA)](./docs/gpu-setup.md)
- [Solución de Problemas y Diagnósticos](./docs/troubleshooting.md)

---

## Contribuir

¡Las contribuciones son bienvenidas! Consulta [CONTRIBUTING.md](./CONTRIBUTING.md) para comenzar.

## Licencia

[MIT](./LICENSE) © 2026 contribuidores de pondok-ai
