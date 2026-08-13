import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  const [auth, insurance, common] = await Promise.all([
    import(`../features/auth/translations/${locale}.json`).then(
      (m) => m.default,
    ),
    import(`../features/insurance/translations/${locale}.json`).then(
      (m) => m.default,
    ),
    import(`../features/common/translations/${locale}.json`).then(
      (m) => m.default,
    ),
  ]);

  return {
    locale,
    messages: { auth, insurance, common },
  };
});
