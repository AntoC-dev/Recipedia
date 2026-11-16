import { existsSync, mkdirSync, copyFileSync, cpSync, rmSync } from 'node:fs';

const targets = [{ src: '.mcp.json', dest: '.cursor/mcp.json', isDir: false }];

mkdirSync('.cursor', { recursive: true });

for (const { src, dest, isDir } of targets) {
  if (!existsSync(src)) {
    console.log(`sync-cursor: skip ${src} (absent)`);
    continue;
  }
  if (isDir) {
    rmSync(dest, { recursive: true, force: true });
    cpSync(src, dest, { recursive: true });
  } else {
    copyFileSync(src, dest);
  }
  console.log(`sync-cursor: ${src} -> ${dest}`);
}
