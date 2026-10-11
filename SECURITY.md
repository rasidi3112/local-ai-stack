# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Security Defaults in pondok-ai

`pondok-ai` is built with a local-first, privacy-first security architecture:
1. **Localhost Binding**: All exposed container ports default to `127.0.0.1`.
2. **Network Isolation**: Databases (PostgreSQL, Qdrant) are strictly internal to the Docker bridge network and not bound to host interfaces by default.
3. **Automated Cryptographic Secrets**: Passwords and encryption keys are auto-generated with high-entropy CSPRNG tokens.
4. **No Telemetry**: No user prompts, embeddings, or queries are ever dispatched to external cloud servers.

## Reporting a Vulnerability

If you discover a security vulnerability within `pondok-ai`, please do NOT open a public issue.

Instead, please send an email to **security@pondok-ai.org** (or use GitHub Private Vulnerability Reporting).

Please provide:
- A description of the vulnerability and potential impact.
- Steps to reproduce or proof-of-concept.
- Any suggested remediations.

We will acknowledge receipt within 48 hours and work with you on a coordinated disclosure timeline.
