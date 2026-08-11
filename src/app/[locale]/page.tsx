import { Landmark, ShieldPlus } from "lucide-react";
import { getTranslations } from "next-intl/server";
import LanguageSwitcher from "@/components/language-switcher";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Link } from "@/i18n/navigation";

export default async function Home() {
  const t = await getTranslations("auth");

  return (
    <div className="flex min-h-svh flex-col">
      <header className="mx-auto flex w-full max-w-4xl items-center justify-between gap-4 px-6 py-6">
        <Link href="/" className="flex items-center gap-2.5 font-medium">
          <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <ShieldPlus className="size-4" aria-hidden />
          </span>
          <span className="text-sm font-semibold tracking-tight">
            {t("brandName")}
          </span>
        </Link>
        <LanguageSwitcher />
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="flex w-full max-w-xl flex-col items-center gap-6 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
            <Landmark className="size-3.5" aria-hidden />
            {t("portalBadge")}
          </span>

          <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">
            {t("portalTitle")}
          </h1>

          <p className="max-w-md text-pretty text-base leading-relaxed text-muted-foreground">
            {t("portalDescription")}
          </p>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Button asChild size="lg" className="sm:min-w-40">
              <Link href="/auth/login">{t("login")}</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="sm:min-w-40">
              <Link href="/auth/register">{t("register")}</Link>
            </Button>
          </div>
        </div>
      </main>

      <footer className="mx-auto w-full max-w-4xl px-6 pb-6">
        <Separator />
        <p className="pt-4 text-center text-xs text-muted-foreground">
          {t("portalNote")}
        </p>
      </footer>
    </div>
  );
}
