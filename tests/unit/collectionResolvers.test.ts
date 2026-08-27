import { describe, test, expect, mock, beforeEach } from "bun:test";

const mockFindMany = mock();
const mockFindUnique = mock();
const mockCreate = mock();

mock.module("../../src/lib/prisma", () => ({
  prisma: {
    collection: {
      findMany: mockFindMany,
      findUnique: mockFindUnique,
      create: mockCreate,
    },
  },
}));

const { collectionResolvers } = await import("../../src/resolvers/collectionResolvers");

describe("collectionResolvers", () => {
  beforeEach(() => {
    mockFindMany.mockReset();
    mockFindUnique.mockReset();
    mockCreate.mockReset();
  });

  describe("collections", () => {
    test("returns all collections ordered by newest first", async () => {
      const fakeCollections = [
        { id: "1", name: "Engineering", slug: "engineering", createdAt: new Date() },
      ];
      mockFindMany.mockResolvedValue(fakeCollections);

      const result = await collectionResolvers.collections();

      expect(result).toEqual(fakeCollections);
      expect(mockFindMany).toHaveBeenCalledWith({
        orderBy: { createdAt: "desc" },
      });
    });
  });

  describe("createCollection", () => {
    test("creates a collection with a valid slug", async () => {
      const fakeCollection = { id: "1", name: "Design", slug: "design", createdAt: new Date() };
      mockCreate.mockResolvedValue(fakeCollection);

      const result = await collectionResolvers.createCollection(undefined, {
        name: "Design",
        slug: "design",
      });

      expect(result).toEqual(fakeCollection);
    });

    test("rejects a malformed slug before touching the database", async () => {
      await expect(
        collectionResolvers.createCollection(undefined, {
          name: "Bad Slug Test",
          slug: "Not A Valid Slug!",
        })
      ).rejects.toThrow("Slug must be lowercase letters, numbers, and hyphens only");

      expect(mockCreate).not.toHaveBeenCalled();
    });

    test("converts a duplicate-slug database error into a clean validation error", async () => {
      const duplicateError = Object.assign(new Error("Unique constraint failed"), {
        code: "P2002",
      });
      mockCreate.mockRejectedValue(duplicateError);

      await expect(
        collectionResolvers.createCollection(undefined, {
          name: "Engineering Again",
          slug: "engineering",
        })
      ).rejects.toThrow('A collection with slug "engineering" already exists.');
    });
  });
});
