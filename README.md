# AIKO Board

Plateforme d'événements : création d'événement, billetterie (badges et tickets),
paiement mobile money, badges PVC imprimables, check-in par QR code — plus un
back-office de conciergerie (commandes, résidences, chauffeurs, planning).

Production : https://aikoboard.com

## Stack

| Couche | Techno |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Base de données | PostgreSQL (Neon) via Prisma 6 |
| Auth back-office | NextAuth v4 — credentials + JWT, 5 rôles |
| Paiement | GeniusPay (Wave, Orange/MTN/Moov Money, carte) |
| Emails | Resend |
| Images | Cloudinary |
| Rate limiting | Upstash Redis, avec repli mémoire |
| PDF | jsPDF (badges PVC, tickets, reçus) |
| i18n | next-intl — français, anglais, arabe |
| Tests | Vitest |
| Hébergement | Vercel |

## Démarrage

```bash
npm install                  # déclenche prisma generate
cp .env.example .env         # puis renseigner les valeurs
npx prisma migrate deploy    # applique le schéma
npx prisma db seed           # données de départ (optionnel)
npm run dev
```

Toutes les variables d'environnement sont documentées dans [.env.example](.env.example).
Seules `DATABASE_URL` et `NEXTAUTH_SECRET` sont obligatoires : sans clés GeniusPay
le paiement répond 503, sans Resend les emails sont ignorés, sans Upstash le rate
limit retombe sur un compteur en mémoire.

> **Attention** : `.env.local` a priorité sur `.env` dans Next.js. Si vous y
> laissez un `DATABASE_URL`, c'est lui qui sera utilisé par `next dev` — alors
> que le CLI Prisma, lui, ne lit que `.env`. Les deux doivent pointer vers la
> même base, sinon vos migrations et votre application divergent.

## Commandes

```bash
npm run dev         # serveur de développement
npm run build       # build de production
npm test            # suite Vitest
npm run typecheck   # tsc --noEmit
npm run lint        # ESLint (config plate)
```

La CI GitHub Actions rejoue `lint`, `typecheck` et `test` sur chaque push et
chaque pull request.

### Vérifier le responsive téléphone

```bash
npx playwright install chromium        # une seule fois
npx tsx scripts/audit-mobile.ts        # audite la production
AUDIT_BASE=http://localhost:3000 npx tsx scripts/audit-mobile.ts
```

Le script charge chaque page dans un vrai navigateur en 375 px et 360 px, et
signale tout débordement horizontal avec l'élément fautif — le défaut qui
force l'utilisateur à scroller latéralement. Passer `AUDIT_TOKEN=<token>` pour
inclure les pages privées de l'organisateur.

## Architecture

### Cycle de vie d'un événement

1. L'organisateur remplit le formulaire → l'événement est créé en `statut: "pending"`
   et reçoit un `manageToken` (32 octets aléatoires).
2. Il paie les frais de création. **L'événement n'est publié qu'après paiement** :
   c'est le webhook GeniusPay qui le passe en `actif`. En secours, la page de
   succès interroge l'API GeniusPay et réconcilie la base.
3. L'organisateur reçoit par email son lien privé de gestion
   (`/fr/organisateur/<slug>?token=…`).

### Accès aux données d'un événement

Les coordonnées des inscrits ne sont jamais publiques. Deux porteurs de droits,
gérés par [lib/event-access.ts](lib/event-access.ts) :

- une **session admin** AIKO (rôles `ADMIN`, `SUPERVISEUR`, `CONCIERGE`,
  `AGENT_INSTITUTIONNEL`, `SCANNER`) ;
- le **token de gestion** de l'événement, qui permet à l'organisateur de
  consulter ses inscrits, exporter le CSV et scanner les badges sans compte.

La fiche publique (`GET /api/events/[slug]`) n'expose ni contact organisateur,
ni token, ni liste d'inscrits.

### Paiements

Tous les montants sont recalculés côté serveur ([lib/pricing.ts](lib/pricing.ts))
à partir du tarif de l'événement ou de l'inscription réellement enregistrée. Le
montant envoyé par le client n'est jamais retenu.

Les effets d'un paiement réussi vivent au même endroit
([lib/payment-flow.ts](lib/payment-flow.ts)) et sont idempotents : le webhook et
la réconciliation peuvent tous les deux s'exécuter sans double email ni double
activation. Les webhooks sont signés (HMAC-SHA256), horodatés (fenêtre de 5 min)
et journalisés pour empêcher le rejeu.

### Inscriptions

Capacité et numéro de ticket sont attribués dans une même transaction, protégés
par une contrainte unique `(eventId, ticketNumber)` avec reprise en cas de
collision. Un événement complet répond `409 EVENT_FULL`.

## Points d'attention

- **PDF sans accents** : jsPDF (polices standard) rend mal les caractères
  accentués. Les fichiers `lib/generate-*-pdf.ts` utilisent volontairement du
  texte non accentué. Cette contrainte ne concerne **que** les PDF — l'interface
  web doit rester correctement accentuée.
- **Données personnelles** : les participants peuvent être anonymisés
  individuellement (`POST /api/admin/participants/[ref]/anonymize`) et le cron
  quotidien anonymise automatiquement ceux dont l'événement est terminé depuis
  plus de 12 mois.
- **Cron** : `vercel.json` déclenche `/api/cron/reminders` chaque jour à 8h
  (rappels J-1 + purge RGPD). La route exige `Authorization: Bearer $CRON_SECRET`.

## Déploiement

```bash
npx prisma migrate deploy    # d'abord la base
vercel deploy --prod         # puis l'application
```

L'ordre compte : le code déployé suppose le schéma à jour.
