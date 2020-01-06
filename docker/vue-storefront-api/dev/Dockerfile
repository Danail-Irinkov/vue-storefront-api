FROM keymetrics/pm2:10-alpine

ENV VS_ENV dev
ENV NODE_ENV developer

WORKDIR /var/www

COPY package.json ./
COPY yarn.lock ./

RUN apk add --no-cache --virtual .build-deps ca-certificates wget curl git && \
    yarn install --no-cache

RUN npm install -g typescript@3.3.3
RUN set -ex && apk --no-cache add sudo

COPY ./config /var/config_repo
RUN chmod 774 /var/config_repo/production.json

EXPOSE 8080

COPY docker/vue-storefront-api/dev/dev_entrypoint.sh /usr/local/bin/dev_entrypoint.sh
RUN chmod +x /usr/local/bin/dev_entrypoint.sh

RUN ["cat", "/usr/local/bin/dev_entrypoint.sh"]
ENTRYPOINT ["/usr/local/bin/dev_entrypoint.sh"]
