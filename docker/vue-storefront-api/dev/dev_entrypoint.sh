#!/bin/sh
set -e
cd /var/www

#copy local.config to Container
rm -f ./config_repo/production.json
cp -a -r -f config_repo/. config
cp -f config_bin/local_docker.json config/local.json

yarn install
yarn restore2main
ls -la config
yarn mage2vs import --store-code=dev --skip-products=1 --skip-pages=1 --skip-blocks=1
yarn mage2vs productsdelta --store-code=dev --partitions=1 --partitionSize=20 --skus=DA001,DA002,DA003,DA004,DA005,DA006,DA007,DA008,DA009

npm install pm2 -g
pm2 start 'yarn dev'
