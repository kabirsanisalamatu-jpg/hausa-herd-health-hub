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
