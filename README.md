# 🏝️ Workation

Eine App zur Organisation gemeinsamer **Workations** (Work + Vacation): Aufenthalte planen,
Mitglieder einladen, einen Tagesplan abstimmen und Ausgaben fair aufteilen – inklusive
Beleg-Upload und PayPal-Abrechnung.

Gebaut mit SvelteKit (Svelte 5), Drizzle ORM und PostgreSQL. Dunkles Glassmorphism-UI
(„Coastal Dusk") mit animiertem Hintergrund.

## Funktionen

- **Rollen** – globale Rollen (`admin` / `member`), erweiterbar. Der erste registrierte
  Nutzer wird automatisch Admin. Nur Admins legen Workations an und verwalten Tagespläne.
- **Workations** – Aufenthalte mit Zeitraum anlegen, Mitglieder per Benutzername einladen
  (annehmen/ablehnen).
- **Tagesplan** – interaktiver **Wochenkalender** mit Zeitraster; per Klick auf einen
  freien Slot wird ein Eintrag angelegt (Google-Calendar-Stil). Überlappende Termine
  werden nebeneinander dargestellt.
- **Ausgaben & Schulden** – Ausgaben mit Betrag auf ausgewählte Teilnehmer aufteilen,
  **Beleg-Upload** (im Browser komprimiert, als `bytea` in der DB). Netto-Schuldenübersicht
  je Person mit **PayPal.me-Zahllink**.
- **Dashboard** – laufende Workation mit „Tag X von Y", Resttagen und heutigem Programm;
  kommende Workations auf einen Blick.
- **Authentifizierung** – session-basiert, selbst implementiert nach dem
  [Lucia](https://lucia-auth.com/)-Muster, ganz ohne Auth-Paket. Nur `node:crypto`:
  scrypt-Passwort-Hashing (OWASP-Parameter), SHA-256-Session-IDs (das Token liegt nie
  im Klartext in der DB).

## Tech-Stack

- **[SvelteKit](https://svelte.dev/docs/kit)** + **Svelte 5** (Runes)
- **[Drizzle ORM](https://orm.drizzle.team/)** + **PostgreSQL** (Dev-DB: Supabase)
- **[@lucide/svelte](https://lucide.dev/)** für Icons, self-hosted Fonts via
  **@fontsource** (Bricolage Grotesque + Manrope)
- **pnpm**, TypeScript, ESLint, Vitest

## Voraussetzungen

- Node.js ≥ 20
- pnpm
- Eine PostgreSQL-Datenbank (z. B. ein kostenloses Supabase-Projekt)

## Einrichtung

```sh
# 1. Abhängigkeiten installieren
pnpm install

# 2. Umgebung konfigurieren
cp .env.example .env
# DATABASE_URL in .env auf die eigene Postgres-/Supabase-URL setzen

# 3. Schema in die Datenbank bringen
pnpm run db:migrate

# 4. Entwicklungsserver starten
pnpm run dev
```

Der erste registrierte Account wird **Admin**. Anschließend unter *Einstellungen* den
PayPal.me-Benutzernamen hinterlegen, damit Zahllinks angezeigt werden.

## Datenbank-Workflow

Schema-Änderungen werden über **Migrationen** eingespielt (nicht `db:push`):

```sh
pnpm run db:generate   # nach Schema-Änderung: SQL-Migration erzeugen
pnpm run db:migrate    # Migration(en) anwenden
pnpm run db:studio     # Drizzle Studio öffnen
```

> Hinweis: `db:push` wird bewusst nicht verwendet – es stürzt mit Supabase wegen eines
> bekannten drizzle-kit-Introspect-Bugs ab. Der Migrations-Workflow umgeht das.

## Sicherheit & Supply-Chain

Das Projekt ist auf eine kleine, geprüfte Abhängigkeitsbasis ausgelegt:

- **pnpm** mit `minimumReleaseAge` (14 Tage Quarantäne in `pnpm-workspace.yaml`) – frisch
  veröffentlichte Paketversionen werden erst nach einer Reifezeit installiert.
- Lifecycle-/Build-Skripte sind standardmäßig blockiert (`onlyBuiltDependencies: []`).
- Exaktes Versions-Pinning (`save-exact`) + committetes `pnpm-lock.yaml`.
- Keine externen Font-/Icon-CDNs (alles self-hosted, DSGVO-freundlich).
- `pnpm audit` ist sauber.

## Skripte

| Skript | Zweck |
|---|---|
| `pnpm run dev` | Entwicklungsserver |
| `pnpm run build` | Produktions-Build |
| `pnpm run preview` | Build lokal ansehen |
| `pnpm run check` | Typprüfung (svelte-check) |
| `pnpm run lint` | ESLint |
| `pnpm test` | Tests (Vitest) |
| `pnpm run db:generate` / `db:migrate` / `db:studio` | Datenbank |

## Projektstruktur

```
src/
├─ lib/
│  ├─ server/        # DB, Auth (Lucia-Muster), Zugriffsprüfung – nur serverseitig
│  ├─ calendar.ts    # Datums-/Wochen-Helfer
│  ├─ money.ts       # Aufteilung & PayPal-Link
│  └─ format.ts      # Datum-/Währungsformatierung
├─ routes/
│  ├─ +page.*        # Dashboard
│  ├─ login/         # Anmeldung & Registrierung
│  ├─ settings/      # Profil (PayPal-Handle)
│  └─ workations/    # Liste, Anlegen, Detail (Tagesplan/Ausgaben/Mitglieder)
└─ app.css           # Glas-Design-System
```
