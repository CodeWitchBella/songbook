export function once<T>(fn: () => T): () => T {
  let result: T;
  let done = false;
  return () => {
    if (!done) {
      done = true;
      result = fn();
    }
    return result;
  };
}

function prefixLength(a: string, b: string) {
  const length = Math.min(a.length, b.length);
  for (let i = 0; i < length; i++) {
    if (a[i] !== b[i]) return i;
  }
  return length;
}

/**
 * Array.prototype.sort predicate which sorts alphabetically but sorts numbers
 * in reverse order
 */
export function collectionCompare(
  ai: { item: { name: string; owner?: { name?: string | null } | null } },
  bi: { item: { name: string; owner?: { name?: string | null } | null } },
) {
  // sort by owner first, then by name
  const ownerA = ai.item.owner?.name ?? "";
  const ownerB = bi.item.owner?.name ?? "";
  const ownerCompare = ownerA.localeCompare(ownerB);
  if (ownerCompare !== 0) return ownerCompare;

  const a = ai.item.name;
  const b = bi.item.name;
  const prefix = prefixLength(a, b);

  if (/[0-9]/.test(a[prefix]) && /[0-9]/.test(b[prefix])) {
    return b.localeCompare(a);
  }
  return a.localeCompare(b);
}

/**
 * Converts a collection data slug (`name` for global collections, `owner`
 * for a user's default collection, or `owner/name` for a named collection
 * owned by a user) into the `:user/:abc` route path segment, using `_` as
 * the placeholder for the missing part.
 */
export function collectionSlugToPath(slug: string): string {
  const slashIndex = slug.indexOf("/");
  if (slashIndex === -1) return `_/${slug}`;
  return `${slug.slice(0, slashIndex)}/${slug.slice(slashIndex + 1)}`;
}

/**
 * Reverses {@link collectionSlugToPath}: turns the `:user`/`:abc` route
 * params back into a collection data slug.
 */
export function collectionParamsToSlug(params: { user?: string; abc?: string }): string {
  const user = params.user === "_" ? "" : (params.user ?? "");
  const abc = params.abc === "_" ? "" : (params.abc ?? "");
  return user ? (abc ? `${user}/${abc}` : user) : abc;
}

export function collectionFullName(collection: {
  slug: string;
  owner?: { handle?: string | null; name?: string | null } | null;
  name: string;
}) {
  return (
    (collection.slug.includes("/") ? (collection.owner?.handle || collection.owner?.name || "") + " > " : "") +
    collection.name
  );
}
