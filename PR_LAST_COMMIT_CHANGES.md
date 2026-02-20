# PR Draft: Changes Since Last Commit (`be8f524`)

## Snapshot
- Base commit: `be8f524` (`refined dockerfile and other files to correctly deploy on coolify`)
- Branch: `main`
- Compared range: `HEAD` commit to current working tree (staged + unstaged + untracked)
- Modified tracked files: `32`
- New untracked files: `35`
- Tracked diff size: `+2078 / -665`
- New file content size: `+2910` lines
- Total net new content in working tree: approximately `+4988 / -665`

## High-Level Summary
- Added full Meal Log UI flow (`/meal-log`) with item entry, nutrition progress, hydration tracking, and history views.
- Added full Meal Plan UI flow (`/meal-plan`) with plan generation, activation, swapping, regeneration, deletion, and plan history.
- Expanded API client layer (`lib/api.ts`) with meal log, meal plan, household member, recipe rating, profile taxonomy, and analyzer endpoints.
- Expanded shared types (`lib/types.ts`) for meal logging, meal planning, household profiles, recipe ratings, and personalized warnings.
- Upgraded Recipe Analyzer to support backend routes by input type (text/url/image/barcode), optional family-member context, and save action.
- Added Next.js analyzer proxy API routes under `app/api/v1/analyzer/*` for server-side forwarding.
- Improved Scan workflow with stronger barcode decoding fallbacks and personalized warnings in result UI.
- Added recipe cooking-to-log flow: finishing cooking can log directly into Meal Log.
- Updated profile/onboarding data handling for richer health and taxonomy fields; schema sync script updated accordingly.
- Added `recipe rating` component support and navigation links for meal-log/meal-plan entry points.

## Detailed Change Matrix

### 1) Core API, Types, Config, and Sync
| File | Type | + | - | Details |
|---|---|---:|---:|---|
| `lib/api.ts` | Modified | 595 | 98 | Major API expansion: analyzer APIs, meal-log APIs, meal-plan APIs, household APIs, recipe rating APIs, taxonomy fetches, profile/health sync updates, recipe normalization improvements, better auth/error handling, FormData-safe content-type logic. |
| `lib/types.ts` | Modified | 357 | 31 | Added/expanded domain types: nutrition normalization, analyzer warnings, meal log models, meal plan models, household/member models, recipe rating models, broader recipe fields. |
| `lib/analyze.ts` | Modified | 31 | 11 | Analyzer result handling refinements and compatibility with new warning/member-aware pathways. |
| `lib/scan-api.ts` | New | 86 | 0 | Added scan lookup/history client helpers and response models. |
| `next.config.mjs` | Modified | 4 | 1 | Clarified rewrite/build-time proxy behavior comments for backend routing in local/Docker deployments. |
| `scripts/appwrite-sync-schema.js` | Modified | 9 | 1 | Added profile/health schema attributes (email and condition/diet/allergen code/id arrays), plus typo cleanup in schema definition. |

### 2) Recipe Analyzer (Page, Components, Server Routes)
| File | Type | + | - | Details |
|---|---|---:|---:|---|
| `app/recipe-analyzer/page.tsx` | Modified | 83 | 12 | Switched to source-specific backend analyzer APIs (text/url/image/barcode), added optional member selector, result-only local restore, save-to-backend action, clear action, and better error handling. |
| `components/analyzer/source-form.tsx` | Modified | 13 | 3 | Form behavior updated for richer source handling and analyzer controls. |
| `components/analyzer/result-panel.tsx` | Modified | 51 | 4 | Result actions expanded (including save) and UI output enriched for latest analyzer payload shape. |
| `components/analyzer/barcode-source.tsx` | Modified | 25 | 4 | Barcode source flow updated to align with new scan/analyzer API contract. |
| `components/analyzer/photo-source.tsx` | Modified | 30 | 6 | Photo source behavior adjusted for API-backed image analysis flow. |
| `components/analyzer/link-source.tsx` | Modified | 3 | 3 | Link source updates for refined analyzer input handling. |
| `components/analyzer/member-selector.tsx` | New | 42 | 0 | New selector to target a household/family member during analysis for personalized warnings. |
| `app/api/v1/analyzer/_proxy.ts` | New | 46 | 0 | Shared backend proxy with timeout/header forwarding logic for analyzer routes. |
| `app/api/v1/analyzer/text/route.ts` | New | 6 | 0 | Added POST route for text analyzer proxying. |
| `app/api/v1/analyzer/url/route.ts` | New | 6 | 0 | Added POST route for URL analyzer proxying. |
| `app/api/v1/analyzer/image/route.ts` | New | 6 | 0 | Added POST route for image analyzer proxying. |
| `app/api/v1/analyzer/barcode/route.ts` | New | 6 | 0 | Added POST route for barcode analyzer proxying. |
| `app/api/v1/analyzer/save/route.ts` | New | 6 | 0 | Added POST route for persisting analyzed recipe output. |

### 3) Scan Flow and Barcode UX
| File | Type | + | - | Details |
|---|---|---:|---:|---|
| `app/scan/page.tsx` | Modified | 162 | 37 | Scan page logic extended for richer result state, warning data, and improved scan workflow orchestration. |
| `components/scan/image-upload-scan.tsx` | Modified | 111 | 49 | Multi-step barcode decode fallback flow (native detector/ZXing/Quagga style flow), improved UX and error messaging for image scanning. |
| `components/scan/manual-code-entry.tsx` | Modified | 26 | 12 | Manual barcode entry flow improved with validation/lookup handling updates. |
| `components/scan/scan-result-sheet.tsx` | Modified | 82 | 9 | Added personalized allergen/health warning sections and richer product result presentation. |

### 4) Meal Log (New Feature Set)
| File | Type | + | - | Details |
|---|---|---:|---:|---|
| `app/meal-log/page.tsx` | New | 10 | 0 | New route entry page for Meal Log experience. |
| `hooks/use-meal-log.tsx` | New | 76 | 0 | Query/mutation hook layer for day log, item operations, water logging, etc. |
| `hooks/use-meal-history.tsx` | New | 18 | 0 | Hook for fetching meal history aggregates over date ranges. |
| `components/meal-log/daily-view.tsx` | New | 197 | 0 | Main daily meal log view: totals, slots, interactions, and derived metrics. |
| `components/meal-log/add-item-sheet.tsx` | New | 79 | 0 | Sheet UI to add meal items with source-aware input. |
| `components/meal-log/manual-entry-form.tsx` | New | 118 | 0 | Manual nutrition entry form for custom meal items. |
| `components/meal-log/quick-add-search.tsx` | New | 65 | 0 | Quick search UI for recipe/product additions. |
| `components/meal-log/meal-slot.tsx` | New | 82 | 0 | Meal bucket renderer (breakfast/lunch/dinner/snacks) with add/edit/delete controls. |
| `components/meal-log/meal-item-row.tsx` | New | 57 | 0 | Row component for displaying/editing individual meal log items. |
| `components/meal-log/nutrition-ring.tsx` | New | 54 | 0 | Circular nutrition progress visual. |
| `components/meal-log/macro-bars.tsx` | New | 61 | 0 | Macro progress bar visualization. |
| `components/meal-log/water-tracker.tsx` | New | 53 | 0 | Hydration progress + quick increment controls. |
| `components/meal-log/streak-badge.tsx` | New | 21 | 0 | Streak indicator UI. |
| `components/meal-log/date-navigator.tsx` | New | 62 | 0 | Day-to-day navigation controls for meal log dates. |
| `components/meal-log/history-view.tsx` | New | 105 | 0 | Historical trends and past-day nutrition/log insights view. |

### 5) Meal Plan (New Feature Set)
| File | Type | + | - | Details |
|---|---|---:|---:|---|
| `app/meal-plan/page.tsx` | New | 313 | 0 | New meal plan orchestration page with active/history tabs, generation flow, and action controls. |
| `hooks/use-meal-plan.tsx` | New | 105 | 0 | Hooks for meal plan CRUD/action endpoints (generate, activate, swap, regenerate, delete, log meal). |
| `components/meal-plan/plan-generator.tsx` | New | 366 | 0 | Plan generation wizard with parameters and submit flow. |
| `components/meal-plan/weekly-calendar.tsx` | New | 155 | 0 | Weekly calendar render for generated plan items. |
| `components/meal-plan/meal-card.tsx` | New | 103 | 0 | Plan item card with swap/log/view recipe actions. |
| `components/meal-plan/plan-summary.tsx` | New | 139 | 0 | Summary panel for generated plan totals/status/member coverage. |
| `components/meal-plan/member-targets.tsx` | New | 91 | 0 | Household member target selection and display for plan generation. |
| `components/meal-plan/add-member-form.tsx` | New | 120 | 0 | Add-family-member form to grow household data from meal-plan flow. |
| `components/meal-plan/swap-modal.tsx` | New | 82 | 0 | Swap-meal modal flow for replacing individual plan items. |

### 6) Household, Profile, Onboarding, and User Data Flows
| File | Type | + | - | Details |
|---|---|---:|---:|---|
| `hooks/use-household.tsx` | New | 60 | 0 | Household/member hooks (list/add/update health profile). |
| `hooks/use-user.tsx` | Modified | 25 | 4 | Extended health payload mapping (major conditions, code/id fields), improved sync error handling, explicit Appwrite permissions on create path. |
| `app/profile/page.tsx` | Modified | 180 | 233 | Significant profile/health page refactor to align with updated profile APIs and richer health/taxonomy model handling. |
| `components/profile/OverviewEditDialog.tsx` | Modified | 14 | 38 | Overview edit schema/fields simplified and normalized against updated profile model. |
| `components/health-onboarding-wizard.tsx` | Modified | 81 | 34 | Onboarding flow updated with toast/error handling and newer health-preference field pathways. |
| `app/register/page.tsx` | Modified | 10 | 2 | Registration flow updates for navigation/state integration with the revised onboarding/profile flow. |

### 7) Recipe Browsing, Details, History, and Cooking UX
| File | Type | + | - | Details |
|---|---|---:|---:|---|
| `app/my-recipes/[id]/page.tsx` | Modified | 3 | 3 | Detail page aligned with updated recipe model/fields. |
| `app/my-recipes/page.tsx` | Modified | 1 | 3 | My-recipes listing tweaks for latest data shape and UI behavior. |
| `app/recipes/[id]/page.tsx` | Modified | 9 | 0 | Recipe detail enhancements (tab integration and related detail actions). |
| `app/page.tsx` | Modified | 1 | 1 | Home page minor update for current navigation/flow wiring. |
| `components/recipe-builder-simple/form.tsx` | Modified | 7 | 2 | Builder panel compatibility updates with expanded recipe shape. |
| `components/recipe/recipe-details-panel.tsx` | Modified | 6 | 2 | Detail panel adjusted for new recipe attributes/data contract. |
| `components/recipe-card.tsx` | Modified | 11 | 12 | Card rendering updates for recipe fields and metadata handling. |
| `components/recipe-hero.tsx` | Modified | 15 | 12 | Hero section updates for recipe time/nutrition metadata display adjustments. |
| `components/recipe-rating.tsx` | New | 113 | 0 | New recipe rating component tied to new rating API endpoints. |
| `hooks/use-history.tsx` | Modified | 30 | 15 | History provider updates for recent views/history behavior and persistence handling. |
| `components/start-cooking-overlay.tsx` | Modified | 96 | 22 | Added finish-cooking prompt to log meal directly, with API call + toast flow + redirect to meal log. |

### 8) Navigation and Shell
| File | Type | + | - | Details |
|---|---|---:|---:|---|
| `components/bottom-nav.tsx` | Modified | 3 | 1 | Navigation entry updates for expanded app sections. |
| `components/left-sidebar.tsx` | Modified | 4 | 0 | Sidebar links expanded for meal-log and meal-plan routes. |

### 9) Build/Generated Artifact
| File | Type | + | - | Details |
|---|---|---:|---:|---|
| `tsconfig.tsbuildinfo` | New | 1 | 0 | TypeScript incremental build cache file (usually not intended for PR unless explicitly tracked). |

## Suggested PR Description Body (Ready to Paste)
### What changed
- Added meal tracking and meal planning end-to-end UI flows, including supporting hooks and API layer methods.
- Upgraded recipe analyzer and scan experiences with personalized warning support and backend-proxied analysis routes.
- Expanded shared domain models for meal plans, meal logs, household members, and ratings.
- Improved profile/onboarding data sync pathways and Appwrite schema alignment for new health/taxonomy fields.
- Added ability to log cooked recipes directly into meal log from cooking mode.

### Why
- To support B2C nutrition workflows beyond recipe browsing: track intake, generate actionable plans, personalize for household members, and close the loop from cooking to logging.

### Notes for reviewers
- This is a large cross-cutting change touching page routes, UI components, hooks, API client code, and shared types.
- Validate route-level integration for: `/recipe-analyzer`, `/scan`, `/meal-log`, `/meal-plan`, `/profile`.
- Confirm backend endpoint availability for new API calls under `/api/v1/*`.
- Verify whether `tsconfig.tsbuildinfo` should be excluded from commit.

### Basic validation checklist
- [ ] Recipe analyzer works for text, URL, image, and barcode flows.
- [ ] Personalized warnings show correctly when member context is selected.
- [ ] Scan image/manual entry still produce expected product results.
- [ ] Meal log supports add/edit/delete items and water logging.
- [ ] Meal plan generation and plan actions (activate/swap/regenerate/delete/log) work.
- [ ] Cooking overlay logs finished meal to meal log.
- [ ] Profile + onboarding save flows sync correctly.
