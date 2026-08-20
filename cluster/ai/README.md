# LiteLLM no namespace `ai`

## ChatGPT Subscription (`chatgpt/`)

O token OAuth fica no PVC `litellm-chatgpt-auth`, montado em
`/var/lib/litellm/chatgpt`. O login deve ser concluído em um pod temporário
**antes** do upgrade Helm; caso contrário, o proxy espera o device flow durante
o startup e o rollout expira.

O overlay mantém o endpoint PostgreSQL como FQDN absoluto
(`postgres.database.svc.cluster.local.`). O ponto final evita que o resolver do
pod acrescente o search domain do Tailscale antes de consultar o serviço K3S.

```bash
kubectl apply -f cluster/ai/litellm-chatgpt-auth-pvc.yaml
```

Crie um pod temporário com a mesma imagem do release, o PVC montado e
`CHATGPT_TOKEN_DIR=/var/lib/litellm/chatgpt`, então execute:

```bash
python -c 'from litellm.llms.chatgpt.authenticator import Authenticator; Authenticator().get_access_token()'
```

Depois que o login terminar, confirme apenas a existência de `auth.json` — não
imprima seu conteúdo — e remova o pod temporário. Só então aplique o overlay,
preservando os valores existentes e a versão 1.93.0 do chart:

```bash
helm upgrade litellm oci://ghcr.io/berriai/litellm-helm \
  --namespace ai \
  --version 1.93.0 \
  --reuse-values \
  -f cluster/ai/litellm-chatgpt-values.yaml \
  --rollback-on-failure --wait --timeout 10m
```

Os modelos expostos pelo proxy, todos em modo Responses, são:

1. `gpt-5.6-sol` (primeiro/default nos clientes que respeitam a ordem)
2. `gpt-5.6-terra`
3. `gpt-5.6-luna`
4. `gpt-5.5`
5. `gpt-5.4`
6. `gpt-5.4-mini`

Todos foram validados diretamente com a conta autenticada antes do upgrade
Helm. O LiteLLM expõe a lista, mas cada cliente ainda pode escolher seu próprio
modelo default.
