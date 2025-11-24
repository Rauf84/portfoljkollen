# Portföljkollen

MVP för ett webbaserat verktyg som hjälper till att administrera projekt, aktiviteter, beslutspunkter och enkla beroenden. Frontenden är byggd i React med Vite och pratar direkt med Supabase (PostgreSQL + Auth) på gratisnivån.

## Kom igång

1. Klona repot och installera beroenden:
   ```bash
   npm install
   ```
2. Skapa en `.env`-fil baserat på `.env.example` och fyll i dina Supabase-nycklar:
   ```bash
   VITE_SUPABASE_URL=https://<ditt-projekt>.supabase.co
   VITE_SUPABASE_ANON_KEY=<din-anon-key>
   ```
3. Kör utvecklingsservern (lyssnar på `0.0.0.0:5173` för att funka i Codespaces/cockpit-liknande miljöer):
   ```bash
   npm run dev
   ```
   Öppna sedan [http://localhost:5173](http://localhost:5173) i din webbläsare.
   - I GitHub Codespaces/remote-IDE: använd den genererade URL:en för port 5173, t.ex.
     `https://<ditt-codespace>-5173.app.github.dev/` (som `https://upgraded-engine-p6r9x5q9g99frxr4-5173.app.github.dev/`).

### Rekommenderad datamodell i Supabase

Skapa tabellerna enligt följande (kolumnnamn kan bytas, men matcha gärna koden):

- **projects**: `id (uuid, pk)`, `name`, `description`, `start_date`, `end_date`, `project_owner`, `project_manager`, `impact_owner`, `status`, `priority` (int)
- **activities**: `id (uuid, pk)`, `project_id (fk → projects.id)`, `name`, `description`, `start_date`, `end_date`, `status`, `responsible`
- **milestones**: `id (uuid, pk)`, `project_id (fk → projects.id)`, `name`, `decision_type`, `date`, `status`
- **dependencies**: `id (uuid, pk)`, `from_activity_id (fk → activities.id)`, `to_activity_id (fk → activities.id)`, `type`

Aktivera Supabase Auth (e-post/lösenord). Endast inloggade användare får se projektlistan.

## Funktioner i denna MVP

- **Inloggning** via Supabase Auth (e-post/lösenord).
- **Projektlista/portföljvy** med filtrering på status.
- **Projektdetaljer**: aktiviteter, beslutspunkter, beroenden samt formulär för att skapa och ta bort poster.
- **Enkla beroenden inom projektet**: koppla en aktivitet till en annan aktivitet (finish-to-start läge som defaulttext).

## Struktur

- `src/App.tsx` – huvudsidan med projektlista, detaljer och formulär.
- `src/api/projects.ts` – tunna helpers mot Supabase för CRUD-operationer.
- `src/hooks/useSupabaseAuth.ts` – enkel lyssnare på inloggningsstatus.
- `src/components/AuthForm.tsx` – inloggnings-/registreringsformulär.
- `src/styles/*` – basstil och komponentstil.

## Deploy-idé

Koppla repot till Netlify eller GitHub Pages. Bygg med `npm run build` och peka miljövariablerna i respektive hosting-miljö till Supabase-projektet.
