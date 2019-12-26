#!/bin/sh
set -e

#copy repo_configs to PersistentDisk
rm -f ./config_repo/production.json
cp -a -r -f config_repo/. config

yarn install || exit $?

#if [ "$VS_ENV" = 'dev' ]; then
#  yarn dev
#else
#  npm install pm2 -g
#  npm run build
  yarn start2
#fi
