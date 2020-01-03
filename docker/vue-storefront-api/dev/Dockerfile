FROM node:10-alpine

ENV VS_ENV prod

WORKDIR /var/www

COPY package.json ./
COPY yarn.lock ./

RUN apk add --no-cache --virtual .build-deps ca-certificates wget curl git && \
    yarn install --no-cache

RUN npm install -g typescript@3.3.3

COPY ./config ./config_repo
RUN chmod 774 ./config_repo/production.json

EXPOSE 8080

COPY docker/vue-storefront-api/dev/dev_entrypoint.sh /usr/local/bin/dev_entrypoint.sh
RUN chmod +x /usr/local/bin/dev_entrypoint.sh

RUN ["cat", "/usr/local/bin/dev_entrypoint.sh"]
ENTRYPOINT ["/usr/local/bin/dev_entrypoint.sh"]
