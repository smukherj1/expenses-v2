FROM node:24.6.0-alpine3.22 AS base
WORKDIR /app

FROM base AS install
RUN mkdir -p /temp/prod
COPY package*.json /temp/prod/
RUN cd /temp/prod && npm install --omit=dev

FROM install AS builder
COPY --from=install /temp/prod/node_modules node_modules
COPY . .
RUN npm install
RUN npm run build

FROM base AS release
COPY --from=install /temp/prod/node_modules node_modules
COPY --from=builder /app/.output .output
COPY --from=builder /app/package.json .
ENV DB_FILE_NAME=file:data/local.db

USER node
EXPOSE 3000/tcp
ENTRYPOINT [ "node", ".output/server/index.mjs" ]