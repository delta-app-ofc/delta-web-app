FROM node:22-bookworm-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . ./

# O Render fornece as variáveis do serviço como build args. Declare as
# configurações públicas neste estágio para o Vite incorporá-las ao bundle.
ARG VITE_POSTGRES_API_URL
ARG VITE_MONGO_API_URL
ARG VITE_RANKING_API_URL
ARG VITE_AI_API_URL
ARG VITE_WEATHER_API_URL
ARG VITE_TARIFF_REGIONS

RUN npm run lint && npm run build

FROM nginx:1.27-alpine AS runtime

# O entrypoint oficial do Nginx processa arquivos *.template e substitui
# PORT usando a variável definida pelo Render.
ENV PORT=10000
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 10000
