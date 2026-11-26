FROM node:22-bookworm-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./
COPY bot/package.json ./bot/package.json
COPY dashboard/package.json ./dashboard/package.json
RUN npm ci

COPY . .
RUN npm run build && npm prune --omit=dev

FROM node:22-bookworm-slim AS runtime

WORKDIR /app
ENV NODE_ENV=production
ENV DIMSUM_DATA_DIR=/data

COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/bot/package.json ./bot/package.json
COPY --from=build --chown=node:node /app/bot/prod ./bot/prod
COPY --from=build --chown=node:node /app/dashboard/package.json ./dashboard/package.json
COPY --from=build --chown=node:node /app/dashboard/dist ./dashboard/dist

RUN mkdir -p /data && chown node:node /data

USER node

EXPOSE 3001
VOLUME ["/data"]

CMD ["node", "bot/prod/app.js"]
