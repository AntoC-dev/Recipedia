Pod::Spec.new do |s|
  s.name           = 'RecipeScraper'
  s.version        = '1.0.0'
  s.summary        = 'Recipe scraper for iOS using Python recipe-scrapers'
  s.description    = 'Expo native module for scraping recipes from websites using Python recipe-scrapers library with Swift fallback'
  s.homepage       = 'https://github.com/example/recipedia'
  s.license        = 'MIT'
  s.author         = { 'Recipedia' => 'contact@recipedia.app' }
  s.platform       = :ios, '13.4'
  s.swift_version  = '5.0'
  s.source         = { git: '' }
  s.source_files   = '*.swift'

  # Exclude scripts and Python source from source_files
  s.exclude_files  = 'scripts/**/*', 'python/**/*'

  # Python runtime framework (added by setup script during prebuild)
  s.vendored_frameworks = 'Frameworks/Python.xcframework'

  # Bundle Python stdlib and packages as resources
  s.resource_bundles = {
    'RecipeScraperPython' => [
      'Frameworks/python-stdlib/**/*',
      'python_packages/**/*',
      'python/**/*'
    ]
  }

  # Preserve paths for Python resources
  s.preserve_paths = 'Frameworks/**/*', 'python_packages/**/*', 'python/**/*', 'scripts/**/*'

  s.dependency 'ExpoModulesCore'
  s.dependency 'SwiftSoup', '~> 2.6'
  # Note: PythonKit is added via the Expo config plugin in Podfile
  # because it's not available in CocoaPods trunk repo

  # Build settings for Python framework
  s.pod_target_xcconfig = {
    'SWIFT_INCLUDE_PATHS' => '$(inherited) "${PODS_TARGET_SRCROOT}/Frameworks"',
    'FRAMEWORK_SEARCH_PATHS' => '$(inherited) "${PODS_TARGET_SRCROOT}/Frameworks"',
    'LD_RUNPATH_SEARCH_PATHS' => '$(inherited) @executable_path/Frameworks @loader_path/Frameworks'
  }

  # Script phases for build
  s.script_phases = [
    # Run Python unit tests before compile
    # Tests are in the shared python/ directory at module root level
    # Uses a virtual environment to auto-install pytest (like Android build.gradle)
    {
      :name => 'Run Python Tests',
      :script => %q(
        PYTHON_DIR="${PODS_TARGET_SRCROOT}/../python"
        PYTHON_TESTS_DIR="${PYTHON_DIR}/tests"
        VENV_DIR="${PYTHON_DIR}/.venv"

        if [ -d "$PYTHON_TESTS_DIR" ]; then
          echo "Running Python tests from: $PYTHON_TESTS_DIR"

          # Find Python 3
          if command -v python3 &> /dev/null; then
            PYTHON=python3
          elif command -v python &> /dev/null; then
            PYTHON=python
          else
            echo "warning: Python not found, skipping tests"
            exit 0
          fi

          # Setup virtual environment if needed (same as Android setupPythonTestEnv)
          if [ ! -f "${VENV_DIR}/bin/pytest" ]; then
            echo "Setting up Python test environment..."
            cd "$PYTHON_DIR"
            $PYTHON -m venv .venv 2>/dev/null || {
              echo "warning: Failed to create venv, skipping tests"
              exit 0
            }
            source .venv/bin/activate
            pip install --quiet pytest "recipe-scrapers[online]>=15.0.0" || {
              echo "warning: Failed to install pytest, skipping tests"
              exit 0
            }
          fi

          # Run tests using the virtual environment
          cd "$PYTHON_DIR"
          source .venv/bin/activate
          python -m pytest tests/ -v --tb=short -x

          if [ $? -ne 0 ]; then
            echo "error: Python tests failed - build cannot proceed"
            exit 1
          fi

          echo "Python tests passed!"
        else
          echo "warning: Python tests directory not found at $PYTHON_TESTS_DIR"
        fi
      ),
      :execution_position => :before_compile,
      :shell_path => '/bin/bash'
    },
    # Setup Python runtime
    {
      :name => 'Setup Python Runtime',
      :script => '"${PODS_TARGET_SRCROOT}/scripts/setup-python.sh" || echo "Warning: Python setup script failed, Swift fallback will be used"',
      :execution_position => :before_compile,
      :shell_path => '/bin/bash'
    }
  ]
end
