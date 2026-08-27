import { prisma } from "../lib/prisma";
import { validateSlug } from "../lib/validation";
import { validationError } from "../lib/errors";

interface CreateCollectionArgs {
  name: string;
  slug: string;
}

export const collectionResolvers = {
  collections: async () => {
    return prisma.collection.findMany({
      orderBy: { createdAt: "desc" },
    });
  },

  collection: async (_parent: unknown, args: { id: string }) => {
    return prisma.collection.findUnique({
      where: { id: args.id },
    });
  },

  createCollection: async (_parent: unknown, args: CreateCollectionArgs) => {
    validateSlug(args.slug);

    try {
      return await prisma.collection.create({
        data: {
          name: args.name,
          slug: args.slug,
        },
      });
    } catch (error) {
      if (
        error instanceof Error &&
        "code" in error &&
        (error as { code: string }).code === "P2002"
      ) {
        throw validationError(`A collection with slug "${args.slug}" already exists.`);
      }
      throw error;
    }
  },
};
