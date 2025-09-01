# use the official Bun image
# see all versions at https://hub.docker.com/r/oven/bun/tags
FROM oven/bun:1-alpine AS base
WORKDIR /app

# install dependencies into temp directory
# this will cache them and speed up future builds
FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json bun.lock /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

# copy dependencies and source code into final image
FROM base AS dev
COPY --from=install /temp/dev/node_modules node_modules
COPY . .
# RUN chown -R bun:bun /app

# run the app
# USER bun
EXPOSE 3000/tcp
ENTRYPOINT [ "bun", "run", "dev", "--host", "0.0.0.0" ]
