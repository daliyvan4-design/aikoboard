"use client";

import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";

/**
 * Hero de la page d'accueil.
 *
 * Le message occupe une bande haute compacte, la video prend tout le reste.
 * Elle n'est volontairement pas recouverte de texte : le film porte ses
 * propres titres et sous-titres, et superposer les notres rendait les deux
 * illisibles. Le titre reste en HTML — c'est lui que lisent les moteurs de
 * recherche et les lecteurs d'ecran, une video ne peut pas s'en charger.
 *
 * Pour activer la video, renseigner NEXT_PUBLIC_HERO_VIDEO_URL : un fichier
 * depose dans public/videos/ ("/videos/hero.mp4") ou une adresse distante.
 * NEXT_PUBLIC_HERO_POSTER_URL fournit l'image d'attente. Sans ces variables,
 * aucune balise video n'est rendue et le fond de marque tient seul : pas de
 * requete perdue ni d'erreur dans la console.
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
      <div className="max-w-[1500px] mx-auto px-4 sm:px-5 lg:px-8 pt-10 lg:pt-14 pb-12 lg:pb-20">
        {/* ── Message : compact, il laisse la place a l'image */}
        <div className="max-w-3xl animate-rise-in">
          <h1 className="font-serif text-[40px] sm:text-[60px] lg:text-[76px] leading-[0.96] tracking-[-0.025em]">
            {t("h1_pre")} <em className="text-gold not-italic">{t("h1_highlight")}</em>.
          </h1>

          <p className="mt-5 max-w-xl text-[15px] sm:text-[17px] leading-[1.6] text-cream/60">
            {t("lead")}
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              href={`/${locale}/evenements/creer`}
              className="btn-press group inline-flex items-center gap-2.5 rounded-full bg-gold px-6 py-3.5 text-[15px] font-semibold text-ink transition-colors hover:bg-gold2"
            >
              {t("cta_create")}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>

            <Link
              href="#participer"
              className="inline-flex items-center gap-2.5 rounded-full border border-cream/20 px-6 py-3.5 text-[15px] text-cream/80 transition-all hover:border-cream/40 hover:text-cream"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              {t("tab_participate")}
            </Link>
          </div>
        </div>

        {/* ── Scene video : pleine largeur, rien par-dessus */}
        <div className="hero-stage relative mt-10 lg:mt-14 overflow-hidden rounded-[20px] lg:rounded-[28px] aspect-video">
          {/* Grain : evite l'aplat trop lisse quand la video n'est pas la */}
          <div className="hero-grain pointer-events-none absolute inset-0 opacity-[0.14]" aria-hidden />

          {VIDEO_URL && (
            <video
              className="absolute inset-0 h-full w-full object-cover"
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

          {/* Filet dore en haut de scene */}
          <div className="hero-rule absolute inset-x-0 top-0 z-10 h-px" aria-hidden />

          {/* Signature discrete, hors de la zone de texte du film */}
          <span className="absolute right-5 top-4 z-10 hidden font-serif text-[14px] tracking-[0.3em] text-cream/35 sm:block">
            AIKO
          </span>
        </div>
      </div>
    </div>
  );
}
