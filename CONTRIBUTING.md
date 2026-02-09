# Contribuindo

Obrigado por considerar contribuir com o **self-workflows**!

## Como Contribuir

### Reportando Bugs

Antes de criar uma issue, verifique se o problema já foi reportado. Se não, use o template de bug report e preencha todas as informações solicitadas.

### Sugerindo Novas Funcionalidades

Use o template de feature request para sugerir melhorias. Funcionalidades que beneficiam a comunidade como um todo têm maior prioridade.

### Enviando Pull Requests

1. Fork o repositório
2. Crie uma branch para sua feature (`git checkout -b feature/minha-feature`)
3. Commit suas mudanças (`git commit -m 'feat: adicionar nova funcionalidade'`)
4. Push para a branch (`git push origin feature/minha-feature`)
5. Abra um Pull Request

### Padrões de Commit

Use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` Nova funcionalidade
- `fix:` Bug fix
- `docs:` Mudanças na documentação
- `style:` Mudanças de formatação (sem impacto no código)
- `refactor:` Refatoração de código
- `test:` Adicionar ou modificar testes
- `chore:` Mudanças em build process, ferramentas, etc.

### Código de Conduta

Seja respeitoso e construtivo. Discussões profissionais levam a melhores resultados.

## Configuração de Desenvolvimento

```bash
# Clonar repositório
git clone https://github.com/leoferolive/self-workflows.git
cd self-workflows

# Instalar dependências
npm install

# Instalar CLI globalmente para testes
npm link

# Testar criação de app
new-app backend test-app -u seu-usuario
```

## Estrutura do Projeto

```
self-workflows/
├── .github/
│   ├── workflows/           # Workflows CI/CD reutilizáveis
│   └── ISSUE_TEMPLATE/      # Templates para issues
├── scripts/                 # Scripts da CLI
├── templates/               # Templates para scaffolding
│   ├── backend/
│   └── frontend/
└── package.json
```

## Testes

Antes de enviar um PR, certifique-se de:

1. Testar a CLI localmente
2. Verificar que os templates gerados funcionam
3. Testar os workflows CI/CD
4. Atualizar a documentação se necessário

## Revisão

Todos os Pull Requests são revisados. Feedbacks são construtivos e visam melhorar a qualidade do código.

Obrigado por contribuir! 🎉
