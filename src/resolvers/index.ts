import { collectionResolvers } from "./collectionResolvers";
import { documentResolvers } from "./documentResolvers";
import { prisma } from "../lib/prisma";

export const resolvers = {
  Query: {
    collections: collectionResolvers.collections,
    collection: collectionResolvers.collection,
    documents: documentResolvers.documents,
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
    createCollection: collectionResolvers.createCollection,
    createDocument: documentResolvers.createDocument,
    updateDocument: documentResolvers.updateDocument,
    deleteDocument: documentResolvers.deleteDocument,
    moveDocument: documentResolvers.moveDocument,
  },
};
