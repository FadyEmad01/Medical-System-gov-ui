/** Cache keys — inside ["admin"] so session expiry purges them (S1). */
export const ADMIN_CATEGORIES_QUERY_KEY = ["admin", "categories"] as const;
export const CATEGORY_QUERY_KEY = (categoryId: string) =>
  ["admin", "categories", "detail", categoryId] as const;
export const REQUIREMENTS_QUERY_KEY = (categoryId: string) =>
  ["admin", "categories", categoryId, "requirements"] as const;
