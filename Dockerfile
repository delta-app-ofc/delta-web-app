FROM node:22-slim AS checks

WORKDIR /workspace

COPY package.json package-lock.json ./
RUN npm ci

COPY . ./

CMD ["sh", "-c", "npm run lint && npm run build"]
