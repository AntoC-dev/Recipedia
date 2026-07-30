window.BENCHMARK_DATA = {
  "lastUpdate": 1785395371305,
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
      }
    ]
  }
}