/**
 * Server actions for citizen insurance profile and card state.
 *
 * Thin, boundary-validating wrappers around api clients: cookie token,
 * untrusted-input validation, and AuthActionError normalization.
 * Implementation lives in `./actions/*` (`"use server"` modules);
 * pure parsers live in `./lib/parse-*`.
 */

export {
  getCardDetailAction,
  getCardStateAction,
} from "./actions/card-actions";
export {
  getProfileAction,
  updateProfileAction,
} from "./actions/profile-actions";
