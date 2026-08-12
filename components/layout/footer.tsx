"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { AikoLogo } from "@/components/brand/aiko-logo";

export function Footer() {
  const locale = useLocale();
  const t = useTranslations("footer");
  const year = new Date().getFullYear();

  return (
    <footer className="bg-ink text-cream border-t border-cream/10">
      <div className="max-w-7xl mx-auto px-5 lg:px-10 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-2">
            <AikoLogo dark height={32} />
            <p className="mt-4 text-[13px] text-cream/50 leading-relaxed max-w-md">
              {t("description")}
            </p>
          </div>

          <div>
            <h4 className="text-[11px] uppercase tracking-[0.15em] text-gold mb-4">
              {t("platform")}
            </h4>
            <ul className="space-y-2 text-[13px] text-cream/50">
              <li>
                <Link href={`/${locale}#creer`} className="hover:text-cream transition-colors">
                  {t("create_event")}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/residences`} className="hover:text-cream transition-colors">
                  {t("residences")}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/services`} className="hover:text-cream transition-colors">
                  {t("services")}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/mon-qr`} className="hover:text-cream transition-colors">
                  Retrouver mon QR code
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-[11px] uppercase tracking-[0.15em] text-gold mb-4">
              {t("contact")}
            </h4>
            <ul className="space-y-2 text-[13px] text-cream/50">
              <li>
                <a href="mailto:contact@aikoboard.com" className="hover:text-cream transition-colors">
                  contact@aikoboard.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-cream/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-cream/30">
            &copy; {year} AIKO Board. {t("rights")}
          </p>
          <div className="flex items-center gap-4 text-[11px] text-cream/30">
            <Link href={`/${locale}/mentions-legales`} className="hover:text-cream/60 transition-colors">
              Mentions légales
            </Link>
            <Link href={`/${locale}/cgu`} className="hover:text-cream/60 transition-colors">
              CGU
            </Link>
            <Link href={`/${locale}/confidentialite`} className="hover:text-cream/60 transition-colors">
              Confidentialité
            </Link>
          </div>
          <p className="text-[11px] text-cream/30">
            {t("made_in")}
          </p>
        </div>
      </div>
    </footer>
  );
}
