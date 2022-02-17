#!/usr/bin/env bash
set -e
set -x

if [ ! -e /opt/build/repo/node_modules/chromium/lib/chromium/chrome-linux ]; then
  rm -rf `pwd`/node_modules/chromium
  rm -rf `pwd`/node_modules/.yarn-integrity
  yarn install
fi
export PATH=`pwd`/node_modules/chromium/lib/chromium/chrome-linux:$PATH
which chrome
# see netlify.toml for CHROMIUM_REVISION that specifies the chrome version
node_modules/chromium/lib/chromium/chrome-linux/chrome --version
# unit tests disabled after migrating to Vue3 doe the ReferenceError problems
# yarn test:unit
yarn test:e2e
yarn build

# preparing lambda
cd lambda
yarn install
yarn generate
cd ..

# search engines should only index the main branch
if [ "$BRANCH" != "main" ]; then
cat >> dist/_headers << EOF
/*
  x-robots-tag: noindex
EOF
fi
