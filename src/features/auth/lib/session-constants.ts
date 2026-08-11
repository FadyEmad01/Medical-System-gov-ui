/**
 * Name of the httpOnly cookie that holds the JWT.
 * Extracted into a side-effect-free module so it can be imported from the
 * proxy (which runs in a separate runtime) without pulling in `next/headers`.
 *
 * Keep this stable: middleware, Server Actions, and Server Components read this.
 */
export const SESSION_COOKIE_NAME = "umr_session";
