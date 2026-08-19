const {
  buildBundleHtml,
} = require('../../../../modules/recipe-scraper/scripts/buildBundleHtml.js');

describe('Pyodide bundle (pyodide-bundle.html)', () => {
  const buildWithStubs = (overrides: Record<string, unknown> = {}): string =>
    buildBundleHtml({
      pyodideJs: 'globalThis.loadPyodide = () => {};',
      pyodideAsmJs: 'globalThis._createPyodideModule = () => {};',
      pyodideWasmBase64: 'd2FzbQ==',
      pythonStdlibBase64: 'c3RkbGli',
      pyodideLockJson: '{"packages":{}}',
      embeddedWheels: [{ filename: 'recipe_scrapers-15.0.0-py3-none-any.whl', base64: 'd2hlZWw=' }],
      scraperPythonCode: 'def scrape_recipe_from_html(html):\n    return {}\n',
      pyodideCdnUrl: 'https://cdn.example.test/pyodide/v0.0.0/full',
      ...overrides,
    });

  let bundleContent: string;

  beforeAll(() => {
    bundleContent = buildWithStubs();
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

    it('embeds the payloads it was given', () => {
      expect(bundleContent).toContain('d2FzbQ==');
      expect(bundleContent).toContain('c3RkbGli');
      expect(bundleContent).toContain('recipe_scrapers-15.0.0-py3-none-any.whl');
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
