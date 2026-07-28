# Maestro Visual Testing — Evaluation

Evaluation of Maestro's visual/screenshot regression testing for Recipedia,
answering issue #323 item 3. **Decision: defer.**

## Environment

- **Maestro:** `2.6.0` (pinned in `.github/workflows/e2e-maestro.yml`).
- **CI model:** E2E runs on **local emulators/simulators inside GitHub Actions**
  — Android on `ubuntu-latest`, iOS on `macos-15`. Not Maestro Cloud.
- **Current screenshot usage:** none (`takeScreenshot` / `assertScreenshot` /
  `assertWithAI` absent from `tests/e2e/`).

## What Maestro 2.6.0 offers

### 1. `assertScreenshot` — pixel-diff (local, free)

- `assertScreenshot: file.png`, or object form with `path`, `cropOn: { id }`,
  `thresholdPercentage` (default 95.0), `label`.
- Compares against a reference PNG **committed alongside the flow**. Fails if
  similarity < threshold or the reference is missing.
- Baseline is created manually (`takeScreenshot`, commit the PNG); updating a
  baseline = re-capture and re-commit. **No managed baseline store — the repo is
  the store.**
- Runs fully locally; fits the existing pipeline mechanically.

### 2. `assertWithAI` / `assertNoDefectsWithAI` — LLM visual checks (Cloud-gated)

- Natural-language assertion / automatic defect scan (cut-off, overlapping,
  mis-centered UI).
- **Requires Maestro Cloud auth** — screenshots are uploaded to Maestro-managed
  LLM providers. Bring-your-own-key vars are deprecated.
- Explicitly experimental; `optional` defaults to `true`, so results are
  non-deterministic by design and weak as a hard gate.

## Repo-specific risks

Recipedia is a near-worst-case fit for strict pixel baselines:

- **Two platforms × two themes:** Android + iOS, light + dark
  (`cases/settings/1_dark_mode.yaml`) → ≥4 baseline sets per screen. Font
  rendering differs across OS/renderer, so one threshold rarely holds for both.
- **i18n en/fr** (`cases/settings/6_language_switch.yaml`): every localized
  screen needs per-locale baselines; text length shifts layout → doubles the
  matrix again.
- **Non-deterministic content (the real blocker):**
  - **Season filter** (`cases/settings/2_season_filter_toggle.yaml`) is
    date/season-dependent — the same screen renders differently by run date.
    Seasonality reads the real system clock (`FilterFunctions.tsx`
    `isRecipeInCurrentSeason`), so there is no test-clock override.
  - **Menu / dynamic dates** and recipe-list ordering drift over time with no
    code change.
- **Baseline maintenance cost:** matrix ≈ screens × 2 platforms × 2 themes × 2
  locales. Every intentional UI tweak forces a bulk re-capture + re-commit of
  PNG blobs in git. High churn, high noise.

## Recommendation: defer

Do **not** adopt broad screenshot regression now, and do **not** adopt the AI
commands in this pipeline.

- **Reject `assertWithAI` / `assertNoDefectsWithAI`:** require Cloud coupling,
  experimental/non-deterministic, upload screenshots to a third party, cannot
  serve as a hard gate.
- **Reject broad `assertScreenshot` baselining:** the platform × theme × locale
  matrix plus season/date non-determinism makes full-screen baselines a
  flakiness and maintenance sink.
- **Optional narrow pilot:** `assertScreenshot` with `cropOn` on a **static,
  deterministic, locale-invariant** region only (e.g. an icon/logo, an
  empty-state illustration, a single control) — never a full screen containing
  dates, season-filtered lists, or translated copy. Platform-scoped, generous
  threshold. This is the only variant that fits the current local-emulator CI.

Revisit only if a concrete stable-UI regression need arises, scoped via
`cropOn`.
