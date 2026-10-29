import * as esbuild from 'esbuild';
import path from 'node:path';
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const rootDir = fileURLToPath(new URL('.', import.meta.url));
const resolveRoot = (...parts) => path.resolve(rootDir, ...parts);

const aliasMap = {
  '@': resolveRoot('src'),
  '@components': resolveRoot('src/shared/ui'),
  '@pages': resolveRoot('src/pages'),
  '@layouts': resolveRoot('src/shared/layouts'),
  '@hooks': resolveRoot('src/shared/hooks'),
  '@styles': resolveRoot('src/styles'),
  '@assets': resolveRoot('src/assets'),
  '@utils': resolveRoot('src/shared/utils'),
  '@lib': resolveRoot('src/shared/lib'),
  '@store': resolveRoot('src/shared/store'),
  '@types': resolveRoot('src/shared/types'),
};

const resolveWithExtensions = (basePath) => {
  const fileCandidates = [
    `${basePath}.ts`,
    `${basePath}.tsx`,
    `${basePath}.js`,
    `${basePath}.jsx`,
    `${basePath}.mjs`,
  ];
  for (const candidate of fileCandidates) {
    if (existsSync(candidate)) return candidate;
  }
  const indexCandidates = [
    path.join(basePath, 'index.ts'),
    path.join(basePath, 'index.tsx'),
    path.join(basePath, 'index.js'),
    path.join(basePath, 'index.jsx'),
    path.join(basePath, 'index.mjs'),
  ];
  for (const candidate of indexCandidates) {
    if (existsSync(candidate)) return candidate;
  }
  if (existsSync(basePath)) return basePath;
  return basePath;
};

const aliasPlugin = {
  name: 'alias-plugin',
  setup(build) {
    build.onResolve({ filter: /.*/ }, args => {
      const spec = args.path;
      if (spec.startsWith('.') || spec.startsWith('/') || spec.startsWith('http://') || spec.startsWith('https://')) {
        return null;
      }

      for (const [key, target] of Object.entries(aliasMap)) {
        if (spec === key) {
          return { path: resolveWithExtensions(target) };
        }
        if (spec.startsWith(key + '/')) {
          return { path: resolveWithExtensions(path.join(target, spec.slice(key.length + 1))) };
        }
      }
      return null;
    });
  },
};

const cssPlugin = {
  name: 'css-plugin',
  setup(build) {
    build.onLoad({ filter: /\.module\.css$/ }, async args => ({
      contents: await fs.readFile(args.path, 'utf8'),
      loader: 'local-css',
      resolveDir: path.dirname(args.path),
    }));

    build.onLoad({ filter: /\.css$/ }, async args => {
      let contents = await fs.readFile(args.path, 'utf8');
      if (args.path.endsWith(path.join('src', 'styles', 'globals.css'))) {
        contents = contents
          .split('\n')
          .filter(line => !line.trim().startsWith('@tailwind '))
          .join('\n');
      }
      return {
        contents,
        loader: 'css',
        resolveDir: path.dirname(args.path),
      };
    });
  },
};

await fs.rm(resolveRoot('dist'), { recursive: true, force: true });

const result = await esbuild.build({
  entryPoints: [resolveRoot('src/main.tsx')],
  outdir: resolveRoot('dist'),
  bundle: true,
  format: 'esm',
  splitting: true,
  sourcemap: false,
  minify: true,
  target: ['es2017'],
  platform: 'browser',
  jsx: 'automatic',
  metafile: true,
  entryNames: 'assets/[name]-[hash]',
  chunkNames: 'assets/[name]-[hash]',
  assetNames: 'assets/[name]-[hash]',
  loader: {
    '.svg': 'file',
    '.png': 'file',
    '.jpg': 'file',
    '.jpeg': 'file',
    '.webp': 'file',
    '.gif': 'file',
    '.woff': 'file',
    '.woff2': 'file',
  },
  define: {
    'import.meta.env.VITE_API_BASE_URL': JSON.stringify(process.env.VITE_API_BASE_URL || ''),
    'import.meta.env.VITE_SENTRY_DSN': JSON.stringify(process.env.VITE_SENTRY_DSN || ''),
    'import.meta.env.MODE': JSON.stringify(process.env.MODE || 'production'),
  },
  plugins: [aliasPlugin, cssPlugin],
  logLevel: 'info',
});

const outputs = result.metafile.outputs;
const jsEntry = Object.entries(outputs).find(([, value]) => value.entryPoint && value.entryPoint.endsWith('src/main.tsx') && value.bytes > 0 && value.inputs)?.[0];
const cssEntry = jsEntry && outputs[jsEntry]?.cssBundle ? outputs[jsEntry].cssBundle : Object.keys(outputs).find(key => key.endsWith('.css'));

if (!jsEntry) {
  throw new Error('Could not find bundled JS entry for src/main.tsx');
}

const htmlSrc = await fs.readFile(resolveRoot('index.html'), 'utf8');
const jsPath = '/' + path.relative(resolveRoot('dist'), jsEntry).replace(/\\/g, '/');
const cssTag = cssEntry
  ? `    <link rel="stylesheet" href="/${path.relative(resolveRoot('dist'), cssEntry).replace(/\\/g, '/')}" />\n`
  : '';

const htmlOut = htmlSrc
  .replace('</head>', `${cssTag}</head>`)
  .replace(/<script type="module" src="\/src\/main\.tsx"><\/script>/, `<script type="module" src="${jsPath}"></script>`);

await fs.writeFile(resolveRoot('dist/index.html'), htmlOut);

const publicDir = resolveRoot('public');
if (existsSync(publicDir)) {
  for (const name of await fs.readdir(publicDir)) {
    const from = path.join(publicDir, name);
    const to = resolveRoot('dist', name);
    await fs.cp(from, to, { recursive: true });
  }
}

// Render Static Site فایل _redirects (مخصوص Netlify) را اجرا نمی‌کند. برای اینکه مسیرهای
// SPA هیچ‌وقت 404 ندهند: برای هر مسیر یک index.html فیزیکی می‌سازیم و 404.html را هم
// نسخه‌ی همان index قرار می‌دهیم. مسیر فایل‌ها absolute است، پس در هر عمقی کار می‌کند.
const routeIndex = await fs.readFile(resolveRoot('dist/index.html'), 'utf8');
const spaRoutes = ['admin-panel', 'admin', 'reseller', 'wallet', 'services', 'subscription', 'referral',
  'support', 'profile', 'settings', 'discount', 'free-trial', 'custom-build'];
for (const route of spaRoutes) {
  const routeDir = resolveRoot('dist', route);
  await fs.mkdir(routeDir, { recursive: true });
  await fs.writeFile(path.join(routeDir, 'index.html'), routeIndex);
}
await fs.writeFile(resolveRoot('dist/404.html'), routeIndex);

console.log('Custom esbuild build completed.');
console.log('JS entry:', jsPath);
if (cssEntry) console.log('CSS bundle:', './' + path.relative(resolveRoot('dist'), cssEntry).replace(/\\/g, '/'));
