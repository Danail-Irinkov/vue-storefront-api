#!/bin/sh
set -e

cd /var/www
#copy local.config to Container
rm -f /var/config_repo/production.json
cp -a -r -f /var/config_repo/. config
cp -f config_bin/local_docker.json config/local.json

yarn install
# yarn restore2main
# yarn mage2vs import --store-code=dev --skip-products=1 --skip-pages=1 --skip-blocks=1
# yarn mage2vs productsdelta --store-code=dev --partitions=1 --partitionSize=20 --skus=DA001,DA002,DA003,DA004,DA005,DA006,DA007,DA008,DA009

# Setting prevents server crash at "pm2 restart all"
echo "call watch from VSF API in dev-ent"

sudo sysctl fs.inotify.max_user_watches=582222000 && sudo sysctl -p
npm install
pm2-runtime start 'ecosystem-dev.json'
