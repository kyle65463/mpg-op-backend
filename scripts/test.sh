#!/usr/bin/env bash

# Check TypeScript compilation
if pnpm tsc --noEmit; then
  echo "TypeScript compilation successful"
else
  echo "TypeScript compilation failed"
  exit 1
fi

docker compose up -d
sleep 1
pnpm dotenv -e .env.test -- prisma migrate deploy
pnpm test:run
TEST_EXIT_CODE=$?
docker compose down
exit $TEST_EXIT_CODE
