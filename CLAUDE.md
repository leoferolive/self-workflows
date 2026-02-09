# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Visão Geral

Este repositório contém workflows CI/CD reutilizáveis e ferramentas de scaffolding para deploy de aplicações em um cluster K3s homelab. O projeto fornece templates para criar rapidamente novas aplicações com infraestrutura de deployment automatizada via GitHub Actions.

## Comandos Disponíveis

### CLI de Scaffolding
```bash
# Instalar a CLI localmente para desenvolvimento
npm link

# Criar nova aplicação
new-app <backend|frontend> <nome-da-app> [-u github-user]

# Exemplo:
new-app backend minha-api -u leoferolive
new-app frontend meu-app -u leoferolive
```

## Arquitetura

### Estrutura do Repositório
```
.github/workflows/          # Workflows reutilizáveis (workflow_call)
├── backend-deploy.yml      # Workflow padrão para backends Java
└── frontend-deploy.yml     # Workflow padrão para frontends Node.js

scripts/
└── new-app.js              # CLI que scaffolds novas aplicações

templates/
├── backend/                # Template para aplicações backend
│   ├── .github/workflows/deploy.yml
│   └── k8s/               # Manifests Kubernetes (namespace, service, deployment, ingress)
└── frontend/              # Template para aplicações frontend
    ├── .github/workflows/deploy.yml
    └── k8s/
```

### Sistema de Workflows Reutilizáveis

Os workflows em `.github/workflows/` são desenhados para serem consumidos via `workflow_call`. Aplicações criadas com a CLI incluem workflows que chamam estes workflows reutilizáveis usando `secrets: inherit`.

**Backend Deploy Workflow** (`.github/workflows/backend-deploy.yml`):
- Build e push de imagem Docker para GHCR (linux/arm64)
- Deploy em cluster K3s via Tailscale + kubectl
- Inputs: `app_name`, `app_namespace`, `dockerfile_path`, `java_version`, `k8s_path`

**Frontend Deploy Workflow** (`.github/workflows/frontend-deploy.yml`):
- Idêntico ao backend, mas sem `java_version` (usa `node_version`)
- Mesma estratégia de build e deploy

### Template System

Os templates usam placeholders com sintaxe `{{NOME_VARIAVEL}}`:
- `{{APP_NAME}}` - Nome da aplicação (usado para namespace, deployment, service, ingress)
- `{{GITHUB_USER}}` - Usuário/organização do GitHub

A CLI `new-app.js` substitui esses placeholders durante a geração do projeto.

### Stack de Deploy

- **Registry**: GitHub Container Registry (ghcr.io)
- **Pipeline**: GitHub Actions
- **Cluster**: K3s (homelab)
- **Networking**: Tailscale para acesso VPN do GitHub Actions ao cluster
- **Ingress**: Traefik com entrada via `web` entrypoint
- **Domínio**: `{APP_NAME}.leoferolive.com.br`

### Secrets Necessários

Aplicações geradas requerem estes secrets no GitHub:
- `TS_OAUTH_CLIENT_ID` - OAuth client ID do Tailscale
- `TS_OAUTH_SECRET` - OAuth secret do Tailscale
- `KUBECONFIG` - Config do K3s em base64

## Convenções de Código

### ES Modules
O projeto usa ES Modules (`"type": "module"` em package.json). Em scripts Node.js:
- Use `import`/`export` ao invés de `require()`
- `__dirname` não existe nativamente - recriar com:
  ```js
  import { fileURLToPath } from 'url';
  import path from 'path';
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  ```

### Padrões Kubernetes
- Cada app tem seu próprio namespace com o mesmo nome da app
- Deployments usam `app: {APP_NAME}` como selector label
- Services expõem port 80 internamente, mapeando para a porta do container
- Ingress usa Traefik com host pattern `{APP_NAME}.leoferolive.com.br`

### Diferenças Backend vs Frontend
- **Backend**: Porta 8080, health checks do Spring Actuator, mais recursos (512Mi/1Gi)
- **Frontend**: Porta 80, health check simples `/`, menos recursos (128Mi/256Mi)
