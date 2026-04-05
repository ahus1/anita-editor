#!/usr/bin/env bash
set -e
set -x

yarn test:unit
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
