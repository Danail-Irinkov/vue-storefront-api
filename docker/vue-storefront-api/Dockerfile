#FROM node:10-alpine
FROM divante/vue-storefront-api:latest

ENV VS_ENV prod

WORKDIR /var/www

RUN apk add --no-cache curl git

COPY package.json ./

RUN apk add --no-cache --virtual .build-deps ca-certificates wget && \
    yarn install --no-cache && \
    apk del .build-deps

COPY ./ecosystem.json ./ecosystem.json
COPY ./tsconfig.json ./tsconfig.json
COPY ./nodemon.json ./nodemon.json
COPY ./babel.config.js ./babel.config.js

COPY ./config ./config
COPY ./migrations ./migrations
COPY ./scripts ./scripts
COPY ./src ./src
COPY ./var ./var
COPY ./docker ./docker
#COPY ./dist ./dist

#CMD ["yarn", "start-kube"]
#COPY docker/vue-storefront-api/vue-storefront-api.sh /usr/local/bin/
#
CMD ["vue-storefront-api.sh"]
