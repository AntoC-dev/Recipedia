import { PyodideScraper } from '../../../../modules/recipe-scraper/src/web/PyodideScraper';

const mockPyodide = {
  loadPackage: jest.fn().mockResolvedValue(undefined),
  runPythonAsync: jest.fn().mockResolvedValue(undefined),
  globals: {
    get: jest.fn(),
    set: jest.fn(),
  },
};

const mockLoadPyodide = jest.fn().mockResolvedValue(mockPyodide);

const mockScript = {
  onload: null as (() => void) | null,
  onerror: null as (() => void) | null,
  src: '',
  async: false,
};

describe('PyodideScraper', () => {
  let scraper: PyodideScraper;
  let originalDocument: typeof document;
  let originalWindow: typeof window;

  beforeEach(() => {
    jest.clearAllMocks();

    originalDocument = global.document;
    originalWindow = global.window;

    global.window = {
      loadPyodide: undefined,
    } as unknown as Window & typeof globalThis;

    global.document = {
      createElement: jest.fn().mockReturnValue(mockScript),
      head: {
        appendChild: jest.fn().mockImplementation(() => {
          if (mockScript.onload) {
            (global.window as unknown as { loadPyodide: typeof mockLoadPyodide }).loadPyodide =
              mockLoadPyodide;
            setTimeout(() => mockScript.onload!(), 0);
          }
        }),
      },
    } as unknown as Document;

    scraper = new PyodideScraper();
  });

  afterEach(() => {
    global.document = originalDocument;
    global.window = originalWindow;
    mockScript.onload = null;
    mockScript.onerror = null;
  });

  describe('initial state', () => {
    test('isReady is false initially', () => {
      expect(scraper.isReady).toBe(false);
    });

    test('hasFailed is false initially', () => {
      expect(scraper.hasFailed).toBe(false);
    });
  });

  describe('preload', () => {
    test('starts initialization without waiting', () => {
      scraper.preload();

      expect(document.createElement).toHaveBeenCalledWith('script');
    });

    test('does not start again if already loading', () => {
      scraper.preload();
      scraper.preload();

      expect(document.createElement).toHaveBeenCalledTimes(1);
    });
  });

  describe('initialize', () => {
    test('loads Pyodide and packages', async () => {
      const initPromise = scraper.initialize();

      await new Promise(resolve => setTimeout(resolve, 10));
      await initPromise;

      expect(mockLoadPyodide).toHaveBeenCalled();
      expect(mockPyodide.loadPackage).toHaveBeenCalledWith(['lxml', 'beautifulsoup4']);
      expect(mockPyodide.runPythonAsync).toHaveBeenCalled();
    });

    test('does not reinitialize if already loading', async () => {
      scraper.initialize();
      scraper.initialize();

      expect(document.createElement).toHaveBeenCalledTimes(1);

      await new Promise(resolve => setTimeout(resolve, 10));
    });

    test('sets isReady to true after successful init', async () => {
      const initPromise = scraper.initialize();

      await new Promise(resolve => setTimeout(resolve, 10));
      await initPromise;

      expect(scraper.isReady).toBe(true);
      expect(scraper.hasFailed).toBe(false);
    });

    test('sets hasFailed on initialization error', async () => {
      const failingScraper = new PyodideScraper();

      // @ts-expect-error simulating a previous failure
      failingScraper.initError = new Error('Previous failure');

      expect(failingScraper.hasFailed).toBe(true);
      expect(failingScraper.isReady).toBe(false);

      await expect(failingScraper.initialize()).rejects.toThrow('Previous failure');
    });
  });

  describe('scrapeFromHtml', () => {
    test('initializes before scraping', async () => {
      mockPyodide.runPythonAsync.mockResolvedValueOnce(undefined);
      mockPyodide.runPythonAsync.mockResolvedValueOnce(undefined);
      mockPyodide.runPythonAsync.mockResolvedValueOnce(
        JSON.stringify({ success: true, data: { title: 'Test' } })
      );

      const initPromise = scraper.scrapeFromHtml('<html></html>', 'https://example.com');

      await new Promise(resolve => setTimeout(resolve, 10));
      const result = await initPromise;

      expect(result.success).toBe(true);
    });

    test('passes html and url to Python', async () => {
      mockPyodide.runPythonAsync.mockResolvedValueOnce(undefined);
      mockPyodide.runPythonAsync.mockResolvedValueOnce(undefined);
      mockPyodide.runPythonAsync.mockResolvedValueOnce(
        JSON.stringify({ success: true, data: { title: 'Test' } })
      );

      const initPromise = scraper.scrapeFromHtml(
        '<html>test</html>',
        'https://example.com/recipe',
        true
      );

      await new Promise(resolve => setTimeout(resolve, 10));
      await initPromise;

      expect(mockPyodide.globals.set).toHaveBeenCalledWith('_html', '<html>test</html>');
      expect(mockPyodide.globals.set).toHaveBeenCalledWith('_url', 'https://example.com/recipe');
      expect(mockPyodide.globals.set).toHaveBeenCalledWith('_wild_mode', true);
    });

    test('returns error if pyodide is null after init', async () => {
      mockPyodide.runPythonAsync.mockResolvedValueOnce(undefined);
      mockPyodide.runPythonAsync.mockResolvedValueOnce(undefined);

      const initPromise = scraper.initialize();
      await new Promise(resolve => setTimeout(resolve, 10));
      await initPromise;

      // @ts-expect-error simulating pyodide being null
      scraper.pyodide = null;

      const result = await scraper.scrapeFromHtml('<html></html>', 'https://example.com');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('InitializationError');
      }
    });
  });

  describe('getSupportedHosts', () => {
    test('returns list of hosts from Python', async () => {
      mockPyodide.runPythonAsync.mockResolvedValueOnce(undefined);
      mockPyodide.runPythonAsync.mockResolvedValueOnce(undefined);
      mockPyodide.runPythonAsync.mockResolvedValueOnce(
        JSON.stringify({ success: true, data: ['allrecipes.com', 'bbc.co.uk'] })
      );

      const initPromise = scraper.getSupportedHosts();

      await new Promise(resolve => setTimeout(resolve, 10));
      const result = await initPromise;

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(['allrecipes.com', 'bbc.co.uk']);
      }
    });
  });

  describe('isHostSupported', () => {
    test('returns true for supported host', async () => {
      mockPyodide.runPythonAsync.mockResolvedValueOnce(undefined);
      mockPyodide.runPythonAsync.mockResolvedValueOnce(undefined);
      mockPyodide.runPythonAsync.mockResolvedValueOnce(
        JSON.stringify({ success: true, data: true })
      );

      const initPromise = scraper.isHostSupported('allrecipes.com');

      await new Promise(resolve => setTimeout(resolve, 10));
      const result = await initPromise;

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(true);
      }
    });

    test('passes host to Python', async () => {
      mockPyodide.runPythonAsync.mockResolvedValueOnce(undefined);
      mockPyodide.runPythonAsync.mockResolvedValueOnce(undefined);
      mockPyodide.runPythonAsync.mockResolvedValueOnce(
        JSON.stringify({ success: true, data: true })
      );

      const initPromise = scraper.isHostSupported('example.com');

      await new Promise(resolve => setTimeout(resolve, 10));
      await initPromise;

      expect(mockPyodide.globals.set).toHaveBeenCalledWith('_host', 'example.com');
    });
  });

  describe('error handling', () => {
    test('returns error result on Python exception', async () => {
      mockPyodide.runPythonAsync.mockResolvedValueOnce(undefined);
      mockPyodide.runPythonAsync.mockResolvedValueOnce(undefined);
      mockPyodide.runPythonAsync.mockRejectedValueOnce(new Error('Python error'));

      const initPromise = scraper.scrapeFromHtml('<html></html>', 'https://example.com');

      await new Promise(resolve => setTimeout(resolve, 10));
      const result = await initPromise;

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('PythonError');
        expect(result.error.message).toBe('Python error');
      }
    });
  });

  describe('script loading', () => {
    test('uses existing loadPyodide if available', async () => {
      // @ts-expect-error simulating browser environment
      global.window.loadPyodide = mockLoadPyodide;

      const freshScraper = new PyodideScraper();
      const initPromise = freshScraper.initialize();
      await initPromise;

      expect(document.createElement).not.toHaveBeenCalled();
      expect(mockLoadPyodide).toHaveBeenCalled();
    });
  });
});
