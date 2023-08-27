FROM node:16-alpine as build-image

LABEL maintainer Amiaya Boss

WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn

COPY . .

RUN yarn build

CMD [ "yarn", "start" ]