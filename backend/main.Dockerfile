FROM node:20-alpine AS builder

WORKDIR /app

#RUN apk add git

COPY package.json package-lock.json ./

RUN yarn install --ignore-engines

COPY . .

RUN yarn build

ENTRYPOINT ["yarn", "start:prod"]