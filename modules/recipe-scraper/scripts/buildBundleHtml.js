/**
 * Pure builder for the Pyodide bundle HTML.
 *
 * Split out of generate-pyodide-html.mjs so the emitted document can be asserted
 * on without producing the real multi-megabyte artifact, which is gitignored and
 * only generated during an iOS prebuild.
 */

/**
 * Assembles the self-contained Pyodide bundle document.
 *
 * @param {object} input - Embedded payloads and code, already read from disk
 * @param {string} input.pyodideJs - Contents of pyodide.js
 * @param {string} input.pyodideAsmJs - Contents of pyodide.asm.js
 * @param {string} input.pyodideWasmBase64 - base64 of pyodide.asm.wasm
 * @param {string} input.pythonStdlibBase64 - base64 of python_stdlib.zip
 * @param {string} input.pyodideLockJson - Contents of pyodide-lock.json
 * @param {{filename: string, base64: string}[]} input.embeddedWheels - Wheels to embed
 * @param {string} input.scraperPythonCode - Python source of the scraper
 * @param {string} input.pyodideCdnUrl - CDN base url recorded in the bundle
 * @returns {string} The complete HTML document
 */
function buildBundleHtml({
    pyodideJs,
    pyodideAsmJs,
    pyodideWasmBase64,
    pythonStdlibBase64,
    pyodideLockJson,
    embeddedWheels,
    scraperPythonCode,
    pyodideCdnUrl,
}) {
    const PYODIDE_CDN_URL = pyodideCdnUrl;

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

    // Build the embedded wheels map as a JS object literal
    const wheelsMapEntries = embeddedWheels.map(w =>
        `    "${w.filename}": "${w.base64}"`
    ).join(',\n');

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

// ============================================================================
// EMBEDDED PYTHON WHEELS (downloaded at build time for offline install)
// ============================================================================
const EMBEDDED_WHEELS = {
${wheelsMapEntries}
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
// Intercept Pyodide's internal fetch calls for embedded assets and wheels.
// No network access required — everything is served from embedded data.
// ============================================================================
const _originalFetch = window.fetch.bind(window);
window.fetch = function(resource, options) {
    const url = typeof resource === 'string' ? resource : (resource.url || resource.href || String(resource));

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

    // Intercept wheel downloads — serve from embedded base64
    for (const [filename, b64] of Object.entries(EMBEDDED_WHEELS)) {
        if (url.endsWith('/' + filename) || url.endsWith('/' + filename + '#')) {
            const buffer = base64ToArrayBuffer(b64);
            return Promise.resolve(new Response(buffer, {
                status: 200,
                headers: { 'Content-Type': 'application/zip' }
            }));
        }
    }

    // Fallback to network for anything else
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

            // Write embedded wheels to Pyodide's virtual filesystem and install locally
            log('info', 'Installing pre-bundled Python wheels...');
            const wheelEntries = Object.entries(EMBEDDED_WHEELS);
            log('info', 'Writing ' + wheelEntries.length + ' wheels to virtual filesystem...');
            for (const [filename, b64] of wheelEntries) {
                const wheelBytes = new Uint8Array(base64ToArrayBuffer(b64));
                pyodide.FS.writeFile('/tmp/' + filename, wheelBytes);
            }

            await pyodide.loadPackage('micropip');
            const wheelPaths = wheelEntries.map(([f]) => '/tmp/' + f);
            await pyodide.runPythonAsync(\`
import micropip
micropip.add_mock_package('jstyleson', '0.0.2')
await micropip.install([\${wheelPaths.map(p => "'" + p + "'").join(', ')}], keep_going=True)
print('[PyScraper:INFO] recipe-scrapers and dependencies installed from local wheels')
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
                    // Use base64 encoding to safely pass HTML to Python,
                    // avoiding triple-quote escaping issues with arbitrary HTML content
                    const b64Html = btoa(unescape(encodeURIComponent(html)));
                    const escaped_url = url.replace(/'/g, "\\\\'");
                    const code = \`scrape_recipe_from_html(__import__('base64').b64decode('\${b64Html}').decode('utf-8'), '\${escaped_url}', \${wildMode ? 'True' : 'False'})\`;
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

    // Listen for messages via postMessage from React Native.
    // Guard: only process strings that start with '{' to ignore React Native
    // internal messages (scheduler events like "sched$...").
    window.addEventListener('message', function(event) {
        var data = event.data;
        if (typeof data !== 'string' || data.charAt(0) !== '{') {
            return;
        }
        try {
            var message = JSON.parse(data);
            if (message.type === 'rpc') {
                handleRpcCall(message.id, message.method, message.params || {});
            }
        } catch (error) {
            log('error', 'Failed to handle message: ' + error.message);
        }
    });

    initPyodide();
})();
</script>
</body>
</html>`;

    return html;
}

module.exports = { buildBundleHtml };
