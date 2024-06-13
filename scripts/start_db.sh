# Print database url
echo "Please add the following line to your .env file:"
echo 'DATABASE_URL="postgres://user:password@localhost:5432/db?schema=public"\n'

# Wait for user enter to continue
read -p "Press enter to continue"

# Check if the DATABASE_URL is set correctly
if ! grep -q '^DATABASE_URL="postgres://user:password@localhost:5432/db?schema=public"$' .env; then
  echo "DATABASE_URL is not set correctly"
  exit 1
fi

docker run --name postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_USER=user \
  -e POSTGRES_DB=db \
  -p 5432:5432 \
  -d postgres

# Check if the Docker command was successful
if [ $? -ne 0 ]; then
  exit 1
fi

sleep 1
pnpm prisma migrate deploy
echo "Database setup complete"
