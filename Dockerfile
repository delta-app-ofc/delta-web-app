FROM node:22-bookworm-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . ./

# Vite compila as variáveis VITE_* neste estágio. No Render, configure-as
# como Environment Variables antes do deploy.
RUN npm run lint && npm run build

FROM nginx:1.27-alpine AS runtime

# O entrypoint oficial do Nginx processa arquivos *.template e substitui
# PORT usando a variável definida pelo Render.
ENV PORT=10000
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 10000
