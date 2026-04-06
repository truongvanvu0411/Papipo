# Lessons Learned

## 2026-04-06 - Nest HTTP tests that hit guarded controllers should override guards, not just register stub providers
- Symptom: The new API HTTP test suite still tried to construct the real `JwtAuthGuard` and failed dependency resolution for `JwtService`, even though a stub guard provider had been added to the testing module.
- Root Cause: `@UseGuards(JwtAuthGuard)` metadata caused Nest to resolve the actual guard class for the route, and simply providing a same-token stub in the providers array was not enough in this test setup.
- Fix: Switched the suite to `overrideGuard(JwtAuthGuard)` and `overrideGuard(RolesGuard)` on the testing module builder, which correctly replaced the route guard instances used during HTTP requests.
- Prevention Rule: When testing Nest controllers through HTTP and the route uses `@UseGuards(...)`, prefer `overrideGuard(...)` on the testing module instead of assuming a plain stub provider will replace the runtime guard instance.
- Example: `apps/api/src/app.http.spec.ts` now uses `Test.createTestingModule(...).overrideGuard(JwtAuthGuard).useValue(...)`.

## 2026-04-06 - Prisma generate must not run concurrently across the same workspace during verification
- Symptom: Running API verification commands in parallel caused `npm run test --workspace @papipo/api` to fail with `EBUSY: resource busy or locked` while Prisma tried to copy its query engine runtime.
- Root Cause: Both `lint` and `test` scripts invoke `prisma generate`, so parallel execution raced on the same `node_modules/.prisma/client` files.
- Fix: Re-ran API verification sequentially instead of in parallel and kept the successful proof from the sequential pass.
- Prevention Rule: In this repo, do not parallelize verification commands that both call `prisma generate` against the same workspace. Run them sequentially to avoid file-lock races on Windows.
- Example: `npm.cmd run lint --workspace @papipo/api` and `npm.cmd run test --workspace @papipo/api` must not be launched together.

## 2026-04-06 - Replace mojibake-corrupted source blocks before layering feature work on top
- Symptom: While extending the Flutter nutrition screen with photo analysis and re-plan flows, targeted patches kept failing because the existing file contained corrupted mojibake characters in subtitle strings, which also risked carrying broken UI text forward.
- Root Cause: The previous source file had non-ASCII corruption in literal strings, so exact-context patches no longer matched reliably and incremental edits would have preserved a bad baseline.
- Fix: Replaced the nutrition screen file with a clean ASCII-first version, then added the new actions and cards on top of that clean source.
- Prevention Rule: If a UI source file already contains mojibake or corrupted literals, do not keep stacking edits onto it. Normalize or replace the affected block first so future patches, reviews, and rendering stay predictable.
- Example: `apps/mobile/lib/features/nutrition/nutrition_screen.dart` was rewritten cleanly before adding the `Analyze photo` and `Re-plan day` flows.

## 2026-04-06 - Monorepo workspaces that import built sibling packages need upstream build steps in local scripts
- Symptom: `npm run lint --workspace @papipo/api` failed with missing exports from `@papipo/contracts` even though the source file had already been updated correctly.
- Root Cause: The API workspace imports the sibling package through its built package output, so direct workspace scripts were reading a stale `contracts` build unless that package had been rebuilt first.
- Fix: Updated the API workspace `build`, `lint`, and `test` scripts to build `@papipo/contracts` first, then run Prisma generation and TypeScript/Jest.
- Prevention Rule: In this monorepo, if one workspace consumes another through package resolution instead of TS path aliases, local scripts must build the upstream workspace first. Do not rely on manual build order or a previous root build.
- Example: `apps/api/package.json` now prefixes `build`, `lint`, and `test` with `npm --prefix ../.. run build --workspace @papipo/contracts`.

## 2026-04-06 - Auth session endpoints must return sanitized contract shapes, not raw ORM records
- Symptom: While wiring the new Flutter session bootstrap, `GET /auth/me` was still returning the raw Prisma user record shape, which risked exposing fields like `passwordHash` to clients and made auth/profile contracts inconsistent with the rest of the platform.
- Root Cause: The endpoint reused a convenient ORM fetch instead of mapping the result into the same explicit auth-safe response shape used by login/register flows.
- Fix: Changed `AuthService.getMe()` to return only `id`, `email`, `role`, `status`, and the small profile summary needed by clients, then added a regression test that asserts `passwordHash` is never present.
- Prevention Rule: Any auth/session endpoint that leaves the server boundary must serialize through an explicit contract mapper. Never return raw ORM entities from authentication routes, even for internal/mobile bootstrap flows.
- Example: `apps/api/src/auth/auth.service.ts` now shapes `getMe()` the same way as the login/register response instead of forwarding the Prisma model directly.

## 2026-03-23 - Desktop business narratives must be generated from traceability artifacts, not from form counts or screen order

- Problem: Desktop reverse could already detect many forms and even parse event/query signals, but `Business_Flow_Sequence.md` and `Project_Overview.md` still sounded generic because they were built mostly from counts, screen order, or broad inventory summaries. That made the output feel polished without making it trustworthy enough for legacy desktop systems.
- Fix: Promote desktop data-lineage artifacts to first-class inputs (`desktop_data_modules.json`, `desktop_query_resolution.json`, `desktop_dataset_graph.json`) and require business narrative statements to map back to evidence-backed chains before they are emitted. Persist that mapping in `business_narrative_evidence.json` so every business claim can be reviewed against code/designer/query evidence.
- Rule: For desktop reverse, do not describe business behavior unless it can be traced to a concrete chain like `form -> event -> data module/query -> table/report/integration`. If only partial evidence exists, mark it as `inferred` or `unknown` instead of filling the gap with generic business wording.
- Guardrail: Every desktop narrative improvement must update the parser artifact, the regression tests, and the evidence map artifact together. A better-looking markdown file is not a valid fix unless the same claim is traceable through machine-readable evidence.

## 2026-03-22 - Flutter causal traceability must resolve project evidence paths and reuse screen diagnostics

- Problem: Flutter `screen -> cubit/usecase/repository/api client -> endpoint` chains were still missing on real projects even after widget extraction passed, because `primary_evidence_path` could be stored as `database/DATA/...` and the causal linker only read that raw path. On containerized runs this made the linker miss the real file and report `missing_state_layer` for every screen.
- Fix: Add a project-aware evidence resolver in [reverse_inventory.py](C:/Users/Administrator/Downloads/FollowReverseCode/ReverseCode/BE/reverse_inventory.py) and have the Flutter causal linker read both `primary_evidence_path` and `resolved_widget_sources` from `screen_extraction_diagnostics.json`. This lets the linker find `BlocProvider`, `context.read<T>()`, and imported widget-driven state usage even when the screen's canonical evidence path is repo-relative or container-relative.
- Rule: When adding any new app traceability linker, never rely on a single raw evidence path. Resolve paths against the project root and reuse per-screen diagnostics artifacts so causal analysis follows the same source set that deterministic extraction already trusted.
- Guardrail: Every fix in this class must update regression tests, especially a real-path fixture plus a container-style `database/DATA/...` path fixture, so `missing_state_layer` does not silently regress on Flutter projects again.

Canonical location for ReverseCode lessons: `rule coding/lessons.md`

Notes:
- This is the single source of truth for workflow/backfill lessons on this repo.
- Update this file after meaningful fixes, postmortems, or architecture corrections.
- `tasks/lessons.md` remains as a compatibility mirror/reference, but new lessons should be written here first.

## 2026-03-21 - Graph UIs should show the cheap context first and render custom 3D nodes explicitly
- Symptom: The first 3D graph pass could load a valid subgraph payload but still show a visually empty canvas, while the mainframe Graph tab felt slow because it waited for summary, node detail, neighbors, and impact before the user saw anything useful.
- Root Cause: The 3D view relied too much on default `3d-force-graph` rendering behavior and camera assumptions, and the graph tab treated expensive detail queries as part of initial paint instead of progressive enhancement.
- Fix: Switched the 3D node renderer to explicit sphere-based Three.js objects with optional labels, added lightweight dev diagnostics for graph/camera initialization, and changed graph-tab loading to render summary first while node/impact context hydrates in the background.
- Prevention Rule: For graph-heavy UX, never block first paint on the full inspector workload, and never assume a visualization library's default node object/camera behavior will remain readable on every dataset.
- Example: `FE/src/components/Graph3DView.tsx` now builds visible sphere nodes directly, and `FE/src/pages/FileDetailPage.tsx` now fetches graph summary first and loads the first node context asynchronously.

## 2026-03-21 - 3D graph visualization should render a focused subgraph, not the whole project graph
- Symptom: The existing Graph tab could already answer dependency questions through hotspots, neighbors, impact, and evidence, but it still forced users to mentally reconstruct structure on larger projects and would become too heavy if we naively tried to render the full graph in 3D.
- Root Cause: Full-project graph rendering is tempting once Neo4j and graph APIs exist, but both app and mainframe graphs can grow quickly enough to hurt FE responsiveness and overwhelm the user with low-signal geometry.
- Fix: Added a dedicated `/graph/project/{pipeline_type}/{uid}/subgraph` API and embedded a `3d-force-graph` view directly into the existing Graph tab, defaulting to a performance-capped neighborhood around the currently focused node instead of the entire project graph.
- Prevention Rule: For visualization-heavy graph UX, ship a focused subgraph first and keep the inspector panels alive around it. Do not trade away traceability or performance just to render "everything" at once.
- Example: `BE/graph/service.py` and `BE/graph/repository.py` now build subgraph payloads for both fallback and Neo4j modes, and `FE/src/pages/FileDetailPage.tsx` / `FE/src/components/Graph3DView.tsx` provide a `List / 3D` toggle with depth, label, and node-cap controls.

## 2026-03-21 - Execution readiness should be a first-class artifact, not a verbal conclusion
- Symptom: By the time the platform could reverse, diff, review, and even plan migration, the final question was still answered informally: "is this package actually ready for controlled execution-oriented transformation?" That answer existed only in scattered scores and docs.
- Root Cause: Transformation planning and confidence existed, but there was no single artifact that consolidated blockers, checklist posture, benchmark targets, and next actions for the final go/no-go decision.
- Fix: Added `execution_readiness.json` and `Execution_Readiness.md` for both app reverse and mainframe, derived from canonical artifacts plus review/runtime signals, and wired them into confidence, resume, quality, and project metadata.
- Prevention Rule: When a platform reaches the point of actionability, it needs an explicit execution gate artifact. Do not make users infer readiness by mentally combining migration scores, review state, and missing-doc checks.
- Example: `BE/execution_readiness.py` now builds the final execution posture for both pipelines, and `BE/module.py` / `BE/mainframe/orchestrator.py` persist it as part of the core run output.

## 2026-03-21 - Transformation planning should reuse the same canonical artifacts as reverse, not invent a second model
- Symptom: By the time we reached modernization planning, mainframe already had a solid `migration_readiness.json` contract, but app reverse still lacked a comparable output. The easy but wrong move would have been to bolt on a separate planner with its own ad-hoc inputs.
- Root Cause: Transformation planning often gets treated as a late-stage reporting feature, which tempts teams to rebuild logic from markdown or loosely re-scan source instead of consuming the canonical inventory/graph/business artifacts that the reverse pipeline already trusts.
- Fix: Added app-side `migration_readiness.json` and `Migration_Blueprint.md`, both derived directly from canonical app artifacts (`inventory.json`, `knowledge_graph.json`, `business_semantics.json`, `coverage_report.json`, `data_lineage.json`) and wired into resume, confidence, and quality handling.
- Prevention Rule: If a reverse platform already has canonical artifacts, transformation planning must consume those artifacts directly. Do not create a second semantics layer just because the output audience changes from analyst to architect.
- Example: `BE/reverse_agent/migration_blueprint.py` now builds app modernization output from canonical reverse artifacts and keeps the same high-level contract shape as mainframe planning.

## 2026-03-21 - Diff and confidence need explanations, not just counts
- Symptom: Run history could say that a project changed and confidence could say a document was `high` or `medium`, but reviewers still had to guess what actually moved in the graph or why the score landed where it did.
- Root Cause: `diff_report.json` only tracked flattened run-summary field changes, and `confidence_report.json` only exposed scores without human-readable rationale or section-aware context.
- Fix: Added graph snapshots and document-section snapshots into run summaries, then derived graph/document deltas in `diff_report.json`; confidence reports now also include `dimension_explanations` and per-document confidence reasons.
- Prevention Rule: If a platform emits a score or a diff, it should also emit the shortest useful explanation for that score or diff. Reviewers should not need to open raw artifacts just to understand why the system changed its mind.
- Example: `BE/run_artifacts.py` now persists graph/document-section deltas across runs, and the History/Document views in `FE/src/pages/FileDetailPage.tsx` surface graph changes plus confidence reasons directly in the UI.

## 2026-03-21 - Business reconstruction must normalize before migration and docs, not after
- Symptom: Even with strong parsing and graph coverage, business outputs still drifted toward technical noise like `GETCOMPY`, `CRDTAGY`, `REQUEST`, `RESPONSE`, `UID`, regex lines, and other code/path artifacts that polluted capability maps, migration candidates, and glossary output.
- Root Cause: Business reconstruction still accepted too many raw parser and path tokens at the semantics layer, and some app-side rules were effectively code snippets masquerading as business statements.
- Fix: Hardened semantics generation itself: app reverse now learns domains from routes/APIs/integrations while dropping code-like rule lines, and mainframe business derivation now uses stronger composite alias splitting plus broader path/install/schema stopword filtering before capability/glossary generation.
- Prevention Rule: If a token is not business-safe at the semantics layer, do not rely on downstream docs or migration filters to clean it up. Normalize and suppress it before it enters canonical business artifacts.
- Example: `BE/reverse_inventory.py` now rejects rule lines like `def ...` / `return ...` and includes route/API/integration evidence in capability clustering, while `BE/mainframe/business.py` splits names like `GETCOMPY` and suppresses `request/member/package/schema` noise before capability and glossary output are built.

## 2026-03-21 - Runtime overlays need a versioned envelope before they can scale beyond ad-hoc JSON imports
- Symptom: Runtime overlay import was useful, but the platform still treated every payload as a loose JSON blob, which made it hard to reason about schema evolution, validation, or future trace/log ingestion.
- Root Cause: The first runtime-overlay implementation optimized for flexibility and corroboration speed, but it had no explicit schema version, no format classification, and no normalized source descriptors.
- Fix: Added a versioned runtime envelope model with `schema_version=1`, `kind=runtime_overlay`, `input_format`, `validation`, and `normalized_sources`, while keeping legacy free-form JSON imports backward compatible.
- Prevention Rule: Once a runtime ingestion path becomes part of the platform architecture, standardize the envelope early. Keep payload parsing flexible, but always persist a normalized contract with version and validation metadata.
- Example: `BE/runtime_overlay.py` now normalizes both legacy JSON blobs and explicit envelope payloads, `main.py` rejects unsupported schema versions with `400`, and the Runtime tab surfaces schema/validation details.

## 2026-03-21 - Review-aware synthesis must change regenerated markdown, not only side-panel state
- Symptom: Review decisions for `doc_section` were visible in the UI, but regenerating a document still produced the same section narrative unless the user manually ignored it while reading.
- Root Cause: Review state was already blended into confidence and graph payloads, but markdown generators themselves were not consuming `doc_section` decisions during regeneration.
- Fix: Added shared markdown post-processing that applies persisted `doc_section` review decisions to regenerated docs, suppressing `false_positive` sections and annotating reviewed sections inline when they are kept.
- Prevention Rule: Once a reverse platform supports section-level review, regeneration must be review-aware by default. Otherwise the system keeps resurrecting content that reviewers have already rejected.
- Example: `BE/review_state.py` now exposes `apply_doc_section_review_to_markdown(...)`, and app/mainframe generators call it before writing markdown outputs.

## 2026-03-21 - Structural run diff and business-semantics diff should be tracked separately
- Symptom: Run history already showed changed fields and document deltas, but it still could not answer the question "did the business understanding itself change, or only the artifact structure?"
- Root Cause: `diff_report.json` flattened run summary counts and graph/doc metadata only; business semantics lived in separate artifacts and were invisible in history unless someone opened raw JSON by hand.
- Fix: Added a dedicated `business_semantics_diff.json`, stored compact business-semantics snapshots in each `run_summary.json`, exposed `run_metadata.last_business_semantics_diff`, and surfaced the latest business delta in the app `History` tab.
- Prevention Rule: When a reverse platform persists both structural state and semantic understanding, diff them separately. Structural churn and business-meaning churn answer different review questions.
- Example: `BE/run_artifacts.py` now emits `business_semantics_diff.json`, and `FE/src/pages/FileDetailPage.tsx` shows capability/rule/glossary additions-removals beside the normal run diff cards.

## 2026-03-21 - Review status should change confidence where evidence is consumed
- Symptom: Review badges on document sections and graph edges made validation visible, but the platform still treated reviewed items almost the same as pending ones when displaying confidence.
- Root Cause: Review decisions were blended only into project-level confidence, while edge-level and doc-section-level surfaces still showed raw parser confidence.
- Fix: Added review-adjusted confidence for `graph_edge` and `doc_section` items, propagated per-type review validation into confidence dimensions, and surfaced the adjusted confidence inline in the detail page.
- Prevention Rule: If review changes trust, reflect that change at the same granularity users are validating. Project-level confidence alone is too coarse once edge and section review exist.
- Example: `BE/review_state.py` now computes per-type validation and adjusted confidence for reviewed edges/sections, and `FE/src/pages/FileDetailPage.tsx` shows the updated confidence inline beside heading/edge review controls.

## 2026-03-21 - Business semantics need normalization gates before they become trusted context
- Symptom: App reverse could build capability clusters and glossary entries quickly, but top domains still drifted toward technical noise like page/service/sync tokens and weak rule statements with no real business subject.
- Root Cause: The early app semantics builder treated raw screen/path/module names almost literally, with only shallow stopword filtering and no support threshold across artifact types.
- Fix: Added stronger token normalization for app reverse, including alias/plural cleanup, technical-token filtering, capability support thresholds, meaningful rule-subject extraction, and normalized glossary dedupe.
- Prevention Rule: Do not let raw parser tokens flow straight into business semantics. Normalize first, require support across artifacts, and drop weak statements before they contaminate docs, graph review, and migration planning.
- Example: `BE/reverse_inventory.py` now normalizes `customers` -> `Customer`, suppresses low-signal terms like `sync` and `service`, and only emits rules/glossary terms that survive subject and dedupe checks.

## 2026-03-21 - Review queues need edge-level and doc-section candidates once entity-level review is in place
- Symptom: Reviewing only hotspots, capabilities, and rules still left two blind spots: important dependencies between entities and weak/generated markdown sections that nobody had explicitly validated.
- Root Cause: The first review loop modeled only entity-like findings, so reviewers could confirm a node but still had no first-class way to mark a dependency edge as wrong or a document section as noisy.
- Fix: Expanded review candidate generation to include `graph_edge` and `doc_section` items, propagated reviewed edge state into graph payloads/APIs, and surfaced that status in the shared Graph UI.
- Prevention Rule: Once a reverse platform has graph-backed traceability and generated docs, the review model should expand along the same axes: node, edge, and document section.
- Example: `BE/review_state.py` now emits `graph_edge` and `doc_section` candidates, `BE/graph/service.py` / `BE/graph/repository.py` carry reviewed edge metadata, and `FE/src/pages/FileDetailPage.tsx` shows reviewed state on connected graph edges.

## 2026-03-21 - Review state has to propagate into graph and doc inputs, not stop at project-level summaries
- Symptom: We could store reviewer decisions and even blend them into project confidence, but Graph tab entities and regenerated docs still treated pending and false-positive items almost the same.
- Root Cause: Review decisions were persisted as project overlay state only; canonical graph/doc builders were not yet consuming that overlay when shaping node payloads or business-capability/rule inputs.
- Fix: Added review-aware annotators for `business_semantics` and graph payloads, propagated those annotations into fallback/Neo4j graph APIs, and made app/mainframe overview/business-capability doc inputs suppress false-positive reviewed items while prioritizing confirmed ones.
- Prevention Rule: Human validation should influence the same canonical inputs used by graph queries and downstream synthesis. If review lives only in a sidebar or project summary, it cannot improve reverse quality.
- Example: `BE/review_state.py` now exposes `annotate_business_semantics_with_review(...)` and `annotate_graph_payload_with_review(...)`; `BE/graph/service.py` and `BE/graph/repository.py` surface review metadata in Graph APIs; `BE/reverse_agent/project_overview.py` and `BE/mainframe/llm_docs.py` consume review-aware business semantics.

## 2026-03-21 - Human review needs identity and history, not just the latest decision
- Symptom: A basic review queue let users mark candidates as confirmed or noisy, but that still left the platform without accountability or a durable review narrative over time.
- Root Cause: The first review-state implementation stored only the latest decision per item, so we lost who reviewed it, why they chose that decision, and how review coverage should influence trust in later outputs.
- Fix: Extended `review_state.json` with reviewer identity, per-item notes, rolling history, and a derived `validation` summary; then blended that summary into returned confidence as a `human_validation` dimension.
- Prevention Rule: Human validation should be modeled as a first-class overlay with reviewer identity and audit history. A single current decision is not enough for governance or later synthesis.
- Example: `BE/review_state.py` now writes reviewer/note/history entries and `augment_confidence_with_review(...)`, while `FE/src/pages/FileDetailPage.tsx` surfaces reviewer input, note entry, and recent review history in the `Review` tab.

## 2026-03-21 - Review decisions must be persisted separately from generated candidates
- Symptom: We could surface graph hotspots, business capabilities, and rule candidates, but there was no stable place to record which findings a reviewer actually trusted or rejected.
- Root Cause: Candidate generation was deterministic and reproducible, but reviewer intent was not modeled as first-class project state, so every refresh effectively reset human validation.
- Fix: Added persisted `review_state.json` per project, exposed `/review/{pipeline_type}/{uid}` APIs, and generated review queues from canonical business semantics plus graph hotspots while keeping reviewer decisions as a separate overlay.
- Prevention Rule: Human review state should never be embedded back into raw candidate generation outputs directly; persist reviewer decisions separately and merge them when building the review queue.
- Example: `BE/review_state.py` now stores decisions independently of generated candidates, and `FE/src/pages/FileDetailPage.tsx` merges that state into a shared `Review` tab for both app and mainframe projects.

## 2026-03-21 - Runtime graph corroboration must attach to existing nodes before creating synthetic observed nodes
- Symptom: Graph search/detail could show a duplicate runtime-observed API or route node alongside the original static node, and the original node still appeared as `runtime_observed=false`.
- Root Cause: Runtime graph augmentation built its matching catalog from `node.node_type` only, but raw local app graph artifacts often store entity type in `type`/`roles` instead. That left the catalog empty in fallback mode and forced the runtime overlay merge to create synthetic nodes instead of linking to the original entity.
- Fix: Switched the runtime graph catalog builder to use the shared `_derive_type_from_node(...)` helper and fall back to `id` when `stable_id` is absent, so imported runtime evidence attaches to the original route/API/module nodes whenever possible.
- Prevention Rule: Any graph-enrichment layer that must work on both normalized graph payloads and raw artifact graphs should derive entity identity/type through one shared normalization helper, never through a single field assumption.
- Example: `BE/graph/service.py` now uses `_derive_type_from_node(node)` inside `_augment_app_graph_payload_with_runtime_overlay(...)`, and graph search/node/neighbor/impact APIs correctly flag existing app nodes as runtime-observed.

## 2026-03-21 - Run metadata is only valuable if the UI can inspect snapshots, not just counts
- Symptom: The platform already persisted `run_summary.json`, `run_history.json`, and `diff_report.json`, but the app detail view only showed aggregate confidence cards. Users still could not inspect recent reruns or see which fields/documents changed.
- Root Cause: `run_metadata` exposed only `history_count` to the FE, and the detail page had no dedicated run-history surface to consume the persisted snapshots.
- Fix: Extended `run_metadata` with a latest-first history preview and added a dedicated app `History` tab showing recent runs, latest diff summary, document delta, and changed-field previews.
- Prevention Rule: When we persist machine-readable history/diff artifacts, the product should surface an inspection view for them; otherwise the persistence layer becomes dead weight.
- Example: `BE/run_artifacts.py` now returns `history` in `load_run_metadata`, and `FE/src/pages/FileDetailPage.tsx` renders a `History` tab for app reverse projects.

## 2026-03-21 - App detail and backend overview must read the same canonical reverse state
- Symptom: App reverse already persisted `inventory.json`, `coverage_report.json`, `data_lineage.json`, and run metadata, but `Backend_Business_Overview.md` still rescanned source as its primary input and the FE detail page still hid app confidence/diff context that already existed in the API payload.
- Root Cause: Phase 2 strengthened canonical artifacts and run metadata first, but the backend overview generator and app detail UI were left on older source-first / counts-only behavior.
- Fix: Made `Backend_Business_Overview.md` artifact-first when canonical app artifacts exist, and surfaced `run_metadata` in app detail UI with confidence, coverage, diff, history, and per-document confidence badges.
- Prevention Rule: Once a reverse pipeline has canonical artifacts and normalized run metadata, all downstream docs and detail views should consume that same state directly instead of recomputing parallel summaries.
- Example: `BE/reverse_agent/backend_reverse.py` now reads `inventory.json` and `integration_surface.json` before source scanning, while `FE/src/pages/FileDetailPage.tsx` renders app `run_metadata.confidence` and `run_metadata.last_diff`.

## 2026-03-21 - Graph-backed docs should consume canonical artifacts directly, not only prepend summary text after generation
- Symptom: Even after app reverse had canonical inventory/graph artifacts, `Project_Overview.md` and `Business_Flow_Sequence.md` were still mostly source-driven documents with a graph-backed prefix pasted on top. That left too much room for drift between docs and canonical artifacts.
- Root Cause: The first Phase 2 pass strengthened inventory/graph generation but left the document generators themselves on the old `source scan + UI evidence` path, so canonical artifacts were only used in a post-processing augmentation step.
- Fix: Updated `project_overview.py` to load graph-backed app artifacts (`inventory`, `coverage`, `business_semantics`, `routes`, `integration_surface`) as primary prompt/fallback context, and updated `business_flow_sequence.py` to prefer `data_lineage.json` over raw source scanning when lineage is available.
- Prevention Rule: Once a reverse pipeline has canonical artifacts, summary documents must read those artifacts directly. Post-generation prefixes are helpful, but they are not a substitute for artifact-first synthesis.
- Example: `generate_project_overview(...)` now injects canonical graph-backed context into the prompt/fallback sections, while `generate_business_flow_sequence(...)` first builds `ScreenFlow` objects from `data_lineage.json`.

## 2026-03-21 - App reverse cannot stay screen-first if we want graph-backed business context to hold on larger codebases
- Symptom: The app pipeline could already build a basic graph, but `Project_Overview` and `Business_Flow` still missed important backend/runtime context such as scheduled jobs, queue/topic assets, integration surface breadth, and end-to-end lineage beyond `screen -> API -> module -> table`.
- Root Cause: Canonical artifacts for the app pipeline were still centered on screens, widgets, routes, and a shallow backend summary. Jobs, queues, and lineage were implicit at best, so graph-backed docs had limited context even when the source package contained richer backend behavior.
- Fix: Expanded `reverse_inventory.py` to index jobs, queues, integration-surface entries, and data-lineage snapshots; persisted dedicated artifacts (`routes.json`, `components.json`, `integration_surface.json`, `data_lineage.json`); and wired the richer inventory into app knowledge-graph edges, confidence scoring, and graph-backed doc prefixes.
- Prevention Rule: For mixed app/web/backend reverse, never stop at screen-level artifacts. Canonical inventory must include entrypoints, backend modules, data touchpoints, async assets, and integration surface before business-summary docs are considered trustworthy.
- Example: `BE/reverse_inventory.py` now derives `module_to_integration`, `module_to_queue`, and `job_to_module` links and persists `data_lineage.json`, which is then surfaced inside graph-backed `Project_Overview.md` and `Business_Flow_Sequence.md`.

## 2026-03-21 - Reverse outputs need run-level history, not just latest artifacts
- Symptom: The platform could generate strong current-state docs, but there was no stable run snapshot to compare reruns, no shared confidence artifact across pipelines, and no easy way to expose latest reverse state in project detail APIs.
- Root Cause: Artifact generation focused on the current successful run only; run metadata, confidence scoring, and diff-ready history were implicit in logs/progress rather than persisted as first-class machine-readable outputs.
- Fix: Added shared run artifacts for both pipelines: `run_summary.json`, `run_history.json`, `confidence_report.json`, and `diff_report.json`, plus `run_id` persistence in `progress.json` and API-level `run_metadata` exposure.
- Prevention Rule: Any reverse pipeline intended for iterative refinement or audit must persist a run snapshot, rolling history, normalized confidence, and a previous-run diff as standard outputs.
- Example: `BE/run_artifacts.py` now builds and persists shared run metadata for both app and mainframe pipelines, while `main.py` and `mainframe/project_store.py` expose `run_metadata` in project responses.

## 2026-03-21 - Graph exploration needs bidirectional navigation between docs and dependency context
- Symptom: Even with hotspots, neighbors, and impact results, users still had to mentally bridge markdown sections and graph entities, which made review slower on large reverse outputs.
- Root Cause: The first graph explorer only supported graph-to-evidence navigation; there was no fast way to jump from a document heading back into the graph, nor to pin one node and compare it against another while reviewing dependencies.
- Fix: Added graph search, markdown heading `Graph` jump buttons, pin/compare node state, and edge-direction filtering in the shared detail page so reviewers can move between docs, graph context, and evidence without losing their place.
- Prevention Rule: Reverse-engineering UX should support both directions of traceability: document -> graph and graph -> evidence. Dependency viewers that only work one way still leak context.
- Example: `FE/src/pages/FileDetailPage.tsx` now renders `Graph` buttons beside markdown headings, supports pin/compare in the Graph tab, and filters connected edges by direction.

## 2026-03-20 - Reverse completeness must be reported against the uploaded archive, not mixed with pipeline byproducts
- Symptom: Mainframe projects could finish as `Done`, but coverage numbers overstated parser completeness and business outputs still looked noisier than expected for mixed repos.
- Root Cause: The manifest only reflected supported parsing scope and later started scanning the whole project folder, which also contains generated files like `progress.json`, `zip.txt`, and previously generated markdown/json artifacts. At the same time, business heuristics still allowed path/build/numeric tokens to dominate capability and rule candidates.
- Fix: Switched to full-archive manifest classification (`mainframe_core` / `sidecar` / `unsupported`), added sidecar parsers plus `coverage_report.json` / `Coverage_Report.md`, excluded generated pipeline files from manifest coverage, and tightened business token/rule filtering so migration/business docs are grounded in cleaner evidence.
- Prevention Rule: Never claim reverse completeness without an explicit parsed-vs-total coverage report, unsupported gap buckets, and a manifest scan that excludes the pipeline's own outputs.
- Example: `BE/mainframe/orchestrator.py` now skips root-level generated files when building `source_manifest.json`, while `BE/mainframe/coverage.py` exposes unsupported extension gaps and sidecar coverage for the uploaded archive itself.

## 2026-03-20 - Mixed mainframe packages need parser coverage for integration archives and resource descriptors, not just source files
- Symptom: Real CBSA-style packages still showed large unsupported buckets and weak migration confidence even after COBOL/JCL/COPYBOOK parsing was stable.
- Root Cause: Important integration/runtime artifacts such as `.si`, `.aar`, `.sar`, and `.csd` were being treated as unsupported or generic files, so coverage under-reported parsed scope and business/migration layers missed API/runtime context.
- Fix: Added deterministic sidecar parsing for IBM service interfaces, AAR/SAR zip archives, and CICS resource definition files; threaded them into manifest coverage, sidecar inventory, business signals, and confidence metrics.
- Prevention Rule: For modernization repos, treat integration descriptors and deployment archives as first-class evidence sources; unsupported buckets should mostly reflect media/tooling files, not runtime-facing assets.
- Example: `BE/mainframe/parsers/sidecar.py` now parses `CREACC.si`, `creacc.aar`, `CSacccre.sar`, and `BANK.csd`, and `coverage_report.json` shows them under parsed sidecar coverage.

## 2026-03-20 - UI confidence should come from parser-backed dimensions, not from document presence alone
- Symptom: Users could see many generated docs but still had no quick signal about whether those docs were trustworthy enough for review or migration planning.
- Root Cause: Project detail/list views only surfaced counts and unresolved references; they did not expose migration-readiness dimensions or map them back to document-level confidence.
- Fix: Derived overall/dimension/document confidence from `migration_readiness.json`, exposed it in mainframe project metrics, and surfaced it in FE list/detail views alongside coverage.
- Prevention Rule: Reverse-engineering UI should always show both output presence and evidence quality; a document list without confidence/coverage encourages false trust.
- Example: `BE/mainframe/project_store.py` now returns `metrics.confidence.document_scores`, and `FE/src/pages/FileDetailPage.tsx` shows confidence badges next to each generated mainframe document.

## 2026-03-19 - Mainframe reverse must not be forced into the screen-first pipeline
- Symptom: The existing reverse architecture was tightly shaped around `screen detection -> UI analysis -> overview docs`, which is a poor fit for `COBOL/CICS/JCL` systems.
- Root Cause: Reusing the web/app pipeline for mainframe would have coupled unrelated concepts like screen extraction and per-screen docs to transaction/batch/data-lineage analysis, increasing regression risk on the existing product.
- Fix: Added an isolated `mainframe` namespace with separate storage, deterministic parsers (`COBOL/JCL/BMS`), canonical IR/graph artifacts, and dedicated API/UI routes while reusing only generic pieces like progress tracking and document viewing.
- Prevention Rule: When a new reverse domain has different primary entities and workflows, create a parallel pipeline with shared infrastructure only; do not stretch the old domain model until it becomes ambiguous.
- Example: `BE/mainframe/*` now powers `/mainframe/*` routes and `FE/src/pages/MainframeFilesPage.tsx`, leaving `/reverse` and `/files` behavior unchanged.

## 2026-03-19 - Mainframe quality gates must measure internal unresolved references, not compiler/system utilities
- Symptom: After adding a quality gate, a valid CardDemo mainframe sample failed because unresolved ratios were inflated by system/compiler utilities and parser false positives like `TO` or `FAILED`.
- Root Cause: The initial unresolved classifier treated every unmatched `CALL`, `COPY`, and JCL `PGM` as an internal dependency candidate, even when it was a standard utility (`IEBGENER`, `IGYCRCTL`, `SDSF`) or a non-program token captured by a loose regex.
- Fix: Expanded copybook parsing, added `PROC/IMS/MQ` coverage, and filtered unresolved metrics to internal references only, excluding known system utilities and obvious parser stopwords before applying thresholds.
- Prevention Rule: Quality gates must operate on normalized, domain-aware signals; never gate on raw parser misses before classifying external/system references.
- Example: `BE/mainframe/ir.py` now excludes utility programs and stopword-like call targets from unresolved quality metrics, allowing valid samples to pass while still failing noisy internal dependency gaps.

## 2026-03-19 - Mainframe PROC definitions can live inside JCL members, not only `.proc` files
- Symptom: The CBSA sample failed quality gate with `PROC` unresolved at `100%` even though the required procedures (`CICS`, `BATCH`, `MAPGEN`) were present in the uploaded archive.
- Root Cause: The parser only created `proc_definitions` from files detected as `proc`, while this sample defined procedures as inline `//NAME PROC` members stored in `.jcl` files.
- Fix: Route `*.jcl` files with top-level `PROC` declarations through the PROC parser instead of the batch-job parser, so inline procedure members are inventory entities and can satisfy `EXEC PROC=...` references.
- Prevention Rule: For mainframe source discovery, classify by content as well as extension; JCL members may represent jobs, cataloged procedures, install utilities, or mixed build artifacts.
- Example: `BE/mainframe/orchestrator.py` now detects inline `PROC` declarations in `.jcl` files and adds them to `proc_definitions`, which unblocks CBSA-style build packs.

## 2026-03-19 - Mermaid blocks must not be emitted for empty lineage sections
- Symptom: Mainframe detail pages showed repeated Mermaid syntax errors because many batch jobs had zero parsed steps but still rendered `flowchart LR` blocks.
- Root Cause: The batch-flow doc generator always emitted a Mermaid fence/header even when no nodes or edges existed, and the FE renderer tried to render every block without checking for empty diagrams.
- Fix: Suppressed Mermaid output for empty job lineage, emitted a text fallback instead, quoted Mermaid labels to reduce parser issues, and made the FE Mermaid component skip effectively empty charts and fall back gracefully on render errors.
- Prevention Rule: Diagram generators must not output syntactically incomplete stubs; viewers should validate or short-circuit empty diagrams before invoking the renderer.
- Example: `BE/mainframe/agents.py` now emits `_No lineage diagram available._` instead of empty Mermaid blocks, and `FE/src/components/MermaidBlock.tsx` skips empty charts.

## 2026-03-19 - JCL/proc classification must prefer build-specific path segments over generic install prefixes
- Symptom: Valid `buildjcl` members under `install/base/...` were misclassified as `install`, which caused build-oriented samples to lose useful metadata.
- Root Cause: The classifier treated any path containing the substring `install` as install flow before checking build-specific markers like `buildjcl`, so mixed directory layouts from mainframe sample repos were biased toward the wrong kind.
- Fix: Classify by path segments and prefer explicit build markers before install markers, then fall back to utilities and member names.
- Prevention Rule: On legacy repository layouts, never classify from loose substrings alone; use directory segments and precedence rules for overlapping naming schemes.
- Example: `BE/mainframe/parsers/jcl.py` and `BE/mainframe/parsers/proc.py` now treat `buildjcl` as build even when the repo root path contains `install`.

## 2026-03-20 - DD direction hints must honor DISP before utility-name guesses
- Symptom: A `SYSUT1` dataset with `DISP=SHR` was classified as `temp`, which hid the real read access pattern in runtime lineage metadata.
- Root Cause: The direction heuristic prioritized `SYSUT*` utility naming before explicit `DISP` tokens, so practical access signals were being overridden by a broad utility guess.
- Fix: Reordered the direction classifier so explicit `DISP` values win first, then fall back to utility-name hints only when no stronger direction is present.
- Prevention Rule: For lineage metadata, explicit access clauses must beat heuristic naming conventions.
- Example: `BE/mainframe/parsers/jcl.py` and `BE/mainframe/parsers/proc.py` now classify `DISP=SHR` as `read` even on `SYSUT1` DDs.

## 2026-03-20 - Business semantics must normalize parser schema variants before deriving evidence
- Symptom: Mainframe jobs failed during business-semantics generation even though parsing succeeded, and no markdown/json outputs were written after inventory generation.
- Root Cause: The business layer assumed BMS map fields were dictionaries with `name/evidence`, but the deterministic BMS parser returns simple field-name strings for real mapsets.
- Fix: Added normalization helpers in `BE/mainframe/business.py` so glossary/capability derivation accepts either dict-backed fields or raw strings, and locked it with a regression test using parser-shaped BMS output.
- Prevention Rule: Any cross-parser aggregation layer must normalize heterogeneous parser payloads before reading nested keys.
- Example: `build_business_semantics_bundle(...)` now handles `["USERID", "PASSWORD"]` and `[{\"name\": \"USERID\"}]` consistently when deriving glossary entries.

## 2026-03-20 - Mainframe LLM synthesis must operate on parsed artifacts, not raw source trees
- Symptom: A naive LLM integration risked reintroducing the same instability and context noise that the deterministic mainframe pipeline was created to avoid.
- Root Cause: Letting the model walk the raw archive would bypass parser/quality-gate guarantees and make overview/business-flow docs depend on unbounded source traversal.
- Fix: Added `BE/mainframe/llm_docs.py` so the LLM sees only compact summaries derived from `inventory`, `knowledge_graph`, `business_semantics`, and `migration_readiness`, with deterministic markdown/mermaid fallbacks if model access fails.
- Prevention Rule: For mainframe reverse, every LLM stage must be artifact-first and best-effort; raw-source exploration is not allowed in the synthesis path.
- Example: `Project_Overview.md` and `Business_Flow_Sequence.md` are now generated from parsed local artifacts and still succeed when `MAINFRAME_ENABLE_LLM_SYNTHESIS=false` or the API key is missing.

## 2026-03-20 - Readiness artifact references must stay aligned with generated outputs
- Symptom: The migration-readiness test failed because `migration_readiness.json` was generated, but the helper evidence list still omitted it.
- Root Cause: The readiness bundle and the artifact registry diverged after the new JSON file was added, so the test looked at a stale artifact list.
- Fix: Added `migration_readiness.json` to the readiness artifact references and documented it in the migration blueprint evidence section.
- Prevention Rule: Whenever a pipeline adds a persisted artifact, update the generator, the consumer docs, and any evidence registries together.
- Example: `BE/mainframe/migration.py` now returns `migration_readiness.json` in `artifact_refs`, and `Migration_Blueprint.md` lists it under evidence artifacts.

## 2026-03-20 - IMS definitions must be parsed as first-class assets, not inferred from COBOL comments alone
- Symptom: IMS-heavy sample packages had real `.psb` and `.dbd` members, but the reverse output lacked explicit IMS resource inventory and PCB-to-DBD linkage.
- Root Cause: The pipeline only recognized IMS call sites in COBOL/JCL and did not ingest definition members as their own source type.
- Fix: Added deterministic IMS parsing for `*.psb` and `*.dbd`, threaded the definitions into inventory/graph generation, and surfaced the new counts in project metrics and docs.
- Prevention Rule: When a domain has its own definition artifacts, parse them directly and link them into the graph instead of reconstructing them from incidental code references.
- Example: `BE/mainframe/parsers/ims.py` now emits PSB/DBD objects, and `BE/mainframe/ir.py` links `IMS_PSB:...` nodes to `IMS_DBD:...` nodes with PCB evidence.

## 2026-03-07 - Hook order crash in FileDetailPage
- Symptom: Opening File Detail caused blank screen with `Rendered more hooks than during the previous render`.
- Root Cause: `useMemo` for markdown components was placed after early returns (`isLoadingProject` / `!project`), so some renders skipped that hook and later renders executed it.
- Fix: Moved `useMemo` above all conditional returns to keep a stable hook call order.
- Prevention Rule: Never place hooks after any branch that can return early.
- Example: `FE/src/pages/FileDetailPage.tsx` now declares `markdownComponents` before loading/null returns.

## 2026-03-07 - Full-screen document scroll kept jumping back to top
- Symptom: In `Document - Full Screen`, scrolling down would periodically reset and jump back to the top.
- Root Cause: Detail polling continued during fullscreen reading (including terminal statuses like `Failed`), triggering repeated re-renders; markdown renderer options were also recreated every render, increasing remount risk.
- Fix: Paused polling while fullscreen is open, stopped polling for terminal statuses (`Done/Failed/Completed/...` with docs), memoized markdown component mapping, and persisted fullscreen scroll position per document path.
- Prevention Rule: For long-form reader views, disable background polling while reading and persist viewport state by stable content key (document path).
- Example: `FileDetailPage.tsx` now stores scroll offsets in `fullscreenScrollByDocRef` and restores via `fullscreenScrollRef`.

## 2026-03-07 - Full-screen markdown content truncated
- Symptom: Full-screen modal showed only the `UI Components` table and hid `Item Definitions` and `Events`.
- Root Cause: The modal rendered `uiComponentsSection` (a sliced subsection) instead of the whole markdown content.
- Fix: Removed subsection slicing and rendered `mdContent` directly in full-screen mode.
- Prevention Rule: If a feature is named "full screen", default to rendering the full source content unless a scoped mode is explicitly requested.
- Example: `FileDetailPage.tsx` now uses `{mdContent}` in the full-screen `<Markdown>` renderer.

## 2026-03-07 - Empty UI extraction for non-Flutter screens
- Symptom: Some `_UI.md` files had only table headers with no rows, while progress still showed completed.
- Root Cause: UI prompt was Flutter-specific and relied on model/tool traversal; WinForms `.Designer.cs` controls were not guaranteed to be loaded, and fast-mode caps cut output.
- Fix: Made prompts stack-agnostic, preloaded related source files, added deterministic WinForms fallback extraction from `.Designer.cs`, and disabled fast-mode caps in `.env` for full analysis.
- Prevention Rule: For reverse-engineering pipelines, never depend on a single framework assumption; always include deterministic fallback parsing for common UI metadata sources.
- Example: `get_ui_design.py` now loads related files and applies `_extract_winforms_widgets(...)` when AI output is empty/unreadable.

## 2026-03-07 - Overview-only output caused by empty screen list
- Symptom: Some jobs produced only `Project_Overview.md` and no `<Screen>_UI.md` detail files.
- Root Cause: AI screen detection returned `screens=[]`, and pipeline treated this as successful completion.
- Fix: Added deterministic fallback screen detection by scanning `/pages|/screens|/views|/form` files and changed pipeline to fail when screen list is empty unless explicitly allowed.
- Prevention Rule: Do not mark reverse-engineering jobs `Done` when primary entities (screens) are missing; enforce fail-fast or explicit opt-in for empty outputs.
- Example: `get_screen_list.py` now falls back to filesystem-based detection and `module.py` enforces `ALLOW_EMPTY_SCREEN_LIST=false` by default.

## 2026-03-07 - File detail page showed stale document count
- Symptom: Detail page kept showing `Documents (1)` even after backend had generated multiple screen docs.
- Root Cause: `FileDetailPage` fetched project metadata only once on mount and never refreshed `paths` while processing continued.
- Fix: Added periodic polling on detail page and synchronized project state until status is `Done` with non-empty docs, plus one-time zip cache guarding.
- Prevention Rule: Any page that depends on async backend generation must poll or subscribe for updates; do not rely on a single initial fetch.
- Example: `FileDetailPage.tsx` now uses `syncProject(...)` with a 5-second interval and stops polling when output is stable.

## 2026-03-07 - Full re-run wasted tokens after partial failures
- Symptom: Retrying a failed request reprocessed all screens and consumed unnecessary tokens.
- Root Cause: Pipeline had no incremental resume path and always re-executed screen analysis from scratch.
- Fix: Added resume mode that reuses cached `screens.json`, skips completed `*_UI.md` + `*_UI.json`, and only regenerates missing/failed screens.
- Prevention Rule: For long-running AI pipelines, support idempotent checkpoints and incremental recovery before adding brute-force retries.
- Example: `POST /resume/{uid}` now launches `process(..., resume_incomplete=True)`.

## 2026-03-08 - Screen transition diagram showed as plain text
- Symptom: `Project_Overview.md` displayed `flowchart TD` as raw text instead of a visual diagram in UI.
- Root Cause: AI output could miss fenced mermaid blocks, and FE markdown renderer had no Mermaid rendering component.
- Fix: Normalized overview generation to always inject section 0/1 with fenced Mermaid flowchart, and added FE Mermaid renderer for `language-mermaid` code blocks.
- Prevention Rule: For diagram-required sections, enforce deterministic markdown post-processing plus viewer-side renderer support.
- Example: `project_overview.py` now builds screen transition Mermaid from source evidence, and `MermaidBlock.tsx` renders it visually.

## 2026-03-08 - Project overview lacked business narrative and purpose columns
- Symptom: Section 0 was mostly technical counts, screen transition had missing links, and component/database tables lacked business-purpose explanation.
- Root Cause: Overview normalization replaced AI business section with static fallback stats and table schema was too technical-only.
- Fix: Preserve AI-generated section 0 when available, strengthen transition edge extraction (navigation/route patterns + connectivity fallback), and enforce component/database tables with `Business Purpose` columns.
- Prevention Rule: In reverse-engineering docs, always separate technical metadata from business meaning; required business-purpose columns must be schema-level constraints, not optional prompt text.
- Example: `project_overview.py` now composes deterministic section schema with business-purpose columns and improved graph edge extraction.

## 2026-03-08 - Business-flow Mermaid parse error and missing per-doc regeneration
- Symptom: `Business_Flow_Sequence.md` sometimes failed to render Mermaid (`Parse error` near `end([End])`), and users could not regenerate only one bad document without rerunning broader flow.
- Root Cause: Flowchart used `end` as a node id (reserved keyword in Mermaid), and backend resume API only supported project-level incremental resume.
- Fix: Renamed terminal node id to `finish_node`, localized JP business-action text, and added targeted document endpoints (`POST /resume/{uid}/doc/{filename}`, `DELETE /doc/{uid}/{filename}`) plus FE inline `Regenerate/Delete` actions in Documents list.
- Prevention Rule: Avoid reserved keywords for diagram node ids; for long AI pipelines, always provide item-level regeneration controls to limit token usage and rework scope.
- Example: `business_flow_sequence.py` now emits `finish_node([End])`; `main.py` routes + `FileDetailPage.tsx` inline doc actions enable doc-only rerun.

## 2026-03-08 - Duplicate event rows and low-quality completion state
- Symptom: Screen docs contained duplicated/noisy event rows, warnings mixed into main event tables, and jobs could end as `Done` with poor reverse quality.
- Root Cause: Event extraction appended per-widget blocks directly to markdown with no merge/dedupe, and completion checks only validated file existence (`*_UI.md`/`*_UI.json`) without quality criteria.
- Fix: Refactored event extraction to 2-phase collect/merge with deduped event table + separate warning section, added per-screen quality reports (`*_quality.json`) and quality gate in final status, and added section-level resume (`events|overview|business_flow`) to regenerate only needed parts.
- Prevention Rule: In AI extraction pipelines, separate raw extraction errors from business output tables, and never mark completion by file existence alone; require measurable quality metrics.
- Example: `get_ui_analysis.py` now returns deduped event payload + warning markdown, and `module.py` validates screen/doc quality before final `Done`.

## 2026-03-08 - FE-only reverse output missed backend business core
- Symptom: Generated docs explained UI flow/events but lacked backend domain/service/repository/API business responsibilities.
- Root Cause: Existing pipeline started from screen evidence and had no dedicated backend extraction stage or backend-specific quality checks.
- Fix: Added standalone backend reverse pipeline generating `Backend_Business_Overview.md` with API catalog, module responsibilities, data/table + ERD, external IF, and business rules with technical evidence; integrated into process/resume (including section/doc targeted regenerate) and quality gate.
- Prevention Rule: For reverse-engineering outputs, define FE and BE pipelines as separate first-class stages; do not assume backend understanding emerges implicitly from screen-driven extraction.
- Example: `backend_reverse.py` + `module.py` now produce and validate backend business documentation in every run (or targeted `section=backend`).

## 2026-03-08 - Backend business descriptions were overly generic and table extraction was noisy
- Symptom: `Business Purpose`/`Business Responsibility` repeated generic phrases and table list contained false positives like `DATETIME`.
- Root Cause: Endpoint purpose inference used method-only templates with weak context, backend file selection mixed FE service files, and table extraction regex captured generic `from ...` imports.
- Fix: Strengthened backend file filtering, added endpoint handler extraction and special-path business mapping (`reverse/resume/progress/doc`), enriched module responsibility by action verb tokens, and restricted table extraction to SQL/ORM patterns (`INSERT INTO`, `SELECT ... FROM`, `__tablename__`, `@Table`) only.
- Prevention Rule: Business explanation quality depends on semantic context (handler + path + domain tokens), not HTTP method alone; SQL extraction must avoid language import patterns.
- Example: `backend_reverse.py` now outputs endpoint rows with `Handler` and avoids non-table tokens from Python imports.

## 2026-03-20 - Mainframe docs ignored selected language and detail pane bled into controls
- Symptom: Mainframe jobs uploaded with default `jp` still showed English markdown, and long document views visually bled into the lower action area on the detail page.
- Root Cause: Mainframe markdown templates were written in English and saved directly without a localization pass, while the detail page grid panels lacked `min-h-0`/scroll containment so the markdown pane could outgrow its cell.
- Fix: Added `BE/mainframe/markdown_i18n.py` and localized saved mainframe markdown by `output_language`, updated fallback overview/business-flow narratives, and tightened `FileDetailPage.tsx` with `min-h-0`, isolated panels, and an internal markdown scroll container.
- Prevention Rule: Output-language support must be enforced at the final persisted-document boundary, and any grid-based split-view reader should explicitly opt into shrink/scroll containment.
- Example: `process_mainframe(...)` now saves localized markdown for `System_Inventory.md` through `Migration_Blueprint.md`, and `FileDetailPage.tsx` keeps the selected markdown pane contained within the documents grid.

## 2026-03-20 - Graph APIs cannot expose raw local node ids directly
- Symptom: Graph fallback nodes derived from local artifacts can contain `/`, `:`, and other path characters that are unsafe or awkward in REST path segments.
- Root Cause: Canonical artifact graphs used human-readable local ids, but the new graph API contract expected a path-friendly `node_id` for `GET /graph/project/.../node/{node_id}`.
- Fix: Added deterministic public node ids in graph fallback mode and kept internal local ids only inside the artifact/query layer.
- Prevention Rule: Any graph/query API that exposes entity ids through URLs must define a transport-safe public id layer instead of leaking raw parser keys.
- Example: `BE/graph/service.py` now hashes fallback node ids before returning hotspots, neighbors, and impact payloads.

## 2026-03-20 - Optional sidecar dependencies still need a full local fallback
- Symptom: A sidecar integration like Neo4j can easily become a hidden hard dependency if query endpoints assume the service is always running.
- Root Cause: It is tempting to wire graph-backed UI directly to the external database once sync works, but that breaks local/offline usage and old projects without synced graph state.
- Fix: Implemented graph endpoints to prefer Neo4j when enabled and healthy, but automatically fall back to local `knowledge_graph.json` artifacts for both app reverse and mainframe pipelines.
- Prevention Rule: For optional infrastructure, every user-facing feature must have a graceful local fallback path before the feature is exposed in the UI.
- Example: `GET /graph/project/{pipeline_type}/{uid}/summary` now returns usable hotspot/count data even when `GRAPH_ENABLED=false`.

## 2026-03-20 - Pinned container tags must be verified against real registry tags
- Symptom: Docker Compose failed immediately when bringing up Neo4j because the pinned image tag did not exist on Docker Hub.
- Root Cause: The graph sidecar was wired with a semver-like tag guess instead of a registry-verified published tag.
- Fix: Switched Compose to a valid published Neo4j tag and kept graph settings configurable via Compose environment overrides.
- Prevention Rule: Before finalizing infra changes, verify pinned image tags with the registry or `docker manifest inspect` rather than assuming a version naming pattern.
- Example: `docker-compose.yml` now uses `neo4j:2025.10.1`, and Compose exposes `GRAPH_*` variables for the backend.

## 2026-03-20 - Graph mappers must derive entity types from canonical inventory, not relation roles
- Symptom: Mainframe graph summaries in Neo4j promoted technical classifier nodes like `typed_as` and `contains_paragraph` into top node types and hotspots.
- Root Cause: The graph sync layer inferred node type from `roles[0]`, but the canonical mainframe graph stores many relation-like roles on otherwise valid entity nodes.
- Fix: Built an explicit entity registry from canonical inventory, used it to assign stable node types for programs/copybooks/fields/jobs/steps/etc., and excluded low-signal classifier nodes from hotspot ranking.
- Prevention Rule: When syncing a knowledge graph to a query store, derive entity identity/type from canonical inventory or schema metadata before consulting role lists that may encode edges or classifications.
- Example: `BE/graph/service.py` now maps `CBACT01C::1000-GET` to `Paragraph` and skips nodes like `FIELD_TYPE:alphanumeric` from mainframe hotspot results.

## 2026-03-21 - Graph evidence must be actionable, not just displayed
- Symptom: The Graph tab could show evidence paths, but they behaved like dead text and forced users to manually hunt for the matching source/doc pane.
- Root Cause: The first graph explorer only exposed counts and labels; it had no path-normalization or pane-navigation layer to translate graph evidence back into the existing source/document viewers.
- Fix: Added evidence click-through handling in the detail page, normalized graph evidence paths before matching, and wired graph edges/neighbors/impact results so users can jump directly from graph context back into source or markdown.
- Prevention Rule: Any evidence surfaced in a reverse-engineering UI should be navigable in one click; traceability is incomplete if users still have to manually re-find the file.
- Example: `FileDetailPage.tsx` now opens the matching source entry or generated document when a graph evidence path is clicked.

## 2026-03-21 - Review actions should live where reviewers read the evidence
- Symptom: Review candidates existed in a dedicated queue, but users still had to context-switch away from markdown sections and connected dependency edges just to confirm or suppress what they were already looking at.
- Root Cause: The first review-loop tranche treated review as a separate workflow instead of carrying candidate identity through to the document and graph surfaces where people actually inspect evidence.
- Fix: Added stable `graph_edge_key` propagation for graph edges and rendered inline review badges/actions directly beside markdown headings and connected edges in the shared detail page.
- Prevention Rule: If a surface is used to inspect evidence, it should also expose the minimum review action needed to validate or dismiss that evidence without forcing a tab switch.
- Example: `FileDetailPage.tsx` now renders inline `Confirm / False Positive / Ignore` controls next to markdown headings and connected edges, using `doc_section` and `graph_edge` review candidates.

## 2026-03-21 - Imported runtime evidence must be visible immediately in the project detail UX
- Symptom: A runtime overlay can exist in backend storage and API payloads, but the feature still feels unfinished if users cannot import, inspect, and remove that evidence directly from the detail page.
- Root Cause: Backend/runtime artifact work was added first, while the detail page still had no `Runtime` tab or explicit runtime-visibility feedback in app confidence.
- Fix: Added app runtime overlay APIs/tests, blended `runtime_visibility` into the returned app confidence, and exposed a dedicated `Runtime` tab with import/delete actions, summary cards, top observed surfaces, and recent runtime messages.
- Prevention Rule: When adding overlay/evidence artifacts, always ship the matching inspection UX in the same tranche; persisted evidence that users cannot see or manage is effectively dead context.
- Example: `runtime_overlay.py`, `main.py`, and `FileDetailPage.tsx` now work together so importing a runtime snapshot JSON immediately changes the detail payload and UI.

## 2026-03-21 - Runtime evidence must feed the graph layer, not live beside it
- Symptom: Runtime overlay could improve a separate summary panel, but Graph tab queries still reflected only static reverse artifacts, so hotspots/impact/search missed observed runtime behavior.
- Root Cause: Runtime snapshots were persisted independently of `knowledge_graph` and graph sync, which split static and runtime context into two parallel but disconnected views.
- Fix: Augmented app graph payloads with runtime-observed nodes/edges, merged runtime overlay into fallback graph loaders, and triggered app graph re-sync on runtime overlay import/delete when canonical artifacts are available.
- Prevention Rule: When a new evidence source changes understanding of dependencies, feed it into the canonical graph/query layer instead of only decorating top-level metadata.
- Example: `graph/service.py` now adds `OBSERVED_AT_RUNTIME` links for app overlays, and `/graph/project/app/{uid}/*` can surface runtime-backed context immediately.

## 2026-03-21 - Runtime snapshots need corroboration and diff, not just counts
- Symptom: An imported runtime snapshot could show counts of routes/APIs/modules, but reviewers still could not tell whether those signals matched the static reverse result or what changed between two imports.
- Root Cause: The initial runtime overlay artifact stored only a latest summary and recent logs, with no comparison against canonical app artifacts and no history/diff artifacts.
- Fix: Added runtime corroboration against app inventory/knowledge graph, persisted `runtime_overlay_history.json` and `runtime_overlay_diff.json`, and exposed those results in the Runtime tab and detail payload.
- Prevention Rule: Any evidence overlay used for validation should answer two questions by default: “how much of this matches what we think we know?” and “what changed since last time?”.
- Example: `runtime_overlay.py` now computes per-category matched/unmatched ratios and persists latest runtime diff/history for app reverse projects.

## 2026-03-21 - App pipeline final stages must use a single explicit project-data path
- Symptom: App reruns could fail late with `name 'user_data_path' is not defined`, which then cascaded into missing `Migration_Blueprint.md` and `Execution_Readiness.md`.
- Root Cause: The app pipeline mixed `root_folder`, `result_folder`, and an undefined `user_data_path` symbol when loading runtime overlay and review state in the graph, migration, and execution stages.
- Fix: Introduced `_resolve_app_project_data_path(...)`, used the resolved project-data path consistently for runtime/review helpers, and added regression coverage in `test_resume_incremental.py`.
- Prevention Rule: In multi-stage pipelines, resolve and name the canonical project-data directory once near function entry, then pass that variable through every artifact/review/runtime stage instead of reusing ad-hoc path names.
- Example: `module.py` now resolves `project_data_path` once and uses it for `load_runtime_overlay(...)` and `build_review_state_payload(...)` in app graph, migration, and execution generation.

## 2026-03-21 - App semantic summaries should not let transport noise or mojibake dominate project metadata
- Symptom: App business summaries could surface low-value domains like `Http`, `All`, and `Del`, while some JP heading snapshots in `run_summary.json`/history looked garbled.
- Root Cause: Business-semantics extraction treated endpoint/integration transport tokens as normal domain candidates, and document-section snapshots read headings without filtering obviously mojibake text.
- Fix: Added app-specific technical-token filtering for business semantics, tightened low-signal rule detection for prompt/code scaffolding, and changed run-artifact heading snapshots to decode documents best-effort and skip suspicious mojibake headings.
- Prevention Rule: Semantic summaries should prefer business-bearing tokens over transport verbs/protocol labels, and run-history metadata should filter corrupted display text instead of persisting it as if it were trustworthy evidence.
- Example: `reverse_inventory.py` now drops endpoint-only tokens like `HTTP/ALL/DEL` from capability/glossary ranking, and `run_artifacts.py` skips headings that match common mojibake markers.

## 2026-03-21 - List screens should never pay the cost of detail-level artifacts
- Symptom: The mainframe list screen felt hung for several seconds even with only a few projects, while users only needed a project list and basic status at first glance.
- Root Cause: List endpoints loaded detail-grade data per project (`metrics`, `run_metadata`, review-derived payloads, repeated zip counting), and the detail page eagerly loaded graph and zip/source state before those tabs were opened.
- Fix: Slimmed list payloads, added dedicated summary endpoints, moved heavy review/detail data out of list paths, stopped unconditional polling when all projects are terminal, and lazy-loaded graph/source work in the detail page.
- Prevention Rule: For reverse-engineering UIs, treat list, summary, and detail as separate performance budgets; anything that reads large artifacts or parses archives must stay out of the initial list path unless it is explicitly required for first paint.
- Example: `GET /mainframe/projects` now returns lightweight project snapshots, `GET /mainframe/summary` feeds overview cards, and `FileDetailPage.tsx` delays graph/source loading until the relevant tab is opened.
- Symptom: App reverse jobs could fail even when most documents were generated, and Laravel-style projects produced overwritten `*_UI.*` artifacts for different screens sharing the same controller name.
- Root Cause: App orchestration used `component_name` as the artifact key, so duplicate controller-backed screens collided; timeout handling relied on thread cancellation that could not stop stuck screen analysis cleanly; stale watchdog only looked at `updated_at`, and final status treated any partial screen failure as full job failure.
- Fix: Added canonical `screen_id`/`artifact_stem` screen identity, switched app timeout execution to a hard-timeout worker process with heartbeat metadata, made stale detection heartbeat-aware, and introduced `DoneWithWarnings` for usable partial completions.
- Prevention Rule: Never use display/component labels as persistence keys for per-screen artifacts; use stable ids from evidence paths, and never let stale detection depend on a generic timestamp when a long-running worker step is expected.
- Example: GIS-like Laravel screens now dedupe by view path instead of colliding on `UserController` / `ThresholdController`, while app runs with one timed-out screen can finish as `DoneWithWarnings` instead of `Failed`.

## 2026-03-21 - Never place an early return before late-added hooks in a large detail page
- Symptom: Opening an app reverse detail page could blank the whole screen with `Rendered more hooks than during the previous render` in `FileDetailPage.tsx`.
- Root Cause: The component had early returns for `isLoadingProject` and `!project`, then later grew additional `useMemo/useEffect/useCallback` hooks below those returns; once loading/data state changed between renders, React saw a different hook count.
- Fix: Introduced a safe `currentProject` fallback, moved all fallback returns until after the full hook block, and added dev-only detail-page debug logs for fetch/render state transitions.
- Prevention Rule: In large React pages, keep all hooks at the top-level stable region and treat loading/empty/error UIs as render branches after the hook section, not as early exits inserted above new hooks.
- Example: `FileDetailPage.tsx` now logs `[FileDetailPage:<pipeline>:<id>] syncProject:*` and `render-state` in dev while keeping hook order constant across loading, empty, and loaded states.

## 2026-03-21 - When reverse output grows into many tabs, ship a reading guide with the product
- Symptom: Even after the reverse platform became much stronger, users could still feel lost because the UI exposed many tabs (`Documents`, `Runtime`, `Review`, `History`, `Graph`) and many artifacts without a simple mental model for what each one means.
- Root Cause: We optimized the pipeline and artifact model faster than we documented the user-facing reading flow, so the system had strong capabilities but weak onboarding for interpreting output.
- Fix: Added two dedicated guides: `docs/APP_REVERSE_OUTPUT_GUIDE.md` and `docs/MAINFRAME_REVERSE_OUTPUT_GUIDE.md`, plus README links, to explain each tab, each core artifact, trust level, and recommended reading order.
- Prevention Rule: Any time a reverse product adds a new output layer or tab, add or update a handbook that explains `what it is`, `where the data comes from`, and `what decision it supports`.
- Example: The new guides explain why `Documents` tell the story, `Graph` preserves dependency context, `Runtime` provides observed evidence, `Review` captures human validation, and `History` explains rerun deltas.

## 2026-03-22 - Reverse quality must be judged before execution readiness, not hidden behind it
- Symptom: Projects that were structurally reverseable still looked `medium` or weak because one blended confidence score mixed parser fidelity with governance and downstream execution posture.
- Root Cause: The old score model used a single top-level confidence number for reverse quality, operational completeness, and execution gating together, so users could not tell whether a project was weak because parsing failed or because it simply lacked runtime/human validation.
- Fix: Added an `Automatic Reverse Reviewer`, persisted `reverse_review.json` / `Reverse_Review.md`, and split confidence into `reverse_fidelity`, `operational_confidence`, and `execution_readiness_summary` while keeping backward-compatible top-level fields.
- Prevention Rule: In reverse-engineering systems, always separate `what we structurally understand`, `how operable/complete the package is`, and `whether it is safe to execute downstream plans`; otherwise the main trust signal becomes misleading.
- Example: App and mainframe detail payloads now expose `reverse_review`, `fidelity_score`, and `operational_confidence`, and the detail page surfaces those as distinct cards instead of one blended confidence box.

## 2026-03-22 - Parser depth must be modeled as stack capabilities, not hidden inside one generic app pipeline
- Symptom: New app projects kept failing in different ways (`Flutter` widget extraction, `Laravel` route linkage, `Next` page discovery), and each one looked like a separate bug even though the root issue was parser depth varying by stack.
- Root Cause: The app pipeline had useful heuristics, but they were scattered across screen detection, UI extraction, and inventory building without a shared `stack profile` or `parser capabilities` contract, so the system could not explain what it expected to find for a given stack or which fallback extractor should engage.
- Fix: Added `stack_profile.json` and `parser_capabilities.json`, introduced a parser registry for tier-1 stacks, strengthened Flutter deterministic widget fallback, improved Laravel route-to-module lineage, and treated Next `app/.../page.tsx` / `pages/...` entries as navigable screens.
- Prevention Rule: When supporting multiple stacks, define per-stack expected entities, expected links, and fallback extractors explicitly; otherwise every mismatch looks like a project-specific bug instead of a missing parser capability.
- Example: The automatic reverse reviewer now ships with parser capability gaps, while app artifacts persist detected stack family plus missing entities/links that currently cap fidelity.

## 2026-03-22 - Runtime corroboration and failure taxonomy must be first-class production artifacts
- Symptom: Runtime evidence existed, but it behaved like an optional overlay instead of a production-grade trust signal; meanwhile reviewer failures still had to be interpreted manually check by check.
- Root Cause: Runtime matching, benchmark expectations, and recurring failure classes were implicit logic spread across confidence and review code, so the platform could not explain quality gaps in a stable, reusable way.
- Fix: Added `runtime_corroboration.json`, `failure_taxonomy.json`, benchmark registry endpoints, and wired runtime corroboration back into automatic review and operational confidence.
- Prevention Rule: When a platform uses runtime and review as trust multipliers, persist them as explicit artifacts with stable schema and failure families; otherwise every new project requires bespoke interpretation.
- Example: Detail payloads now expose `runtime_corroboration`, `failure_taxonomy`, `stack_profile`, and benchmark-backed reviewer context together, so a low-fidelity project can be diagnosed by class rather than by ad-hoc debugging.

## 2026-03-22 - Production artifacts are only useful if they are exposed, cached, and documented end-to-end
- Symptom: Tranche 4 artifacts like transformation delivery, production audit, and project index can exist in the pipeline, but still feel unfinished if list/detail APIs do not expose them and operators have no guide for how to use them.
- Root Cause: Pipeline work tends to land before API/UI/docs are fully wired, which leaves a misleading state where the engine computes useful production signals but the product still behaves as if they do not exist.
- Fix: Exposed `transformation_delivery.json`, `production_audit.json`, and `project_index.json` through app/mainframe detail and list flows, added UI score cards for delivery/audit, and wrote operator/deployment/onboarding guides for tranche 4.
- Prevention Rule: For production-hardening work, treat `artifact generation`, `API exposure`, `cache usage`, and `operator documentation` as one delivery unit; do not count the tranche as done if any one of those four is missing.
- Example: App and mainframe detail pages now surface transformation delivery and production audit directly, while list endpoints can reuse `project_index.json` to stay lightweight.

## 2026-03-22 - A feature does not really exist if users cannot reach it from the screen they are actually using
- Symptom: Mainframe project deletion already existed in backend and list UI, but it still felt missing because users working inside the detail page had no obvious way to delete the project there.
- Root Cause: We treated API availability and one list-button surface as sufficient, instead of checking whether the action is reachable from the real workflow entry points users spend time in.
- Fix: Added project deletion directly to `FileDetailPage.tsx`, wired it for both app and mainframe pipelines, and reused the same confirmation flow so delete is available from detail without returning to the list.
- Prevention Rule: For destructive but legitimate project-management actions, verify they are reachable from every primary workflow surface, not only from one index page.
- Example: Mainframe reverse now supports deleting a project from both the list page and the detail page.

## 2026-03-22 - Laravel route-backed screens must prefer Blade evidence and deterministic UI extraction before AI
- Symptom: GIS-style Laravel projects regressed into mass screen failures like `No UI widgets extracted from screen source` or long stalls on large Blade templates, even though the templates themselves contained clear forms, links, selects, and canvases.
- Root Cause: Route-backed screens could still pick `routes/web.php` as primary evidence, and `get_ui_design` tried AI-first for Blade/template screens before using deterministic markup extraction. That made view-heavy stacks both slower and less reliable than they needed to be.
- Fix: Ranked screen evidence so Laravel screens prefer `.blade.php` over `routes/web.php`, added robust relative-path resolution in `get_ui_design`, expanded deterministic markup extraction for Blade/form/canvas/textarea patterns, and added a route fallback for route files.
- Prevention Rule: For template-driven stacks, prefer deterministic UI extraction from the concrete template first and use AI as a supplement; do not let route/controller files outrank the actual rendered view when choosing screen evidence.
- Example: `GIS_v2_20260303.zip` moved from all 8 screens failing to `Done` after Blade screens were extracted deterministically and route-backed `HomePage` stopped analyzing raw routing config as if it were the UI.

## 2026-03-22 - Event quality gates should not fail deterministic template screens that do not own business handlers
- Symptom: After Blade widgets were successfully extracted, the same screens still failed because event analysis demanded code-backed events directly from the template, producing `Event count too low` and `Event coverage too low` on otherwise valid Laravel pages.
- Root Cause: The event quality gate assumed every screen source should contain realizable event handlers, which is not true for many server-rendered templates where business actions live in routes/controllers instead of the Blade file itself.
- Fix: When `get_ui_design` uses deterministic template/route extraction, it now skips expensive event-analysis gating for that screen and treats the extracted UI structure as the primary artifact, leaving dependency gaps to be scored later by reverse review and fidelity metrics.
- Prevention Rule: Quality gates must respect stack boundaries; if the current evidence source is a template shell rather than the event-owning logic layer, do not fail the screen for missing local handlers.
- Example: GIS rerun `run-20260322T040504735244Z` completed with all 8 screens passing, while reverse review still correctly reported medium `dependency_traceability` rather than masking the gap as a screen extraction failure.

## 2026-03-22 - Dependency traceability must be a canonical artifact backed by stack-aware linkers
- Symptom: App projects could show strong file coverage and many backend modules, yet still stall below high operational confidence because `screen_endpoint_links` and `endpoint_module_links` stayed near zero, making dependency-traceability gaps look vague and project-specific.
- Root Cause: Traceability was inferred from a few summary counts and thin token matching, while important backend evidence such as Laravel route files and Next API route handlers could be skipped or parsed too weakly to form explicit `screen -> endpoint -> module -> data` chains.
- Fix: Added `traceability_report.json` as the canonical app traceability artifact, strengthened stack-aware linkers in `reverse_inventory.py` for Laravel/React-Next/Spring-Node/Flutter API linkage, fixed Laravel route endpoint extraction in `backend_reverse.py`, wired traceability into reverse review, failure taxonomy, benchmark expectations, and operational confidence, and preserved already-completed screens during resume so reruns do not undercount extraction quality.
- Prevention Rule: Any traceability improvement must land as a reusable artifact + regression test + failure-taxonomy mapping + benchmark expectation; do not raise confidence by heuristics alone or by patching one project's naming scheme.
- Example: After rerunning `GIS_v2_20260303.zip`, the project moved from `api_endpoints=0 / screen_endpoint_links=0 / endpoint_module_links=0` to `api_endpoints=62 / screen_endpoint_links=2 / endpoint_module_links=431`, generated `traceability_report.json`, and raised `operational_confidence` to `high` through real chain evidence instead of threshold tuning.

## 2026-03-22 - Japanese default docs must stay readable even on graph-backed fallback paths
- Symptom: `Project_Overview.md` and `Business_Flow_Sequence.md` could regress into English-first headings or mojibake-looking Japanese after graph-backed and fallback improvements, which made the default `jp` output much harder to read.
- Root Cause: The generator code mixed old corrupted localized literals with newer graph-backed helper text written only in English, and the unstable AI section output was allowed to leak straight into the final normalized markdown.
- Fix: Re-localized the Japanese default branches in `project_overview.py` and `business_flow_sequence.py`, added deterministic JP fallback headings/intros for graph-backed context, rejected obviously mojibake AI sections during normalization, and added regression tests that assert readable Japanese output for `jp`.
- Prevention Rule: Whenever a document generator adds a new fallback or graph-backed section, verify all supported output-language branches explicitly; do not assume a shared English helper can be dropped into the `jp` path without degrading readability.
- Example: GIS regenerated `Project_Overview.md` now starts with `# プロジェクト総覧`, and `Business_Flow_Sequence.md` starts with `# 業務フロー・シーケンス図` instead of English-first headings.
## 2026-03-22 - Progress timelines must be scoped per run, not accumulated forever per project
- Symptom: After a rerun or resume succeeded, `Progress Detail` could still show many old screen failures, making the latest run look broken even when the current artifacts and final status were healthy.
- Root Cause: `progress.json` stored one shared `events` array per project, and backend progress updates could switch to a new `run_id` without resetting that timeline or tagging events with the active run. The UI then rendered the full mixed history as if it belonged to the current run.
- Fix: `progress_store.py` now resets progress timeline state when `run_id` changes, tags each appended event with the current `run_id`, and the progress modal filters to the active run timeline when that metadata exists.
- Prevention Rule: Any project that supports rerun/resume must treat progress events as run-scoped data. If a new `run_id` starts, either archive or reset the live timeline and always carry `run_id` on every event shown to users.
- Example: GIS-style reruns no longer inherit the earlier `No UI widgets extracted...` failures in `Progress Detail`; the modal now reflects only the current run instead of replaying old failures from a previous attempt.

## 2026-03-22 - Flutter reverse must resolve `package:` imports and event-coded API clients, not assume REST literals
- Symptom: `followapplication.zip` could pass screen detection yet still collapse into low traceability because the engine saw `api_endpoints = 0`, `screen_endpoint_links = 0`, and old runs reported `No UI widgets extracted` or event-quality failures for most screens.
- Root Cause: Two common Flutter-specific gaps were stacked together. First, local import traversal ignored `package:...` imports, so pages could not reach cubits/usecases/repositories/custom widgets that lived in the same app package. Second, endpoint extraction assumed URL/path literals, while this codebase uses `FollowApiClient` plus `ParameterEvent.*` codes instead of plain `/api/...` strings at the screen layer.
- Fix: Hardened Flutter extraction to resolve `package:` imports in both widget traversal and traceability traversal, modeled `ParameterEvent.*` calls in `FollowApiClient` as canonical endpoints, indexed method-call reference tokens for module linkage, and added diagnostics so shell/custom-widget screens stop failing by default while traceability gaps are reported explicitly.
- Prevention Rule: For Flutter projects, treat `package:` imports as first-class local imports and support event-coded/mobile client protocols as endpoint evidence. Do not require REST path literals in UI/page files before acknowledging a real backend interaction chain.
- Example: After the Flutter hardening pass, `screen_extraction_diagnostics.json` for `followapplication` shows `9/9` screens passing via `custom_widget_traversal`, and the next trust bottleneck becomes real endpoint/data traceability rather than false-negative extraction or quality-gate failures.

## 2026-03-22 - Quota exhaustion must fail fast into deterministic fallback, not stall every screen
- Symptom: A clean rerun of `followapplication.zip` through the real app path could sit for many minutes on each screen while `Progress Detail` looked effectively stuck, even after extraction bugs were fixed.
- Root Cause: The AI layer treated `429 insufficient_quota` like a transient retry/fallback condition, so it retried the same exhausted provider repeatedly across multiple models before the screen-level deterministic fallback could engage. That makes an upstream quota problem look like a reverse-engineering failure.
- Fix: `reverse_agent/agent.py` now recognizes quota exhaustion as a non-transient provider-wide failure, skips retry loops and same-provider model fallback, and lets screen/doc generators fall straight into deterministic fallback behavior.
- Prevention Rule: If an upstream provider says the account has no quota, fail fast and switch to the local deterministic path. Do not burn minutes retrying sibling models on the same exhausted account.
- Example: Flutter screen analysis now moves from `AI extraction failed ...` to deterministic widget traversal immediately when OpenAI returns `insufficient_quota`, instead of spending several retry cycles per screen before doing the same fallback anyway.

## 2026-03-22 - Multi-language intake must detect stack family before requiring web/mobile screens
- Symptom: A new desktop legacy project like Delphi/VB6/.NET could fail immediately with `No screens were detected from source code`, even though the archive clearly contained many forms, designer files, and data modules.
- Root Cause: The app pipeline still treated `screen-first` detection as the universal gate for every app project, so unsupported desktop families were misclassified as generic parser failures instead of being routed to a family-aware adapter path.
- Fix: Added `desktop_legacy` stack detection with Delphi/VB6/WinForms/WPF signals, introduced deterministic desktop entrypoint detection for forms/dialogs/data modules, expanded inventory/traceability with desktop baseline chains, and changed status semantics so desktop projects can land in `UnsupportedStackNeedsAdapter` instead of failing like a broken web app.
- Prevention Rule: Always run stack-family preflight before screen extraction and choose the intake adapter from that result; if a project belongs to a partially supported family, continue with baseline inventory/review and return a family-aware status instead of hard-failing on `0 screens`.
- Example: `delphi reverse.zip` should now discover desktop entrypoints from `.dfm/.pas/.frm/.Designer.cs/.xaml` evidence and proceed into baseline review/traceability, even if deep desktop form parsing still needs later tranche work.

## 2026-03-22 - Deterministic desktop parsing must never be overwritten by the generic AI branch
- Symptom: The Delphi desktop parser could recover real controls and event wiring when called directly, but the actual run still failed per-form with `No UI widgets extracted from screen source`.
- Root Cause: `get_ui_design.py` populated a valid desktop deterministic bundle first, then immediately fell through the generic AI extraction branch because the `else` was attached to the preferred-deterministic check instead of the “no widgets yet” condition. The later AI/fallback path overwrote the already-good desktop output.
- Fix: Changed the control flow so AI extraction only runs when no deterministic widgets exist yet, added a regression test that calls `get_ui_design()` on a real Delphi-style `.dfm + .pas` pair, and reran the desktop sample to confirm all 267 entrypoints complete successfully.
- Prevention Rule: Whenever a stack-specific deterministic parser succeeds, guard that result from lower-priority generic extractors. Generic AI fallback should be opt-in only when stack-aware extraction produced no usable widgets.
- Example: After the fix, `delphi reverse.zip` moved from mass `No UI widgets extracted...` failures to `Done`, with `267/267` screen analyses completing.

## 2026-03-22 - Business-first app docs must keep narrative sections first and append graph context later
- Symptom: Even after rewriting `Project_Overview` and `Business_Flow_Sequence` to sound more like mainframe narratives, the saved documents still started with `Graph-Backed ... Context`, so users saw technical evidence before the business explanation.
- Root Cause: `reverse_inventory.py` still prepended graph-backed summary blocks to the top of the generated markdown, which overrode the intended business-first ordering of the new doc builders.
- Fix: Changed graph-backed augmentation to append an evidence snapshot section at the end (`## 7. Graph-Backed Evidence Snapshot` / `## 6. Graph-Backed Flow Context`) instead of prepending it, and added regression coverage to ensure the title and `0.` business sections remain the first content in both documents.
- Prevention Rule: For overview/flow docs, the first user-visible content must be the natural-language business narrative. Supporting graph metrics belong in later evidence sections, never ahead of the executive/business context.
- Example: The regenerated Delphi `Project_Overview.md` now begins with `# プロジェクト総覧` followed immediately by `## 0. Executive Overview and Business Context`, while graph-backed metrics appear later as supporting evidence.

## 2026-03-22 - Artifact-backed backend docs must accept reviewed rule shapes, not assume every rule uses the same key
- Symptom: A clean desktop rerun still emitted a warning because `Backend_Business_Overview` crashed with `KeyError: 'rule'` during markdown rendering.
- Root Cause: The backend doc renderer assumed every business-rule record always had a `rule` field, but reviewed or normalized semantics can produce alternate shapes such as `statement`, `description`, or plain strings.
- Fix: Hardened backend rule rendering to accept multiple rule shapes and fall back safely when only alternate keys are present, then reran the Delphi sample to verify backend overview generation completes without warnings.
- Prevention Rule: Any renderer that consumes reviewed or normalized artifacts must tolerate schema variants introduced by review/annotation layers; never assume one literal key when the pipeline can already emit semantically equivalent shapes.
- Example: `Backend_Business_Overview.md` now generates successfully for the desktop sample even when business rules come from reviewed semantics instead of raw inventory rows.

## 2026-03-24 - Mainframe-grade business docs for app/desktop must rebuild from canonical artifacts, not reuse stale heuristics
- Symptom: Even after desktop traceability improved, `Project_Overview.md` and `Business_Flow_Sequence.md` could still read like a technical dump or surface stale noise tokens from older runs because the narrative layer reused previously written understanding artifacts and weak name-based heuristics.
- Root Cause: App docs were generated before canonical graph-backed artifacts became authoritative, and later reruns could keep stale `system_comprehension`-like state instead of rebuilding business understanding from the latest inventory, traceability, desktop query resolution, and narrative evidence posture.
- Fix: Added a shared app/desktop narrative builder that regenerates `system_comprehension.json` and `business_meaning_graph.json` from canonical artifacts on every doc generation, validates `business_narrative_evidence.json` with `confirmed/inferred/unknown`, refreshes docs again after graph build, and feeds the same understanding posture into automatic reverse review.
- Prevention Rule: For app/web/desktop narrative docs, always rebuild the understanding layer from the latest canonical artifacts before writing markdown. Never trust cached business-context artifacts across reruns, and never let control/designer noise tokens become business subjects.
- Example: The current app pipeline now emits `system_comprehension.json`, `business_meaning_graph.json`, and `business_narrative_evidence.json`, then uses them to regenerate `Project_Overview.md` and `Business_Flow_Sequence.md` after graph build instead of freezing whatever heuristic context existed before canonical traceability was available.

## 2026-03-25 - App UI docs must be action-first, not a raw widget dump
- Symptom: Flutter app screen docs such as `IdentificationPage_UI.md` were dominated by layout/support widgets (`Row`, `Container`, `Scaffold`, `BasePageWithSubHeader`), so the item-definition table filled with `N/A` and pushed real business controls out of view.
- Root Cause: `_UI.json` treated every recovered widget as an equal business item, while the narrative/review layers also consumed that same raw widget list. This mixed layout evidence, support wrappers, and true action/input controls into one undifferentiated artifact.
- Fix: Added layered UI semantics artifacts (`widget_catalog`, `action_catalog`, `field_semantics`), changed `_UI.md` to render business actions/fields first and supporting widget evidence separately, propagated Flutter custom-widget labels/callbacks/input constraints deterministically, and added aggregate artifacts (`screen_widget_catalog.json`, `screen_action_catalog.json`, `screen_field_semantics.json`) for downstream doc/review builders.
- Prevention Rule: UI evidence must be split into exhaustive debug evidence and business-facing action semantics. Main screen tables should be driven by actionable/input/navigation controls only; support/layout widgets belong in a secondary evidence section.
- Example: `followapplication` screen docs now surface `NavBtnWidget`, `TextButton`, and other business-facing controls in the main table while `Row`/`Container` move to `Supporting Widget Evidence`.

## 2026-03-25 - App system comprehension must map canonical screen ids back to user-facing entrypoint names
- Symptom: Even after app understanding artifacts were rebuilt, `Project_Overview.md` and `Business_Flow_Sequence.md` could still open with `N/A` or opaque ids like `screen_e60f2e968da0` instead of real entrypoint names.
- Root Cause: The app traceability layer often stores completed chains using canonical `screen_id` keys, but the understanding layer originally read only `entrypoint` names directly from traceability without remapping those ids back through `screens.json`.
- Fix: `app_narrative_builder.py` now resolves `screen_id -> screen_name/component_name` when building primary entrypoints, and it also consults `screen_action_catalog.json` so UI-driven app entrypoints survive even when the raw chain uses internal ids.
- Prevention Rule: Any business-facing narrative layer that reads canonical graph/traceability ids must remap them back to user-facing entrypoint names before emitting overview or flow prose.
- Example: After the fix, `followapplication` overview/flow intros use `DetailCardPage` instead of `screen_e60f2e968da0`.

## 2026-03-25 - App semantic aggregates must be rebuilt from the saved `_UI.json` schema, not assumed wrapper keys
- Symptom: After semantic Flutter screen extraction improved, downstream aggregate artifacts like `screen_action_catalog.json` could still collapse to empty lists during ad-hoc regeneration, which in turn made comprehension/docs silently fall back to weaker cached understanding.
- Root Cause: The saved per-screen `_UI.json` payload now exposes `widget_catalog`, `action_catalog`, and `field_semantics` directly, but regeneration code that assumed nested `screen_action_catalog`-style wrapper objects produced empty aggregate artifacts.
- Fix: Rebuilt aggregate app semantic artifacts by reading the persisted `_UI.json` schema directly and normalizing them into `screen_widget_catalog.json`, `screen_action_catalog.json`, and `screen_field_semantics.json` with explicit `screen_name/screen_id/primary_evidence_path` wrappers before rerunning overview/flow/review generation.
- Prevention Rule: When a canonical per-screen artifact schema changes, every downstream aggregate builder and rerun script must be updated to read that exact schema. Never assume aggregate wrapper keys exist just because the pipeline exposes similarly named top-level artifacts.
- Example: `followapplication` now regenerates aggregate semantic catalogs from each `*_UI.json`, restoring action counts like `DetailCardPage = 3` and `ManageCardsPage = 4` instead of leaving the whole project with an empty action catalog.

## 2026-03-25 - App business subjects must prefer strong compound/data-backed evidence over weak helper singles
- Symptom: Even after app docs became business-first, top subjects could still degrade into generic singles like `changed`, `record`, or framework/project residue such as `follow` and `cubit`, which made overviews look technical and untrustworthy.
- Root Cause: The meaning graph promoted any high-frequency token with enough sources, even if it was only a weak fragment of a stronger compound (`changed_card`) or a framework/helper token leaking from callbacks, repositories, and generated chain hops.
- Fix: Added weak-subject suppression and strong-source-aware promotion in `app_narrative_builder.py`, boosted chain-derived endpoint/module evidence, filtered helper tokens like `follow`, `cubit`, `bloc`, and made `primary_business_subjects` prefer stronger promoted tokens first.
- Prevention Rule: Business-subject promotion must rank compound/data-backed subjects above weak fragments and helper/framework names. If a stronger compound token exists, do not also promote its weak single-token fragments unless they have independent strong evidence.
- Example: `followapplication` now promotes `card`, `customer`, and `changed_card` ahead of weaker fragments like `changed` or project-residue tokens such as `follow`.

## 2026-03-25 - App flow narratives must join UI actions to downstream traceability chains when evidence exists
- Symptom: App `Business_Flow_Sequence.md` could stop at callback names like `ManageCardsCubit.sendCardChanges` even when the pipeline already had completed screen-to-endpoint-to-table chains, so the narrative still felt one layer short of mainframe-style business explanation.
- Root Cause: The flow builder consumed `screen_action_catalog.json` and `traceability_report.json` separately, but did not attempt to match action items back to completed chains by screen and target overlap.
- Fix: Added chain matching in `business_flow_sequence.py` so app flow steps now enrich action items with downstream endpoint/table/integration evidence when a matching chain exists, and suppress navigation-only noise rows that do not own a concrete target.
- Prevention Rule: When app action semantics and completed traceability chains coexist, flow generation must attempt a deterministic join before emitting a narrative step. Do not leave a step at callback-only wording if a matching downstream chain is already available.
- Example: `followapplication` flow steps for `Edit Staff Code Dialog` and `update Card` now mention downstream API/event and table evidence instead of stopping at the Cubit callback name alone.

## 2026-03-25 - Workbook-style UI previews must be exported from semantic artifacts, not reconstructed from markdown
- Symptom: Even after action-first `_UI.md` improved, app reverse still could not preview a basic-design-style screen spec because the only human-facing output was a custom markdown shape that did not map cleanly to `画面レイアウト / イベント仕様 / 入出力項目定義 / 画面バリデーションチェック`.
- Root Cause: The pipeline treated `_UI.md` as the terminal presentation layer. There was no canonical exporter that converted `action_catalog`, `field_semantics`, and supporting widget evidence into workbook-style sections with per-line evidence posture, so any future spec preview would have been forced to scrape markdown back into structure.
- Fix: Added a deterministic `ui_spec_preview` builder that reads saved per-screen `_UI.json`, normalizes item types and names into controlled workbook-style vocab, writes `*_UI_Spec.json` and `*_UI_Spec.md`, persists `screen_spec_export_diagnostics.json`, and feeds the same diagnostics into `reverse_review.json`. The app document list also sorts `_UI_Spec.md` next to its paired `_UI.md`.
- Prevention Rule: Any new human-facing screen spec format must be generated from canonical semantic artifacts, never by reverse-parsing existing markdown. Pair every new preview/export format with diagnostics that record unresolved mappings and evidence posture.
- Example: `followapplication` now emits `HomePage_UI_Spec.md` and `HomePage_UI_Spec.json` beside `HomePage_UI.md`, with workbook-style sections driven directly from `screen_action_catalog.json` and `screen_field_semantics.json`.

## 2026-04-06 - NodeNext NestJS workspaces need explicit Jest ESM wiring or tests will fail before executing
- Symptom: API unit tests in the new NestJS workspace failed before running any assertions, first on config loading and then on `Cannot use import statement outside a module` and missing `jest` globals.
- Root Cause: The API package uses `type: module` plus `moduleResolution: NodeNext`, but Jest does not automatically execute TypeScript ESM the same way `tsx` and `tsc` do. It also does not inject CommonJS-style `jest` globals in ESM test files.
- Fix: Switched the API test runner to `node --experimental-vm-modules`, moved Jest config to `jest.config.cjs`, added a `.js`-stripping `moduleNameMapper`, enabled `isolatedModules` in the API tsconfig, and imported `jest` from `@jest/globals` inside ESM spec files.
- Prevention Rule: When a workspace uses NodeNext ESM, set up Jest for ESM on day one and write spec files with ESM-safe imports and globals. Do not assume a default Jest setup will work with `.js`-suffixed TypeScript imports.
- Example: `apps/api` now runs `npm run test --workspace @papipo/api` successfully with ESM NestJS source files and spec imports like `./auth.service.js`.

## 2026-04-06 - Flutter parity with a visual prototype must preserve screen structure, not just colors and endpoints
- Symptom: The rebuilt Flutter app could functionally authenticate and onboard, but the UI still felt unrelated to the approved prototype because onboarding was collapsed into one long form and auth used a generic app layout.
- Root Cause: Implementation prioritized feature parity and shared theme tokens, but skipped a screen-by-screen fidelity pass against the prototype's actual interaction structure: centered hero header, floating clay card, inset inputs, progress dots, pill CTA placement, and step-based onboarding flow.
- Fix: Rebuilt Flutter auth and onboarding around the prototype structure instead of just reusing the old form screens, updated the clay theme primitives to better match the prototype shadows and surfaces, and verified the rebuilt screens on the Android emulator after passing `flutter analyze` and `flutter test`.
- Prevention Rule: When a task explicitly says Flutter UI should match the prototype, do not sign off after token-level theming or API wiring. Validate the real screen composition, flow segmentation, control placement, and visual rhythm against the prototype before calling the mobile UI acceptable.
- Example: `apps/mobile/lib/features/onboarding/onboarding_screen.dart` now uses a centered multi-step wizard card with progress dots and a floating peach CTA, instead of the previous single long onboarding form.

## 2026-04-06 - Mobile localization is not done until both static Flutter copy and backend-generated text agree
- Symptom: The app could show Japanese on the auth screen while the logged-in dashboard still surfaced English greetings, AI welcome copy, insights, habit names, and validation errors, which made testing feel random and unfinished.
- Root Cause: Locale fallback was wired first, but only part of the Flutter UI read from the localization layer, while dynamic copy still came from seeded/backend-generated English strings and a few validators stayed hardcoded in widgets.
- Fix: Expanded `PapipoStrings` across the main Flutter screens and auth validators, localized seeded/demo content plus backend-generated onboarding/check-in/nutrition/workout/AI fallback text, and smoke-checked the API payloads before reinstalling the mobile build on the emulator.
- Prevention Rule: For localized app work, never stop at `MaterialApp.locale`. Audit every user-facing layer: widget labels, validation messages, seeded demo data, deterministic backend copy, and AI fallbacks. A screen is not “translated” if any of those layers still leaks the source language.
- Example: `apps/mobile` now pulls visible labels from `PapipoStrings`, while `apps/api/src/wellness/wellness.service.ts` and `apps/api/src/ai/ai.service.ts` emit Japanese copy for the default demo flow instead of English fallback text.
