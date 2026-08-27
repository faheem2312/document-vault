import { describe, test, expect, afterAll } from "bun:test";
import { prisma } from "../../src/lib/prisma";
import { collectionResolvers } from "../../src/resolvers/collectionResolvers";
import { documentResolvers } from "../../src/resolvers/documentResolvers";

describe("integration: document lifecycle against real Postgres", () => {
  const testSlug = `integration-test-${Date.now()}`;
  let collectionAId: string;
  let collectionBId: string;
  let documentId: string;

  afterAll(async () => {
    // Clean up everything this test created, regardless of pass/fail
    await prisma.document.deleteMany({
      where: { collectionId: { in: [collectionAId, collectionBId].filter(Boolean) } },
    });
    await prisma.collection.deleteMany({
      where: { id: { in: [collectionAId, collectionBId].filter(Boolean) } },
    });
    await prisma.$disconnect();
  });

  test("creates a collection", async () => {
    const collection = await collectionResolvers.createCollection(undefined, {
      name: "Integration Test Collection A",
      slug: `${testSlug}-a`,
    });
    collectionAId = collection.id;
    expect(collection.slug).toBe(`${testSlug}-a`);
  });

  test("creates a second collection to move into later", async () => {
    const collection = await collectionResolvers.createCollection(undefined, {
      name: "Integration Test Collection B",
      slug: `${testSlug}-b`,
    });
    collectionBId = collection.id;
    expect(collection.slug).toBe(`${testSlug}-b`);
  });

  test("creates a document inside collection A", async () => {
    const doc = await documentResolvers.createDocument(undefined, {
      title: "Integration Test Doc",
      content: "This document mentions onboarding steps",
      collectionId: collectionAId,
    });
    documentId = doc.id;
    expect(doc.collectionId).toBe(collectionAId);
  });

  test("finds the document via substring search", async () => {
    const result = await documentResolvers.documents(undefined, {
      search: "onboarding",
    });
    const found = result.items.find((d: { id: string }) => d.id === documentId);
    expect(found).toBeDefined();
  });

  test("moves the document into collection B", async () => {
    const moved = await documentResolvers.moveDocument(undefined, {
      id: documentId,
      collectionId: collectionBId,
    });
    expect(moved.collectionId).toBe(collectionBId);
  });

  test("filtering documents by collection A now returns nothing", async () => {
    const result = await documentResolvers.documents(undefined, {
      collectionId: collectionAId,
    });
    expect(result.items).toHaveLength(0);
  });

  test("filtering documents by collection B returns the moved document", async () => {
    const result = await documentResolvers.documents(undefined, {
      collectionId: collectionBId,
    });
    expect(result.items.some((d: { id: string }) => d.id === documentId)).toBe(true);
  });

  test("deletes the document", async () => {
    const deleted = await documentResolvers.deleteDocument(undefined, { id: documentId });
    expect(deleted).toBe(true);
  });
});
