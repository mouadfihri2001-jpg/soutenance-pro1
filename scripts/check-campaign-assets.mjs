import { access } from 'node:fs/promises';
import { join } from 'node:path';

// A referenced local asset must be present in the deployed campaign directory.
// Run after multipart videos have been reconstructed.
export async function checkCampaignAssets(html, root = 'dist/accompagnement') {
  const paths = [...new Set(Array.from(
    html.matchAll(/["'(](assets\/[A-Za-z0-9_./-]+\.(?:mp4|mp3|jpg|jpeg|png|webp|svg|woff2))(?=["')])/g),
    match => match[1]
  ))];
  const captures = html.match(/avisCaptures:\s*\[([\d,\s]+)\]/);
  if (captures) {
    for (const value of captures[1].split(',')) {
      const number = Number(value.trim());
      if (!Number.isInteger(number) || number < 1 || number > 99) throw new Error('Invalid screenshot number');
      paths.push(`assets/avis/av-${String(number).padStart(2, '0')}.jpg`);
    }
  }
  if (!paths.length) throw new Error('Campaign asset references were not found');
  const missing = [];
  for (const path of paths) {
    try { await access(join(root, path)); }
    catch { missing.push(path); }
  }
  if (missing.length) throw new Error(`Missing campaign assets: ${missing.join(', ')}`);
  return paths.length;
}
