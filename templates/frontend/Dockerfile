# Multi-stage Dockerfile para Node.js
# Build stage
FROM node:{{NODE_VERSION}}-alpine AS builder

WORKDIR /app

# Copiar package.json e baixar dependências (cache layer)
COPY package*.json ./
RUN npm ci

# Copiar código fonte e build
COPY . .
RUN npm run build

# Runtime stage
FROM nginx:alpine

# Copiar arquivos buildados para nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuração customizada do nginx (opcional)
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expor porta
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
