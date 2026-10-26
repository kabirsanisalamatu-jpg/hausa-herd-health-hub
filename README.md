# Hausa Herd Health Hub

AgriVet OS — Phase 1: Foundation, Design System & Localization



We are building AgriVet OS, a Hausa-first, English-ready livestock health platform for farmers and veterinary professionals in Nigeria.



This is Phase 1 only.



Do NOT build the landing page, authentication, waitlist, dashboards, database, AI features, or Phase 2 functionality yet.



The goal of this phase is to establish a clean, scalable foundation that later phases can build on safely.



1. Inspect the existing project first



Before changing anything:



- Inspect the existing project structure.

- Inspect "package.json".

- Identify the framework and existing dependencies.

- Identify whether Supabase is already connected.

- Identify existing routes, components, styling, and configuration.

- Inspect any existing GitHub-connected code.

- Preserve useful existing work.

- Do not replace the existing framework or dependencies unnecessarily.



If the project is empty or does not already have an appropriate stack, use:



- React

- TypeScript

- Vite

- Tailwind CSS

- shadcn/ui where appropriate

- Lucide icons



Do not introduce unnecessary libraries.



Before implementation, briefly summarize what you found and the architecture you will use.



Then implement the phase.



---



2. Product principles



AgriVet OS must be:



- Hausa-first

- English-ready

- Mobile-first

- Responsive

- Simple enough for farmers using low-to-mid-range Android phones

- Professional and trustworthy

- Appropriate for African agritech and animal-health use



Visual direction:



- clean

- spacious

- professional

- rounded but not excessively playful

- accessible contrast

- clear CTAs

- readable typography

- simple cards

- subtle borders

- restrained shadows

- lightweight illustrations/icons



Avoid:



- heavy gradients

- glassmorphism

- excessive animations

- clutter

- futuristic "AI" visual styling

- excessive rounded/pill UI

- unnecessary decorative elements



The product should feel like a serious livestock-health platform rather than an AI experiment.



Prepare the structure to be PWA-ready, but do not spend this phase implementing advanced PWA functionality.



---



3. Localization architecture



Create a scalable localization system.



Structure:



src/

  locales/

    ha/

      common.ts

    en/

      common.ts



The architecture must support adding additional languages later without rewriting components.



Default language



Hausa is the default language.



English is the fallback language.



Translation requirements



Create:



- "LanguageContext"

- "useTranslation()" hook

- "t()" translation function

- translation dictionaries for Hausa and English



The fallback behavior should be:



1. Try the selected language.

2. If a translation key is missing, use English.

3. If it is missing from English too, return the key safely rather than crashing.



Do not hard-code user-facing interface text inside components.



This includes:



- buttons

- navigation

- headings

- descriptions

- labels

- placeholders

- validation messages

- error messages

- aria-labels

- tooltips

- empty states

- loading states

- notifications/toasts



Database field names and role values must NOT be translated.



---



4. Language persistence



Create language persistence using "localStorage".



Use a stable key such as:



agrivet_language



Behavior:



- First visit → Hausa

- User switches to English → save English

- User switches back to Hausa → save Hausa

- Refresh → preserve selected language



Prepare the architecture so that a future authenticated user's preference can also be synchronized with:



profiles.preferred_language



Do not create the database implementation yet.



---



5. LanguageSwitcher component



Create a reusable:



LanguageSwitcher



It must display:



Hausa | English



Requirements:



- keyboard accessible

- visible focus state

- accessible labels

- mobile friendly

- clear active language

- no unnecessary animation



All visible text must come from the translation system.



The component must be reusable on:



- landing page

- authentication pages

- app layouts



Even though those pages are not being built yet, structure the component so it can be reused later.



---



6. Design system



Create reusable UI foundations.



Use existing shadcn/ui components if already installed.



Create or prepare:



src/

  components/

    ui/

    common/

  layouts/

  contexts/

  hooks/

  lib/

  types/

  locales/



At minimum establish reusable components or patterns for:



- Button

- Input

- Select

- Card

- Badge

- Alert

- Loading state

- Empty state

- Page container



Do not over-engineer the component system.



Only create components that will actually be reused.



---



7. Brand foundation



Use the product name:



AgriVet OS



Create a simple text/icon-based temporary brand treatment if a logo asset does not already exist.



Do not generate a complicated logo.



Use an animal-health/agriculture visual language.



Possible icon direction:



- livestock

- leaf

- health/cross

- farm



Use Lucide icons where suitable.



Do not use copyrighted external images.



---



8. Responsive foundation



Make the application mobile-first.



Design primarily for:



360px

375px

390px

412px



Then scale naturally to:



768px

1024px

1280px+



Requirements:



- no horizontal scrolling

- touch targets approximately 44px or larger

- readable text

- comfortable spacing

- responsive containers

- accessible navigation structure



The future farmer experience must work well on inexpensive Android phones.



---



9. Accessibility foundation



Follow basic WCAG-friendly practices.



Ensure:



- semantic HTML

- labels for form controls

- keyboard navigation

- visible focus states

- sufficient contrast

- accessible buttons

- accessible icon buttons

- appropriate heading hierarchy

- "aria-label" where necessary

- no interaction dependent only on hover



Do not use color as the only way to communicate status.



---



10. Future architecture



Prepare the project for these future areas without implementing them now:



User roles



farmer

vet

admin

content_editor

super_admin



Do not create public role selection or role logic in this phase.



Future routes



/

 /waitlist

 /demo

 /sign-in

 /sign-up

 /forgot-password

 /reset-password



 /dashboard

 /farmer/dashboard

 /vet/dashboard

 /admin/dashboard

 /content/dashboard



Do not build these pages yet.



Only establish a clean route architecture that will allow them to be added later.



---



11. Future Supabase architecture



Do not create the Phase 1 database yet.



However, structure the code so Supabase can be added cleanly in the next phase.



Do not:



- hard-code API keys

- add service-role credentials

- create fake authentication

- create insecure client-side role logic



If Supabase is already connected, preserve the existing connection.



Create ".env.example" only if it does not already exist, using placeholders such as:



VITE_SUPABASE_URL=

VITE_SUPABASE_ANON_KEY=



Never expose a Supabase service-role key in frontend code.



---



12. Future user experience



Keep these principles in mind when creating the foundation:



Farmer



The future farmer experience should prioritize:



- simplicity

- Hausa

- clear actions

- minimal technical terminology

- mobile usability



Veterinarian



The future vet experience should feel:



- professional

- structured

- information-rich

- efficient



Admin



The future admin experience should prioritize:



- control

- verification

- moderation

- platform management



Content editor



The future content editor should have content-focused access and should not have system-administration privileges.



Do not implement these dashboards yet.



---



13. Safety/product language



AgriVet OS is an animal-health platform.



Never present the future AI as:



- a veterinarian

- a replacement for a veterinarian

- a definitive diagnostic authority



Future guidance must be framed as informational/preliminary and encourage appropriate professional veterinary care.



Do not implement AI functionality in this phase.



---



14. Code quality



Keep the code:



- typed

- readable

- modular

- maintainable

- simple

- documented only where useful



Avoid:



- unnecessary abstractions

- duplicate components

- massive components

- inline hard-coded translations

- unused dependencies

- dead code

- placeholder functionality pretending to be complete



Use TypeScript properly.



---



15. GitHub



This project will use GitHub as the source of truth.



Do not remove or overwrite existing repository configuration unnecessarily.



Keep changes organized and easy to review.



If Lovable's GitHub integration creates commits automatically, preserve that workflow.



---



16. Phase 1 completion criteria



Before declaring Phase 1 complete, verify:



Project



- Application starts successfully.

- No TypeScript errors.

- No build errors.

- No obvious console errors.

- Existing functionality remains intact.



Localization



- Hausa loads by default.

- English can be selected.

- Language selection persists after refresh.

- Missing Hausa keys fall back to English.

- No user-facing hard-coded strings remain in the foundation components.



UI



- Responsive at approximately 360px.

- Responsive on tablet.

- Responsive on desktop.

- No horizontal overflow.

- Keyboard navigation works.

- Focus states are visible.

- Touch targets are sufficiently large.



Components



Verify the reusable foundation components work.



Code



- No unnecessary dependencies.

- No exposed secrets.

- No service-role credentials.

- No fake authentication.

- No Phase 2 features.



---



17. IMPORTANT SCOPE RULE



This is Phase 1 only.



DO NOT build:



- authentication

- sign-up

- sign-in

- password reset

- waitlist

- Supabase tables

- RLS

- farmer dashboard

- vet dashboard

- admin dashboard

- content dashboard

- AI assistant

- AI diagnosis

- medication recommendations

- animal records

- vaccination system

- treatment system

- marketplace

- payments

- telemedicine

- chat

- analytics

- weather alerts



Those belong to later phases.



Do not invent additional features.



---



Final response required



When Phase 1 is complete, report:



1. Existing project stack discovered

2. Files created

3. Files modified

4. Dependencies added, if any

5. Localization architecture

6. Components created

7. Responsive/accessibility work completed

8. Tests/checks performed

9. Any issues remaining

10. What should be built in Phase 2



Then STOP.



Do not automatically begin Phase 2.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://hausa-herd-health-hub.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/87db209d-1199-449a-8470-a1d6a5d068d8).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
