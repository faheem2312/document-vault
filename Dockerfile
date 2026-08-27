FROM oven/bun:1 AS base
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
RUN bunx prisma generate

EXPOSE 4000

CMD ["bun", "run", "index.ts"]
