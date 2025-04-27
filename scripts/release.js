#!/usr/bin/env node
const fse = require('fs-extra');
const archiver = require('archiver');
const path = require('path');

async function build() {
  const rootDir = path.resolve(__dirname, '..');
  const distDir = path.join(rootDir, 'dist');
  // Clean dist
  await fse.remove(distDir);
  await fse.ensureDir(distDir);

  // Copy core files
  const files = ['index.js', 'onec.js', 'package.json', 'package-lock.json'];
  for (const file of files) {
    const src = path.join(rootDir, file);
    if (await fse.pathExists(src)) {
      await fse.copy(src, path.join(distDir, file));
    }
  }

  // Copy node_modules
  const nmSrc = path.join(rootDir, 'node_modules');
  const nmDst = path.join(distDir, 'node_modules');
  if (await fse.pathExists(nmSrc)) {
    await fse.copy(nmSrc, nmDst);
  }

  // Copy Node runtime (win32) from node32/ if exists, else node.exe in root
  const node32Dir = path.join(rootDir, '../one-s-node');
  if (await fse.pathExists(node32Dir)) {
    await fse.copy(node32Dir, path.join(distDir, 'node32'));
  } else {
    const nodeExe = path.join(rootDir, 'node.exe');
    if (await fse.pathExists(nodeExe)) {
      await fse.copy(nodeExe, path.join(distDir, 'node.exe'));
    } else {
      console.warn('Warning: node32/ or node.exe not found, skipping Node copy');
    }
  }

  // Create zip archive
  const pkg = fse.readJSONSync(path.join(rootDir, 'package.json'));
  const zipName = `${pkg.name}-${pkg.version}-win32.zip`;
  const outputZip = path.join(rootDir, zipName);
  const output = fse.createWriteStream(outputZip);
  const archive = archiver('zip', { zlib: { level: 9 } });
  output.on('close', () => {
    console.log(`Release created: ${zipName} (${archive.pointer()} bytes)`);
  });
  archive.on('error', err => { throw err; });
  archive.pipe(output);
  archive.directory(distDir + path.sep, false);
  await archive.finalize();
}

build().catch(err => {
  console.error(err);
  process.exit(1);
});