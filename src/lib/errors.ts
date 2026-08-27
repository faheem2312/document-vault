import { GraphQLError } from "graphql";

export function validationError(message: string): GraphQLError {
  return new GraphQLError(message, {
    extensions: { code: "BAD_USER_INPUT" },
  });
}

export function notFoundError(message: string): GraphQLError {
  return new GraphQLError(message, {
    extensions: { code: "NOT_FOUND" },
  });
}
