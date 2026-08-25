import { prisma } from "../lib/prisma";

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
};
