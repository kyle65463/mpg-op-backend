# NodeJS API Server Template

A nodejs API server template with a set of API for demo use.

[The Spec of Demo Server](https://sprout-haumea-97e.notion.site/Demo-Server-799f9c5f248d4644b95b56c10d888b03?pvs=4)

[Code Explanation](https://sprout-haumea-97e.notion.site/Code-Explanation-d4ff096c835b48f99dc2a76611a02573?pvs=4)

## Requirement

- pnpm
- docker

## Install dependencies

```bash
pnpm install
pnpm db:generate
pnpm prepare
```

## Commands

### Start

```bash
pnpm start <command>
```

You can specify which command to execute by adding an arguments.

- `server`: Start the api server
- `gen-openapi`: Generate openapi documentation
- `gen-access-token`: Generate an access token for demo use

If not specified, the default command is `server`.

### Run Unit Tests

```bash
pnpm test
```

### Add migration file with Prisma

```bash
pnpm db:migrate
```

## Run a demo server locally

```bash
cp .env.example .env
pnpm db:start
pnpm start gen-access-token # Save the access token to Postman or whatever place
pnpm start
# You can use Postman to play around with the server (demo.postman_collection.json)
```

## Display the api docs locally

```bash
pnpm start gen-api-docs
pnpm start # Make sure the api server is running
pnpm api-docs
```
