"use client";

import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";

/**
 * Hero de la page d'accueil.
 *
 * La scene video occupe presque toute la hauteur : c'est elle qui porte le
 * message, le texte venant s'y poser en surimpression. Tant qu'aucune video
 * n'est fournie, le fond de marque tient seul — la page n'a jamais l'air
 * inachevee.
 *
 * Pour activer la video, renseigner NEXT_PUBLIC_HERO_VIDEO_URL : un fichier
 * depose dans public/videos/ ("/videos/hero.mp4") ou une adresse distante.
 * NEXT_PUBLIC_HERO_POSTER_URL fournit l'image d'attente, affichee le temps
 * du chargement. Sans ces variables, aucune balise video n'est rendue : pas
 * de requete perdue ni d'erreur dans la console.
 */

const VIDEO_URL = process.env.NEXT_PUBLIC_HERO_VIDEO_URL ?? "";
const POSTER_URL = process.env.NEXT_PUBLIC_HERO_POSTER_URL ?? "";

interface HeroProps {
  locale: string;
  t: (key: string) => string;
}

export function Hero({ locale, t }: HeroProps) {
  return (
    <div className="bg-ink text-cream">
      <div className="max-w-[1500px] mx-auto px-4 sm:px-5 lg:px-8 pt-5 lg:pt-8 pb-12 lg:pb-20">
        <div className="hero-stage relative overflow-hidden rounded-[24px] lg:rounded-[36px] aspect-[3/4] sm:aspect-[16/10] lg:aspect-[21/9]">
          {/* Grain : evite l'aplat trop lisse sur les grands ecrans */}
          <div className="hero-grain pointer-events-none absolute inset-0 opacity-[0.14]" aria-hidden />

          {/* La video prend toute la scene des qu'elle est fournie */}
          {VIDEO_URL && (
            <video
              className="absolute inset-0 h-full w-full object-cover animate-slow-zoom"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              poster={POSTER_URL || undefined}
              aria-hidden
            >
              <source src={VIDEO_URL} />
            </video>
          )}

          {/* Voile : le texte doit rester lisible sur n'importe quelle image */}
          <div
            className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-ink/5"
            aria-hidden
          />

          {/* Filet dore en haut de scene */}
          <div className="hero-rule absolute inset-x-0 top-0 h-px" aria-hidden />

          {/* Barre haute : signature et statut */}
          <div className="absolute inset-x-0 top-0 flex items-center justify-between p-5 lg:p-8">
            <span className="inline-flex items-center gap-2.5 rounded-full border border-cream/15 bg-ink/40 px-3.5 py-1.5 text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-cream/70 backdrop-blur-md">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-gold" />
              </span>
              {t("eyebrow")}
            </span>

            <span className="hidden sm:block font-serif text-[16px] tracking-[0.3em] text-cream/50">
              AIKO
            </span>
          </div>

          {/* Message principal, pose sur la video */}
          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8 lg:p-14">
            <div className="max-w-3xl animate-rise-in">
              <h1 className="font-serif text-[38px] sm:text-[58px] lg:text-[80px] leading-[0.96] tracking-[-0.025em]">
                {t("h1_pre")}{" "}
                <em className="text-gold not-italic">{t("h1_highlight")}</em>.
              </h1>

              <p className="mt-4 lg:mt-6 max-w-xl text-[15px] sm:text-[17px] leading-[1.6] text-cream/65">
                {t("lead")}
              </p>

              <div className="mt-6 lg:mt-9 flex flex-wrap items-center gap-3">
                <Link
                  href={`/${locale}/evenements/creer`}
                  className="btn-press group inline-flex items-center gap-2.5 rounded-full bg-gold px-6 py-3.5 text-[15px] font-semibold text-ink transition-colors hover:bg-gold2"
                >
                  {t("cta_create")}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>

                <Link
                  href="#participer"
                  className="inline-flex items-center gap-2.5 rounded-full border border-cream/20 bg-ink/30 px-6 py-3.5 text-[15px] text-cream/80 backdrop-blur-md transition-all hover:border-cream/40 hover:text-cream"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  {t("tab_participate")}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
