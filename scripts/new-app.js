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
    .action((type, name, options) => {
        if (!['backend', 'frontend'].includes(type)) {
            console.log(chalk.red('❌ Tipo inválido! Use: backend ou frontend'));
            process.exit(1);
        }

        console.log(chalk.blue(`\n🚀 Criando aplicação ${type}: ${name}\n`));

        const templateDir = path.join(__dirname, '..', 'templates', type);
        const outputDir = path.join(process.cwd(), name);

        // Verificar se já existe
        if (fs.existsSync(outputDir)) {
            console.log(chalk.red(`❌ Pasta ${name} já existe!`));
            process.exit(1);
        }

        // Copiar templates
        copyDir(templateDir, outputDir, {
            APP_NAME: name,
            GITHUB_USER: options.user
        });

        console.log(chalk.green(`\n✅ Aplicação criada com sucesso!`));
        console.log(chalk.yellow(`\n📁 Estrutura criada em: ${outputDir}`));
        console.log(chalk.cyan(`\n📋 Próximos passos:`));
        console.log(chalk.white(`   1. cd ${name}`));
        console.log(chalk.white(`   2. Crie seu código-fonte`));
        console.log(chalk.white(`   3. Crie o Dockerfile`));
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