#!/bin/sh
set -e


#copy repo_configs to PersistentDisk
#rm config_repo/production.js
cp -a -r -f config_repo/. config
cp -a -r -f config_repo/. config2

yarn install || exit $?

if [ "$VS_ENV" = 'dev' ]; then
  yarn dev
else
  yarn build || exit $?
  yarn start
fi
