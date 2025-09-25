# Repository Guidelines

## Project Structure & Module Organization
Feature routes live under `app/` following the Next.js App Router (`app/gps`, `app/race`, `app/manual`). Shared UI primitives are in `components/`, with state helpers in `context/` and `hooks/`. Domain logic sits in `src/features/*`, while reusable types, localisation, and shared utilities live in `src/types`, `src/locale`, and `src/shared`. Static assets and icons are stored in `public/`, and maintenance scripts (including image compression) are under `scripts/`.

## Build, Test, and Development Commands
- `npm run dev`: starts the Next.js dev server on all interfaces for live previewing.
- `npm run build`: compiles the production bundle; run before packaging or deploying.
- `npm run start`: serves the built bundle for smoke tests.
- `npm run lint`: executes ESLint with the shared Prettier config; fix issues before committing.
- `npm run compress`: optimises images via `scripts/compress-images.js` ahead of shipping media.

## Coding Style & Naming Conventions
Use modern TypeScript with strict mode in mind and functional React components named in PascalCase. Keep indentation at two spaces and prefer Tailwind utility classes for styling. Adopt configured path aliases such as `@components/*` and `@features/*` to avoid deep relative imports. Run `npm run lint` to enforce the shared ESLint + Prettier ruleset before committing.

## Testing Guidelines
Automated tests are nascent; colocate future specs alongside features (e.g. `src/features/map/__tests__/Component.test.tsx`). Until a harness lands, rely on manual verification through `app/test-online` and race flows. Document checked scenarios in the PR description. Treat linting as the minimum quality gate.

## Commit & Pull Request Guidelines
Commits typically use descriptive summaries—often in Chinese—that state the user impact first, followed by key details. For pull requests, link relevant issues, list affected routes or features, and include screenshots or recordings for UI updates. Summarise manual test coverage so reviewers can replay critical paths.
