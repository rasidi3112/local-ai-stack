# pondok-ai

[English](README.md) · [Bahasa Indonesia](README_id.md) · [한국어](README_ko.md) · [العربية](README_ar.md) · [Español](README_es.md) · [中文](README_zh.md) · [Français](README_fr.md) · [日本語](README_ja.md) · **Deutsch** · [Português](README_pt.md) · [Русский](README_ru.md) · [हिन्दी](README_hi.md) · [Türkçe](README_tr.md) · [Italiano](README_it.md) · [Tiếng Việt](README_vi.md)

<p align="center">
  <strong>Führen Sie Ihren eigenen privaten KI-Stack lokal mit einem Befehl aus.</strong>
</p>

<p align="center">
  <a href="#schnellstart">Schnellstart</a> •
  <a href="#funktionen">Funktionen</a> •
  <a href="#voreinstellungen">Voreinstellungen</a> •
  <a href="#cli-befehle">CLI-Befehle</a> •
  <a href="#api-gateway">API-Gateway</a> •
  <a href="#beispiele">Beispiele</a> •
  <a href="#dokumentation">Dokumentation</a>
</p>

---

## Überblick

`pondok-ai` ist ein entwicklerfreundliches, reibungsloses CLI- und Container-Orchestrierungs-Toolkit, das eine vollständige, private KI-Umgebung direkt auf Ihrer lokalen Workstation startet.

Angetrieben von **Docker Compose v2** bietet Ihnen `pondok-ai` lokale LLMs, Chat-UI, Vektorsuche, Datenbankpersistenz und ein OpenAI-kompatibles API-Gateway in Sekunden. Prompts, Chats und Embeddings werden auf Ihrer Maschine verarbeitet; das Herunterladen von Container-Images und Modellgewichten erfordert eine Internetverbindung.

```bash
npx pondok-ai init
npx pondok-ai up
```

---

## Funktionen

-  **Lokale Verarbeitung**: Prompts, Chats, Embeddings und Inferenz laufen auf Ihrer Hardware. Initiales Herunterladen von Container-Images und Modellen erfordert Internetzugang.
- ⚡ **Null Einrichtungsreibung**: Erkennt automatisch Betriebssystem, Architektur, RAM und GPU (Apple Metal / NVIDIA CUDA).
-  **Modulare Voreinstellungen**: Skalieren Sie von einer leichtgewichtigen Chat-Oberfläche (`minimal`) zu einem Unternehmens-RAG-Stack (`standard`) oder einer autonomen Automatisierungspipeline (`full`).
-  **OpenAI-kompatibles Gateway**: Richten Sie Standard-OpenAI-SDKs oder LangChain direkt auf `http://localhost:8000/v1` ohne Code-Neuschreibungen.
-  **Integrierter Modell-Manager**: Laden, listen, inspizieren und entfernen Sie Modelle mit integrierten RAM/Festplatten-Sicherheitswarnungen.
-  **Selbstheilende Diagnose**: Der integrierte `doctor`-Befehl diagnostiziert Portkonflikte, Docker-Daemon-Status und Ressourcenlimits, bevor Sie auf Probleme stoßen.

---

## Architektur

```
┌───────────────────────────────────────────────────────────────┐
│                  Host-Maschine (CLI)                          │
│                                                               │
│   Port 3000             Port 8000           Port 5678         │
│       │                     │                   │             │
└───────┼─────────────────────┼───────────────────┼─────────────┘
        ▼                     ▼                   ▼
  ┌───────────┐         ┌───────────┐       ┌───────────┐
  │ Open      │         │ API       │       │ n8n       │
  │ WebUI     │         │ Gateway   │       │ (Full)    │
  └─────┬─────┘         └─────┬─────┘       └─────┬─────┘
        │                     │                   │
        ├─────────────────────┼───────────────────┤
        ▼                     ▼                   ▼
  ┌───────────┐         ┌───────────┐       ┌───────────┐
  │ Ollama    │         │ Qdrant    │       │ Postgres  │
  │ (LLMs)    │         │ (Vektor)  │       │ (Status)  │
  └───────────┘         └───────────┘       └───────────┘
```

---

## Voreinstellungen

| Voreinstellung | Enthaltene Dienste | Min. RAM | Empfohlen für |
|---|---|---|---|
| **`minimal`** | Ollama, Open WebUI | 8 GB | Schneller lokaler Chat, leichte Experimente |
| **`standard`** *(Standard)* | Ollama, Open WebUI, PostgreSQL, Qdrant, API-Gateway | 16 GB | RAG-Pipelines, App-Entwicklung, OpenAI-Ersatz |
| **`full`** | Standard + n8n Automatisierungs-Engine | 16+ GB | Autonome KI-Agenten, visuelle Workflow-Automatisierung |

---

## Schnellstart

### Automatisierte Ein-Befehl-Installation

#### macOS und Linux
```bash
curl -fsSL https://raw.githubusercontent.com/rasidi3112/pondok-ai/main/scripts/install.sh | bash
```

#### Windows (PowerShell)
```powershell
iwr -useb https://raw.githubusercontent.com/rasidi3112/pondok-ai/main/scripts/install.ps1 | iex
```

### Manueller Schnellstart über npx

Voraussetzungen: Node.js 22 oder höher, Docker und Docker Compose v2.

#### 1. Stack initialisieren
```bash
# Interaktiver Setup-Assistent mit automatischer Hardware-Erkennung
npx pondok-ai init

# Oder nicht-interaktiv mit einer gewählten Voreinstellung
npx pondok-ai init --preset standard --yes
```

#### 2. Dienste mit automatischen Gesundheitsprüfungen starten
```bash
npx pondok-ai up
```

Nach dem Start greifen Sie auf Ihren Stack zu:
- **Open WebUI**: [http://localhost:3000](http://localhost:3000)
- **API-Gateway**: [http://localhost:8000](http://localhost:8000)
- **Ollama**: [http://localhost:11434](http://localhost:11434)
- **Qdrant**: [http://localhost:6333/dashboard](http://localhost:6333/dashboard) *(wenn zugeordnet)*

#### 3. Intelligente Hardware-Erkennung und Modellempfehlungen
```bash
# Erhalten Sie intelligente hardwarebasierte Empfehlungen basierend auf Ihrem RAM/VRAM
npx pondok-ai model recommend

# Modell mit Vorab-Speicher- und Festplatten-Sicherheitsprüfung installieren
npx pondok-ai model install llama3.2:3b
```

---

## CLI-Befehle

| Befehl | Beschreibung |
|---|---|
| `pondok-ai init` | Interaktiven Konfigurations-Assistenten mit Hardware-Erkennung ausführen |
| `pondok-ai up` | Compose-Konfiguration validieren, Container starten und auf Gesundheitsprüfungen warten |
| `pondok-ai down` | Stack-Container stoppen und entfernen |
| `pondok-ai start` | Vorhandene gestoppte Container starten |
| `pondok-ai stop` | Laufende Container stoppen |
| `pondok-ai restart` | Stack-Container neu starten |
| `pondok-ai status` | Container-Gesundheit und URLs anzeigen |
| `pondok-ai logs [Dienst]` | Protokolle anzeigen (`-f` zum Streamen) |
| `pondok-ai doctor` | Docker, RAM, GPU/VRAM, Ports und Modellempfehlungen diagnostizieren |
| `pondok-ai update` | Konfigurierte gepinnte Images mit automatischem Backup und Gesundheitsprüfungen erneut laden |
| `pondok-ai backup` | Konfigurationen und Datenvolumes mit SHA-256-Integritätsprüfungen sichern (nicht verschlüsselt) |
| `pondok-ai restore <Pfad>` | Aus einem SHA-256-integritätsgeprüften Backup wiederherstellen (nicht verschlüsselt) |
| `pondok-ai reset` | Stack zurücksetzen (behält Volumes, es sei denn `--delete-data` ist angegeben) |
| `pondok-ai config` | Aktive Konfiguration inspizieren oder bearbeiten |
| `pondok-ai model list` | Heruntergeladene Modelle auflisten |
| `pondok-ai model recommend` | Hardwareorientierte Modellempfehlungen (RAM, VRAM, Festplatte) |
| `pondok-ai model install <Name>` | Neues Modell mit Vorab-Ressourcen-Sicherheitsprüfungen laden |
| `pondok-ai model remove <Name>` | Installiertes Modell löschen |
| `pondok-ai model status` | Modell-Ressourcen-Fußabdrücke inspizieren |

Images sind auf explizite Versionen gepinnt. `pondok-ai update` aktualisiert die konfigurierten Versionen; es wählt keine neueren Releases aus. Nach der Installation einer neueren CLI führen Sie `pondok-ai update --upgrade-images` aus, um nur die Legacy-Standard-Image-Tags der CLI zu migrieren. Benutzerdefinierte Image-Werte bleiben erhalten.

---

## API-Gateway

Das API-Gateway bietet Drop-in-OpenAI-REST-Endpunkte:

Setzen Sie `PONDOK_AI_API_KEY` auf den generierten `API_SECRET_KEY`, bevor Sie einen `/v1/*`-Endpunkt aufrufen.

Das Gateway begrenzt authentifizierte `/v1/*`-Anfragen pro Quell-IP standardmäßig auf 120 Anfragen pro Minute. Konfigurieren Sie `RATE_LIMIT_MAX_REQUESTS` und `RATE_LIMIT_WINDOW_MS` in `.env`, wenn Ihr lokaler Client andere Limits benötigt.

```bash
curl http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $PONDOK_AI_API_KEY" \
  -d '{
    "model": "llama3.2:3b",
    "messages": [
      { "role": "user", "content": "Hallo von meinem privaten lokalen KI-Stack!" }
    ]
  }'
```

### Verwendung mit dem offiziellen OpenAI Node.js SDK
```typescript
import OpenAI from 'openai';

const apiKey = process.env.PONDOK_AI_API_KEY;
if (!apiKey) {
  throw new Error('Setzen Sie PONDOK_AI_API_KEY auf Ihren generierten API_SECRET_KEY.');
}

const openai = new OpenAI({
  baseURL: 'http://localhost:8000/v1',
  apiKey,
});

const completion = await openai.chat.completions.create({
  model: 'llama3.2:3b',
  messages: [{ role: 'user', content: 'Erklären Sie Quantencomputing in einem Satz.' }],
});

console.log(completion.choices[0].message.content);
```

---

## Beispiele

- [`examples/openai-compat/`](./examples/openai-compat): Drop-in-OpenAI-SDK-Integrationsskript.
- [`examples/rag-example/`](./examples/rag-example): End-to-End-RAG-Pipeline mit Qdrant-Vektordatenbank und Ollama-Embeddings.

---

## Dokumentation

- [Architektur-Übersicht](./docs/architecture.md)
- [API-Gateway-Referenz](./docs/api-reference.md)
- [Konfigurationsleitfaden](./docs/configuration.md)
- [GPU-Beschleunigungs-Setup (Metal / CUDA)](./docs/gpu-setup.md)
- [Fehlerbehebung & Diagnose](./docs/troubleshooting.md)

---

## Mitwirken

Beiträge sind willkommen! Schauen Sie sich [CONTRIBUTING.md](./CONTRIBUTING.md) an, um loszulegen.

## Lizenz

[MIT](./LICENSE) © 2026 pondok-ai-Mitwirkende
