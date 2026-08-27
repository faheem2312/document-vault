import { describe, test, expect, mock, beforeEach } from "bun:test";

const mockDocFindMany = mock();
const mockDocFindUnique = mock();
const mockDocCreate = mock();
const mockDocUpdate = mock();
const mockDocDelete = mock();
const mockCollectionFindUnique = mock();

mock.module("../../src/lib/prisma", () => ({
  prisma: {
    document: {
      findMany: mockDocFindMany,
      findUnique: mockDocFindUnique,
      create: mockDocCreate,
      update: mockDocUpdate,
      delete: mockDocDelete,
    },
    collection: {
      findUnique: mockCollectionFindUnique,
    },
  },
}));

const { documentResolvers } = await import("../../src/resolvers/documentResolvers");

describe("documentResolvers", () => {
  beforeEach(() => {
    mockDocFindMany.mockReset();
    mockDocFindUnique.mockReset();
    mockDocCreate.mockReset();
    mockDocUpdate.mockReset();
    mockDocDelete.mockReset();
    mockCollectionFindUnique.mockReset();
  });

  describe("documents (query)", () => {
    test("returns items with no nextCursor when fewer results than 'take'", async () => {
      mockDocFindMany.mockResolvedValue([
        { id: "1", title: "Doc A" },
        { id: "2", title: "Doc B" },
      ]);

      const result = await documentResolvers.documents(undefined, { take: 5 });

      expect(result.items).toHaveLength(2);
      expect(result.nextCursor).toBeNull();
    });

    test("returns a nextCursor when more results exist than 'take'", async () => {
      mockDocFindMany.mockResolvedValue([
        { id: "1", title: "Doc A" },
        { id: "2", title: "Doc B" },
        { id: "3", title: "Doc C" },
      ]);

      const result = await documentResolvers.documents(undefined, { take: 2 });

      expect(result.items).toHaveLength(2);
      expect(result.nextCursor).toBe("3");
    });

    test("builds a search filter across title and content", async () => {
      mockDocFindMany.mockResolvedValue([]);

      await documentResolvers.documents(undefined, { search: "onboarding" });

      const calledWith = mockDocFindMany.mock.calls[0][0];
      expect(calledWith.where.OR).toEqual([
        { title: { contains: "onboarding", mode: "insensitive" } },
        { content: { contains: "onboarding", mode: "insensitive" } },
      ]);
    });
  });

  describe("createDocument", () => {
    test("rejects an empty title without touching the database", async () => {
      await expect(
        documentResolvers.createDocument(undefined, {
          title: "",
          content: "Some content",
          collectionId: "col-1",
        })
      ).rejects.toThrow("Title must not be empty.");

      expect(mockDocCreate).not.toHaveBeenCalled();
    });

    test("rejects an empty content", async () => {
      await expect(
        documentResolvers.createDocument(undefined, {
          title: "A title",
          content: "   ",
          collectionId: "col-1",
        })
      ).rejects.toThrow("Content must not be empty.");
    });

    test("rejects when the target collection does not exist", async () => {
      mockCollectionFindUnique.mockResolvedValue(null);

      await expect(
        documentResolvers.createDocument(undefined, {
          title: "Valid Title",
          content: "Valid content",
          collectionId: "missing-collection",
        })
      ).rejects.toThrow('Collection with id "missing-collection" not found.');
    });

    test("creates a document when input is valid", async () => {
      mockCollectionFindUnique.mockResolvedValue({ id: "col-1" });
      const fakeDoc = { id: "doc-1", title: "Valid Title" };
      mockDocCreate.mockResolvedValue(fakeDoc);

      const result = await documentResolvers.createDocument(undefined, {
        title: "Valid Title",
        content: "Valid content",
        collectionId: "col-1",
      });

      expect(result).toEqual(fakeDoc);
    });
  });

  describe("updateDocument", () => {
    test("rejects when the document does not exist", async () => {
      mockDocFindUnique.mockResolvedValue(null);

      await expect(
        documentResolvers.updateDocument(undefined, { id: "missing-id" })
      ).rejects.toThrow('Document with id "missing-id" not found.');
    });

    test("allows a partial update without requiring all fields", async () => {
      mockDocFindUnique.mockResolvedValue({ id: "doc-1", title: "Old Title" });
      mockDocUpdate.mockResolvedValue({ id: "doc-1", isArchived: true });

      const result = await documentResolvers.updateDocument(undefined, {
        id: "doc-1",
        isArchived: true,
      });

      expect(result.isArchived).toBe(true);
      const calledWith = mockDocUpdate.mock.calls[0][0];
      expect(calledWith.data).toEqual({ isArchived: true });
    });
  });

  describe("deleteDocument", () => {
    test("rejects when the document does not exist", async () => {
      mockDocFindUnique.mockResolvedValue(null);

      await expect(
        documentResolvers.deleteDocument(undefined, { id: "missing-id" })
      ).rejects.toThrow('Document with id "missing-id" not found.');
    });

    test("deletes and returns true when the document exists", async () => {
      mockDocFindUnique.mockResolvedValue({ id: "doc-1" });
      mockDocDelete.mockResolvedValue({ id: "doc-1" });

      const result = await documentResolvers.deleteDocument(undefined, { id: "doc-1" });

      expect(result).toBe(true);
    });
  });

  describe("moveDocument", () => {
    test("rejects when the document does not exist", async () => {
      mockDocFindUnique.mockResolvedValue(null);

      await expect(
        documentResolvers.moveDocument(undefined, { id: "missing-id", collectionId: "col-1" })
      ).rejects.toThrow('Document with id "missing-id" not found.');
    });

    test("rejects when the target collection does not exist", async () => {
      mockDocFindUnique.mockResolvedValue({ id: "doc-1" });
      mockCollectionFindUnique.mockResolvedValue(null);

      await expect(
        documentResolvers.moveDocument(undefined, { id: "doc-1", collectionId: "missing-col" })
      ).rejects.toThrow('Collection with id "missing-col" not found.');
    });

    test("moves the document when both exist", async () => {
      mockDocFindUnique.mockResolvedValue({ id: "doc-1" });
      mockCollectionFindUnique.mockResolvedValue({ id: "col-2" });
      mockDocUpdate.mockResolvedValue({ id: "doc-1", collectionId: "col-2" });

      const result = await documentResolvers.moveDocument(undefined, {
        id: "doc-1",
        collectionId: "col-2",
      });

      expect(result.collectionId).toBe("col-2");
    });
  });
});
