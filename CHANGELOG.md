## [2.9.0](https://github.com/AntoC-dev/Recipedia/compare/v2.8.0...v2.9.0) (2025-12-22)

### Features

* **scraper:** add fallback image extraction from JSON-LD and tests ([1c360a1](https://github.com/AntoC-dev/Recipedia/commit/1c360a1d6e17daa2f1f96c5123ca6d399d9b952f))

### Bug Fixes

* **perf:** add 30s timeout to heavy batch selection test ([27dd757](https://github.com/AntoC-dev/Recipedia/commit/27dd757217c5abb728fb493ff134cafe3eb8f31c))
* quitoque no auth ([#167](https://github.com/AntoC-dev/Recipedia/issues/167)) ([d85ed8e](https://github.com/AntoC-dev/Recipedia/commit/d85ed8ebec7ebd3f88ae1823c2d82181dccf0508))

### Performance Improvements

* update reassure baseline [skip ci] ([3beb200](https://github.com/AntoC-dev/Recipedia/commit/3beb200ba6fcd25224c8c3103216690fdef860b5))

## [2.8.0](https://github.com/AntoC-dev/Recipedia/compare/v2.7.0...v2.8.0) (2025-12-22)

### Features

* **tutorial:** mark initial menu item as cooked during onboarding ([5bc7cf2](https://github.com/AntoC-dev/Recipedia/commit/5bc7cf24715c35904122a9ba8e19b3429fe7d9a0))

### Bug Fixes

* **menu:** adjust modal height or better layout alignment ([a0dfe0b](https://github.com/AntoC-dev/Recipedia/commit/a0dfe0b52544f012255c96656657bcada4463b67))

## [2.7.0](https://github.com/AntoC-dev/Recipedia/compare/v2.6.0...v2.7.0) (2025-12-21)

### Features

* menu screen ([#164](https://github.com/AntoC-dev/Recipedia/issues/164)) ([5fa6886](https://github.com/AntoC-dev/Recipedia/commit/5fa68862fb0264a636dd50db88ce3f40315a56e7))
* **menu:** add Menu screen with weekly recipe management ([7a48972](https://github.com/AntoC-dev/Recipedia/commit/7a489720b5ae9cba487de826b16645b326e259b2))

### Bug Fixes

* **recipe-database:** remove seen history when deleting a recipe ([b9b8dd8](https://github.com/AntoC-dev/Recipedia/commit/b9b8dd832ec4f403c7afe07379d61a9d8d939367))

## [2.6.0](https://github.com/AntoC-dev/Recipedia/compare/v2.5.1...v2.6.0) (2025-12-21)

### Features

* bulk quitoque ([#163](https://github.com/AntoC-dev/Recipedia/issues/163)) ([df58121](https://github.com/AntoC-dev/Recipedia/commit/df5812178a81d50dca7080205e74c85942320eb2))
* **providers:** add language-based filtering for recipe providers ([62202b1](https://github.com/AntoC-dev/Recipedia/commit/62202b1312dfae2e75804509d98ebbd86a92b6a5))
* **providers:** add QuitoqueProvider with dynamic pagination ([19146ec](https://github.com/AntoC-dev/Recipedia/commit/19146ec7079160ca38c2a16a8da955a20ead46c8))
* **providers:** enhance discovery with retry and improved scraping ([25431db](https://github.com/AntoC-dev/Recipedia/commit/25431dba3a2a895c5914d228b99fc3df524cae9d))
* **validation:** integrate fuzzy search and enhance provider registry ([913e801](https://github.com/AntoC-dev/Recipedia/commit/913e801c8344555f56d21d1b076786659d45b8e7))

### Bug Fixes

* **providers:** extract Quitoque pagination from HTML instead of probing ([d499554](https://github.com/AntoC-dev/Recipedia/commit/d4995543156bd9d28a1124df3d5d0c32b3e79271))

### Performance Improvements

* update reassure baseline [skip ci] ([f77fd02](https://github.com/AntoC-dev/Recipedia/commit/f77fd02edb7580fcf130543ef636fe34da25d231))

## [2.5.1](https://github.com/AntoC-dev/Recipedia/compare/v2.5.0...v2.5.1) (2025-12-21)

### Bug Fixes

* settings first launch ([#165](https://github.com/AntoC-dev/Recipedia/issues/165)) ([ac864ff](https://github.com/AntoC-dev/Recipedia/commit/ac864ffff56ee46717c6c764d1e47733334bec9c))
* **settings:** use system dark mode preference when no user choice exist ([de97119](https://github.com/AntoC-dev/Recipedia/commit/de97119f109027f65c0bfcfce83df847eb051224))

### Performance Improvements

* update reassure baseline [skip ci] ([0a8fd65](https://github.com/AntoC-dev/Recipedia/commit/0a8fd65e01ea873f4fe105950a5a5b37bbbca807))

## [2.5.0](https://github.com/AntoC-dev/Recipedia/compare/v2.4.0...v2.5.0) (2025-12-20)

### Features

* bulk optimizations ([#162](https://github.com/AntoC-dev/Recipedia/issues/162)) ([5500b21](https://github.com/AntoC-dev/Recipedia/commit/5500b21f0b614f0e66d393d5d01ce79cf7f24cc6))
* **database:** add batch methods for ingredient and tag similarity ([2196a70](https://github.com/AntoC-dev/Recipedia/commit/2196a708c49a86cf10e340ccd25d1cf6d5861a0e))
* **discovery:** add skeleton loading and allow continue during discovery ([556b36a](https://github.com/AntoC-dev/Recipedia/commit/556b36a1475936106819ccb915e213b87e1fc8c4))
* **discovery:** scan categories concurrently for faster discovery ([dd60762](https://github.com/AntoC-dev/Recipedia/commit/dd60762bebfef4f22c8f7c807e73b4633bd63009))
* **import:** enhance BulkImportDiscovery with recipe categorization ([afebd8d](https://github.com/AntoC-dev/Recipedia/commit/afebd8d40458a494cc15ea6dd1bec71f9799d3f7))
* **import:** introduce visibility-based lazy loading for recipe images ([28c1ed1](https://github.com/AntoC-dev/Recipedia/commit/28c1ed1b961bfae994320570d0982e467d8a05fb))
* **validation:** show granular initialization progress ([5d121f6](https://github.com/AntoC-dev/Recipedia/commit/5d121f65a3f8d4e8cebe71c0d070049e55fcae11))

### Performance Improvements

* update reassure baseline [skip ci] ([91b5bf7](https://github.com/AntoC-dev/Recipedia/commit/91b5bf75fe267f73b1f322d63024699d8190680a))

## [2.4.0](https://github.com/AntoC-dev/Recipedia/compare/v2.3.0...v2.4.0) (2025-12-19)

### Features

* already seen bulk ([#161](https://github.com/AntoC-dev/Recipedia/issues/161)) ([b767a84](https://github.com/AntoC-dev/Recipedia/commit/b767a84505cb476443836abd4f077a157b9cff90))
* **database:** add source tracking and import history support ([73f2f64](https://github.com/AntoC-dev/Recipedia/commit/73f2f649b5b70f1a0c6ca4151e7c5df489f2acb2))
* **import:** enhance bulk import workflows with tracking ([0890569](https://github.com/AntoC-dev/Recipedia/commit/08905691084574f073266242690dbac6562ade42))
* **import:** enhance BulkImportDiscovery with recipe categorization ([5b159f8](https://github.com/AntoC-dev/Recipedia/commit/5b159f87aba8d6c60869efc1520b97d3cae8366b))

### Performance Improvements

* update reassure baseline [skip ci] ([b2e4fc2](https://github.com/AntoC-dev/Recipedia/commit/b2e4fc274d810ee70168588644f68ad80a0bcc93))

## [2.3.0](https://github.com/AntoC-dev/Recipedia/compare/v2.2.2...v2.3.0) (2025-12-19)

### Features

* bulk import for hellofresh recipes ([#159](https://github.com/AntoC-dev/Recipedia/issues/159)) ([12158a9](https://github.com/AntoC-dev/Recipedia/commit/12158a9b9141c4a00fee459a067510ef06a13d9a))
* **bulk-import:** introduce components and workflow for bulk import ([cdb551b](https://github.com/AntoC-dev/Recipedia/commit/cdb551b7f17a94e87cb46b31f066b41638b5a806))
* **providers:** add HelloFresh provider and provider registry ([bf77941](https://github.com/AntoC-dev/Recipedia/commit/bf779412b4e905b4ed770e19b61362bb849cc0ac))
* **recipe-scraper:** centralize ignored patterns logic in hook ([bb5bdac](https://github.com/AntoC-dev/Recipedia/commit/bb5bdace97786b0eda8fde233a1ca6e22cae33b0))
* **recipe-scraper:** handle HTML decoding and improve error handling ([4a8b3e7](https://github.com/AntoC-dev/Recipedia/commit/4a8b3e73302e55790979ca36ef26e08814a2c895))
* **tests:** expand unit test coverage for components, workflows, hooks ([6e001d8](https://github.com/AntoC-dev/Recipedia/commit/6e001d83b9d9b71c5a2662f0c20c2c968a85d940))
* **ui:** add error placeholder and custom borderRadius to CustomImage ([75ed210](https://github.com/AntoC-dev/Recipedia/commit/75ed21015cb5a95f02c654b434f1b5b7a39abb52))
* **utils:** add logging for missing recipe image URI ([b2f0eed](https://github.com/AntoC-dev/Recipedia/commit/b2f0eedba76fbd0f96546fcd3be83748b0df2cd0))
* **utils:** improve filename sanitization and enhance image downloading ([06a6998](https://github.com/AntoC-dev/Recipedia/commit/06a69984b42845d1c8e0ad8c7bb8413058096f7b))

### Performance Improvements

* update reassure baseline [skip ci] ([2b3c59c](https://github.com/AntoC-dev/Recipedia/commit/2b3c59cd6bd30f40166068517777b3e11840bea0))

## [2.2.2](https://github.com/AntoC-dev/Recipedia/compare/v2.2.1...v2.2.2) (2025-12-16)

### Bug Fixes

* **utils:** use correct array for random tag selection in RecipeDatabase ([f122892](https://github.com/AntoC-dev/Recipedia/commit/f12289201e9cc9ce33811d5950baf35d8455597c))

## [2.2.1](https://github.com/AntoC-dev/Recipedia/compare/v2.2.0...v2.2.1) (2025-12-16)

### Performance Improvements

* add measures ([#154](https://github.com/AntoC-dev/Recipedia/issues/154)) ([921807a](https://github.com/AntoC-dev/Recipedia/commit/921807a585651800cd23123dedad2450aeda47e2))

## [2.2.0](https://github.com/AntoC-dev/Recipedia/compare/v2.1.0...v2.2.0) (2025-12-12)

### Features

* **auth-dialog:** add password visibility toggle and reset logic ([15704af](https://github.com/AntoC-dev/Recipedia/commit/15704afe6f7e7b2788a5b1ea6f1b57acc7441207))
* **build-test:** add Maestro CLI caching and version management ([d9c117b](https://github.com/AntoC-dev/Recipedia/commit/d9c117b7557da39c6611910e4c304ffad9bb73a9))
* quitoque parsing ([#151](https://github.com/AntoC-dev/Recipedia/issues/151)) ([6fc2df9](https://github.com/AntoC-dev/Recipedia/commit/6fc2df90a382d8945ef2da3cf30768370ddb1d03))
* **recipe-scraper:** add auth dialogs + enhance scraping logic ([6a21178](https://github.com/AntoC-dev/Recipedia/commit/6a21178d36cef5fc9acd36fe257386b93f3edad9))
* **recipe-scraper:** add authentication support and improve data extraction ([88db593](https://github.com/AntoC-dev/Recipedia/commit/88db593d49f22ae5194d050bafb608c4364ac019))
* **recipe-scraper:** add kitchen staple extraction and parsing logic ([291e97e](https://github.com/AntoC-dev/Recipedia/commit/291e97e2c971aed43f7f67a25d84b7621636f451))
* **recipe-scraper:** add structured instruction extraction with titles ([be9dabf](https://github.com/AntoC-dev/Recipedia/commit/be9dabf4ec0e326ef23ba95fc77ced180f464fcf))
* **recipe-scraper:** extend ingredient extraction to include staples ([14937bf](https://github.com/AntoC-dev/Recipedia/commit/14937bf8b2cab75366ef99d217e2420d3906340a))
* **recipe-scraper:** integrate parsed instructions ([1f51301](https://github.com/AntoC-dev/Recipedia/commit/1f513016a7dce43a16b8b9c842f7a0cc654cfa6d))
* **url-validation:** improve validation with hostname check ([7dad8da](https://github.com/AntoC-dev/Recipedia/commit/7dad8da0e68bf80e81e08974f19dc18111f1e59c))

## [2.1.0](https://github.com/AntoC-dev/Recipedia/compare/v2.0.0...v2.1.0) (2025-12-11)

### Features

* marmiton url  ([#150](https://github.com/AntoC-dev/Recipedia/issues/150)) ([ac6b053](https://github.com/AntoC-dev/Recipedia/commit/ac6b05395eed35cd6e2e4ee467e7032f935e887a))
* **recipe-scraper:** improve error handling with localized messages ([bd5749b](https://github.com/AntoC-dev/Recipedia/commit/bd5749b3badaf1dc15df6fe753f4bf50aa609675))
* **recipe-scraper:** improve tag conversion and validation ([788b66c](https://github.com/AntoC-dev/Recipedia/commit/788b66c2913808208b92dbc17c5d271ff23d7c0e))

## [2.0.0](https://github.com/AntoC-dev/Recipedia/compare/v1.5.0...v2.0.0) (2025-12-11)

### ⚠ BREAKING CHANGES

* Add recipe-scraper native module with Python dependencies.
Builds now require Python 3.13+ for Android (Chaquopy) and download
BeeWare Python 3.12 framework for iOS.

- Add recipe-scraper plugin to app.config.ts
- Add Python __pycache__ to .gitignore
- Update CI to install pytest for Python tests during Android build

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>

### Features

* add detailed UI logging and update validation flow comments ([422811e](https://github.com/AntoC-dev/Recipedia/commit/422811ecedce9069d5f8bccb28884b89ddf046d4))
* adding recipe from a website url  ([#149](https://github.com/AntoC-dev/Recipedia/issues/149)) ([7349757](https://github.com/AntoC-dev/Recipedia/commit/73497573b70885fe384105a07adc4e04e8baa0bb))
* **recipe-scraper:** add Android native module with Chaquopy Python ([e0edd64](https://github.com/AntoC-dev/Recipedia/commit/e0edd6420c688768e84c4ae7758c5f6d9237c4d0))
* **recipe-scraper:** add Expo config plugin for native build setup ([6ac901c](https://github.com/AntoC-dev/Recipedia/commit/6ac901c251efb075d2b0c3e7d22a65e3f74fa209))
* **recipe-scraper:** add iOS native module with BeeWare Python runtime ([85b25b8](https://github.com/AntoC-dev/Recipedia/commit/85b25b8aba0d6cc330fef663cea80d328adcf24e))
* **recipe-scraper:** add shared Python scraper using recipe-scrapers ([7c1c10f](https://github.com/AntoC-dev/Recipedia/commit/7c1c10fc40fa633c886ad2156650bbec4d9ec2dc))
* **recipe-scraper:** add TypeScript/Web implementation with Pyodide ([27a822f](https://github.com/AntoC-dev/Recipedia/commit/27a822f07b107d8a79dab147aa9b464d2a121bd0))
* **Recipe:** add hooks for scraper validation, cleanup, and integration ([1e58823](https://github.com/AntoC-dev/Recipedia/commit/1e5882335235c4299bd5bb00303798ac7312e572))
* **Recipe:** enable recipe creation from website URLs ([f2732ca](https://github.com/AntoC-dev/Recipedia/commit/f2732ca3083f65955b402f4f47352ac2f51e249f))
* **utils:** add function to download images to app cache ([cc8d15e](https://github.com/AntoC-dev/Recipedia/commit/cc8d15ea0b8ce5d4d2aa365965ef81f2d8d36412))
* **utils:** extend ingredient filtering with exact match patterns ([0dcba13](https://github.com/AntoC-dev/Recipedia/commit/0dcba13022ce8bf237a0e3f86e7aa2cf09be4b70))
* **utils:** extract converter for reusable conversion logic ([eff325e](https://github.com/AntoC-dev/Recipedia/commit/eff325e7a458ae06b7669b38edd98a7d728546cf))

### Bug Fixes

* **recipe-scraper:** use system Python path for Chaquopy builds ([c8ec4e2](https://github.com/AntoC-dev/Recipedia/commit/c8ec4e2d1b48a5660dd4fe6b2603d123c177033d))

### Miscellaneous Chores

* configure recipe-scraper module in app and CI ([0e3b3db](https://github.com/AntoC-dev/Recipedia/commit/0e3b3db7d0818fe221701fefd219395fec5718e7))

## [1.5.0](https://github.com/Anto-dev-perso/Recipedia/compare/v1.4.0...v1.5.0) (2025-12-07)

### Features

* add OCR and ingredient management hooks for recipe
  forms ([5b637cc](https://github.com/Anto-dev-perso/Recipedia/commit/5b637ccb49421f00add6050ad38c716fb2e5a158))
* **display:** add `formatQuantityForDisplay` for
  UI ([0e06d8f](https://github.com/Anto-dev-perso/Recipedia/commit/0e06d8f1824a91bcab48459dd36783e37f0b48a3))

### Bug Fixes

* **test:** resolve hanging tests and fix 43 failing unit
  tests ([9ed650a](https://github.com/Anto-dev-perso/Recipedia/commit/9ed650ac9c2f7ba0e726d074c0e0ee81d845e7ff))

## [1.4.0](https://github.com/AntoC-dev/Recipedia/compare/v1.3.3...v1.4.0) (2025-12-06)

### Features

* app bar in
  parameters ([#144](https://github.com/AntoC-dev/Recipedia/issues/144)) ([7f1207a](https://github.com/AntoC-dev/Recipedia/commit/7f1207ad5eb143df7b297d3a7f771285267fb72b))

### Bug Fixes

* **test:** adjust reporters for unit test coverage
  command ([5128469](https://github.com/AntoC-dev/Recipedia/commit/512846910b0ebac83837fbdfe3b5987e8844895c))

## [1.3.3](https://github.com/AntoC-dev/Recipedia/compare/v1.3.2...v1.3.3) (2025-12-05)

### Bug Fixes

* avoid state update on initial mount to fix CI E2E
  tests ([#141](https://github.com/AntoC-dev/Recipedia/issues/141)) ([bb1ef0d](https://github.com/AntoC-dev/Recipedia/commit/bb1ef0d4ef274230399a608e5b011c5dadc501f8))
* **ci:** use Node.js 22 LTS in release
  workflow ([0ca7b79](https://github.com/AntoC-dev/Recipedia/commit/0ca7b79332091e72d8d94d95909d8c716053381b))
* replace `useFocusEffect` with `useIsFocused` for focus
  handling ([386eaa0](https://github.com/AntoC-dev/Recipedia/commit/386eaa0d6f74228fa28cb29461b19788c6bebb72))

## [1.3.2](https://github.com/AntoC-dev/Recipedia/compare/v1.3.1...v1.3.2) (2025-12-04)

### Bug Fixes

* resolve ESLint warnings and TypeScript errors for React
  Compiler ([153e906](https://github.com/AntoC-dev/Recipedia/commit/153e906bf5101c6aa753293bd9049279ac40c048))

## [1.3.1](https://github.com/AntoC-dev/Recipedia/compare/v1.3.0...v1.3.1) (2025-12-03)

### Bug Fixes

* **BottomTabs:** update lazy loading logic for tutorial
  mode ([4c4c552](https://github.com/AntoC-dev/Recipedia/commit/4c4c552af9b3cafdaa091ab0ed2fdbe60eca0be6))
* **RecipeDatabaseContext:** correct update
  order ([68ec279](https://github.com/AntoC-dev/Recipedia/commit/68ec279dae4fe90482d1f4b0591ffd88055548ca))
* **RecipeIngredients:** resolve scroll blocking in ingredients
  table ([ef4539a](https://github.com/AntoC-dev/Recipedia/commit/ef4539acd1803a9f041c73548020f77266a0e368))
* **VerticalBottomButtons:** update FAB visibility with
  `useFocusEffect` ([e95d005](https://github.com/AntoC-dev/Recipedia/commit/e95d0054329ac2f1ba366f358e428dff289fe56c))

## [1.3.0](https://github.com/AntoC-dev/Recipedia/compare/v1.2.1...v1.3.0) (2025-12-01)

### Features

* add error handling and improved validation for
  tags/ingredients ([adf15e2](https://github.com/AntoC-dev/Recipedia/commit/adf15e2e879225d5f98c55ef668bf72f7e368ca0))
* **ItemDialog:** check for
  similarity ([39a6122](https://github.com/AntoC-dev/Recipedia/commit/39a6122d3b5f22dbf488b6b63aee4c3b9eac8421))
* prevents ocr duplicates and add proper dialog to add tags or
  ingredients ([#128](https://github.com/AntoC-dev/Recipedia/issues/128)) ([b166837](https://github.com/AntoC-dev/Recipedia/commit/b166837c22c33366c1def6aabf21e85bc1c59111))
* **Recipe:** handle duplicates on
  OCR ([8cac93d](https://github.com/AntoC-dev/Recipedia/commit/8cac93d755e685455471804eeb8129be7335a019))

### Bug Fixes

* don't set pending action in
  useEffect ([84c329c](https://github.com/AntoC-dev/Recipedia/commit/84c329c31364600025bbb33b7198301f6cc118b0))
* **OCR:** prevent ingredient loss during ValidationQueue
  processing ([e56ba5e](https://github.com/AntoC-dev/Recipedia/commit/e56ba5e35372ee4399f251342b8a777462f20620))
* **Recipe:** remove callback hook for
  now ([9588e5e](https://github.com/AntoC-dev/Recipedia/commit/9588e5e5b6b200f6a8890a3ea76f7f441fe7048f))
* support FormIngredientElement type after
  rebase ([e184c8b](https://github.com/AntoC-dev/Recipedia/commit/e184c8b35587246ab0e464d6ba7014a6f3d2f70e))

### Performance Improvements

* add useCallback for
  rendering ([9a06a42](https://github.com/AntoC-dev/Recipedia/commit/9a06a42c713b2921735c7f364b715ddbb77d5ddd))

## [1.2.1](https://github.com/AntoC-dev/Recipedia/compare/v1.2.0...v1.2.1) (2025-11-28)

### Bug Fixes

* **RecipePreparation:** on end doesn't works so goback to on
  change ([052a492](https://github.com/AntoC-dev/Recipedia/commit/052a4929486a58f6def168840ad67c5ee2aabce4))

## [1.2.0](https://github.com/AntoC-dev/Recipedia/compare/v1.1.0...v1.2.0) (2025-11-24)

### Features

* allow the
  edge-to-edge ([c955d34](https://github.com/AntoC-dev/Recipedia/commit/c955d3405ba345536f35e1225f8cc9c33d2dc7ea))
* edge to
  edge ([#129](https://github.com/AntoC-dev/Recipedia/issues/129)) ([372d21a](https://github.com/AntoC-dev/Recipedia/commit/372d21a5090fc1beca38fddb7359785546b3b245))

## [1.1.0](https://github.com/AntoC-dev/Recipedia/compare/v1.0.0...v1.1.0) (2025-11-18)

### Features

* **Database:** do insert in 1
  query ([beee764](https://github.com/AntoC-dev/Recipedia/commit/beee764ca88e233230a79938faaab2ef69e93f26))
* **database:** enhance dataset loading with scalable
  recipes ([a95db62](https://github.com/AntoC-dev/Recipedia/commit/a95db62a92516f053046aed9d317da9099bb6ce8))
* running async
  database ([#125](https://github.com/AntoC-dev/Recipedia/issues/125)) ([7e5fb30](https://github.com/AntoC-dev/Recipedia/commit/7e5fb3073b01ca8cbceb5bc51fd1745cbdbf4846))
* **ui:** add reusable `LoadingOverlay`
  component ([7b90e78](https://github.com/AntoC-dev/Recipedia/commit/7b90e783ccfc90cb0c23a3bb95f991c2f3698523))
* **ui:** use `LoadingOverlay` in Welcome and PersonsSettings
  screens ([c882fdc](https://github.com/AntoC-dev/Recipedia/commit/c882fdc0f961ea53543fcc72d378f72e4ccd22d2))

### Bug Fixes

* initialization on first
  launch ([3cabe97](https://github.com/AntoC-dev/Recipedia/commit/3cabe97060e9671d6896f3a1f921d57610d6a702))

## [1.0.0](https://github.com/AntoC-dev/Recipedia/compare/v0.22.1...v1.0.0) (2025-11-16)

### ⚠ BREAKING CHANGES

* **RecipeDataset:** recipes production dataset ready to go
* **Dataset:** tags production dataset ready to go
* **Dataset:** English's ingredients production dataset ready to go
* **Dataset:** French's ingredients production dataset ready to go

### Features

* **Assets:** add French localization images for store
  screens ([0903419](https://github.com/AntoC-dev/Recipedia/commit/0903419041d6e2ab02b788957e9dfac0db0ed99c))
* **Dataset:** fil the French ingredients
  database ([5fcf086](https://github.com/AntoC-dev/Recipedia/commit/5fcf086956fe6f723098f7aaa09c95bed37eca57))
* **Dataset:** fill the English ingredients
  database ([5a55240](https://github.com/AntoC-dev/Recipedia/commit/5a55240764a52ea9491e676bd77f783c274ea075))
* **Dataset:** populate English and French tags
  databases ([ecb19d4](https://github.com/AntoC-dev/Recipedia/commit/ecb19d4d3b3d2995db9da5a63a4239765f702a42))
* **env:** add a fallback with the `NODE_ENV`
  variable ([4f778d6](https://github.com/AntoC-dev/Recipedia/commit/4f778d623cfa5cc5df91835d65a122aadbc3a76a))
* **env:** update dataset type to use
  `EXPO_PUBLIC_DATASET_TYPE` ([1f6e320](https://github.com/AntoC-dev/Recipedia/commit/1f6e3200428d41f8fcef38768e786d274fe2b0f5))
* **FileGestion:** add handling for test and production dataset
  images ([3b56d38](https://github.com/AntoC-dev/Recipedia/commit/3b56d380a2ac4fb18e7534433643cecfb22d44e9))
* production datasets up and
  ready ([#117](https://github.com/AntoC-dev/Recipedia/issues/117)) ([989ed69](https://github.com/AntoC-dev/Recipedia/commit/989ed6993a639de13853d332b63574ac9442ae47))
* **RecipeDataset:** add production recipes
  images ([fe8f132](https://github.com/AntoC-dev/Recipedia/commit/fe8f132a626c75cbe55c1bae2d6555719082f65a))
* **RecipeDataset:** populate English and French recipe
  databases ([9e1ad2c](https://github.com/AntoC-dev/Recipedia/commit/9e1ad2cc8166f3d11754e167022be58b84b52b58))

### Bug Fixes

* **translations:** update French ingredient type key for
  consistency ([d5b9856](https://github.com/AntoC-dev/Recipedia/commit/d5b98564d7bd103477bd870e890cdd1a5068e7da))

## [0.22.1](https://github.com/AntoC-dev/Recipedia/compare/v0.22.0...v0.22.1) (2025-11-15)

### Bug Fixes

* **context:** handle errors in
  `getSeasonFilter` ([e864e27](https://github.com/AntoC-dev/Recipedia/commit/e864e27046d91abe6459b943e8cef58a1387eee3))
* **Recipe:** add explicit Fuse.js typing for search
  results ([488e3a3](https://github.com/AntoC-dev/Recipedia/commit/488e3a35572e8654264544cddd972dc35502ee74))
* **utils:** improve locale retrieval for language
  settings ([e3f9544](https://github.com/AntoC-dev/Recipedia/commit/e3f95442a3625ac756bcf1a701f07f77e92ad7b6))

## [0.22.0](https://github.com/AntoC-dev/Recipedia/compare/v0.21.0...v0.22.0) (2025-11-14)

### Features

* **Recipe:** replace RecipeTextRender with dedicated
  component ([4416b35](https://github.com/AntoC-dev/Recipedia/commit/4416b35937aefff735106485ba01ee1e29094ce6))
* **TextInput:** add dense and mode in text
  inputs ([d3ef302](https://github.com/AntoC-dev/Recipedia/commit/d3ef3026f8c3b5dff19764937abf7bd291a8596b))

### Bug Fixes

* **CustomTextInput:** remove tap-to-edit
  behavior ([b18271d](https://github.com/AntoC-dev/Recipedia/commit/b18271d17944830fb0a69d19fde09bd26b8ac810))
* **Recipe:** minor
  fixes ([13387b2](https://github.com/AntoC-dev/Recipedia/commit/13387b20099c07d161b451cd9dee77fb63e37fa9))

## [0.21.0](https://github.com/AntoC-dev/Recipedia/compare/v0.20.1...v0.21.0) (2025-11-11)

### Features

* **Recipe:** optimize saving logic and add recipe
  comparison ([64e2e45](https://github.com/AntoC-dev/Recipedia/commit/64e2e457b28f71883da05a0be1bd26ff6b4c29e8))

### Bug Fixes

* edit persons
  only ([#113](https://github.com/AntoC-dev/Recipedia/issues/113)) ([ad83e07](https://github.com/AntoC-dev/Recipedia/commit/ad83e07b684d9aba09d1d1fb1a0816717abbd02d))
* **workflow:** reorder suite artifact deletion step for proper
  timing ([87ed075](https://github.com/AntoC-dev/Recipedia/commit/87ed0751cfb38a4589dff8fabca5bf7d4b05d8e6))

## [0.20.1](https://github.com/AntoC-dev/Recipedia/compare/v0.20.0...v0.20.1) (2025-11-09)

### Bug Fixes

* **Recipe:** await `fillOneField` to ensure modal state is
  cleared ([f1826e6](https://github.com/AntoC-dev/Recipedia/commit/f1826e6ead38fd35d3b201d967d476973f6e9055))
* **RecipeCard:** add recipe title in testId of the
  card ([18dfcff](https://github.com/AntoC-dev/Recipedia/commit/18dfcff9770fd8c4d62a251b13df5424bc1423a1))

## [0.20.0](https://github.com/AntoC-dev/Recipedia/compare/v0.19.1...v0.20.0) (2025-11-08)

### Features

* **RecipeDatabase:** transform dataset image filenames to full
  URIs ([95c2550](https://github.com/AntoC-dev/Recipedia/commit/95c2550aee6ec1d73f5ad0f35878c6dc3e780be2))

### Bug Fixes

* dataset image store in
  database ([#116](https://github.com/AntoC-dev/Recipedia/issues/116)) ([8a377cf](https://github.com/AntoC-dev/Recipedia/commit/8a377cf29c0e6887db02313184c621000d7eaa25))

## [0.19.1](https://github.com/AntoC-dev/Recipedia/compare/v0.19.0...v0.19.1) (2025-11-04)

### Bug Fixes

* **Filters:** remove redundant translation calls for filter
  values ([5909692](https://github.com/AntoC-dev/Recipedia/commit/59096921d23967fdbf6581cc36f99d863ed01dff))

## [0.19.0](https://github.com/AntoC-dev/Recipedia/compare/v0.18.3...v0.19.0) (2025-11-03)

### Features

* **Recipe:** add missing preparation time validation and
  translations ([7b3395d](https://github.com/AntoC-dev/Recipedia/commit/7b3395df4cb7d886b96d60ce99808f32dab9742a))
* **Recipe:** time is now
  mandatory ([#111](https://github.com/AntoC-dev/Recipedia/issues/111)) ([8fac897](https://github.com/AntoC-dev/Recipedia/commit/8fac89762c4b3f6f4eb19ba1c3a0f989851f8dd9))

## [0.18.3](https://github.com/AntoC-dev/Recipedia/compare/v0.18.2...v0.18.3) (2025-11-03)

### Bug Fixes

* recipe image disappeared
  sometimes ([#108](https://github.com/AntoC-dev/Recipedia/issues/108)) ([78c7dbe](https://github.com/AntoC-dev/Recipedia/commit/78c7dbeed0e4d1ba8dbe13df0cd00235b145a9fd))
* **RecipeDatabase:** correct img source mapping with filename
  extraction ([1aeff32](https://github.com/AntoC-dev/Recipedia/commit/1aeff329a81bc58cbfbbff372dcd8d5391598035))

## [0.18.2](https://github.com/AntoC-dev/Recipedia/compare/v0.18.1...v0.18.2) (2025-11-01)

### Bug Fixes

* **Recipe:** improve duplicate ingredient detection and
  handling ([f85ac28](https://github.com/AntoC-dev/Recipedia/commit/f85ac282c95811553c6d31a06153f851fe4bbd45))

## [0.18.1](https://github.com/AntoC-dev/Recipedia/compare/v0.18.0...v0.18.1) (2025-11-01)

### Bug Fixes

* **ingredients:** fix various bugs around ingredient
  adding ([e60b6e4](https://github.com/AntoC-dev/Recipedia/commit/e60b6e4d43bb96b3e74809e988db57b38d52fa9f))

## [0.18.0](https://github.com/AntoC-dev/Recipedia/compare/v0.17.1...v0.18.0) (2025-10-28)

### Features

* **ui:** display item quantity and unit in shopping list
  titles ([d037cab](https://github.com/AntoC-dev/Recipedia/commit/d037cab0dd09c2e9e54b4a82e969c5fd520b5e2e))

### Bug Fixes

* **database:** update shopping list when recipes are edited or
  deleted ([dcc40e1](https://github.com/AntoC-dev/Recipedia/commit/dcc40e1dd51acafe7536fc9300490ea0a1186f74))

## [0.17.1](https://github.com/AntoC-dev/Recipedia/compare/v0.17.0...v0.17.1) (2025-10-28)

### Bug Fixes

* **database:** refresh recipes cache after tag/ingredient
  updates ([f1ef5a3](https://github.com/AntoC-dev/Recipedia/commit/f1ef5a34c67e94a1e97e98e6d5a6955b7fe329ae))

## [0.17.0](https://github.com/AntoC-dev/Recipedia/compare/v0.16.0...v0.17.0) (2025-10-27)

### Features

* **context:** introduce `RecipeDatabaseContext` for centralized
  recipe ([4dd6201](https://github.com/AntoC-dev/Recipedia/commit/4dd6201b99eaaa6862785e591458be5aefe8a32b))

## [0.16.0](https://github.com/AntoC-dev/Recipedia/compare/v0.15.0...v0.16.0) (2025-10-26)

### Features

* **context:** add `DefaultPersonsContext` for
  management ([8aacaa4](https://github.com/AntoC-dev/Recipedia/commit/8aacaa4d7d4ce72a6f98d9161a4e6c8f4b12022c))

## [0.15.0](https://github.com/AntoC-dev/Recipedia/compare/v0.14.4...v0.15.0) (2025-10-26)

### Features

* **components:** add `NumericTextInput` for type-safe numeric input
  handling ([69b4b7e](https://github.com/AntoC-dev/Recipedia/commit/69b4b7ef3a958053f78ba228833811af9dd7e743))

## [0.14.4](https://github.com/AntoC-dev/Recipedia/compare/v0.14.3...v0.14.4) (2025-10-23)

### Bug Fixes

* **recipe:** ensure dialog properties use spread to avoid
  mutations ([c94a226](https://github.com/AntoC-dev/Recipedia/commit/c94a2266462dec16bd7968830938dff53561e5fe))
* **recipe:** improve dialog content formatting for similar
  recipes ([6f5f93d](https://github.com/AntoC-dev/Recipedia/commit/6f5f93dd8e732ab5eafb3bc31b4aef021c1b54aa))

## [0.14.3](https://github.com/AntoC-dev/Recipedia/compare/v0.14.2...v0.14.3) (2025-10-22)

### Bug Fixes

* **app:** prevent duplicate data loading on first
  launch ([45ec34d](https://github.com/AntoC-dev/Recipedia/commit/45ec34d560f2f7f9805ed8e5606ec26b36055e8b))

## [0.14.2](https://github.com/AntoC-dev/Recipedia/compare/v0.14.1...v0.14.2) (2025-10-19)

### Bug Fixes

* **ingredients:** add the right
  ingredient ([e71ad66](https://github.com/AntoC-dev/Recipedia/commit/e71ad66ac35c0ddee2cc80f88c4b1c7af647d793))

## [0.14.1](https://github.com/AntoC-dev/Recipedia/compare/v0.14.0...v0.14.1) (2025-10-19)

### Bug Fixes

* **NutritionRow:** adjust decimal precision for non-integer values to 2
  places ([db0d7e9](https://github.com/AntoC-dev/Recipedia/commit/db0d7e9be6cafd1fa4c12b909c3ec4af097ec8c4))
* **NutritionRow:** ensure float precision conversion is consistent for display
  values ([9cf4b73](https://github.com/AntoC-dev/Recipedia/commit/9cf4b73070423b0ec35e5977b983086a4658e80c))
* **RecipeNutrition:** set default portionWeight to zero and extend validation dialog
  props ([a89c56c](https://github.com/AntoC-dev/Recipedia/commit/a89c56ca5e7dbda7cd475b399ac95c3d58df944d))

## [0.14.0](https://github.com/AntoC-dev/Recipedia/compare/v0.13.0...v0.14.0) (2025-10-16)

### Features

* **Search:** add back button handling and scroll view
  ref ([a25fbd3](https://github.com/AntoC-dev/Recipedia/commit/a25fbd31a91de39963ea91c27ca8b08d8833abf3))

### Bug Fixes

* **Recipe:** fix ingredient and preparation step editing
  logic ([aa38e80](https://github.com/AntoC-dev/Recipedia/commit/aa38e807ef20e62ec1bb14a0d311c69c0ae946c2))

## [0.13.0](https://github.com/AntoC-dev/Recipedia/compare/v0.12.0...v0.13.0) (2025-09-28)

### Features

* **translations:** add empty state messages for recommendations in English and
  French ([c903eb9](https://github.com/AntoC-dev/Recipedia/commit/c903eb9191a8805a611d90f5767387ae42455f1f))
* **translations:** add home screen recommendations for English and
  French ([ad06c66](https://github.com/AntoC-dev/Recipedia/commit/ad06c66b5ecf3f85052e70f86b0119fa9f38d7a3))
* **utils:** add new recipe filtering and recommendation
  features ([d586c92](https://github.com/AntoC-dev/Recipedia/commit/d586c9277012d5b634061241f690043964bfd0c7))

### Bug Fixes

* **utils:** handle edge case in shuffle function when numberOfElementsWanted is
  0 ([2a2b4b9](https://github.com/AntoC-dev/Recipedia/commit/2a2b4b944a0b3491d6fd3937657248f33b5ba3a1))

## [0.12.0](https://github.com/AntoC-dev/Recipedia/compare/v0.11.0...v0.12.0) (2025-09-27)

### Features

* **App:** add first launch logic, and integrates WelcomeScreen and
  tutorial ([da84894](https://github.com/AntoC-dev/Recipedia/commit/da84894d6d75831e98b3e66f366c0ceec4bbbcfc))
* **datasets:** add placeholders for English and French
  datasets ([85c9858](https://github.com/AntoC-dev/Recipedia/commit/85c9858fa00057cc7939af5dc03e12fb62999452))
* **Home:** integrate tutorial steps with demo toggle
  logic ([5f6c3c1](https://github.com/AntoC-dev/Recipedia/commit/5f6c3c157863c7fa4acff76898fb0d40d34f6339))
* **Search:** integrate tutorial step with demo toggle
  logic ([ffbec94](https://github.com/AntoC-dev/Recipedia/commit/ffbec9484d843ada3e0f015bb01c74aa9cdd564b))
* **Settings:** define recipe management as the highlight of
  tour ([7908e68](https://github.com/AntoC-dev/Recipedia/commit/7908e68d3b94ea3bdb1444db7819b79d4d0beee7))
* **Shopping:** integrate tutorial steps with demo
  logic ([cba3c0c](https://github.com/AntoC-dev/Recipedia/commit/cba3c0cc4106bf19dbcc2f631eb07a059a574e01))
* **Tutorial:** add `TutorialProvider` component and integrate tutorial
  logger ([66bf0a7](https://github.com/AntoC-dev/Recipedia/commit/66bf0a748cdd531f1d84742271ce351740688dce))
* **Tutorial:** add `TutorialTooltip`
  component ([1a74754](https://github.com/AntoC-dev/Recipedia/commit/1a7475477fe004d551be6606321d7b8c06bce56b))
* **Welcome:** add WelcomeScreen and first launch to async
  storage ([7def573](https://github.com/AntoC-dev/Recipedia/commit/7def57355629cceccb135e46facdc023b2d2306a))

## [0.11.0](https://github.com/AntoC-dev/Recipedia/compare/v0.10.0...v0.11.0) (2025-09-20)

### Features

* **App:** update splash screen and icons, add notification
  settings ([248488d](https://github.com/AntoC-dev/Recipedia/commit/248488d632f8f2436f0741045c5d242c53e4400b))
* **App:** update splash screen and icons, add notification
  settings ([#66](https://github.com/AntoC-dev/Recipedia/issues/66)) ([98b6cb0](https://github.com/AntoC-dev/Recipedia/commit/98b6cb033c9f2fe08972ae5026a566014448699f))

## [0.10.0](https://github.com/AntoC-dev/Recipedia/compare/v0.9.0...v0.10.0) (2025-09-16)

### Features

* **Recipe:** enhance validation with nutrition and image
  checks ([ff1140e](https://github.com/AntoC-dev/Recipedia/commit/ff1140ec24b895d2c92515ccc9bbc746cf3572e5))

## [0.9.0](https://github.com/AntoC-dev/Recipedia/compare/v0.8.0...v0.9.0) (2025-09-16)

### Features

* **Database:** add nutrition in
  database ([c8cd9fb](https://github.com/AntoC-dev/Recipedia/commit/c8cd9fb69ee53974e68335c412f1a0aa1d6fdaed))
* **OCR:** implement OCR handling for nutrition
  data ([92c094f](https://github.com/AntoC-dev/Recipedia/commit/92c094faa569ce292848591b93ec9f22500c8a44))
* **Recipe:** add OCR UI for
  nutrition ([e61b79d](https://github.com/AntoC-dev/Recipedia/commit/e61b79ddceb91f216c95f65c6bbec4ede5d8be3d))
* **Recipe:** add rendering of nutrition
  datas ([50bd4e8](https://github.com/AntoC-dev/Recipedia/commit/50bd4e8169ab277005bb60fe6ced3c306c2a14a3))

## [0.8.0](https://github.com/AntoC-dev/Recipedia/compare/v0.7.0...v0.8.0) (2025-09-08)

### Features

* **Shopping:** add dialog before
  clearing ([c7bac3b](https://github.com/AntoC-dev/Recipedia/commit/c7bac3b712cdea457a553546bba984ac3cad8483))
* **Shopping:** hide clear button when empty
  list ([636485b](https://github.com/AntoC-dev/Recipedia/commit/636485bb7671cf7167ec990370a8bd46271163e4))

## [0.7.0](https://github.com/AntoC-dev/Recipedia/compare/v0.6.0...v0.7.0) (2025-08-16)

### Features

* **Log:** add logging system in
  project ([0b09b66](https://github.com/AntoC-dev/Recipedia/commit/0b09b667d19e5a93492f45f5a5d5d732967b9a65))

## [0.6.0](https://github.com/AntoC-dev/Recipedia/compare/v0.5.0...v0.6.0) (2025-08-16)

### Features

* **Recipe:** add dialogs related to user typing an ingredient name
  unknownw ([00c0a9c](https://github.com/AntoC-dev/Recipedia/commit/00c0a9c8d3496abd1ea9fc30a21d9453e0a5de6a))

## [0.5.0](https://github.com/AntoC-dev/Recipedia/compare/v0.4.0...v0.5.0) (2025-08-15)

### Features

* **Recipe:** add a dialog in case user try to use a tag that doesn't exist while adding a
  recipe ([f10e06b](https://github.com/AntoC-dev/Recipedia/commit/f10e06b3dfcc343ab068b2fa1065ea057e57eb66))

## [0.4.0](https://github.com/AntoC-dev/Recipedia/compare/v0.3.0...v0.4.0) (2025-08-15)

### Features

* **recipe:** validate ingredient names and
  quantities ([6c57e15](https://github.com/AntoC-dev/Recipedia/commit/6c57e158873a7636ed1cc2583fc76769861f9624))

## [0.3.0](https://github.com/AntoC-dev/Recipedia/compare/v0.2.0...v0.3.0) (2025-08-15)

### Features

* **recipe:** implement scaling of ingredient quantities for new default persons
  count ([77c6282](https://github.com/AntoC-dev/Recipedia/commit/77c62829dd609df65bfad2240481b62315d7a932))

## [0.2.0](https://github.com/AntoC-dev/Recipedia/compare/v0.1.0...v0.2.0) (2025-08-14)

### Features

* **recipe:** create dataset images and use
  them ([64156e2](https://github.com/AntoC-dev/Recipedia/commit/64156e260e97ab734a73ca5573bb9a86bf8b1964))

## [0.1.0](https://github.com/AntoC-dev/Recipedia/compare/v0.0.1...v0.1.0) (2025-08-12)

### Features

* add a dropdown menu when entering
  ingredients ([3cd1b09](https://github.com/AntoC-dev/Recipedia/commit/3cd1b0981f4687580cd2168485a5db3214107ec1))
* add a dropdown menu when entering
  ingredients ([a694444](https://github.com/AntoC-dev/Recipedia/commit/a6944440ab02e8ad1694f3cfe4bc7fe30c628f07))
* add a file
  gestion ([2b3a6bd](https://github.com/AntoC-dev/Recipedia/commit/2b3a6bde4b1ae1e0eb3cb7a95b2f189603fd99b8))
* add recipe with
  images ([aaf965d](https://github.com/AntoC-dev/Recipedia/commit/aaf965da7b8a76f78515bfd22f2ee2e7afcb1b88))
* add season on ingredients + its filter + fix bugs + icons
  selections ([57ab74e](https://github.com/AntoC-dev/Recipedia/commit/57ab74e34417eb3f7dd4b331291404c1a78a997b))
* Create project with React
  Native ([5ef1bfe](https://github.com/AntoC-dev/Recipedia/commit/5ef1bfef3a046ff7c566fdf75d8c239d9031ba47))
* **i18n:** implement i18n with multi-language support and UI
  updates ([223069b](https://github.com/AntoC-dev/Recipedia/commit/223069b06ba168bb5ea453f4182d3002f805f599))
* implement recipe view and interface it with home
  page ([4e196ec](https://github.com/AntoC-dev/Recipedia/commit/4e196ec9cea3f6edbc5a2800bde11a37edfbe6e4))
* implement shopping
  screen ([d66c289](https://github.com/AntoC-dev/Recipedia/commit/d66c2897c748708f9890fdffc8b45e97aba7eee5))
* implement the deletion of the
  recipe ([9d74281](https://github.com/AntoC-dev/Recipedia/commit/9d7428151157d6442a3cde8ae4a785a3babd2c62))
* implements database edition in TagsSettings and
  IngredientsSettings ([4f42323](https://github.com/AntoC-dev/Recipedia/commit/4f42323fef19f499f0759394f405b29d0801ab8a))
* lot of
  features ([e6b11a2](https://github.com/AntoC-dev/Recipedia/commit/e6b11a27af88a9f3fe124939d35b6e6c3ff469ec))
* lot of new features/refactor and clea
  up ([48e5f65](https://github.com/AntoC-dev/Recipedia/commit/48e5f65b616d74e2f8f4afce814c93a6825fe147))
* move to expo ([260a77a](https://github.com/AntoC-dev/Recipedia/commit/260a77ab6512d78057bf5017e050c8de56695e1c))
* **parameters:** implements parameters
  screen ([5438466](https://github.com/AntoC-dev/Recipedia/commit/5438466888c650671b5dfbd35395fa93f941bfe7))
* **parameters:** use expo-constant for UI
  display ([062f5f7](https://github.com/AntoC-dev/Recipedia/commit/062f5f783ed19c7f3eabf45fef80c04b2b2e4c9c))
* plug new Recipe to Home
  button ([3862f2f](https://github.com/AntoC-dev/Recipedia/commit/3862f2f7dfac2cd062f4672ae199b36ce7a5d7b8))
* **recipe:** Check when user validates a new recipe that it is not already existing in the
  database ([305395b](https://github.com/AntoC-dev/Recipedia/commit/305395b068b0097b01e2355c877e7abb1fbb118e))
* **recipe:** create dataset images and use
  them ([2b39e1c](https://github.com/AntoC-dev/Recipedia/commit/2b39e1ca48d0be7463924970f91356567db7693f))
* **search:** use the parameter for default on season
  filter ([a31db3e](https://github.com/AntoC-dev/Recipedia/commit/a31db3e3f8d94ff5fd9505dd688de5caa553362b))
* settings now delete elements in the
  database ([18f3e4a](https://github.com/AntoC-dev/Recipedia/commit/18f3e4a36bc2993957fa3985229abcfc1efa17ea))
* use new dropdown component on tag
  also ([bcf083b](https://github.com/AntoC-dev/Recipedia/commit/bcf083bfc759f9b5630c961e54ee9d2bb8523e87))
* use react-native-image-crop-picker to crop nicely
  images ([1724e7a](https://github.com/AntoC-dev/Recipedia/commit/1724e7a922e84c40f96fe6929a62ffb550e85ab1))
* use react-native-mlkit for native OCR and implements unit
  tests ([35a4708](https://github.com/AntoC-dev/Recipedia/commit/35a4708f279fdbf37eef161d8fa389d7a223d0f5))

### Bug Fixes

* initialize database at start of the
  app ([d0f6c6b](https://github.com/AntoC-dev/Recipedia/commit/d0f6c6bd67cf767121921fa9c2c9116d2a56b8b8))
* use font directly instead of loading
  it ([494d7f9](https://github.com/AntoC-dev/Recipedia/commit/494d7f9db09bec4c3f9dce1d3740a6a3567f6a0e))
