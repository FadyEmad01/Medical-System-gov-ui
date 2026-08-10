import Image from "next/image";
import { getTranslations } from "next-intl/server";
import LanguageSwitcher from "@/components/language-switcher";
import { Link } from "@/i18n/navigation";

type Props = {
  children: React.ReactNode;
};

export default async function AuthLayout({ children }: Props) {
  const t = await getTranslations("auth");

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10 ">
        <div className="flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 font-medium">
            <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground"></div>
            {t("brandName")}
          </Link>
          <LanguageSwitcher />
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">{children}</div>
        </div>
      </div>
      <div className="relative hidden bg-muted lg:block">
        <div className="sticky top-0 h-svh">
          <Image
            src="/placeholder.svg"
            alt={t("brandName")}
            fill
            priority
            className="object-cover dark:brightness-[0.2] dark:grayscale"
            sizes="50vw"
          />
        </div>
      </div>
    </div>
  );
}
