# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Visão Geral

Este repositório contém workflows CI/CD reutilizáveis e ferramentas de scaffolding para deploy de aplicações em um cluster K3s homelab. O projeto fornece templates para criar rapidamente novas aplicações com infraestrutura de deployment automatizada via GitHub Actions.

## Comandos Disponíveis

### Instalação para Uso

#### Via npm (Recomendado)
```bash
npm install -g @leoferolive/self-workflows
```

#### Via npx (Sem Instalação)
```bash
npx @leoferolive/self-workflows backend minha-api -u leoferolive
```

#### Via Git Clone (Desenvolvimento)
```bash
git clone https://github.com/leoferolive/self-workflows.git
cd self-workflows
npm install
npm link
```

### CLI de Scaffolding
```bash
# Instalar a CLI localmente para desenvolvimento
npm link

# Criar nova aplicação
new-app <backend|frontend> <nome-da-app> [-u github-user] [options]

# Exemplo básico:
new-app backend minha-api -u leoferolive
new-app frontend meu-app -u leoferolive

# Exemplo com opções customizadas:
new-app backend minha-api \
  -u leoferolive \
  --domain example.com \
  --java-version 17 \
  --replicas 3
```

#### Opções da CLI
- `-u, --user <github-user>` - Usuário do GitHub (padrão: leoferolive)
- `-r, --template-repo <repo>` - Repositório de templates (padrão: self-workflows)
- `--domain <domain>` - Domínio para ingress (padrão: leoferolive.com.br)
- `--java-version <version>` - Versão do Java para backend (padrão: 21)
- `--node-version <version>` - Versão do Node.js para frontend (padrão: 20)
- `--replicas <count>` - Número de réplicas (padrão: 1)

## Arquitetura

### Estrutura do Repositório
```
.github/workflows/          # Workflows reutilizáveis (workflow_call)
└── deploy.yml              # Workflow unificado para backend e frontend

scripts/
└── new-app.js              # CLI que scaffolds novas aplicações

templates/
├── backend/                # Template para aplicações backend
│   ├── .github/workflows/deploy.yml
│   ├── Dockerfile          # Dockerfile multi-stage Spring Boot
│   └── k8s/               # Manifests Kubernetes (namespace, service, deployment, ingress)
└── frontend/              # Template para aplicações frontend
    ├── .github/workflows/deploy.yml
    ├── Dockerfile          # Dockerfile multi-stage Node.js
    └── k8s/
```

### Sistema de Workflows Reutilizáveis

Os workflows em `.github/workflows/` são desenhados para serem consumidos via `workflow_call`. Aplicações criadas com a CLI incluem workflows que chamam estes workflows reutilizáveis usando `secrets: inherit`.

**Deploy Workflow Unificado** (`.github/workflows/deploy.yml`):
- Workflow único que suporta backend e frontend via input `app_type`
- Build e push de imagem Docker para GHCR (linux/arm64)
- Deploy em cluster K3s via Tailscale + kubectl
- Inputs: `app_name`, `app_namespace`, `app_type`, `dockerfile_path`, `java_version` (backend), `node_version` (frontend), `k8s_path`
- Outputs: `deployment_status`, `image_tag`

### Template System

Os templates usam placeholders com sintaxe `{{NOME_VARIAVEL}}`:
- `{{APP_NAME}}` - Nome da aplicação (usado para namespace, deployment, service, ingress)
- `{{GITHUB_USER}}` - Usuário/organização do GitHub
- `{{TEMPLATE_REPO}}` - Nome do repositório de templates (padrão: self-workflows)
- `{{DOMAIN}}` - Domínio para ingress (padrão: leoferolive.com.br)
- `{{JAVA_VERSION}}` - Versão do Java para backend (padrão: 21)
- `{{NODE_VERSION}}` - Versão do Node.js para frontend (padrão: 20)
- `{{REPLICAS}}` - Número de réplicas do deployment (padrão: 1)

A CLI `new-app.js` substitui esses placeholders durante a geração do projeto.

### Stack de Deploy

- **Registry**: GitHub Container Registry (ghcr.io)
- **Pipeline**: GitHub Actions
- **Cluster**: K3s (homelab)
- **Networking**: Tailscale para acesso VPN do GitHub Actions ao cluster
- **Ingress**: Traefik com entrada via `web` entrypoint
- **Domínio**: `{APP_NAME}.{DOMAIN}` (customizável via `--domain`, padrão: leoferolive.com.br)

### Secrets Necessários

Aplicações geradas requerem estes secrets no GitHub:
- `TAILSCALE_AUTHKEY` - Auth key do Tailscale (não é mais OAuth)
- `KUBECONFIG` - Config do K3s em base64

**Nota**: Os secrets são passados automaticamente via `secrets: inherit` no workflow call.

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
- Número de réplicas configurável via `{{REPLICAS}}` (padrão: 1)
- Services expõem port 80 internamente, mapeando para a porta do container
- Ingress usa Traefik com host pattern `{APP_NAME}.{DOMAIN}` (customizável)

### Validações de Nome
A CLI valida o nome da aplicação seguindo as convenções Kubernetes:
- Apenas letras minúsculas, números e hífens
- Não pode começar ou terminar com hífen
- Não pode conter hífens consecutivos
- Máximo 63 caracteres (limite do Kubernetes)

### Diferenças Backend vs Frontend
- **Backend**: Porta 8080, health checks do Spring Actuator, mais recursos (512Mi/1Gi)
- **Frontend**: Porta 80, health check simples `/`, menos recursos (128Mi/256Mi)

### Dockerfiles Templates
Cada template inclui um Dockerfile multi-stage otimizado:

**Backend** (`templates/backend/Dockerfile`):
- Build stage: Maven + Eclipse Temurin JDK `{{JAVA_VERSION}}`
- Runtime stage: Eclipse Temurin JRE `{{JAVA_VERSION}}`
- Usa usuário non-root para segurança
- Health check via `/actuator/health`
- Cache layer do Maven para builds mais rápidos

**Frontend** (`templates/frontend/Dockerfile`):
- Build stage: Node.js `{{NODE_VERSION}}` para npm install + build
- Runtime stage: nginx alpine servindo arquivos estáticos
- Health check via HTTP /
- Otimizado para SPA (Single Page Applications)

## Publicação no npm

### Criar Conta e Token npm

1. Acessar https://www.npmjs.com/signup e criar conta
2. Verificar email de confirmação
3. Acessar https://www.npmjs.com/settings/leoferolive/tokens
4. Criar "Automation" token (não "Automation" + "Automation")
5. Copiar o token gerado

### Configurar GitHub

1. Acessar https://github.com/leoferolive/self-workflows/settings/secrets/actions
2. Adicionar novo secret chamado `NPM_TOKEN`
3. Colar o token do npm

### Publicar Nova Versão

```bash
# Atualizar versão (cria tag git e auto-commit)
npm version major|minor|patch

# Push da tag (triggera GitHub Actions)
git push origin main --tags
```

O workflow `.github/workflows/npm-publish.yml` será executado automaticamente e publicará no npm.
