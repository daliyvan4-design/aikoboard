"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { LangSwitcher } from "./lang-switcher";
import { AikoLogo } from "@/components/brand/aiko-logo";

export function Header() {
  const locale = useLocale();
  const t = useTranslations("header");

  return (
    <header className="bg-ink text-cream sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-5 lg:px-10 h-[68px] flex items-center justify-between">
        <Link href={`/${locale}`}>
          <AikoLogo dark height={38} />
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-[12px] tracking-wide text-cream/55">
          <Link href={`/${locale}/evenements`} className="hover:text-cream transition-colors">
            {t("events")}
          </Link>
          <Link href={`/${locale}/evenements/creer`} className="hover:text-cream transition-colors">
            {t("create_event")}
          </Link>
          <Link href={`/${locale}#participer`} className="hover:text-cream transition-colors">
            {t("participate")}
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <Link
            href={`/${locale}/evenements/creer`}
            className="hidden sm:inline-flex items-center gap-2 bg-gold hover:bg-gold2 text-ink rounded-full px-5 py-2 text-[12px] font-semibold btn-press"
          >
            {t("create_event")}
          </Link>
          <LangSwitcher />
        </div>
      </div>
    </header>
  );
}
