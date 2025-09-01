#!/usr/bin/bash

# '--init' needed to kill the container with Ctrl + C when using bun for
# some reason.
docker run \
    --rm \
    --init \
    -v ${PWD}/data:/app/data \
    -p 3000:3000 \
    --env-file .env \
    expenses-v2:dev
