FROM node:10-alpine

ENV VS_ENV prod

WORKDIR /var/www

RUN apk add --no-cache curl git

COPY package.json ./
COPY yarn.lock ./

RUN apk add --no-cache --virtual .build-deps ca-certificates wget && \
    yarn install --no-cache

RUN npm install -g typescript@3.3.3

COPY ./config ./config_repo

COPY docker/vue-storefront-api/dev/dev_entrypoint.sh /usr/local/bin/
RUN chmod 774 /usr/local/bin/dev_entrypoint.sh

EXPOSE 8080

CMD ["dev_entrypoint.sh"]
