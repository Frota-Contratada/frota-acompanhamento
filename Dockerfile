FROM node:22.22.3-bookworm-slim AS base

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci


FROM base AS dev

ENV NODE_ENV=development

COPY . .

EXPOSE 3001

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3001"]


FROM base AS build

ARG VITE_PARENT_ORIGINS="http://localhost:5173"

ENV VITE_PARENT_ORIGINS=${VITE_PARENT_ORIGINS}

COPY . .

RUN npm run build


FROM nginx:1.28-alpine AS runner

COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8081

HEALTHCHECK \
    --interval=30s \
    --timeout=5s \
    --start-period=5s \
    --retries=3 \
    CMD wget -q -O - http://127.0.0.1:8081/health || exit 1
