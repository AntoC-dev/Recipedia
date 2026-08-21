# E2E Testing Guide for Recipedia

Maestro E2E tests for the Recipedia React Native app. Written for AI agents and
developers editing flows in `tests/e2e/`.

## Table of Contents

- [Running Tests](#running-tests)
- [Suites](#suites)
- [Architecture](#architecture)
- [Bundle ID (`appId`)](#bundle-id-appid)
- [TestID Conventions](#testid-conventions)
- [Adding Tests](#adding-tests)
- [Text Input Rules](#text-input-rules)
- [Keyboard Dismissal](#keyboard-dismissal)
- [Shared Platform-Split Flows](#shared-platform-split-flows)
- [Coordinate Anchoring](#coordinate-anchoring)
- [SearchBar Patterns](#searchbar-patterns)
- [Re-render Barriers](#re-render-barriers)
- [OCR Testing](#ocr-testing)
- [Language Support](#language-support)
- [Decimal Separators (Device Region)](#decimal-separators-device-region)
- [CI Retry Mechanism](#ci-retry-mechanism)
- [Emulator Settings (Android CI)](#emulator-settings-android-ci)
- [Production Smoke Build](#production-smoke-build)
- [Validating Flows with the Maestro MCP Server](#validating-flows-with-the-maestro-mcp-server)
- [Troubleshooting](#troubleshooting)

## Running Tests

```bash
npm run workflow:build-test:android   # build + run every suite

cd tests/e2e
maestro test . --config=settings.yaml # one suite
maestro test cases/settings/1_dark_mode.yaml       # one case, no retry
maestro test cases/settings/ci/1_dark_mode.yaml    # one case, with CI retry
```

## Suites

Each suite has a config at the root of `tests/e2e/` listing its cases and their
order. Configs point at `cases/{feature}/ci/*` so CI gets the retry wrappers;
the originals in the parent directory are what you run locally.

```yaml
# settings.yaml
flows:
  - cases/settings/ci/*

executionOrder:
  flowsOrder:
    - '1 - Dark Mode Toggle Flow'
    - '2 - Season Filter Toggle Flow'
```

| Suite                           | Covers                                                  |
| ------------------------------- | ------------------------------------------------------- |
| `smoke`                         | Core journeys on the **production dataset** — see below |
| `app-init`                      | Launch, onboarding, FAB menu                            |
| `search` / `search-filters`     | Search bar behaviour / filter page and chips            |
| `recipe-create` / `recipe-edit` | Manual creation / editing                               |
| `recipe-readonly`               | Read-only recipe screen                                 |
| `ingredient-dialog`             | Ingredient dialog interactions                          |
| `ocr`                           | OCR recipe creation (camera + gallery)                  |
| `menu` / `shopping`             | Menu and shopping list                                  |
| `settings`                      | Dark mode, language, season filter, default persons     |
| `tags-db` / `ingredients-db`    | Tag and ingredient database management                  |
| `duplicates-*`                  | Duplicate detection for recipes, tags, ingredients      |
| `web` / `web-edge-cases`        | Website import                                          |
| `bulk-import`                   | Bulk import pipeline                                    |
| `locale-fr`                     | Decimals follow the **device region**, not the language |
| `performance`                   | Flashlight measurement run                              |

Adding a suite: create `{suite}.yaml`, list `cases/{feature}/ci/*`, add the
suite to the matrices in `.github/workflows/build-test.yml`.

## Architecture

```
tests/e2e/
├── {suite}.yaml            # suite config
├── cases/{feature}/        # test cases (user journeys)
│   └── ci/                 # retry wrappers used by suite configs
├── flows/{feature}/        # reusable action sequences
├── asserts/{screen}/       # UI verifications, with en/ and fr/ variants
└── assets/                 # OCR images
```

Principles: cases orchestrate, flows act, asserts verify. Every case is
independent and starts from `flows/setupTest.yaml` (launch with clear state,
skip onboarding, warm up screens). Keep flows atomic, pass parameters via `env`,
give every command a `label` — labels are what you read in `maestro.log`.

Directory naming is lowercase (`flows/recipe/adding/...`); language-specific
assertions live in `en/` / `fr/` leaves.

## Bundle ID (`appId`)

Every flow declares `appId: 'com.recipedia'`, shared by iOS and Android on
purpose. iOS publishes as `com.recipedia.ios`, but that suffix is applied
**only** to the `production` EAS profile (`isStoreBuild` gate in
`app.config.ts`). Maestro launches by bundle id alone and flows have no
per-platform `appId`, so a test build carrying `.ios` would fail every iOS suite
with `Failed to get app binary directory for bundle com.recipedia`. Never change
`appId` in a flow file.

## TestID Conventions

Pattern: `{Screen|Component}::{Element}[::{Type|Modifier}]`

```yaml
id: 'SearchScreen::RecipeCards::1' # screen element, indexed
id: 'RecipeTitle::CustomTextInput' # component element with type
id: 'RecipeIngredients::0::QuantityInput::NumericTextInput'
id: 'RecipeValidate-text' # Paper button label child
```

Use the full hierarchy, include the index for list items, append the type when
several elements share a name.

**Paper `Button` labels live on a `-text` child.** The `testID` lands on a
wrapper whose accessibility text is the `accessibilityLabel` prop, not the
visible label. `tapOn` the wrapper id, `assertVisible` the `-text` child:

```yaml
# WRONG — wrapper carries accessibilityLabel, not "Annuler"
- assertVisible:
    { id: 'BulkImportDiscovery::fresh-0::RestoreButton', text: 'Annuler' }
# RIGHT
- assertVisible:
    { id: 'BulkImportDiscovery::fresh-0::RestoreButton-text', text: 'Annuler' }
```

A wrapper `id` + `text` works only when the button has no `accessibilityLabel`.

## Adding Tests

New case in an existing suite:

1. `cases/{feature}/{N}_{name}.yaml` — `name`, `appId`, `tags`, then
   `setupTest.yaml` → actions → assertions.
2. CI wrapper at `cases/{feature}/ci/{N}_{name}.yaml` (see
   [CI Retry Mechanism](#ci-retry-mechanism)).
3. Add the case `name` to the suite's `executionOrder.flowsOrder`.

Before editing a shared flow, find its callers:

```bash
grep -r "fileName.yaml" tests/e2e --include="*.yaml"
```

## Text Input Rules

Use `flows/inputAndCommitText.yaml` (env `TARGET_ID`, `VALUE`, `DISMISS_ID`)
rather than hand-rolling `inputText` + a dismiss:

```yaml
- tapOn: { id: 'RecipeTime::NumericTextInput', label: 'Focus the time input' }
- runFlow:
    file: '../../inputAndCommitText.yaml' # adjust relative depth per caller
    env:
      TARGET_ID: 'RecipeTime::NumericTextInput'
      VALUE: '30'
      DISMISS_ID: 'RecipeTime::PrefixText'
    label: 'Enter the time to prepare'
```

**Assert the typed value before the field is blurred.** `inputText` returns as
soon as Maestro dispatched the keystrokes and `waitForAnimationToEnd` only
compares two frames, so on a loaded CI machine the blur lands while the last
characters are still queued on the JS thread. The field commits a partial value
(`30` saved as `3`) and the flow fails minutes later somewhere unrelated (issue
#525). This is about the blur, not about Enter — a tap elsewhere and
`hideKeyboard` race the same way.

**Commit with a tap, not `pressKey: enter`.** Enter does not reliably trigger
the IME action on Android and inserts a newline in a multiline input. The
dismiss target must be **non-touchable**: the recipe screens use
`keyboardShouldPersistTaps='handled'`, so tapping a plain `Text` blurs the
field, while tapping a button runs that button's handler and keeps the keyboard
up. Usual targets: `RecipeTime::PrefixText`, `RecipePersons::PrefixText`,
`<NutritionRow>::Text`, `RecipeIngredients::<i>::Unit`.

**Pick the helper that matches the intent.** `inputText` inserts at the caret
rather than replacing, so the wrong helper either concatenates silently (`321`
typed into a persons field holding `4` commits `4321`) or asserts text it never
predicted.

| Helper                            | Field starts | Ends up holding | Asserts                    |
| --------------------------------- | ------------ | --------------- | -------------------------- |
| `flows/inputAndCommitText.yaml`   | empty        | `VALUE`         | field **is** `VALUE`       |
| `flows/replaceAndCommitText.yaml` | non-empty    | `VALUE`         | field **is** `VALUE`       |
| `flows/appendText.yaml`           | non-empty    | old + `VALUE`   | field **contains** `VALUE` |

All three take `TARGET_ID` and `VALUE`; the committing two also take
`DISMISS_ID`. `replaceAndCommitText.yaml` clears the field then delegates to
`inputAndCommitText.yaml`. `appendText.yaml` deliberately does not commit — it
is what a multiline paragraph needs between its lines.

**It is all caret mechanics.** `inputText` inserts at the caret, `eraseText`
only backspaces what is _before_ it, and no `pressKey` jumps to the end. A plain
`tapOn` hits the element **centre** — past the end of a short value, mid-string
in one that fills the box. So a persons field holding `4` then given `321` ends
up `4321`, and a quantity field holding `3291` then erased ends up `91`. The
lever is `tapOn`'s element-relative `point`: `"95%,50%"` puts the caret past the
end, `"2%,50%"` at the start (used by
`flows/parameters/tags/insertTextAtCursorBeginning.yaml`).
`replaceAndCommitText.yaml` taps at 95% before erasing, so one `eraseText` is
enough, then waits for the field to read empty. Never hand-roll `tapOn` +
`eraseText` on a field holding more than a character or two, and never add a
second erase to force a field clear — a field that comes back non-empty is being
re-rendered from state mid-erase; fix that instead.

Fields that start non-empty: persons (seeded from `defaultPersons`, `4` out of
the box), time and persons in OCR mode (`manuallyFill` seeds `0`), and
everything in an editing flow. Fields that start empty: the manual-add form,
freshly added ingredient rows, first-time nutrition values — do not pay
`replaceAndCommitText.yaml`'s ~4s of Android backspaces there.

Autocomplete fields (`TextInputWithDropDown`) follow the same rules: ingredient
names commit live via `onChangeText`, tags via `onEndEditing` → `onValidate`,
which fires on focus loss.

**Multiline inputs are the exception**: Enter is what inserts the newline. Type
each line with `flows/appendText.yaml` (asserts the line landed, does not blur),
insert the newline inline (`pressKey: ENTER` on Android, `tapOn: Return` on
iOS), and blur once at the end —
`flows/recipe/adding/manual/en/addAiguillettes.yaml` is the only such case.

## Keyboard Dismissal

Wrap every dismissal in `waitForAnimationToEnd` before and after, so Maestro
never taps while the keyboard animates.

**Modal dialogs** (ItemDialog, NoteEditDialog, UrlInputDialog): use
`flows/dismissModalKeyboard.yaml`, which holds the split — `hideKeyboard` on
Android, tap the iOS `Done` key (from `returnKeyType="done"`). Do not re-inline
the platform blocks; iOS `pressKey: enter` is flaky on CI simulators.

**Autocomplete, when the flow must pick from the dropdown**: committing the
field fires `onEndEditing` → `onValidate` with the typed text and closes the
dropdown before it can be tapped. `hideKeyboard` (Android only) is the one
dismiss that leaves the field focused, so it is also the only way to reach a
typed-but-unresolved ingredient row — which
`flows/recipe/adding/manual/en/tryAddOnlyImageTitleDescriptionTagPersonIngredient.yaml`
relies on for the "all ingredients known by Recipedia" assertion in
`cases/recipe-create/4_validation_all.yaml`. Everywhere else prefer
`inputAndCommitText.yaml`. iOS autocomplete dismissal is handled case by case.

**Tapping SearchBar without typing**: no keyboard appears on iOS, so guard the
`hideKeyboard` with `when: platform: Android`.

## Shared Platform-Split Flows

When both platforms reach the same goal a different way, the split lives in one
flow and callers use `runFlow`. Keep a block inline only when it is asymmetric
(one OS does something the other lacks).

| Flow                                                   | Env          | Android / iOS                                      |
| ------------------------------------------------------ | ------------ | -------------------------------------------------- |
| `flows/dismissModalKeyboard.yaml`                      | —            | `hideKeyboard` / tap `Done`                        |
| `flows/dismissKeyboardVia.yaml`                        | `KEY`        | `hideKeyboard` / tap `${KEY}` (`Search`, `Return`) |
| `flows/waitForCheckSettle.yaml`                        | `CHECK_TEXT` | no-op / wait 30s for the checked state to animate  |
| `flows/search/commitTypedSearch.yaml`                  | —            | tap `key_pos_ime_action` / tap `Search`            |
| `flows/recipe/adding/ocr/pickImageSource.yaml`         | —            | camera / gallery (simulator has no camera)         |
| `flows/recipe/adding/ocr/validateWithoutCropping.yaml` | —            | dispatches to the per-OS crop-validate flows       |

## Coordinate Anchoring

CI devices differ per platform (see `guides/ci-setup.md`), so a percentage of
the **screen** resolves to a different element on each target and breaks again
on the next device bump. Prefer, in order:

1. **Semantic** — no geometry at all: `scrollUntilVisible` on the target id.
2. **Element-anchored** — bounds come from the element, not the screen.
3. **Screen-percentage** — only when nothing on screen can be anchored to.

```yaml
# 2. Element-anchored
- swipe:
    from:
      id: 'Some::ScrollableContainer'
    direction: UP

- tapOn:
    id: 'Some::Input::CustomTextInput'
    point: '95%,50%' # percentage of the ELEMENT's box, device-independent
```

A `point` combined with an `id` is element-relative, so those sites survive a
device bump untouched. Every tier-3 site must be re-derived when the CI device
changes: content anchored below the status bar shifts by the top-inset delta,
content anchored to the bottom by the home-indicator inset. Before falling back
to tier 3, check with the Maestro MCP `inspect_screen` whether the surface
exposes an identifier — native screens often do. The remaining tier-3 sites are
the iOS Photos picker cells and `flows/performance/*` (Android-only, so
unaffected by iOS device bumps).

Two cost notes when picking a tier:

- `centerElement: true` retries centering up to 4 times, each a full swipe plus
  a hierarchy fetch. Use it when the element is genuinely clipped or occluded,
  not by default.
- A `repeat` loop whose `while` is `notVisible` burns the full lookup window on
  the iteration that finally succeeds. Worth paying for adaptivity, not worth
  adding by reflex.

### Swipes must not start on a multiline input

A swipe with no explicit anchor starts at screen centre. If that lands inside a
multiline `CustomTextInput` whose text overflows, iOS routes the pan to the
inner `UITextView` and the enclosing `ScrollView` never moves —
`scrollUntilVisible` then swipes to no effect, gives up, reports COMPLETED, and
taps the target wherever it still sits. `nestedScrollEnabled` does not help; it
is Android-only.

`CustomTextInput` sets `scrollEnabled={false}` when multiline so the field grows
instead of scrolling internally. Keep it that way, and anchor scrolls with
`from: { id: ... }` when a flow works near large text fields.

## SearchBar Patterns

While the search bar is focused (`searchBarClicked === true`) the recipe grid
(`SearchScreen::RecipeCards::*`) is **empty**, replaced by the suggestion
dropdown. The grid only renders once the dropdown closes via `onSubmitEditing`.
`pressKey: enter` does not reliably trigger Paper Searchbar's IME action on
Android, which was the root cause of intermittent `RecipeCards::*` timeouts
across the recipe-create, ingredients-db and search suites. Use one of two
deterministic patterns:

**Pattern A — act on one specific recipe** (the top suggestion _is_ that
recipe): tap `SearchScreen::Suggestions::Item::0`. Cross-platform, no split. It
**replaces the typed text with the suggestion's full title** (typing `Lentil`
gives the filter `Lentil Soup`).

**Pattern B — keep exactly the typed text** (grid must show every match, or the
suggestion list may be empty — e.g. verifying a title was _not_ added): run
`flows/search/commitTypedSearch.yaml`, which taps the keyboard action key so
`onSubmitEditing` fires, closing the dropdown and keeping the filter. Do not
substitute `hideKeyboard`: it dismisses the keyboard without closing the
dropdown (there is no `onBlur`, and the dropdown must stay scrollable).

When unsure prefer Pattern B — it never changes the search term.

**Clearing the search** is a third thing: tap
`SearchScreen::SearchBar-clear-icon`, Paper's built-in clear icon. It is always
present in the hierarchy but only actionable once the search has text, so tap it
only after typing — never assert it away when the field is empty. It clears the
text _and_ closes the dropdown, on both platforms, and replaces the old
`pressKey: "BACK"` / coordinate-tap hacks.

## Re-render Barriers

A tap that writes to the database and then re-groups a list finishes long after
the tap itself, especially on CI. Asserting the new layout immediately catches
the list mid-update — the row shows its new state (checkbox ticked) while still
sitting in its old section. Wait for the _structural_ change, never for the
tapped row's own styling.

```yaml
# Wrong: the assertion races the re-render
- tapOn: { id: 'ShoppingScreen::SectionList::Flour' }
- assertNotVisible:
    { id: 'ShoppingScreen::SectionList::ingredientTypes.baking::SubHeader' }

# Right: the barrier is the row leaving the working list
- tapOn: { id: 'ShoppingScreen::SectionList::Flour' }
- extendedWaitUntil:
    notVisible: { id: 'ShoppingScreen::SectionList::Flour' }
    timeout: 30000
    label: 'Wait for Flour to leave the working list'
```

Pick a barrier the state change actually reaches — the shopping flows show the
three shapes:

- `flows/shopping/markIngredientPurchased.yaml` — the row leaves the working
  list for the collapsed purchased block.
- `flows/shopping/markLastIngredientPurchased.yaml` — buying the last item
  clears the list, which opens the purchased block and keeps the row on screen,
  so the all-done state is the barrier instead.
- `flows/shopping/unmarkIngredientPurchased.yaml` — the row stays visible either
  way, so the returning category header is the barrier.

**Snackbars block taps.** The purchase undo snackbar is anchored over the bottom
of the list, so a tap aimed at a row it covers hits the snackbar instead. Flows
that chain taps wait it out with
`flows/shopping/waitForUndoSnackbarToClear.yaml` rather than dismissing it by
hand.

## OCR Testing

Android MediaStore sorts "Recent" by timestamp, and images added within ~500ms
of each other get unpredictable order. So media is added **on-demand** right
before selection, and the flow always picks index 0.

Per field: tap the field's OCR button → `android/addMedia.yaml` (env
`FIELD_NAME`) → `android/selectMostRecentFromModal.yaml`. The modal counter
tracks which image to pick from the app's own modal:

```yaml
- evalScript: ${output.modalImageCounter = 1} # after the first selection
- tapOn:
    id: 'Modal::List#${output.modalImageCounter}::SquareButton::Image'
- evalScript: ${output.modalImageCounter = output.modalImageCounter + 1}
```

Camera mode reuses the gallery flows for every field except the first: the
screen is already open, so `ocrImage.yaml` skips the gallery button, picks
`Modal::List#0` and initialises the counter.

**`addMedia` does not support variable substitution.** Select the path with a
conditional instead:

```yaml
- runFlow:
    when:
      true: ${RECIPE_NAME == "hellofresh" && FIELD_NAME == "image"}
    commands:
      - addMedia: ['../../../../../../assets/aiguillettesTeriyaki/image.jpg']
```

New OCR recipe: add `assets/{recipeName}/{field}.jpg`, extend `addMedia.yaml`
with its conditionals, add `asserts/recipe/ocr/{recipeName}.yaml`, wire it into
an OCR case.

## Language Support

Language-specific assertions live in `en/` / `fr/` leaves under
`asserts/{screen}/`. A language case switches locale, runs the
`{screen}IsTranslated.yaml` verification flows, then switches back:

```yaml
- runFlow: { file: '../../flows/parameters/language/switchToFrench.yaml' }
- runFlow: { file: '../../flows/parameters/language/homeIsTranslated.yaml' }
- runFlow: { file: '../../flows/parameters/language/switchToEnglish.yaml' }
```

Adding a language: create `asserts/{screen}/{lang}/`, a
`switchTo{Language}.yaml`, the `{screen}IsTranslated.yaml` flows, and extend the
language case.

## Decimal Separators (Device Region)

Numbers follow the **device region**, never the app language — see
`ARCHITECTURE.md` §9 and `src/utils/NumberFormat.ts`.

`text:` is a full-string **regex**, so a bare `.` is a wildcard: `'8.53 g'` also
matches `8,53 g`. Write the decimal point as a character class, in the injected
value and in literals alike, or the assertion checks the digits and nothing
else:

```yaml
FAT: '8[.]53'
text: '133[.]33 g'
```

Values typed rather than matched (`inputText`, `flows/inputAndCommitText.yaml`)
stay unescaped — brackets there would be typed literally.

### The locale-fr suite

Every other suite runs on its platform's default region, so they all expect
dots. `locale-fr` is the one suite proving the region actually drives the
format, and each platform takes the side it can reach:

| Platform | Device region | App language | Expects |
| -------- | ------------- | ------------ | ------- |
| Android  | France        | English      | commas  |
| iOS      | United States | French       | dots    |

Maestro has no locale command, so
`flows/device/android/setSystemLanguageToFrench.yaml` drives the Settings app.
It is Android-only — the iOS region picker restarts the device, killing the
Maestro session — and guarded on the Settings home title, so it no-ops when the
device is already French.

The region is not restored. CI wipes the emulator per suite; a local one stays
French.

> Resetting a local emulator needs more than `setprop persist.sys.locale`: the
> framework keeps its own `settings get system system_locales`, and when the two
> disagree the app renders the old region while the prop looks right. Change it
> through the Settings UI.

## CI Retry Mechanism

CI runs the wrappers in `cases/{feature}/ci/`, which repeat the original flow on
infrastructure flakiness (ANR dialogs, scroll variance, simulator load) without
hiding app bugs — the original is unchanged and is what runs locally.

```yaml
# cases/settings/ci/1_dark_mode.yaml
name: '1 - Dark Mode Toggle Flow'
appId: 'com.recipedia'
tags:
  - settings
---
- retry:
    maxRetries: 2
    file: '../1_dark_mode.yaml'
```

Copy the original's `name`, `appId`, `tags` and any `env:` defaults into the
wrapper.

## Emulator Settings (Android CI)

`.github/scripts/run-e2e-android.sh` applies these once the device is booted:

```bash
adb shell settings put global hide_error_dialogs 1   # no system crash/ANR dialogs
adb shell settings put global window_animation_scale 0
adb shell settings put global transition_animation_scale 0
adb shell settings put global animator_duration_scale 0
```

`hide_error_dialogs 1` stops the launcher ANR dialog
(`Pixel Launcher isn't responding`) from tripping visibility assertions.
`handleAnr.yaml` remains a guarded no-op safety net for **local** emulators,
which never get these settings; CI-only flows do not need it.

## Production Smoke Build

Most suites run on the test-dataset release build (`maestro` EAS profile). The
`smoke` suite runs on `production-maestro`, which extends `maestro` (installable
APK / iOS simulator, release config, same R8/Hermes/shrink as the store build)
and overrides `EXPO_PUBLIC_DATASET_TYPE=production`, so every CI run also proves
the app boots and its core flows work against real seed data under release
optimizations.

- It inherits `EXPO_PUBLIC_DISABLE_ANIMATIONS=true` via `extends`.
  `resolveIosBundleId` treats a production-dataset build with animations
  disabled as **not** a store build, so it keeps the shared `com.recipedia` id.
  No new flag: the gate reuses two existing profile env vars and the invariant
  that store builds keep animations on while automation builds turn them off.
- The literal store artifacts are not Maestro-runnable (Android AAB, iOS device
  IPA); `production-maestro` reproduces every release-only and prod-dataset
  crash surface, and only packaging/signing differ.
- CI: `build-{android,ios}-production-maestro` then
  `e2e-tests-{android,ios}-production-maestro` running `suites: '["smoke"]'`.
  Internal-only, skipped for dependabot.
- **Keep smoke dataset-agnostic**: target ids and indices
  (`RecipeCards::1::Cover`), never a typed recipe title — production seed data
  differs from the test dataset. That is why smoke has its own cases;
  `recipe-readonly` opens "Chicken Tacos" (absent from production) and
  `app-init`'s `assertHomeScreen` needs carousels that depend on the month and
  the dataset's variety. Smoke still reuses dataset-agnostic asserts
  (`assertSearchScreenUI`, `assertMenuEmpty`, `assertShoppingEmpty`,
  `assertAppearanceSection`).

## Validating Flows with the Maestro MCP Server

Maestro ships an MCP server (`maestro mcp`) that drives the running app. **Every
new or edited flow must be validated live before it is done** — reading source
and screenshots does not prove a selector resolves.

```bash
claude mcp add -s user maestro -- maestro mcp   # user scope, then reconnect with /mcp
```

Workflow: **`list_devices`** (pick the `device_id`, share the Viewer URL) →
**`inspect_screen`** (read the real hierarchy — never author a selector from a
screenshot, which invents text for icon-only nodes) → **`run`** (the flow, or
inline YAML chunks with `take_screenshot` between steps; `run` validates
syntax).

### CRITICAL: never reload or launch the app yourself

The local target is a **dev build**, where `launchApp` / relaunch / cold start
drops to the Expo dev-client launcher instead of the app, breaking the run and
losing state. Running a committed case or `ci/` wrapper counts as launching it —
they chain `flows/setupTest.yaml`, which calls `launchApp: clearState: true`.

When a step needs a fresh app or a reload, STOP and ASK the user, wait for
confirmation, then re-`inspect_screen`. Committed YAML keeps `launchApp` for CI,
where the release test build handles it correctly.

## Troubleshooting

| Symptom                               | Cause / fix                                                                                                     |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `Element not found`                   | TestID changed, element off-screen (`scrollUntilVisible`), too early (`extendedWaitUntil`), or wrong screen     |
| `Flow file does not exist`            | `runFlow.file` is relative to the **current file** — count the `../` levels                                     |
| `${VAR}` appears literally            | Missing `env:` on the caller, or a command that does not interpolate (`addMedia`)                               |
| OCR picked the wrong image            | `addMedia` must run right before selection; check `modalImageCounter` and the `RECIPE_NAME`/`FIELD_NAME` values |
| Platform block skipped                | `when: platform:` needs `Android` / `iOS`, capitalised                                                          |
| Assertion passes locally, fails on CI | A missing barrier — see [Text Input Rules](#text-input-rules) and [Re-render Barriers](#re-render-barriers)     |
| Intermittent, infrastructure-shaped   | Handled by the [CI retry wrappers](#ci-retry-mechanism); do not paper over it with sleeps                       |

Debugging: give every command a descriptive `label` (that is what the log
shows), run a single case in isolation, and use `maestro studio` to check
selectors. Maestro docs: https://maestro.mobile.dev/

## Best Practices

1. Run suites with `maestro test . --config={suite}.yaml` from `tests/e2e/`.
2. Label every command; keep flows atomic and parameterised via `env`.
3. Reuse shared asserts and platform-split flows instead of inlining.
4. Follow the TestID conventions; target `-text` children for Paper labels.
5. Wait for state, never sleep: assert the typed value before blurring, and wait
   for the structural change after a list-mutating tap.
6. Create a `ci/` wrapper and update the suite's `flowsOrder` for every new
   case.
7. Validate live over MCP before considering a flow done — without reloading the
   app yourself.

**Questions**: see `AGENTS.md` for project-wide conventions.
