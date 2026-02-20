# Nutri B2C Frontend

Nutri B2C is a consumer nutrition web app built with Next.js, focused on recipe discovery, analysis, meal planning, and daily nutrition tracking.

## Latest Product Updates

- Added Meal Log experience with daily tracking, meal slots, hydration tracking, and nutrition progress views.
- Added Meal Plan experience with generation, activation, swap, regeneration, and history flows.
- Expanded Recipe Analyzer to support text, URL, image, and barcode analysis through backend API routes.
- Added personalized warnings using family member context for allergen and health notices.
- Improved Scan flow with stronger barcode detection and richer result presentation.
- Added recipe rating support and integrated rating actions in recipe-related flows.
- Added cooking completion logging so meals can be sent directly to Meal Log after finishing recipe steps.
- Expanded profile and health data handling to support richer dietary, allergen, and condition metadata.

## Core Capabilities

- Authentication and user management via Appwrite.
- Recipe browsing, saving, and detailed recipe views.
- Recipe analysis with nutrition and warning insights.
- Barcode and image assisted product scanning.
- Household-aware personalization for analysis and planning.
- Daily meal logging and streak tracking.
- Weekly meal planning workflows.

## Main Routes

- `/` Home and primary discovery.
- `/recipes` Recipe browsing and detail experiences.
- `/recipe-analyzer` Multi-source analyzer.
- `/scan` Product barcode and image scan experience.
- `/meal-log` Daily nutrition logging workspace.
- `/meal-plan` Weekly plan generation and management.
- `/budget` Household budget tracking dashboard.
- `/profile` Personal profile and health preferences.

## Technology

- Frontend framework: Next.js (React)
- Language: TypeScript
- Auth and user storage: Appwrite
- Package management: pnpm

## Environment and Setup Notes

- Configure environment variables before running the app.
- Use public-prefixed variables only for values intended for browser exposure.
- Keep Appwrite project, database, and collection identifiers consistent across local and deployed environments.
- Ensure backend API base URL is correctly configured for local development and containerized deployments.

## Quality and Delivery

- Lint and build checks are expected before merging.
- CI validates install, lint, and build on pushes and pull requests.
- Keep generated artifacts out of commits unless intentionally required.

## Contributing

- Work in a feature branch when collaborating through pull requests.
- Keep commits scoped and descriptive.
- Include release notes for user-facing behavior changes.
