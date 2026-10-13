import sharp from 'sharp';
import { readFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const resDir = join(root, 'android', 'app', 'src', 'main', 'res');

const fullIcon = readFileSync(join(root, 'public', 'icon.svg'));
const foreground = readFileSync(join(root, 'public', 'icon-foreground.svg'));

const densities = [
  { dir: 'mipmap-mdpi', size: 48 },
  { dir: 'mipmap-hdpi', size: 72 },
  { dir: 'mipmap-xhdpi', size: 96 },
  { dir: 'mipmap-xxhdpi', size: 144 },
  { dir: 'mipmap-xxxhdpi', size: 192 },
];

const webIconSizes = [192, 512];

for (const { dir, size } of densities) {
  const outDir = join(resDir, dir);
  mkdirSync(outDir, { recursive: true });
  for (const name of ['ic_launcher.png', 'ic_launcher_round.png']) {
    await sharp(fullIcon, { density: 300 })
      .resize(size, size)
      .png()
      .toFile(join(outDir, name));
  }
  await sharp(foreground, { density: 300 })
    .resize(size, size)
    .png()
    .toFile(join(outDir, 'ic_launcher_foreground.png'));
  console.log(`${dir}: icons generated (${size}px)`);
}

for (const size of webIconSizes) {
  await sharp(fullIcon, { density: 300 })
    .resize(size, size)
    .png()
    .toFile(join(root, 'public', `icon-${size}.png`));
  console.log(`public/icon-${size}.png generated`);
}

console.log('Done.');
