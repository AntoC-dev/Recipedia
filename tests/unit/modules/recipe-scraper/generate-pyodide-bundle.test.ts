import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const BUNDLE_PATH = join(
  __dirname,
  '..',
  '..',
  '..',
  '..',
  'modules',
  'recipe-scraper',
  'assets',
  'pyodide-bundle.html'
);

const bundleExists = existsSync(BUNDLE_PATH);

const describeIfBundle = bundleExists ? describe : describe.skip;

describeIfBundle('Pyodide bundle (pyodide-bundle.html)', () => {
  let bundleContent: string;

  beforeAll(() => {
    bundleContent = readFileSync(BUNDLE_PATH, 'utf-8');
  });

  describe('jstyleson initialization', () => {
    it('contains the jstyleson shim module creation', () => {
      expect(bundleContent).toContain("jstyleson = ModuleType('jstyleson')");
      expect(bundleContent).toContain("sys.modules['jstyleson'] = jstyleson");
    });

    it('registers jstyleson as a mock package for micropip', () => {
      expect(bundleContent).toContain("micropip.add_mock_package('jstyleson', '0.0.2')");
    });

    it('creates the shim before registering the mock package', () => {
      const shimIndex = bundleContent.indexOf("sys.modules['jstyleson'] = jstyleson");
      const mockPackageIndex = bundleContent.indexOf("micropip.add_mock_package('jstyleson'");
      expect(shimIndex).toBeGreaterThan(-1);
      expect(mockPackageIndex).toBeGreaterThan(-1);
      expect(shimIndex).toBeLessThan(mockPackageIndex);
    });

    it('registers the mock package before installing wheels', () => {
      const mockPackageIndex = bundleContent.indexOf("micropip.add_mock_package('jstyleson'");
      const installIndex = bundleContent.indexOf('micropip.install(');
      expect(mockPackageIndex).toBeGreaterThan(-1);
      expect(installIndex).toBeGreaterThan(-1);
      expect(mockPackageIndex).toBeLessThan(installIndex);
    });
  });

  describe('bundle integrity', () => {
    it('contains embedded WASM data', () => {
      expect(bundleContent).toContain('wasmBase64:');
    });

    it('contains embedded stdlib data', () => {
      expect(bundleContent).toContain('stdlibBase64:');
    });

    it('contains embedded lock file data', () => {
      expect(bundleContent).toContain('lockJson:');
    });

    it('contains the fetch interceptor', () => {
      expect(bundleContent).toContain('const _originalFetch = window.fetch.bind(window)');
    });

    it('contains the scraper Python code', () => {
      expect(bundleContent).toContain('scrape_recipe_from_html');
    });

    it('is a valid HTML document', () => {
      expect(bundleContent).toMatch(/^<!DOCTYPE html>/);
      expect(bundleContent).toContain('</html>');
    });
  });

  describe('offline wheel bundling', () => {
    it('contains embedded wheels map', () => {
      expect(bundleContent).toContain('EMBEDDED_WHEELS');
    });

    it('does not fetch from PyPI at runtime', () => {
      expect(bundleContent).not.toContain("micropip.install('recipe-scrapers'");
    });

    it('installs wheels from local filesystem paths', () => {
      expect(bundleContent).toContain('/tmp/');
      expect(bundleContent).toContain('micropip.install([');
    });

    it('writes wheels to virtual filesystem before install', () => {
      const writeIndex = bundleContent.indexOf('pyodide.FS.writeFile');
      const installIndex = bundleContent.indexOf('micropip.install([');
      expect(writeIndex).toBeGreaterThan(-1);
      expect(installIndex).toBeGreaterThan(-1);
      expect(writeIndex).toBeLessThan(installIndex);
    });
  });

  describe('safe HTML encoding', () => {
    it('uses base64 encoding for HTML passed to Python (not triple quotes)', () => {
      expect(bundleContent).toContain('b64decode');
      expect(bundleContent).not.toMatch(/scrape_recipe_from_html\('''/);
    });

    it('listens for postMessage events', () => {
      expect(bundleContent).toContain("window.addEventListener('message'");
    });
  });
});
