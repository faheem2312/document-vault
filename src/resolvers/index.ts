import { collectionResolvers } from "./collectionResolvers";
import { prisma } from "../lib/prisma";

export const resolvers = {
  Query: {
    collections: collectionResolvers.collections,
    collection: collectionResolvers.collection,
    documents: () => ({ items: [], nextCursor: null }), // TODO: next step
  },
  Collection: {
    documents: async (parent: { id: string }) => {
      return prisma.document.findMany({
        where: { collectionId: parent.id },
        orderBy: { createdAt: "desc" },
      });
    },
  },
  Mutation: {
    createCollection: () => {
      throw new Error("Not implemented yet");
    },
    createDocument: () => {
      throw new Error("Not implemented yet");
    },
    updateDocument: () => {
      throw new Error("Not implemented yet");
    },
    deleteDocument: () => {
      throw new Error("Not implemented yet");
    },
    moveDocument: () => {
      throw new Error("Not implemented yet");
    },
  },
};
