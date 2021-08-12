FROM node:slim

RUN apt-get update && apt-get upgrade && apt-get install -y yarn

RUN mkdir -p /.cache/yarn && chmod -R 777 /.cache/yarn
RUN mkdir -p /.yarn && chmod -R 777 /.yarn
