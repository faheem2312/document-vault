import { prisma } from "../lib/prisma";
import { validateTitle, validateContent } from "../lib/validation";
import { notFoundError } from "../lib/errors";

interface DocumentsArgs {
  collectionId?: string;
  search?: string;
  isArchived?: boolean;
  take?: number;
  cursor?: string;
}

interface CreateDocumentArgs {
  title: string;
  content: string;
  tags?: string[];
  collectionId: string;
}

interface UpdateDocumentArgs {
  id: string;
  title?: string;
  content?: string;
  tags?: string[];
  isArchived?: boolean;
}

interface DeleteDocumentArgs {
  id: string;
}

interface MoveDocumentArgs {
  id: string;
  collectionId: string;
}

export const documentResolvers = {
  documents: async (_parent: unknown, args: DocumentsArgs) => {
    const take = args.take ?? 20;
    const where: Record<string, unknown> = {};

    if (args.collectionId) {
      where.collectionId = args.collectionId;
    }
    if (args.isArchived !== undefined) {
      where.isArchived = args.isArchived;
    }
    if (args.search) {
      where.OR = [
        { title: { contains: args.search, mode: "insensitive" } },
        { content: { contains: args.search, mode: "insensitive" } },
      ];
    }

    const items = await prisma.document.findMany({
      where,
      take: take + 1,
      ...(args.cursor ? { cursor: { id: args.cursor }, skip: 1 } : {}),
      orderBy: { createdAt: "desc" },
    });

    let nextCursor: string | null = null;
    if (items.length > take) {
      const nextItem = items.pop();
      nextCursor = nextItem?.id ?? null;
    }

    return { items, nextCursor };
  },

  createDocument: async (_parent: unknown, args: CreateDocumentArgs) => {
    validateTitle(args.title);
    validateContent(args.content);

    const collection = await prisma.collection.findUnique({
      where: { id: args.collectionId },
    });
    if (!collection) {
      throw notFoundError(`Collection with id "${args.collectionId}" not found.`);
    }

    return prisma.document.create({
      data: {
        title: args.title,
        content: args.content,
        tags: args.tags ?? [],
        collectionId: args.collectionId,
      },
    });
  },

  updateDocument: async (_parent: unknown, args: UpdateDocumentArgs) => {
    const existing = await prisma.document.findUnique({ where: { id: args.id } });
    if (!existing) {
      throw notFoundError(`Document with id "${args.id}" not found.`);
    }

    if (args.title !== undefined) validateTitle(args.title);
    if (args.content !== undefined) validateContent(args.content);

    return prisma.document.update({
      where: { id: args.id },
      data: {
        ...(args.title !== undefined ? { title: args.title } : {}),
        ...(args.content !== undefined ? { content: args.content } : {}),
        ...(args.tags !== undefined ? { tags: args.tags } : {}),
        ...(args.isArchived !== undefined ? { isArchived: args.isArchived } : {}),
      },
    });
  },

  deleteDocument: async (_parent: unknown, args: DeleteDocumentArgs) => {
    const existing = await prisma.document.findUnique({ where: { id: args.id } });
    if (!existing) {
      throw notFoundError(`Document with id "${args.id}" not found.`);
    }

    await prisma.document.delete({ where: { id: args.id } });
    return true;
  },

  moveDocument: async (_parent: unknown, args: MoveDocumentArgs) => {
    const document = await prisma.document.findUnique({ where: { id: args.id } });
    if (!document) {
      throw notFoundError(`Document with id "${args.id}" not found.`);
    }

    const targetCollection = await prisma.collection.findUnique({
      where: { id: args.collectionId },
    });
    if (!targetCollection) {
      throw notFoundError(`Collection with id "${args.collectionId}" not found.`);
    }

    return prisma.document.update({
      where: { id: args.id },
      data: { collectionId: args.collectionId },
    });
  },
};
