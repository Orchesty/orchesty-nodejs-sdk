FROM node:slim

RUN apt-get update && apt-get upgrade && apt-get install -y \
    yarn

RUN yarn set version berry
RUN yarn set version 2.4.2
RUN mkdir -p /.yarn/berry && chmod -R 777 /.yarn/berry
