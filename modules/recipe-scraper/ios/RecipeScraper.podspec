Pod::Spec.new do |s|
  s.name           = 'RecipeScraper'
  s.version        = '1.0.0'
  s.summary        = 'Recipe scraper module for iOS'
  s.description    = 'Expo native module providing recipe scraping. Python execution is handled via Pyodide WebView on the TypeScript side.'
  s.homepage       = 'https://github.com/example/recipedia'
  s.license        = 'MIT'
  s.author         = { 'Recipedia' => 'contact@recipedia.app' }
  s.platform       = :ios, '18.0'
  s.swift_version  = '5.0'
  s.source         = { git: '' }

  # Only the minimal Swift module file
  s.source_files = 'RecipeScraperModule.swift'

  s.dependency 'ExpoModulesCore'

  install_modules_dependencies(s)
end
