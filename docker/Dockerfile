FROM node:slim

RUN apt-get update && apt-get upgrade -y && apt-get install -y yarn
RUN apt-get autoclean -y && apt-get autoremove -y

RUN mkdir -p /.cache/yarn && chmod -R 777 /.cache/yarn
RUN mkdir -p /.yarn && chmod -R 777 /.yarn
