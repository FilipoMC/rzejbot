#!/usr/bin/env bash

git checkout bot-prod
git pull

pnpm i

pnpm -F @rzej/bot run build
pnpm -F @rzej/bot run start
