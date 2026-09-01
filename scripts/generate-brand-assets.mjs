import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const publicDir = new URL('../public/', import.meta.url);
const publicPath = (filename) => fileURLToPath(new URL(filename, publicDir));
const faviconSvg = await readFile(new URL('favicon.svg', publicDir));

async function renderIcon(filename, size, { solidBackground = false } = {}) {
    let image = sharp(faviconSvg).resize(size, size);

    if (solidBackground) {
        image = image.flatten({ background: '#18181b' });
    }

    await image.png({ compressionLevel: 9 }).toFile(publicPath(filename));
}

await Promise.all([
    renderIcon('favicon-16x16.png', 16),
    renderIcon('favicon-32x32.png', 32),
    renderIcon('favicon.png', 200),
    renderIcon('apple-touch-icon.png', 180, { solidBackground: true }),
    renderIcon('android-chrome-192x192.png', 192),
    renderIcon('android-chrome-512x512.png', 512),
]);

const icoSizes = [16, 32, 48];
const icoPngs = await Promise.all(
    icoSizes.map((size) => sharp(faviconSvg).resize(size, size).png().toBuffer()),
);
const icoHeaderSize = 6 + (16 * icoPngs.length);
const icoHeader = Buffer.alloc(icoHeaderSize);
icoHeader.writeUInt16LE(0, 0);
icoHeader.writeUInt16LE(1, 2);
icoHeader.writeUInt16LE(icoPngs.length, 4);

let icoOffset = icoHeaderSize;
icoPngs.forEach((png, index) => {
    const entryOffset = 6 + (index * 16);
    const size = icoSizes[index];
    icoHeader.writeUInt8(size, entryOffset);
    icoHeader.writeUInt8(size, entryOffset + 1);
    icoHeader.writeUInt8(0, entryOffset + 2);
    icoHeader.writeUInt8(0, entryOffset + 3);
    icoHeader.writeUInt16LE(1, entryOffset + 4);
    icoHeader.writeUInt16LE(32, entryOffset + 6);
    icoHeader.writeUInt32LE(png.length, entryOffset + 8);
    icoHeader.writeUInt32LE(icoOffset, entryOffset + 12);
    icoOffset += png.length;
});
await writeFile(new URL('favicon.ico', publicDir), Buffer.concat([icoHeader, ...icoPngs]));

const socialCardSvg = Buffer.from(`
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
    <rect width="1200" height="630" fill="#fafafa"/>
    <rect x="1" y="1" width="1198" height="628" rx="28" fill="none" stroke="#e4e4e7" stroke-width="2"/>
    <rect x="72" y="72" width="54" height="54" rx="12" fill="#18181b"/>
    <path fill="#fff" fill-rule="evenodd" d="M86 82h12c12 0 20 6.6 20 17s-8 17-20 17H86V82Zm12 8h-3v18h3c6.5 0 10.5-3.2 10.5-9S104.5 90 98 90Z"/>
    <text x="144" y="108" fill="#3f3f46" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="700" letter-spacing="2">DANIE NELL</text>
    <text x="72" y="225" fill="#09090b" font-family="Arial, Helvetica, sans-serif" font-size="68" font-weight="700" letter-spacing="-2">
        <tspan x="72" dy="0">Finance, data,</tspan>
        <tspan x="72" dy="78">and automation.</tspan>
    </text>
    <text x="72" y="420" fill="#52525b" font-family="Arial, Helvetica, sans-serif" font-size="28">
        Systems that turn raw data into decisions.
    </text>
    <text x="72" y="548" fill="#71717a" font-family="Arial, Helvetica, sans-serif" font-size="22">danienell.com</text>
    <circle cx="956" cy="315" r="184" fill="#fff" stroke="#e4e4e7" stroke-width="8"/>
</svg>`);

const headshot = await sharp(publicPath('images/headshot.jpg'))
    .resize(352, 352, { fit: 'cover' })
    .composite([{
        input: Buffer.from('<svg width="352" height="352"><circle cx="176" cy="176" r="176" fill="#fff"/></svg>'),
        blend: 'dest-in',
    }])
    .png()
    .toBuffer();

await sharp(socialCardSvg)
    .composite([{ input: headshot, left: 780, top: 139 }])
    .png({ compressionLevel: 9 })
    .toFile(publicPath('social-card.png'));

console.log('Generated favicon variants, app icons, and social-card.png');
