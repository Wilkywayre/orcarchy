import { execFile } from 'node:child_process';
import { homedir } from 'node:os';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const run = promisify(execFile);
const bridge = fileURLToPath(new URL('./convert.py', import.meta.url));

export async function readPalette(palette, signal) {
  // Why -B: the bridge imports the shipped package from the installed plugin
  // directory, and CPython bytecode there changes the installed content hash,
  // which makes Orca refuse to start the worker. (-I ignores the environment,
  // so PYTHONDONTWRITEBYTECODE would not help here.)
  const { stdout } = await run('python3', ['-B', '-I', bridge, '--palette', palette, '--dry-run'], {
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
