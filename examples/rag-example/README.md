# RAG Pipeline Example with Qdrant & Ollama

This example demonstrates a complete **Retrieval-Augmented Generation (RAG)** pipeline using:
1. **Ollama** embeddings (`nomic-embed-text`) via the API Gateway (`/v1/embeddings`)
2. **Qdrant** vector database for indexing and cosine similarity search
3. **Ollama** chat completions (`llama3.2:3b`) via the API Gateway (`/v1/chat/completions`)

---

## Prerequisites

1. Start `pondok-ai` with the `standard` preset:
   ```bash
   npx pondok-ai init --preset standard --yes
   npx pondok-ai up
   ```
2. Pull required models:
   ```bash
   npx pondok-ai model install llama3.2:3b
   npx pondok-ai model install nomic-embed-text
   ```
3. Set `PONDOK_AI_API_KEY` to the generated `API_SECRET_KEY` for the stack before running the scripts.

---

## Running the Pipeline

```bash
# 1. Install dependencies
npm install

# 2. Provide the gateway credential
export PONDOK_AI_API_KEY='<your API_SECRET_KEY>'

# 3. Ingest sample documents into Qdrant
npm run ingest

# 4. Ask questions augmented with retrieved knowledge
npm run query "How does quantization help run models on laptops?"
```
