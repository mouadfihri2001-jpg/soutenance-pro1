import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';

// Multipart source storage avoids oversized connector uploads. Published MP4s
// are byte-for-byte identical to the originals supplied in sp-1-site-ugc.zip.
export async function buildCampaignMedia(output = 'dist/accompagnement/assets/video') {
  const manifest = JSON.parse(await readFile('campaign-media/manifest.json', 'utf8'));
  await mkdir(output, { recursive: true });
  for (const entry of manifest) {
    if (!/^ugc[1-3]\.mp4$/.test(entry.file) || !entry.parts.every(p => /^ugc[1-3]\/\d{3}\.mp4\.part$/.test(p))) {
      throw new Error('Invalid campaign media manifest');
    }
    const bytes = Buffer.concat(await Promise.all(entry.parts.map(p => readFile(`campaign-media/${p}`))));
    if (bytes.length !== entry.size || createHash('sha256').update(bytes).digest('hex') !== entry.sha256) {
      throw new Error(`Campaign video integrity check failed: ${entry.file}`);
    }
    await writeFile(`${output}/${entry.file}`, bytes);
  }
}
