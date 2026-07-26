FROM node:slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates git \
    && rm -rf /var/lib/apt/lists/*

RUN npm i -g pnpm

RUN mkdir "/.local" && chmod -R 777 "/.local"
