<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules

- All user-facing text goes through `t()` from `useTranslation()`; dictionaries live in `src/locales/<lang>/common.ts` — keeps the Hausa-first/English-fallback contract in one place.
- Language state lives in `src/contexts/LanguageContext.tsx` and persists under the `agrivet_language` localStorage key — single source of truth, later syncable with `profiles.preferred_language`.
- Reusable non-shadcn UI lives in `src/components/common/`, shells in `src/layouts/` — keeps `src/components/ui/` as untouched shadcn primitives.
- Colors, fonts and radii are semantic tokens in `src/styles.css`; components never hard-code color classes — required for consistent theming.
- Waitlist submission goes only through `waitlistService` in `src/lib/waitlist.ts`; the `waitlist` table is insert-only for anon (no SELECT/UPDATE/DELETE grants or policies) — keeps personal data private and DB errors mapped to safe messages.
- Auth state (session, profile, role) lives only in `src/contexts/AuthContext.tsx` via `useAuth()`; auth errors go through `authErrorKey()` in `src/lib/auth.ts` — one auth source, no raw errors in UI.
- Roles live in `public.user_roles` and are written only by the `handle_new_user` trigger (farmer/vet only) or trusted SQL; clients have SELECT-own only — prevents self-promotion.
- `profiles` grants UPDATE on editable columns only (name, phone, location, language, avatar) — id/email can't be changed by clients.
- Signed-in pages live under `src/routes/_authenticated/` (client-only gate redirecting to `/sign-in`) — session is in browser storage.
- Livestock data goes only through `livestockService` in `src/lib/livestock.ts`; the `livestock` table is owner-only via RLS (farmer role + `owner_id = auth.uid()`), owner defaults from the session and is immutable, no DELETE (soft archive) — ownership is enforced in the database, not the UI.
- Livestock form/summary UI lives in `src/components/livestock/`; farmer pages live under `src/routes/_authenticated/farmer/` behind the farmer `RoleGate` layout — one gate for the whole subtree.
- Health events and vaccinations go only through `healthService` in `src/lib/health.ts`; tables are owner-only via RLS (farmer role + owner_id = auth.uid() + linked livestock owned), with a composite FK (livestock_id, owner_id) → livestock(id, owner_id), immutable owner/livestock, no DELETE — ownership is enforced in the database. Due status is computed from the recorded next_due_date only (`dueStatus()`); no schedules are generated.
- Treatment records go only through `treatmentService` in `src/lib/treatments.ts`; `treatment_records` mirrors the health-table security (owner-only RLS, composite FK to livestock owner, immutable owner/livestock, no DELETE) and additionally blocks inserts/edits on archived livestock in RLS. Reminders come only from the `farmer_reminders(_today, _horizon)` RPC (active livestock, farmer's local date passed from the client); vaccination records superseded by a later dose with the same normalised name (`vaccine_key`/`supersededIds`) are excluded from due counts and reminders.
