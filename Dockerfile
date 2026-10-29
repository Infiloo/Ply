FROM node:22-bookworm-slim

# better-sqlite3 may compile from source when no prebuilt binary matches.
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
COPY shared/package.json shared/package.json
COPY bot/package.json bot/package.json
COPY dashboard/package.json dashboard/package.json

RUN npm ci --omit=dev

COPY shared/src shared/src
COPY bot/src bot/src

ENV NODE_ENV=production
ENV PLY_DATA_DIR=/data

RUN mkdir -p /data
VOLUME ["/data"]

CMD ["node", "bot/src/index.js"]
