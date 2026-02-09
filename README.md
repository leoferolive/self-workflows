# self-workflows

[Reusable CI/CD workflows and scaffolding tools for K3s deployments](https://github.com/leoferolive/self-workflows)

Ferramenta de scaffolding para criar aplicações com infraestrutura CI/CD automatizada para deploy em cluster K3s via GitHub Actions.

## Visão Geral

O **self-workflows** fornece:

- **Workflows CI/CD reutilizáveis** via GitHub Actions
- **CLI de scaffolding** para criar novas aplicações rapidamente
- **Templates Kubernetes** prontos para deploy
- **Suporte a backend (Java/Spring Boot)** e **frontend (Node.js)**
- **Deploy automatizado** para cluster K3s via Tailscale

## Pré-requisitos

- **K3s cluster** rodando em seu homelab
- **Tailscale** configurado para acesso VPN ao cluster
- **GitHub account** com GitHub Container Registry habilitado
- **Node.js 20+** para usar a CLI de scaffolding

## Instalação

### Opção 1: Via npm (Recomendado)

```bash
# Instalar globalmente
npm install -g @leoferolive/self-workflows

# Ou usar diretamente com npx (sem instalação)
npx @leoferolive/self-workflows backend minha-api -u leoferolive
```

### Opção 2: Via Git Clone (Desenvolvimento)

```bash
# Clonar repositório
git clone https://github.com/leoferolive/self-workflows.git
cd self-workflows

# Instalar dependências
npm install

# Instalar CLI globalmente
npm link
```

## Uso

### Criar Nova Aplicação Backend

```bash
new-app backend minha-api -u leoferolive
```

### Criar Nova Aplicação Frontend

```bash
new-app frontend meu-app -u leoferolive
```

### Opções Avançadas

```bash
# Customizar domínio, versões e réplicas
new-app backend minha-api \
  -u leoferolive \
  --domain example.com \
  --java-version 17 \
  --replicas 3

new-app frontend meu-app \
  -u leoferolive \
  --domain example.com \
  --node-version 18 \
  --replicas 2
```

### Uso via npx (Sem Instalação)

```bash
npx @leoferolive/self-workflows backend minha-api -u leoferolive
npx @leoferolive/self-workflows frontend meu-app -u leoferolive
```

### Opções Disponíveis

| Opção | Descrição | Padrão |
|-------|-----------|--------|
| `-u, --user <github-user>` | Usuário do GitHub | `leoferolive` |
| `-r, --template-repo <repo>` | Repositório de templates | `self-workflows` |
| `--domain <domain>` | Domínio para ingress | `leoferolive.com.br` |
| `--java-version <version>` | Versão do Java (backend) | `21` |
| `--node-version <version>` | Versão do Node.js (frontend) | `20` |
| `--replicas <count>` | Número de réplicas | `1` |

## Estrutura do Projeto

Após criar uma aplicação com `new-app`, a seguinte estrutura será gerada:

```
minha-api/
├── .github/
│   └── workflows/
│       └── deploy.yml        # Workflow CI/CD que chama self-workflows
├── k8s/
│   ├── namespace.yaml        # Namespace Kubernetes
│   ├── deployment.yaml       # Deployment da aplicação
│   ├── service.yaml          # Service interno
│   └── ingress.yaml          # Ingress Traefik
├── Dockerfile                # Dockerfile multi-stage
└── README.md                 # Instruções básicas
```

## Configuração do GitHub

Após criar a aplicação e fazer push para o GitHub, configure os seguintes secrets:

### Secrets Necessários

1. **TAILSCALE_AUTHKEY** - Auth key do Tailscale
2. **KUBECONFIG** - Config do K3s em base64

### Gerar KUBECONFIG em Base64

```bash
# Exportar kubeconfig atual
base64 -w 0 ~/.kube/config
```

## Workflow de Deploy

1. **Push para main** → Trigger automático do workflow
2. **Build & Push** → Imagem Docker é buildada e pushada para GHCR
3. **Deploy** → Tailscale conecta ao K3s e aplica manifests Kubernetes
4. **Rollout** → Deployment é atualizado com nova imagem

## Stack de Deploy

- **Registry**: GitHub Container Registry (ghcr.io)
- **Pipeline**: GitHub Actions
- **Cluster**: K3s (homelab)
- **Networking**: Tailscale para acesso VPN
- **Ingress**: Traefik com entrada via `web` entrypoint
- **Domínio**: `{APP_NAME}.{DOMAIN}`

## Validações de Nome

O nome da aplicação deve seguir estas regras:

- Apenas letras minúsculas, números e hífens
- Não pode começar ou terminar com hífen
- Não pode conter hífens consecutivos

Exemplos válidos: `minha-api`, `app-v2`, `demo123`

Exemplos inválidos: `minha_api`, `Meu-App`, `app--v1`, `-app`

## Desenvolvimento

### Estrutura do Repositório

```
self-workflows/
├── .github/
│   └── workflows/
│       └── deploy.yml           # Workflow unificado reutilizável
├── scripts/
│   └── new-app.js               # CLI de scaffolding
├── templates/
│   ├── backend/                 # Template para backend Java
│   │   ├── .github/workflows/
│   │   ├── k8s/
│   │   └── Dockerfile
│   └── frontend/                # Template para frontend Node.js
│       ├── .github/workflows/
│       ├── k8s/
│       └── Dockerfile
└── package.json
```

### Executar CLI em Modo Desenvolvimento

```bash
# Executar sem instalar globalmente
node scripts/new-app.js backend test-app -u leoferolive
```

## Desenvolvimento

### Configurar Ambiente

```bash
# Clonar repositório
git clone https://github.com/leoferolive/self-workflows.git
cd self-workflows

# Instalar dependências
npm install

# Criar link global para testes locais
npm link
```

### Scripts Disponíveis

```bash
npm run dev          # Executa CLI localmente
npm run test         # Executa testes
npm run lint         # Verifica qualidade do código
npm run lint:fix     # Corrige problemas automaticamente
npm run format       # Formata código
npm run format:check # Verifica formatação
```

### Publicar Nova Versão

```bash
# 1. Atualizar versão (cria tag e auto-commit)
npm version major|minor|patch

# 2. Fazer push da tag
git push origin main --tags

# 3. GitHub Actions publica automaticamente no npm
```

## Contribuindo

Contribuições são bem-vindas! Por favor, leia [CONTRIBUTING.md](CONTRIBUTING.md) para detalhes.

## Licença

Este projeto está licenciado sob a licença ISC - veja o arquivo [LICENSE](LICENSE) para detalhes.

## Autor

**LeoFerOlive**

## Links

- [GitHub Repository](https://github.com/leoferolive/self-workflows)
- [Issue Tracker](https://github.com/leoferolive/self-workflows/issues)
