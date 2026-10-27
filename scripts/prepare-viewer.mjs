import { copyFile, mkdir } from 'node:fs/promises';
await mkdir(new URL('../public/', import.meta.url), { recursive: true });
// The offline presentation embeds the same viewer used by the React app.
await copyFile(new URL('../lib/viewer.js', import.meta.url), new URL('../public/viewer.js', import.meta.url));
