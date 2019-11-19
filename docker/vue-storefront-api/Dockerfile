FROM node:10-alpine

ENV VS_ENV dev

WORKDIR /var/www

RUN apk add --no-cache curl git

COPY package.json ./

RUN apk update
RUN apk add --no-cache --virtual .build-deps ca-certificates wget && \
    yarn install --no-cache && \
    apk del .build-deps

COPY ./ecosystem.json ./ecosystem.json
COPY ./tsconfig.json ./tsconfig.json
COPY ./nodemon.json ./nodemon.json
COPY ./babel.config.js ./babel.config.js

#COPY ./config ./config
COPY ./config ./config_repo
COPY ./migrations ./migrations
COPY ./scripts ./scripts
COPY ./src ./src
COPY ./var ./var
COPY ./docker ./docker

COPY docker/vue-storefront-api/vue-storefront-api.sh /usr/local/bin/
RUN chmod 774 /usr/local/bin/vue-storefront-api.sh

CMD ["vue-storefront-api.sh"]
