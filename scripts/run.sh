#!/usr/bin/bash

docker run \
    --rm \
    -v ${PWD}/data:/app/data \
    -p 3000:3000 \
    --env-file .env \
    expenses-v2