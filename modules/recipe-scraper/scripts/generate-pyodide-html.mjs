#!/usr/bin/env node
/**
 * Generate a self-contained HTML bundle for Pyodide on iOS.
 *
 * This script reads all downloaded Pyodide core files and Python wheels,
 * converts them to base64, and generates a single HTML file that can be
 * loaded in a WebView without any network access.
 *
 * The key trick is a fetch interceptor: when Pyodide internally fetches its
 * assets (WASM, stdlib, lock file) or micropip fetches wheels, we intercept
 * those requests and serve them from the embedded base64 data.
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import pkg from './buildBundleHtml.js';

const { buildBundleHtml } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MODULE_DIR = dirname(__dirname);
const PYODIDE_DIR = join(MODULE_DIR, '..', '..', 'node_modules', 'pyodide');
const WHEELS_DIR = join(MODULE_DIR, 'assets', 'pyodide-download', 'wheels');
const OUTPUT_FILE = join(MODULE_DIR, 'assets', 'pyodide-bundle.html');
const SCRAPER_CODE_FILE = join(MODULE_DIR, 'src', 'ios', 'scraperCode.ts');

const PYODIDE_PKG = JSON.parse(readFileSync(join(PYODIDE_DIR, 'package.json'), 'utf-8'));
const PYODIDE_VERSION = PYODIDE_PKG.version;
const PYODIDE_CDN_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full`;

function readFileAsBase64(filepath) {
    const buffer = readFileSync(filepath);
    return buffer.toString('base64');
}

function readFileAsText(filepath) {
    return readFileSync(filepath, 'utf-8');
}

function readEmbeddedWheels() {
    if (!existsSync(WHEELS_DIR)) {
        throw new Error(`Wheels directory missing: ${WHEELS_DIR}`);
    }
    const wheelFiles = readdirSync(WHEELS_DIR).filter(f => f.endsWith('.whl'));
    if (wheelFiles.length === 0) {
        throw new Error('No wheel files found in wheels directory');
    }
    console.log(`[generate-html] Embedding ${wheelFiles.length} Python wheels...`);
    return wheelFiles.map(filename => ({
        filename,
        base64: readFileAsBase64(join(WHEELS_DIR, filename)),
    }));
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

    console.log(`[generate-html] Using Pyodide v${PYODIDE_VERSION} from npm`);

    const requiredFiles = ['pyodide.js', 'pyodide.asm.js', 'pyodide.asm.wasm', 'python_stdlib.zip', 'pyodide-lock.json'];
    for (const file of requiredFiles) {
        const filepath = join(PYODIDE_DIR, file);
        if (!existsSync(filepath)) {
            throw new Error(`Required file missing: ${filepath}`);
        }
    }

    const pyodideJs = readFileAsText(join(PYODIDE_DIR, 'pyodide.js'));
    const pyodideAsmJs = readFileAsText(join(PYODIDE_DIR, 'pyodide.asm.js'));
    const pyodideWasmBase64 = readFileAsBase64(join(PYODIDE_DIR, 'pyodide.asm.wasm'));
    const pythonStdlibBase64 = readFileAsBase64(join(PYODIDE_DIR, 'python_stdlib.zip'));
    const pyodideLockJson = readFileAsText(join(PYODIDE_DIR, 'pyodide-lock.json'));

    console.log('[generate-html] Reading Python wheels...');
    const embeddedWheels = readEmbeddedWheels();

    console.log('[generate-html] Extracting scraper Python code...');
    const scraperPythonCode = extractScraperCode();

    console.log('[generate-html] Generating HTML bundle...');

    const html = buildBundleHtml({
        pyodideJs,
        pyodideAsmJs,
        pyodideWasmBase64,
        pythonStdlibBase64,
        pyodideLockJson,
        embeddedWheels,
        scraperPythonCode,
        pyodideCdnUrl: PYODIDE_CDN_URL,
    });

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
