import "dotenv/config";
import { createYoga, createSchema } from "graphql-yoga";
import { readFileSync } from "fs";
import { resolvers } from "./src/resolvers";

const typeDefs = readFileSync("./src/schema/schema.graphql", "utf-8");

const schema = createSchema({
  typeDefs,
  resolvers,
});

const yoga = createYoga({ schema });

Bun.serve({
  port: 4000,
  fetch: yoga.fetch,
});

console.log("🚀 Server running at http://localhost:4000/graphql");
