#!/usr/bin/env bash
set -e
set -x

yarn install
ls -lR node_modules/chromium
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
cat >> _dist/_headers << EOF
/*
  x-robots-tag: noindex
EOF
fi
