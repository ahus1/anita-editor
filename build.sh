#!/usr/bin/env bash
set -e
set -x

yarn install
export PATH=`pwd`/node_modules/chromium/lib/chromium/chrome-linux:$PATH
which chrome
# see netlify.toml for CHROMIUM_REVISION that specifies the chrome version
node_modules/chromium/lib/chromium/chrome-linux/chrome --version
yarn test:unit
yarn test:e2e
yarn build

# preparing lambda
cd lambda
yarn install
yarn generate
cd ..

# search engines should only index the master branch
if [ "$BRANCH" != "master" ]; then
cat >> dist/_headers << EOF
/*
  x-robots-tag: noindex
EOF
fi
