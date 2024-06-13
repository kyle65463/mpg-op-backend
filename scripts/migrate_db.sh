#!/usr/bin/env bash

docker compose up -d
sleep 1
pnpm dotenv -e .env.test -- prisma migrate dev
docker compose down