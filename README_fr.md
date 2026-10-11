# pondok-ai

[English](README.md) · [Bahasa Indonesia](README_id.md) · [한국어](README_ko.md) · [العربية](README_ar.md) · [Español](README_es.md) · [中文](README_zh.md) · **Français** · [日本語](README_ja.md) · [Deutsch](README_de.md) · [Português](README_pt.md) · [Русский](README_ru.md) · [हिन्दी](README_hi.md) · [Türkçe](README_tr.md) · [Italiano](README_it.md) · [Tiếng Việt](README_vi.md)

<p align="center">
  <strong>Exécutez votre propre pile IA privée localement avec une seule commande.</strong>
</p>

<p align="center">
  <a href="#démarrage-rapide">Démarrage Rapide</a> •
  <a href="#fonctionnalités">Fonctionnalités</a> •
  <a href="#préconfigurations">Préconfigurations</a> •
  <a href="#commandes-cli">Commandes CLI</a> •
  <a href="#passerelle-api">Passerelle API</a> •
  <a href="#exemples">Exemples</a> •
  <a href="#documentation">Documentation</a>
</p>

---

## Aperçu

`pondok-ai` est une boîte à outils CLI et d'orchestration de conteneurs conviviale pour les développeurs et sans friction qui démarre un environnement IA complet et privé directement sur votre poste de travail local.

Propulsé par **Docker Compose v2**, `pondok-ai` vous offre des LLM locaux, une interface de chat, une recherche vectorielle, une persistance de base de données et une passerelle API compatible OpenAI en quelques secondes. Les prompts, chats et embeddings sont traités sur votre machine ; le téléchargement des images de conteneurs et des poids de modèles nécessite une connexion Internet.

```bash
npx pondok-ai init
npx pondok-ai up
```

---

## Fonctionnalités

-  **Traitement Local** : Les prompts, chats, embeddings et inférences s'exécutent sur votre matériel. Le téléchargement initial des images de conteneurs et des modèles nécessite un accès Internet.
- ⚡ **Configuration Sans Friction** : Détecte automatiquement le système d'exploitation, l'architecture, la RAM et le GPU (Apple Metal / NVIDIA CUDA).
-  **Préconfigurations Modulaires** : Évoluez d'une interface de chat légère (`minimal`) à une pile RAG d'entreprise (`standard`) ou un pipeline d'automatisation autonome (`full`).
-  **Passerelle Compatible OpenAI** : Pointez les SDK OpenAI standard ou LangChain directement vers `http://localhost:8000/v1` sans réécrire de code.
-  **Gestionnaire de Modèles Intégré** : Téléchargez, listez, inspectez et supprimez des modèles avec des avertissements de sécurité RAM/disque intégrés.
-  **Diagnostics Auto-Réparateurs** : La commande `doctor` intégrée diagnostique les collisions de ports, l'état du démon Docker et les limites de ressources avant que vous ne rencontriez des problèmes.

---

## Architecture

```
┌───────────────────────────────────────────────────────────────┐
│                  Machine Hôte (CLI)                           │
│                                                               │
│   Port 3000             Port 8000           Port 5678         │
│       │                     │                   │             │
└───────┼─────────────────────┼───────────────────┼─────────────┘
        ▼                     ▼                   ▼
  ┌───────────┐         ┌───────────┐       ┌───────────┐
  │ Open      │         │ Passerelle│       │ n8n       │
  │ WebUI     │         │ API       │       │ (Full)    │
  └─────┬─────┘         └─────┬─────┘       └─────┬─────┘
        │                     │                   │
        ├─────────────────────┼───────────────────┤
        ▼                     ▼                   ▼
  ┌───────────┐         ┌───────────┐       ┌───────────┐
  │ Ollama    │         │ Qdrant    │       │ Postgres  │
  │ (LLMs)    │         │ (Vecteur) │       │ (État)    │
  └───────────┘         └───────────┘       └───────────┘
```

---

## Préconfigurations

| Préconfiguration | Services Inclus | RAM Min | Recommandé Pour |
|---|---|---|---|
| **`minimal`** | Ollama, Open WebUI | 8 GB | Chat local rapide, expérimentation légère |
| **`standard`** *(par défaut)* | Ollama, Open WebUI, PostgreSQL, Qdrant, Passerelle API | 16 GB | Pipelines RAG, développement d'applications, remplacement d'OpenAI |
| **`full`** | Standard + moteur d'automatisation n8n | 16+ GB | Agents IA autonomes, automatisation de flux visuels |

---

## Démarrage Rapide

### Installation Automatisée en Une Commande

#### macOS et Linux
```bash
curl -fsSL https://raw.githubusercontent.com/rasidi3112/pondok-ai/main/scripts/install.sh | bash
```

#### Windows (PowerShell)
```powershell
iwr -useb https://raw.githubusercontent.com/rasidi3112/pondok-ai/main/scripts/install.ps1 | iex
```

### Démarrage Rapide Manuel via npx

Prérequis : Node.js 22 ou ultérieur, Docker et Docker Compose v2.

#### 1. Initialiser la pile
```bash
# Assistant de configuration interactif avec détection automatique du matériel
npx pondok-ai init

# Ou non interactif avec une préconfiguration choisie
npx pondok-ai init --preset standard --yes
```

#### 2. Démarrer les services avec vérifications automatiques de santé
```bash
npx pondok-ai up
```

Une fois en cours d'exécution, accédez à votre pile :
- **Open WebUI** : [http://localhost:3000](http://localhost:3000)
- **Passerelle API** : [http://localhost:8000](http://localhost:8000)
- **Ollama** : [http://localhost:11434](http://localhost:11434)
- **Qdrant** : [http://localhost:6333/dashboard](http://localhost:6333/dashboard) *(lorsque mappé)*

#### 3. Détection Matérielle Intelligente et Recommandations de Modèles
```bash
# Obtenez des recommandations intelligentes basées sur votre RAM/VRAM
npx pondok-ai model recommend

# Installez un modèle avec vérification préalable de sécurité mémoire et disque
npx pondok-ai model install llama3.2:3b
```

---

## Commandes CLI

| Commande | Description |
|---|---|
| `pondok-ai init` | Exécuter l'assistant de configuration interactif avec détection matérielle |
| `pondok-ai up` | Valider la configuration Compose, démarrer les conteneurs et attendre les vérifications de santé |
| `pondok-ai down` | Arrêter et supprimer les conteneurs de la pile |
| `pondok-ai start` | Démarrer les conteneurs arrêtés existants |
| `pondok-ai stop` | Arrêter les conteneurs en cours d'exécution |
| `pondok-ai restart` | Redémarrer les conteneurs de la pile |
| `pondok-ai status` | Afficher la santé des conteneurs et les URL |
| `pondok-ai logs [service]` | Afficher les journaux (`-f` pour diffuser) |
| `pondok-ai doctor` | Diagnostiquer Docker, RAM, GPU/VRAM, ports et recommandations de modèles |
| `pondok-ai update` | Re-télécharger les images épinglées configurées avec sauvegarde automatique et vérifications de santé |
| `pondok-ai backup` | Sauvegarder les configurations et volumes de données avec vérifications d'intégrité SHA-256 (non crypté) |
| `pondok-ai restore <chemin>` | Restaurer depuis une sauvegarde vérifiée par intégrité SHA-256 (non crypté) |
| `pondok-ai reset` | Réinitialiser la pile (préserve les volumes sauf si `--delete-data` est spécifié) |
| `pondok-ai config` | Inspecter ou modifier la configuration active |
| `pondok-ai model list` | Lister les modèles téléchargés |
| `pondok-ai model recommend` | Recommandations de modèles adaptées au matériel (RAM, VRAM, Disque) |
| `pondok-ai model install <nom>` | Télécharger un nouveau modèle avec vérifications préalables de sécurité des ressources |
| `pondok-ai model remove <nom>` | Supprimer un modèle installé |
| `pondok-ai model status` | Inspecter les empreintes de ressources des modèles |

Les images sont épinglées à des versions explicites. `pondok-ai update` actualise les versions configurées ; il ne sélectionne pas de versions plus récentes. Après avoir installé une CLI plus récente, exécutez `pondok-ai update --upgrade-images` pour migrer uniquement les balises d'image par défaut héritées de la CLI. Les valeurs d'image personnalisées sont préservées.

---

## Passerelle API

La passerelle API fournit des endpoints REST compatibles OpenAI :

Définissez `PONDOK_AI_API_KEY` sur le `API_SECRET_KEY` généré avant d'appeler un endpoint `/v1/*`.

La passerelle limite les requêtes authentifiées `/v1/*` par adresse IP source à 120 requêtes par minute par défaut. Configurez `RATE_LIMIT_MAX_REQUESTS` et `RATE_LIMIT_WINDOW_MS` dans `.env` si votre client local nécessite des limites différentes.

```bash
curl http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $PONDOK_AI_API_KEY" \
  -d '{
    "model": "llama3.2:3b",
    "messages": [
      { "role": "user", "content": "Bonjour depuis ma pile IA locale privée !" }
    ]
  }'
```

### Utilisation avec le SDK Node.js Officiel d'OpenAI
```typescript
import OpenAI from 'openai';

const apiKey = process.env.PONDOK_AI_API_KEY;
if (!apiKey) {
  throw new Error('Définissez PONDOK_AI_API_KEY sur votre API_SECRET_KEY généré.');
}

const openai = new OpenAI({
  baseURL: 'http://localhost:8000/v1',
  apiKey,
});

const completion = await openai.chat.completions.create({
  model: 'llama3.2:3b',
  messages: [{ role: 'user', content: 'Expliquez l\'informatique quantique en une phrase.' }],
});

console.log(completion.choices[0].message.content);
```

---

## Exemples

- [`examples/openai-compat/`](./examples/openai-compat) : Script d'intégration directe du SDK OpenAI.
- [`examples/rag-example/`](./examples/rag-example) : Pipeline RAG de bout en bout utilisant la base de données vectorielle Qdrant et les embeddings Ollama.

---

## Documentation

- [Aperçu de l'Architecture](./docs/architecture.md)
- [Référence de la Passerelle API](./docs/api-reference.md)
- [Guide de Configuration](./docs/configuration.md)
- [Configuration de l'Accélération GPU (Metal / CUDA)](./docs/gpu-setup.md)
- [Dépannage et Diagnostics](./docs/troubleshooting.md)

---

## Contribuer

Les contributions sont les bienvenues ! Consultez [CONTRIBUTING.md](./CONTRIBUTING.md) pour commencer.

## Licence

[MIT](./LICENSE) © 2026 contributeurs de pondok-ai
