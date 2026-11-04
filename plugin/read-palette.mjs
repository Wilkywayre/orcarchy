import { execFile } from 'node:child_process';
import { homedir } from 'node:os';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const run = promisify(execFile);
const bridge = fileURLToPath(new URL('./convert.py', import.meta.url));

export async function readPalette(palette, signal) {
  const { stdout } = await run('python3', ['-I', bridge, '--palette', palette, '--dry-run'], {
    cwd: homedir(), signal, timeout: 10000, maxBuffer: 256 * 1024, windowsHide: true,
  });
  const documents = JSON.parse(stdout);
  const app = documents['themes/app.json'];
  const terminal = documents['themes/terminal.json'];
  if (!app || !terminal || app.base !== terminal.mode) {
    throw new Error('Converter did not return matching app and terminal colors');
  }
  return { app: JSON.stringify(app), terminal: JSON.stringify(terminal) };
}
