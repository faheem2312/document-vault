import { validationError } from "./errors";

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function validateTitle(title: string): void {
  if (title.trim().length === 0) {
    throw validationError("Title must not be empty.");
  }
}

export function validateContent(content: string): void {
  if (content.trim().length === 0) {
    throw validationError("Content must not be empty.");
  }
}

export function validateSlug(slug: string): void {
  if (!SLUG_REGEX.test(slug)) {
    throw validationError(
      "Slug must be lowercase letters, numbers, and hyphens only (e.g. 'my-collection')."
    );
  }
}
