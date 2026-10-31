// SPDX-License-Identifier: MIT
// One classic script for Safari 10.1. The ES modules in web/ stay as they are.
// esbuild will not lower top-level await, so the entry is wrapped in an async
// function here. The await then lowers with the es2015 target.
import fs from 'fs';
import * as esbuild from 'esbuild';

const src = fs.readFileSync('web/app.js', 'utf8');
const imports = [];
const body = [];
let collecting = false;
let buf = [];
for (const line of src.split('\n')) {
  if (!collecting && /^\s*import\s/.test(line)) {
    collecting = true;
    buf = [line];
  } else if (collecting) buf.push(line);
  else {
    body.push(line);
    continue;
  }
  if (collecting && line.includes(';')) {
    imports.push(buf.join('\n'));
    collecting = false;
  }
}
if (collecting) throw new Error('unclosed import in web/app.js');
const wrapped = `${imports.join('\n')}\nasync function __legacyBoot() {\n${body.join('\n')}\n}\n__legacyBoot();\n`;

const versionFile = fs.readFileSync('web/version.js', 'utf8');
const versionMatch = versionFile.match(/export const VERSION = '([^']+)'/);
if (!versionMatch) throw new Error('web/version.js has no VERSION');
const swPath = 'web/sw.js';
const sw = fs.readFileSync(swPath, 'utf8');
if (/^\s*import\s/m.test(sw) || /^\s*export\s/m.test(sw)) throw new Error('web/sw.js must stay a classic script');
if (!/const VERSION = '[^']*';/.test(sw)) throw new Error('web/sw.js has no VERSION constant to stamp');
const stamped = sw.replace(/const VERSION = '[^']*';/, `const VERSION = '${versionMatch[1]}';`);
if (stamped !== sw) fs.writeFileSync(swPath, stamped);

const banner = {
  js: '// SPDX-License-Identifier: MIT\n// Built for Safari 10.1 (iOS 10.3). Refresh with npm run build.\n',
};

await esbuild.build({
  stdin: {
    contents: wrapped,
    resolveDir: 'web',
    sourcefile: 'app.js',
    loader: 'js',
  },
  bundle: true,
  format: 'iife',
  target: 'es2015',
  outfile: 'web/legacy.js',
  legalComments: 'none',
  banner,
});

await esbuild.build({
  entryPoints: ['web/settings.js'],
  bundle: true,
  format: 'iife',
  target: 'es2015',
  outfile: 'web/settings-legacy.js',
  legalComments: 'none',
  banner,
});

await import('./appcache.mjs');
