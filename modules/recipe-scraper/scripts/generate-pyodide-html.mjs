#!/usr/bin/env node
/**
 * Generate a self-contained HTML bundle for Pyodide on iOS.
 *
 * This script reads all downloaded Pyodide core files, converts them to base64,
 * and generates a single HTML file that can be loaded in a WebView.
 *
 * The key trick is a fetch interceptor: when Pyodide internally fetches its
 * assets (WASM, stdlib, lock file), we intercept those requests and serve them
 * from the embedded base64 data. All other requests (like micropip fetching
 * wheels from PyPI) pass through to the real network.
 *
 * Note: Python packages (recipe-scrapers, etc.) are installed at runtime
 * via micropip since they're pure Python wheels available on PyPI.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MODULE_DIR = dirname(__dirname);
const DOWNLOAD_DIR = join(MODULE_DIR, 'assets', 'pyodide-download');
const OUTPUT_FILE = join(MODULE_DIR, 'assets', 'pyodide-bundle.html');
const SCRAPER_CODE_FILE = join(MODULE_DIR, 'src', 'ios', 'scraperCode.ts');

const PYODIDE_VERSION = '0.26.4';
const PYODIDE_CDN_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full`;

function readFileAsBase64(filepath) {
    const buffer = readFileSync(filepath);
    return buffer.toString('base64');
}

function readFileAsText(filepath) {
    return readFileSync(filepath, 'utf-8');
}

function extractScraperCode() {
    const tsContent = readFileAsText(SCRAPER_CODE_FILE);
    const match = tsContent.match(/export const SCRAPER_PYTHON_CODE = `([\s\S]*?)`;/);
    if (!match) {
        throw new Error('Could not extract SCRAPER_PYTHON_CODE from scraperCode.ts');
    }
    return match[1];
}

function generateHtml() {
    console.log('[generate-html] Reading Pyodide core files...');

    const requiredFiles = ['pyodide.js', 'pyodide.asm.js', 'pyodide.asm.wasm', 'python_stdlib.zip', 'pyodide-lock.json'];
    for (const file of requiredFiles) {
        const filepath = join(DOWNLOAD_DIR, file);
        if (!existsSync(filepath)) {
            throw new Error(`Required file missing: ${filepath}`);
        }
    }

    const pyodideJs = readFileAsText(join(DOWNLOAD_DIR, 'pyodide.js'));
    const pyodideAsmJs = readFileAsText(join(DOWNLOAD_DIR, 'pyodide.asm.js'));
    const pyodideWasmBase64 = readFileAsBase64(join(DOWNLOAD_DIR, 'pyodide.asm.wasm'));
    const pythonStdlibBase64 = readFileAsBase64(join(DOWNLOAD_DIR, 'python_stdlib.zip'));
    const pyodideLockJson = readFileAsText(join(DOWNLOAD_DIR, 'pyodide-lock.json'));

    console.log('[generate-html] Extracting scraper Python code...');
    const scraperPythonCode = extractScraperCode();

    console.log('[generate-html] Generating HTML bundle...');

    const jstylessonShim = `
import json
import re

def _strip_comments(text):
    """Strip JavaScript-style comments from text."""
    text = re.sub(r'//[^\\\\n]*', '', text)
    text = re.sub(r'/\\\\*.*?\\\\*/', '', text, flags=re.DOTALL)
    return text

def loads(s, **kwargs):
    """Parse JSON string with JavaScript-style comments."""
    return json.loads(_strip_comments(s), **kwargs)

def load(fp, **kwargs):
    """Parse JSON file with JavaScript-style comments."""
    return loads(fp.read(), **kwargs)

def dumps(obj, **kwargs):
    """Serialize object to JSON string."""
    return json.dumps(obj, **kwargs)

def dump(obj, fp, **kwargs):
    """Serialize object to JSON file."""
    return json.dump(obj, fp, **kwargs)
`;

    const escapedScraperCode = scraperPythonCode
        .replace(/\\/g, '\\\\')
        .replace(/`/g, '\\`')
        .replace(/\$/g, '\\$');

    const escapedJstylessonShim = jstylessonShim
        .replace(/\\/g, '\\\\')
        .replace(/`/g, '\\`')
        .replace(/\$/g, '\\$');

    const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pyodide Recipe Scraper (Bundled)</title>
</head>
<body>
<script>
// ============================================================================
// EMBEDDED PYODIDE ASSETS
// ============================================================================
const EMBEDDED_ASSETS = {
    wasmBase64: "${pyodideWasmBase64}",
    stdlibBase64: "${pythonStdlibBase64}",
    lockJson: ${JSON.stringify(pyodideLockJson)}
};

function base64ToArrayBuffer(base64) {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}

// ============================================================================
// FETCH INTERCEPTOR
// Intercept Pyodide's internal fetch calls for embedded assets.
// All other requests (micropip to PyPI, etc.) pass through to real network.
// ============================================================================
const _originalFetch = window.fetch.bind(window);
window.fetch = function(resource, options) {
    const url = typeof resource === 'string' ? resource : resource.url;

    if (url.endsWith('/pyodide.asm.wasm') || url.endsWith('/pyodide.asm.wasm?') || url === 'pyodide.asm.wasm') {
        const buffer = base64ToArrayBuffer(EMBEDDED_ASSETS.wasmBase64);
        return Promise.resolve(new Response(buffer, {
            status: 200,
            headers: { 'Content-Type': 'application/wasm' }
        }));
    }

    if (url.endsWith('/python_stdlib.zip') || url === 'python_stdlib.zip') {
        const buffer = base64ToArrayBuffer(EMBEDDED_ASSETS.stdlibBase64);
        return Promise.resolve(new Response(buffer, {
            status: 200,
            headers: { 'Content-Type': 'application/zip' }
        }));
    }

    if (url.endsWith('/pyodide-lock.json') || url === 'pyodide-lock.json') {
        return Promise.resolve(new Response(EMBEDDED_ASSETS.lockJson, {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        }));
    }

    // Pass through all other requests (micropip downloading wheels from PyPI, etc.)
    return _originalFetch(resource, options);
};

// ============================================================================
// PYODIDE LOADER
// ============================================================================
${pyodideJs}

// ============================================================================
// PYODIDE ASM MODULE
// ============================================================================
${pyodideAsmJs}

// ============================================================================
// MAIN SCRIPT
// ============================================================================
(function() {
    'use strict';

    let pyodide = null;
    let isReady = false;

    function postToRN(message) {
        if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify(message));
        }
    }

    function log(level, message) {
        postToRN({ type: 'log', level, message });
    }

    async function initPyodide() {
        try {
            log('info', 'Loading Pyodide from embedded bundle (fetch interceptor active)...');

            // Use the real CDN URL as indexURL. The fetch interceptor above
            // will serve WASM/stdlib/lock from embedded base64, while any
            // other files Pyodide requests will fall through to the CDN.
            pyodide = await loadPyodide({
                indexURL: '${PYODIDE_CDN_URL}/',
                stdout: (text) => log('debug', '[Python stdout] ' + text),
                stderr: (text) => log('warn', '[Python stderr] ' + text),
            });

            log('info', 'Pyodide loaded, installing packages...');

            // Install jstyleson shim
            log('info', 'Creating jstyleson shim...');
            await pyodide.runPythonAsync(\`
import sys
from types import ModuleType

jstyleson = ModuleType('jstyleson')
exec('''${escapedJstylessonShim}''', jstyleson.__dict__)
sys.modules['jstyleson'] = jstyleson
print('[PyScraper:INFO] jstyleson shim installed')
\`);

            // Install recipe-scrapers from PyPI via micropip
            log('info', 'Installing recipe-scrapers via micropip...');
            await pyodide.loadPackage('micropip');
            await pyodide.runPythonAsync(\`
import micropip
await micropip.install('recipe-scrapers', keep_going=True)
print('[PyScraper:INFO] recipe-scrapers installed')
\`);

            log('info', 'Loading scraper module...');

            const pythonCode = \`${escapedScraperCode}\`;
            await pyodide.runPythonAsync(pythonCode);

            isReady = true;
            postToRN({ type: 'ready' });
            log('info', 'Pyodide initialization complete (bundled mode)');

        } catch (error) {
            log('error', 'Pyodide initialization failed: ' + error.message);
            postToRN({
                type: 'error',
                error: {
                    type: 'InitializationError',
                    message: error.message
                }
            });
        }
    }

    async function handleRpcCall(id, method, params) {
        if (!isReady) {
            postToRN({
                type: 'rpcResponse',
                id,
                error: { type: 'NotReady', message: 'Pyodide is not ready yet' }
            });
            return;
        }

        try {
            let result;

            switch (method) {
                case 'scrapeRecipeFromHtml': {
                    const { html, url, wildMode } = params;
                    const escaped_html = html.replace(/\\\\/g, '\\\\\\\\').replace(/'/g, "\\\\'");
                    const escaped_url = url.replace(/'/g, "\\\\'");
                    const code = \`scrape_recipe_from_html('''\${escaped_html}''', '\${escaped_url}', \${wildMode ? 'True' : 'False'})\`;
                    result = await pyodide.runPythonAsync(code);
                    break;
                }

                case 'getSupportedHosts': {
                    result = await pyodide.runPythonAsync('get_supported_hosts()');
                    break;
                }

                case 'isHostSupported': {
                    const { host } = params;
                    const escaped_host = host.replace(/'/g, "\\\\'");
                    result = await pyodide.runPythonAsync(\`is_host_supported('\${escaped_host}')\`);
                    break;
                }

                case 'isReady': {
                    result = JSON.stringify({ success: true, data: isReady });
                    break;
                }

                default:
                    throw new Error('Unknown method: ' + method);
            }

            postToRN({
                type: 'rpcResponse',
                id,
                result: result
            });

        } catch (error) {
            log('error', 'RPC call failed: ' + method + ' - ' + error.message);
            postToRN({
                type: 'rpcResponse',
                id,
                error: {
                    type: 'RpcError',
                    message: error.message
                }
            });
        }
    }

    window.handleMessage = function(messageStr) {
        try {
            const message = JSON.parse(messageStr);

            if (message.type === 'rpc') {
                handleRpcCall(message.id, message.method, message.params || {});
            }
        } catch (error) {
            log('error', 'Failed to handle message: ' + error.message);
        }
    };

    initPyodide();
})();
</script>
</body>
</html>`;

    writeFileSync(OUTPUT_FILE, html, 'utf-8');

    const bundleSize = (html.length / (1024 * 1024)).toFixed(2);
    console.log(`[generate-html] Bundle written: ${OUTPUT_FILE} (${bundleSize} MB)`);
}

try {
    generateHtml();
} catch (error) {
    console.error('[generate-html] Error:', error.message);
    process.exit(1);
}
