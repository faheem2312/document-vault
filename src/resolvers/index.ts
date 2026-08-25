export const resolvers = {
  Query: {
    collections: () => [],
    collection: () => null,
    documents: () => ({ items: [], nextCursor: null }),
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
