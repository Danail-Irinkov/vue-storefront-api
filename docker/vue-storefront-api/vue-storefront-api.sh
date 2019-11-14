#!/bin/sh
set -e

#copy repo_configs to PersistentDisk
cp -a /config/. /config2/
ls -la config2

rm /config_repo/production.js
cp -a -T /config_repo/. /config/
ls -la config

yarn install || exit $?

if [ "$VS_ENV" = 'dev' ]; then
  yarn dev
else
  yarn build || exit $?
  yarn start
fi
