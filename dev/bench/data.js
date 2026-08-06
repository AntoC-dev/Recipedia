window.BENCHMARK_DATA = {
  "lastUpdate": 1786001057924,
  "repoUrl": "https://github.com/AntoC-dev/Recipedia",
  "entries": {
    "Screen FPS": [
      {
        "commit": {
          "author": {
            "name": "semantic-release-bot",
            "username": "semantic-release-bot",
            "email": "semantic-release-bot@martynus.net"
          },
          "committer": {
            "name": "semantic-release-bot",
            "username": "semantic-release-bot",
            "email": "semantic-release-bot@martynus.net"
          },
          "id": "46357cfc28fdf3ce712dde6242bdb0b467aac6f7",
          "message": "chore(release): 2.46.1 [skip ci]\n\n## [2.46.1](https://github.com/AntoC-dev/Recipedia/compare/v2.46.0...v2.46.1) (2026-07-23)\n\n### Bug Fixes\n\n* **#305:** satisfy strict types in shopping reset tests ([4fc79d4](https://github.com/AntoC-dev/Recipedia/commit/4fc79d46f596e97c6dbdcf3c40d2d6fac8035c4b)), closes [#305](https://github.com/AntoC-dev/Recipedia/issues/305)\n* reset purchased items after final cook ([ca3b589](https://github.com/AntoC-dev/Recipedia/commit/ca3b58964d89e4910f700ccbdcc892d6dc6b5fdc))\n* reset purchased items after final cook ([#390](https://github.com/AntoC-dev/Recipedia/issues/390)) ([9877632](https://github.com/AntoC-dev/Recipedia/commit/98776322f9208d25a6752f54d5bd9b4dd58b134e))",
          "timestamp": "2026-07-23T17:47:33Z",
          "url": "https://github.com/AntoC-dev/Recipedia/commit/46357cfc28fdf3ce712dde6242bdb0b467aac6f7"
        },
        "date": 1784835717807,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "00_seed",
            "value": 59.3,
            "unit": "fps"
          },
          {
            "name": "01_app_start",
            "value": 59.5,
            "unit": "fps"
          },
          {
            "name": "02_home",
            "value": 59.2,
            "unit": "fps"
          },
          {
            "name": "03_search",
            "value": 58.5,
            "unit": "fps"
          },
          {
            "name": "04_recipe_view",
            "value": 58.7,
            "unit": "fps"
          },
          {
            "name": "05_shopping",
            "value": 58.7,
            "unit": "fps"
          },
          {
            "name": "06_parameters",
            "value": 55.2,
            "unit": "fps"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "name": "AntoC",
            "username": "AntoC-dev",
            "email": "129602681+AntoC-dev@users.noreply.github.com"
          },
          "committer": {
            "name": "GitHub",
            "username": "web-flow",
            "email": "noreply@github.com"
          },
          "id": "7c73b43d6107bdc6507907c144427325061706a9",
          "message": "test(e2e): close E2E coverage gaps — smoke, seasonality, Menu (#493)\n\nResolves #323 — the identified E2E coverage gaps.\n\n## What\n- **Smoke suite** (`smoke.yaml`, both platforms): launch → all 5 tabs\n(incl. Menu) → view a recipe → search. Shallow, id-based,\ndataset-agnostic. Runs on a **production-dataset** release build, in\nparallel with the main matrix for fast fail-fast feedback.\n- **Production-maestro EAS profile**: extends `maestro` (installable APK\n/ iOS simulator, Release opts) but seeds the production dataset —\nvalidates the real seed data under release optimizations, the one gap\nthe test-dataset builds can't cover. `resolveIosBundleId` reuses the\nexisting dataset + animations env vars (no new flag) to keep the shared\n`com.recipedia` id so Maestro can launch it on iOS.\n- **Ingredient seasonality**: positive case — an all-year ingredient\nkeeps its recipe visible under the season filter (deterministic\ncomplement to the existing negative case). Adds a reusable\n`selectAllSeasons` flow; leaves shared `addNewIngredient` untouched.\n- **Menu tab**: fixes `# TODO Menu` — the shared bottom-tabs assert\n(en/fr) and app-init nav now cover all 5 tabs.\n- **Visual testing**: evaluated per the issue → **defer** (see\n`VISUAL_TESTING_EVALUATION.md`); baseline matrix + season/date\nnon-determinism make screenshot regression a flakiness sink.\n\n## Commits\n- `test(e2e): cover Menu tab in bottom-tabs navigation`\n- `build(eas): add production-maestro profile for prod-dataset E2E`\n- `test(e2e): add production smoke suite`\n- `test(e2e): cover seasonal recipe stays visible under filter`\n- `docs(e2e): evaluate Maestro visual testing`\n\n## Validation\n- Smoke flows ran green on Android emulator (pre-refactor); the\nreused/simplified pieces are CI-proven.\n- `app.config` gate unit-tested (TDD, 6/6). All YAML/JSON parse clean.\n- Not live-validated: production-maestro CI path (needs a prod-dataset\nbuild) and the dataset-agnostic search rewrite.\n\n🤖 Generated with [Claude Code](https://claude.com/claude-code)",
          "timestamp": "2026-07-29T17:54:51Z",
          "url": "https://github.com/AntoC-dev/Recipedia/commit/7c73b43d6107bdc6507907c144427325061706a9"
        },
        "date": 1785395369727,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "00_seed",
            "value": 59.3,
            "unit": "fps"
          },
          {
            "name": "01_app_start",
            "value": 59.5,
            "unit": "fps"
          },
          {
            "name": "02_home",
            "value": 59.2,
            "unit": "fps"
          },
          {
            "name": "03_search",
            "value": 58.5,
            "unit": "fps"
          },
          {
            "name": "04_recipe_view",
            "value": 58.6,
            "unit": "fps"
          },
          {
            "name": "05_shopping",
            "value": 58.7,
            "unit": "fps"
          },
          {
            "name": "06_parameters",
            "value": 54.9,
            "unit": "fps"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "name": "AntoC",
            "username": "AntoC-dev",
            "email": "129602681+AntoC-dev@users.noreply.github.com"
          },
          "committer": {
            "name": "GitHub",
            "username": "web-flow",
            "email": "noreply@github.com"
          },
          "id": "112abb4132f3ce9fc856bc7a805002054e676691",
          "message": "ci(dependabot): group Expo patches, drop dead reviewers config, ignore gradle/actions majors (#515)\n\n## Context\n\nFollow-up to the audit of the open Dependabot PRs. **No application\ndependency is changed** — `dependabot.yml` only.\n\n## Changes\n\n### 1. Expo runtime family → a single `expo-sdk` group, patch-only\n\nThe `Expo Configuration Check` (expo-doctor) is red on `main` because\nsome `expo*` packages lag behind the patch versions pinned by SDK 56.\n\n`expo` / `expo-*` / `@expo/*` are now grouped into **one weekly PR**\n(`update-types: patch`) instead of independent bumps. One lockfile\nresolution, so the family **can no longer land desynchronised** —\nprecisely the failure mode that broke the E2E suite. Minor/major stay\nmanual (SDK upgrade via `expo install`).\n\n### 2. `react` / `react-dom` → fully ignored\n\nThe config already blocked `react`/`react-dom` on minor/major but **let\npatches through**. Result: #508 bumped `react` `19.2.3 → 19.2.8`\n**without** co-bumping `react-dom` (left at `19.2.3`).\n\nThey are now **fully ignored** (all update types, patch included).\nUnlike the tilde-ranged `expo-*` packages, the SDK pins them to an\n**exact** version, so a lone Dependabot patch puts them ahead of the SDK\nversion map and fails expo-doctor. They move via `expo install` only. →\n**supersedes #508** (to close).\n\n### 3. `gradle/actions` → majors ignored (staying on v5)\n\nv6 moved \"enhanced\" caching into a **proprietary** component (free for\npublic repos, but no longer MIT) and dropped configuration-cache\nsupport. v5 covers the Android build. v5.x patch/minor bumps still flow\nthrough. → **supersedes #510** (to close).\n\n### 4. `reviewers` removed — it was dead config\n\nTwo compounding bugs, both verified against the last 6 Dependabot PRs\n(**zero reviewers requested on every one**):\n\n- GitHub **retired the `reviewers` option** on 2025-08-08 in favour of\nCODEOWNERS\n([changelog](https://github.blog/changelog/2025-08-08-dependabot-reviewers-configuration-option-is-replaced-by-code-owners/)).\n- The configured value, `AntoC`, resolves to GitHub account `antoc` (id\n4174576) — **an unrelated third party**, not the maintainer `AntoC-dev`.\n\n### 5. Labels — fixed on the repo side, not in the YAML\n\nThe declared labels (`automated`, `ci`, `github-actions`) were\n**silently dropped**: Dependabot only applies labels that **already\nexist**. #510 landed with no labels at all, #511–514 with only\n`released`.\n\nAll three labels have been **created in the repository**. The config\nitself was correct and is unchanged.\n\n## What was dropped\n\nEarlier revisions of this PR added a second npm entry (a Friday Expo\nlane) plus an auto-merge workflow. Both are removed:\n\n- **The second npm entry was invalid.** Dependabot requires a unique\n`package-ecosystem` + `directory` + `target-branch` triple; two npm\nentries on `/` make it **reject the whole file**, breaking *all*\nupdates, not just the new one. The `expo-sdk` group achieves the same\nresult inside the existing entry.\n- **Auto-merge is dropped** (decision: CI gets reviewed before merging).\nIt would have required status checks on the `main` ruleset anyway —\nthere are none today, so `--auto` would have merged on approval\n**without waiting for CI**.\n\n## Verification\n\n- `dependabot.yml`: valid YAML, 2 entries (npm Monday / github-actions\nMonday).\n- Labels `automated`, `ci`, `github-actions`, `dependencies`: present in\nthe repo.\n- After merge: the next Dependabot PR should carry its labels, and Expo\npatches should arrive as a single grouped PR.\n\n## Open question\n\nCODEOWNERS is the official replacement for `reviewers`, but the `main`\nruleset has `require_code_owner_review: true` — currently inert with no\nsuch file. Adding one would **activate** that rule: with a single\nmaintainer, you cannot approve your own PRs, so every PR would need an\nadmin bypass. Not added here.\n\n---\n_Generated by [Claude\nCode](https://claude.ai/code/session_0131d8MCxJzMriSL9naXkyWd)_",
          "timestamp": "2026-08-05T17:32:39Z",
          "url": "https://github.com/AntoC-dev/Recipedia/commit/112abb4132f3ce9fc856bc7a805002054e676691"
        },
        "date": 1786001056387,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "00_seed",
            "value": 59.3,
            "unit": "fps"
          },
          {
            "name": "01_app_start",
            "value": 59.6,
            "unit": "fps"
          },
          {
            "name": "02_home",
            "value": 59.3,
            "unit": "fps"
          },
          {
            "name": "03_search",
            "value": 59,
            "unit": "fps"
          },
          {
            "name": "04_recipe_view",
            "value": 59,
            "unit": "fps"
          },
          {
            "name": "05_shopping",
            "value": 58.9,
            "unit": "fps"
          },
          {
            "name": "06_parameters",
            "value": 54.6,
            "unit": "fps"
          }
        ]
      }
    ]
  }
}