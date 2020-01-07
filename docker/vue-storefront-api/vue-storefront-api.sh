#!/bin/sh
set -e

#copy repo_configs to PersistentDisk
rm -f ./config_repo/production.json
cp -a -r -f config_repo/. config

#npm config set scripts-prepend-node-path auto
npm install -g typescript@3.3.3
#npm install -g pm2

yarn install || exit $?
#if [ "$VS_ENV" = 'dev' ]; then
#  yarn dev
#else
#  npm install pm2 -g
#  npm run build
yarn start2
#  yarn startK2
#fi
