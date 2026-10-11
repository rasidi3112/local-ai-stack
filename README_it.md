# pondok-ai

[English](README.md) · [Bahasa Indonesia](README_id.md) · [한국어](README_ko.md) · [العربية](README_ar.md) · [Español](README_es.md) · [中文](README_zh.md) · [Français](README_fr.md) · [日本語](README_ja.md) · [Deutsch](README_de.md) · [Português](README_pt.md) · [Русский](README_ru.md) · [हिन्दी](README_hi.md) · [Türkçe](README_tr.md) · **Italiano** · [Tiếng Việt](README_vi.md)

<p align="center">
  <strong>Esegui il tuo stack AI privato localmente con un solo comando.</strong>
</p>

<p align="center">
  <a href="#avvio-rapido">Avvio Rapido</a> •
  <a href="#caratteristiche">Caratteristiche</a> •
  <a href="#preset">Preset</a> •
  <a href="#comandi-cli">Comandi CLI</a> •
  <a href="#gateway-api">Gateway API</a> •
  <a href="#esempi">Esempi</a> •
  <a href="#documentazione">Documentazione</a>
</p>

---

## Panoramica

`pondok-ai` è un toolkit CLI e di orchestrazione di container amichevole per sviluppatori e senza attriti che avvia un ambiente AI completo e privato direttamente sulla tua workstation locale.

Alimentato da **Docker Compose v2**, `pondok-ai` ti fornisce LLM locali, interfaccia chat, ricerca vettoriale, persistenza del database e un gateway API compatibile con OpenAI in pochi secondi. Prompt, chat ed embedding vengono elaborati sulla tua macchina; il download delle immagini container e dei pesi dei modelli richiede una connessione internet.

```bash
npx pondok-ai init
npx pondok-ai up
```

---

## Caratteristiche

-  **Elaborazione Locale**: Prompt, chat, embedding e inferenza vengono eseguiti sul tuo hardware. Il download iniziale delle immagini container e dei modelli richiede accesso a internet.
- ⚡ **Zero Attriti di Configurazione**: Rileva automaticamente sistema operativo, architettura, RAM e GPU (Apple Metal / NVIDIA CUDA).
-  **Preset Modulari**: Scala da un'interfaccia chat leggera (`minimal`) a uno stack RAG aziendale (`standard`) o una pipeline di automazione autonoma (`full`).
-  **Gateway Compatibile con OpenAI**: Punta SDK OpenAI standard o LangChain direttamente a `http://localhost:8000/v1` senza riscrivere il codice.
-  **Gestore Modelli Integrato**: Scarica, elenca, ispeziona e rimuovi modelli con avvisi di sicurezza RAM/disco integrati.
-  **Diagnostica Auto-Riparante**: Il comando `doctor` integrato diagnostica collisioni di porte, stato del daemon Docker e limiti di risorse prima che tu incontri problemi.

---

## Architettura

```
┌───────────────────────────────────────────────────────────────┐
│                  Macchina Host (CLI)                          │
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
  │ (LLMs)    │         │ (Vettore) │       │ (Stato)   │
  └───────────┘         └───────────┘       └───────────┘
```

---

## Preset

| Preset | Servizi Inclusi | RAM Min | Consigliato Per |
|---|---|---|---|
| **`minimal`** | Ollama, Open WebUI | 8 GB | Chat locale veloce, sperimentazione leggera |
| **`standard`** *(predefinito)* | Ollama, Open WebUI, PostgreSQL, Qdrant, Gateway API | 16 GB | Pipeline RAG, sviluppo app, sostituzione OpenAI |
| **`full`** | Standard + motore di automazione n8n | 16+ GB | Agenti AI autonomi, automazione del flusso di lavoro visuale |

---

## Avvio Rapido

### Installazione Automatizzata con Un Comando

#### macOS e Linux
```bash
curl -fsSL https://raw.githubusercontent.com/rasidi3112/pondok-ai/main/scripts/install.sh | bash
```

#### Windows (PowerShell)
```powershell
iwr -useb https://raw.githubusercontent.com/rasidi3112/pondok-ai/main/scripts/install.ps1 | iex
```

### Avvio Rapido Manuale tramite npx

Prerequisiti: Node.js 22 o successivo, Docker e Docker Compose v2.

#### 1. Inizializzare lo stack
```bash
# Wizard di configurazione interattivo con rilevamento automatico hardware
npx pondok-ai init

# O non interattivo con un preset scelto
npx pondok-ai init --preset standard --yes
```

#### 2. Avviare i servizi con controlli di salute automatici
```bash
npx pondok-ai up
```

Una volta in esecuzione, accedi al tuo stack:
- **Open WebUI**: [http://localhost:3000](http://localhost:3000)
- **Gateway API**: [http://localhost:8000](http://localhost:8000)
- **Ollama**: [http://localhost:11434](http://localhost:11434)
- **Qdrant**: [http://localhost:6333/dashboard](http://localhost:6333/dashboard) *(quando mappato)*

#### 3. Rilevamento Intelligente Hardware e Raccomandazioni Modelli
```bash
# Ottieni raccomandazioni intelligenti basate sulla tua RAM/VRAM
npx pondok-ai model recommend

# Installa modello con controllo di sicurezza memoria e disco pre-volo
npx pondok-ai model install llama3.2:3b
```

---

## Comandi CLI

| Comando | Descrizione |
|---|---|
| `pondok-ai init` | Eseguire wizard di configurazione interattivo con rilevamento hardware |
| `pondok-ai up` | Convalidare configurazione Compose, avviare container e attendere controlli di salute |
| `pondok-ai down` | Fermare e rimuovere container dello stack |
| `pondok-ai start` | Avviare container esistenti fermati |
| `pondok-ai stop` | Fermare container in esecuzione |
| `pondok-ai restart` | Riavviare container dello stack |
| `pondok-ai status` | Mostrare salute container e URL |
| `pondok-ai logs [servizio]` | Visualizzare log (`-f` per streaming) |
| `pondok-ai doctor` | Diagnosticare Docker, RAM, GPU/VRAM, porte e raccomandazioni modelli |
| `pondok-ai update` | Ri-scaricare immagini fissate configurate con backup automatico e controlli di salute |
| `pondok-ai backup` | Backup di configurazioni e volumi dati con controlli di integrità SHA-256 (non crittografato) |
| `pondok-ai restore <percorso>` | Ripristinare da backup verificato con integrità SHA-256 (non crittografato) |
| `pondok-ai reset` | Reimpostare stack (preserva volumi a meno che `--delete-data` sia specificato) |
| `pondok-ai config` | Ispezionare o modificare configurazione attiva |
| `pondok-ai model list` | Elencare modelli scaricati |
| `pondok-ai model recommend` | Raccomandazioni modelli personalizzate per hardware (RAM, VRAM, Disco) |
| `pondok-ai model install <nome>` | Scaricare nuovo modello con controlli di sicurezza risorse pre-volo |
| `pondok-ai model remove <nome>` | Eliminare modello installato |
| `pondok-ai model status` | Ispezionare impronte risorse modelli |

Le immagini sono fissate a versioni esplicite. `pondok-ai update` aggiorna le versioni configurate; non seleziona versioni più recenti. Dopo aver installato una CLI più recente, esegui `pondok-ai update --upgrade-images` per migrare solo i tag immagine predefiniti legacy della CLI. I valori immagine personalizzati vengono preservati.

---

## Gateway API

Il Gateway API fornisce endpoint REST compatibili con OpenAI pronti all'uso:

Imposta `PONDOK_AI_API_KEY` sulla `API_SECRET_KEY` generata prima di chiamare un endpoint `/v1/*`.

Il gateway limita le richieste autenticate `/v1/*` per IP di origine a 120 richieste al minuto per impostazione predefinita. Configura `RATE_LIMIT_MAX_REQUESTS` e `RATE_LIMIT_WINDOW_MS` in `.env` se il tuo client locale necessita di limiti diversi.

```bash
curl http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $PONDOK_AI_API_KEY" \
  -d '{
    "model": "llama3.2:3b",
    "messages": [
      { "role": "user", "content": "Ciao dal mio stack AI locale privato!" }
    ]
  }'
```

### Utilizzo con l'SDK Node.js Ufficiale di OpenAI
```typescript
import OpenAI from 'openai';

const apiKey = process.env.PONDOK_AI_API_KEY;
if (!apiKey) {
  throw new Error('Imposta PONDOK_AI_API_KEY sulla tua API_SECRET_KEY generata.');
}

const openai = new OpenAI({
  baseURL: 'http://localhost:8000/v1',
  apiKey,
});

const completion = await openai.chat.completions.create({
  model: 'llama3.2:3b',
  messages: [{ role: 'user', content: 'Spiega il calcolo quantistico in una frase.' }],
});

console.log(completion.choices[0].message.content);
```

---

## Esempi

- [`examples/openai-compat/`](./examples/openai-compat): Script di integrazione SDK OpenAI pronto all'uso.
- [`examples/rag-example/`](./examples/rag-example): Pipeline RAG end-to-end utilizzando database vettoriale Qdrant ed embedding Ollama.

---

## Documentazione

- [Panoramica Architettura](./docs/architecture.md)
- [Riferimento Gateway API](./docs/api-reference.md)
- [Guida alla Configurazione](./docs/configuration.md)
- [Configurazione Accelerazione GPU (Metal / CUDA)](./docs/gpu-setup.md)
- [Risoluzione Problemi e Diagnostica](./docs/troubleshooting.md)

---

## Contribuire

I contributi sono benvenuti! Consulta [CONTRIBUTING.md](./CONTRIBUTING.md) per iniziare.

## Licenza

[MIT](./LICENSE) © 2026 contributori di pondok-ai
