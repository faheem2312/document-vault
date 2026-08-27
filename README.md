# Document Vault 

A small backend API for organizing documents into collections, built with Bun, TypeScript, GraphQL Yoga, PostgreSQL, and Prisma.

## Setup

```
docker compose up -d
bun install
bun run gendb
bun run dev
```

This starts Postgres in Docker, installs dependencies, applies database migrations, and starts the GraphQL server at `http://localhost:4000/graphql`, which serves an interactive GraphiQL playground in the browser.

You'll also need a `.env` file in the project root:

```
DATABASE_URL="postgresql://vault:vault@localhost:5432/document_vault"
```

## Available scripts

| Command | What it does |
|---|---|
| `bun run dev` | Starts the GraphQL server |
| `bun run gendb` | Runs Prisma migrations against the database |
| `bun run lint` | Runs ESLint (includes a `no-explicit-any` rule) |
| `bun run typecheck` | Runs the TypeScript compiler in check-only mode |
| `bun run test` | Runs all unit and integration tests |
| `bun run sanity` | Runs lint, typecheck, and tests together |

## Domain model

- **Collection** — `id`, `name`, `slug` (unique), `createdAt`
- **Document** — `id`, `title`, `content`, `tags` (string list), `collectionId`, `isArchived`, `createdAt`

A Collection has many Documents; a Document belongs to exactly one Collection.

## API

**Queries**
- `collections` — list all collections
- `collection(id)` — a single collection with its nested documents
- `documents(collectionId, search, isArchived, take, cursor)` — list documents, optionally filtered by collection or archived state, and searched by substring match on title or content. Paginated using `take`/`cursor`.

**Mutations**
- `createCollection(name, slug)`
- `createDocument(title, content, tags, collectionId)`
- `updateDocument(id, title, content, tags, isArchived)` — all fields but `id` are optional (partial update)
- `deleteDocument(id)`
- `moveDocument(id, collectionId)`

## Validation

Empty titles, empty content, and malformed slugs are rejected with GraphQL errors (`extensions.code: "BAD_USER_INPUT"`), not raw 500s. Referencing a nonexistent collection or document returns a `"NOT_FOUND"` error. Duplicate slugs are caught at the database level (a unique constraint) and converted into a clean validation error rather than a raw Prisma exception.

## Testing

- **Unit tests** (`tests/unit/`) — resolver logic tested with a mocked Prisma client, so they run fast and don't require a database.
- **Integration test** (`tests/integration/`) — exercises a full document lifecycle (create collection, create document, search, move, delete) against a real, Dockerized Postgres instance.

Run everything with `bun run test`, or `bun run sanity` to also run lint and typecheck first.

## Design decisions and tradeoffs

- **Cursor-based pagination** uses Prisma's native `cursor` + `skip: 1` + `take` support, with a "fetch one extra record" trick to determine whether a next page exists, avoiding a separate count query.
- **Plain scalar arguments** are used for mutations instead of GraphQL `input` types. At this scale, this keeps the schema simpler to read; a larger API would likely introduce `input` types once mutations grow more numerous or share common fields.
- **Dates are returned as ISO strings**, not a custom GraphQL scalar, to avoid adding complexity that isn't needed at this scale.
- **Validation lives in a small, explicit `src/lib/validation.ts` module** rather than a schema-validation library, since the rules here (empty string checks, one regex) don't yet justify that dependency.
- **No caching layer, authentication, or GraphQL Federation** — as specified, these were deliberately left out of scope.

## Docker

A `Dockerfile` is included for the API service itself (separate from `docker-compose.yml`, which only runs Postgres). It is not wired into any deployment pipeline, since deployment was explicitly out of scope.

## How I'd extend this

- **Authentication/authorization** — add a resolver-level auth check (e.g. a `context.user` populated from a JWT), and scope collections/documents to their owner.
- **Caching** — a Redis-backed DataLoader for the `Collection.documents` field resolver would help avoid N+1 queries if `collections { documents }` became a common, high-traffic query pattern.
- **Full-text search** — the current substring search (`contains`) would not scale well; Postgres's native full-text search (`tsvector`/`tsquery`) or a dedicated search index would be the natural next step for larger datasets.
- **Soft deletes** — `deleteDocument` currently hard-deletes; a `deletedAt` timestamp column would allow recovery and audit history.
- **Input types** — as the mutation surface grows, migrating to GraphQL `input` types would keep the schema more maintainable.
