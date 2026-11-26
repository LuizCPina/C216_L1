# Etapa 1: o Node gera os arquivos estaticos com o Vite.
FROM node:26-alpine AS build

WORKDIR /app

# Primeiro so as dependencias: se o package-lock nao mudar, o Docker reaproveita
# esta camada e o npm ci nao roda de novo a cada build.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# O endereco da API entra no JavaScript na hora do build (import.meta.env).
# Quem chama a API e o navegador, na maquina de quem usa: por isso localhost.
ARG VITE_API_URL=http://localhost:8000
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Etapa 2: so o nginx servindo o resultado, sem Node nem node_modules.
FROM nginx:stable-alpine

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
