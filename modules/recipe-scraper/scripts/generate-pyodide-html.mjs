#!/usr/bin/env node
/**
 * Generate a self-contained HTML bundle for Pyodide on iOS.
 *
 * This script reads all downloaded Pyodide core files, converts them to base64,
 * and generates a single HTML file that can be loaded in a WebView.
 *
 * The bundle includes:
 * - Pyodide JavaScript (inline)
 * - Pyodide WASM (base64 data URL)
 * - Python standard library (base64)
 * - jstyleson shim (inline Python)
 * - Recipe scraper code (inline Python)
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

    // Verify required files exist
    const requiredFiles = ['pyodide.js', 'pyodide.asm.js', 'pyodide.asm.wasm', 'python_stdlib.zip', 'pyodide-lock.json'];
    for (const file of requiredFiles) {
        const filepath = join(DOWNLOAD_DIR, file);
        if (!existsSync(filepath)) {
            throw new Error(`Required file missing: ${filepath}`);
        }
    }

    // Read core files
    const pyodideJs = readFileAsText(join(DOWNLOAD_DIR, 'pyodide.js'));
    const pyodideAsmJs = readFileAsText(join(DOWNLOAD_DIR, 'pyodide.asm.js'));
    const pyodideWasmBase64 = readFileAsBase64(join(DOWNLOAD_DIR, 'pyodide.asm.wasm'));
    const pythonStdlibBase64 = readFileAsBase64(join(DOWNLOAD_DIR, 'python_stdlib.zip'));
    const pyodideLock = readFileAsText(join(DOWNLOAD_DIR, 'pyodide-lock.json'));

    console.log('[generate-html] Extracting scraper Python code...');
    const scraperPythonCode = extractScraperCode();

    console.log('[generate-html] Generating HTML bundle...');

    // jstyleson shim - needed because jstyleson doesn't have proper Pyodide wheels
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

    // Escape special characters for JavaScript template literal
    const escapedScraperCode = scraperPythonCode
        .replace(/\\/g, '\\\\')
        .replace(/`/g, '\\`')
        .replace(/\$/g, '\\$');

    const escapedJstylessonShim = jstylessonShim
        .replace(/\\/g, '\\\\')
        .replace(/`/g, '\\`')
        .replace(/\$/g, '\\$');

    // Generate the HTML
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
    lockJson: ${JSON.stringify(pyodideLock)}
};

// Convert base64 to ArrayBuffer
function base64ToArrayBuffer(base64) {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}

// Convert base64 to Blob URL
function base64ToBlobUrl(base64, mimeType) {
    const buffer = base64ToArrayBuffer(base64);
    const blob = new Blob([buffer], { type: mimeType });
    return URL.createObjectURL(blob);
}

// ============================================================================
// PYODIDE LOADER (Modified to use embedded assets)
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

    // Send message to React Native
    function postToRN(message) {
        if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify(message));
        }
    }

    // Log helper
    function log(level, message) {
        postToRN({ type: 'log', level, message });
    }

    // Initialize Pyodide with embedded assets
    async function initPyodide() {
        try {
            log('info', 'Loading Pyodide from embedded bundle...');

            // Create blob URLs for WASM and stdlib
            const wasmUrl = base64ToBlobUrl(EMBEDDED_ASSETS.wasmBase64, 'application/wasm');
            const stdlibUrl = base64ToBlobUrl(EMBEDDED_ASSETS.stdlibBase64, 'application/zip');

            // Configure Pyodide to use our embedded assets
            pyodide = await loadPyodide({
                indexURL: 'blob://',
                lockFileURL: 'data:application/json,' + encodeURIComponent(EMBEDDED_ASSETS.lockJson),
                stdout: (text) => log('debug', '[Python stdout] ' + text),
                stderr: (text) => log('warn', '[Python stderr] ' + text),
                _loadPyodideWasm: async () => {
                    log('info', 'Loading WASM from embedded bundle...');
                    const response = await fetch(wasmUrl);
                    return response.arrayBuffer();
                },
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

            // Execute the scraper Python code
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

    // Handle RPC calls from React Native
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

    // Message handler for React Native
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

    // Start initialization
    initPyodide();
})();
</script>
</body>
</html>`;

    // Write the bundle
    writeFileSync(OUTPUT_FILE, html, 'utf-8');

    const bundleSize = (html.length / (1024 * 1024)).toFixed(2);
    console.log(`[generate-html] Bundle written: ${OUTPUT_FILE} (${bundleSize} MB)`);
}

// Run the generator
try {
    generateHtml();
} catch (error) {
    console.error('[generate-html] Error:', error.message);
    process.exit(1);
}
