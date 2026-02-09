#!/usr/bin/env node

import { program } from 'commander';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Recriar __dirname em ES Modules (necessário porque __dirname não existe nativamente em ESM)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

program
    .name('new-app')
    .description('Cria uma nova aplicação para deploy no homelab K3s')
    .argument('<type>', 'Tipo da aplicação: backend ou frontend')
    .argument('<name>', 'Nome da aplicação (ex: my-api)')
    .option('-u, --user <github-user>', 'Usuário do GitHub', 'leoferolive')
    .option('-r, --template-repo <repo>', 'Repositório de templates (self-workflows)', 'self-workflows')
    .option('--domain <domain>', 'Domínio para ingress (padrão: leoferolive.com.br)', 'leoferolive.com.br')
    .option('--java-version <version>', 'Versão do Java (backend, padrão: 21)', '21')
    .option('--node-version <version>', 'Versão do Node.js (frontend, padrão: 20)', '20')
    .option('--replicas <count>', 'Número de réplicas (padrão: 1)', '1')
    .action((type, name, options) => {
        if (!['backend', 'frontend'].includes(type)) {
            console.log(chalk.red('❌ Tipo inválido! Use: backend ou frontend'));
            process.exit(1);
        }

        // Validar nome da aplicação
        if (!/^[a-z0-9-]+$/.test(name)) {
            console.log(chalk.red('❌ Nome inválido! Use apenas letras minúsculas, números e hífens.'));
            console.log(chalk.yellow('Exemplo: minha-api, app-v2, demo123'));
            process.exit(1);
        }

        // Validar que nome não começa ou termina com hífen
        if (name.startsWith('-') || name.endsWith('-')) {
            console.log(chalk.red('❌ Nome não pode começar ou terminar com hífen!'));
            process.exit(1);
        }

        // Validar que não há hífens consecutivos
        if (name.includes('--')) {
            console.log(chalk.red('❌ Nome não pode conter hífens consecutivos!'));
            process.exit(1);
        }

        console.log(chalk.blue(`\n🚀 Criando aplicação ${type}: ${name}\n`));

        const templateDir = path.join(__dirname, '..', 'templates', type);

        // Validar que o template existe
        if (!fs.existsSync(templateDir)) {
            console.log(chalk.red(`❌ Template "${type}" não encontrado em: ${templateDir}`));
            process.exit(1);
        }

        const outputDir = path.join(process.cwd(), name);

        // Verificar se já existe
        if (fs.existsSync(outputDir)) {
            console.log(chalk.red(`❌ Pasta ${name} já existe!`));
            process.exit(1);
        }

        // Verificar permissões de escrita no diretório pai
        const parentDir = path.dirname(outputDir);
        try {
            fs.accessSync(parentDir, fs.constants.W_OK);
        } catch (err) {
            console.log(chalk.red(`❌ Sem permissão de escrita em: ${parentDir}`));
            process.exit(1);
        }

        // Preparar replacements
        const replacements = {
            APP_NAME: name,
            GITHUB_USER: options.user,
            TEMPLATE_REPO: options.templateRepo,
            DOMAIN: options.domain,
            JAVA_VERSION: options.javaVersion,
            NODE_VERSION: options.nodeVersion,
            REPLICAS: options.replicas
        };

        // Copiar templates
        copyDir(templateDir, outputDir, replacements);

        console.log(chalk.green(`\n✅ Aplicação criada com sucesso!`));
        console.log(chalk.yellow(`\n📁 Estrutura criada em: ${outputDir}`));
        console.log(chalk.cyan(`\n📋 Próximos passos:`));
        console.log(chalk.white(`   1. cd ${name}`));
        console.log(chalk.white(`   2. Crie seu código-fonte`));
        console.log(chalk.white(`   3. Crie o Dockerfile (ou use o template incluído)`));
        console.log(chalk.white(`   4. git init && git add . && git commit -m "Initial commit"`));
        console.log(chalk.white(`   5. Crie repo no GitHub e faça push`));
        console.log(chalk.white(`   6. Configure os secrets no GitHub (TS_OAUTH_CLIENT_ID, TS_OAUTH_SECRET, KUBECONFIG)`));
        console.log(chalk.white(`   7. git push origin main - Deploy automático! 🎉\n`));
    });

function copyDir(src, dest, replacements) {
    fs.mkdirSync(dest, { recursive: true });

    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            copyDir(srcPath, destPath, replacements);
        } else {
            let content = fs.readFileSync(srcPath, 'utf8');

            // Substituir placeholders
            for (const [key, value] of Object.entries(replacements)) {
                content = content.replace(new RegExp(`{{${key}}}`, 'g'), value);
            }

            fs.writeFileSync(destPath, content);
            console.log(chalk.gray(`   ✓ ${destPath.replace(process.cwd() + '/', '')}`));
        }
    }
}

program.parse();