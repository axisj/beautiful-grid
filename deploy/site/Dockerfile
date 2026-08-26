FROM node:22.22.3-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY site/package.json site/package-lock.json ./site/

RUN npm ci \
  && npm --prefix site ci

COPY . .

RUN npm --prefix site run test -- test/deployment-contract.test.ts \
  && npm run site:build

FROM nginx:1.28-alpine AS site

COPY deploy/site/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/site/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=5 \
  CMD wget -qO- --timeout=5 http://127.0.0.1/health >/dev/null || exit 1
