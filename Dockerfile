FROM node:20-alpine AS runner
RUN apk add --no-cache libc6-compat
RUN apk update
RUN corepack enable && corepack prepare pnpm@latest --activate
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm db:generate

# Generate openapi.yml
RUN pnpm start gen-openapi 

ENV NODE_ENV=production
EXPOSE 8080
ENTRYPOINT ["pnpm", "start", "--"]
CMD ["server"]
