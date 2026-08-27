import { prisma } from "../lib/prisma";
import { validateSlug } from "../lib/validation";

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

    return prisma.collection.create({
      data: {
        name: args.name,
        slug: args.slug,
      },
    });
  },
};
