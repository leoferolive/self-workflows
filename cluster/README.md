# cluster/ — Ops do cluster K3s (homelab)

Manifests de operação do cluster que não pertencem a nenhum app específico
(backups de banco, health-checks sintéticos). Deploy é manual via `kubectl apply`,
consistente com o monitoring (que hoje vive em `chat-api/k8s/monitoring/`).

> Este diretório é ignorado pelo scaffolding (`new-app` copia apenas `templates/`)
> e não vai para o pacote npm (whitelist `files` do package.json).

## Conteúdo

| Manifest | Namespace | Schedule | O que faz |
| --- | --- | --- | --- |
| `backup/cronjob-pg-backup-database.yaml` | `database` | `20 3 * * *` (diário 03:20 UTC) | `pg_dumpall` do Postgres compartilhado (nossalista, nossagrana_prod, grafana + roles) → gzip no PVC `postgres-backup` |
| `backup/cronjob-pg-backup-nossoradar.yaml` | `nossoradar` | `40 3 * * *` (diário 03:40 UTC) | `pg_dumpall` do Postgres do nossoradar → gzip no PVC `nossoradar-backup` |
| `healthcheck/cronjob-ingress-healthcheck.yaml` | `monitoring` | `*/15 * * * *` | `curl` em todos os hostnames públicos `*.leoferolive.com.br`; falha se ≥1 host falhar |

Horários escolhidos para não colidir com os CronJobs existentes
(`chat-api-judge` em `0 */4 * * *`, `chat-api-rotate-session` em 03:00/04:00).
Todos com `concurrencyPolicy: Forbid` e requests/limits pequenos —
a memória do nó é o recurso escasso (~90% de uso).

## Aplicar

```bash
kubectl apply -f cluster/backup/
kubectl apply -f cluster/healthcheck/
kubectl get cronjob -A
```

Aplicar **um CronJob por vez** e observar `kubectl top node` antes do próximo
(restrição de memória do nó).

## Alertas

Falha de Job dispara a regra default `KubeJobFailed` do kube-prometheus-stack,
que roteia para o receiver Telegram já configurado (`telegram-warning`).
A regra tem `for: 15m` — **a mensagem chega ~15 minutos após a falha**.

## Testar manualmente

```bash
# run manual do backup
kubectl create job --from=cronjob/pg-backup -n database test-backup-1
kubectl logs -n database job/test-backup-1 -f

# conferir o dump
kubectl run -n database backup-check --rm -it --restart=Never \
  --image=postgres:17-alpine --overrides='{"spec":{"containers":[{"name":"backup-check","image":"postgres:17-alpine","command":["sh"],"stdin":true,"tty":true,"volumeMounts":[{"name":"b","mountPath":"/backup"}]}],"volumes":[{"name":"b","persistentVolumeClaim":{"claimName":"postgres-backup"}}]}}'
# dentro do pod: gunzip -t /backup/*.sql.gz && zcat /backup/*.sql.gz | head -50
```

## Restore

```bash
# restaurar TUDO (roles + todos os bancos) num Postgres vazio:
zcat pg-all-YYYY-MM-DD.sql.gz | psql -h <host> -U <superuser> postgres

# restaurar UM banco num banco scratch (drill de teste):
createdb -h <host> -U <superuser> restore_test
# ATENÇÃO: o "tail -n +2" é obrigatório — ele remove a linha "\connect <db>";
# sem isso o psql RECONECTA NO BANCO VIVO e roda o script lá.
zcat pg-all-YYYY-MM-DD.sql.gz \
  | sed -n '/^\\connect nossalista$/,/^\\connect /p' | tail -n +2 | sed '$d' \
  | psql -h <host> -U <superuser> -d restore_test
```

Drill de restore deve ser executado após qualquer mudança nestes manifests —
backup sem restore testado não é backup.

## Limitações conhecidas

- **Backups ficam no mesmo nó** (PVC local-path no SD/disco do Pi): protegem contra
  corrupção lógica e DELETE acidental, **não** contra perda do nó/disco.
  Item futuro: cópia off-node (ex.: rclone para storage cloud, cifrado).
- Retenção: 14 dias (`find -mtime +14 -delete` no próprio job).
- O healthcheck atravessa o Cloudflare: queda do Cloudflare gera falso positivo
  em todos os hosts ao mesmo tempo — o log imprime "N de M falharam" para
  diagnóstico rápido.
