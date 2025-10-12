FROM node:20-alpine AS builder

WORKDIR /app

#RUN apk add git

COPY package.json package-lock.json ./

RUN yarn install --ignore-engines
#:3
COPY . .

RUN yarn build

ENTRYPOINT ["yarn", "start:prod"]