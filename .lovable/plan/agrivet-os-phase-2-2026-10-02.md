# AgriVet OS Phase 2

## Build
- Replace the foundation showcase at `/` with a concise Hausa-first public landing page covering the hero, features, four-step flow, audiences, vision, safety notice, and waitlist call-to-action.
- Upgrade the shared public header and footer with desktop and accessible mobile navigation, language switching, and graceful future links for Demo, Sign In, and Sign Up.
- Add `/waitlist` with a complete translated form, client-side validation, loading, unavailable/error, and development success states.
- Keep submissions behind a small service boundary that performs no storage and can be replaced by the Phase 3 database implementation.

## Design and experience
- Use the existing agricultural palette, typography, shadcn controls, Lucide icons, and compact CSS illustration; add no heavy media or dependencies.
- Keep all visible copy in the existing Hausa and English dictionaries, with Hausa as default and English as fallback.
- Make mobile controls at least 44px, preserve visible focus, associate errors with fields, and prevent horizontal overflow.

## Verification
- Check metadata and route behavior for `/` and `/waitlist`.
- Exercise Hausa default, English switching and persistence, all required validation, development success/error states, mobile navigation, keyboard focus, and responsive layouts from 360px through desktop.
- Confirm the preview builds cleanly with no console errors and no Phase 3 functionality.

## Technical details
- Reuse TanStack Router, `LanguageContext`, `useTranslation()`, React Hook Form, Zod, and existing shadcn components.
- Future destinations remain ordinary unavailable links without creating placeholder routes; the working primary path is `/waitlist`.
- The development submission adapter returns an explicit non-persistent result and never claims production storage.
