import { inspectConfiguration } from '../server/runtime-config.js';

export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return res.status(405).json({ error: { message: 'Méthode non autorisée.' } }); }
  // Names and safe public values only; misplaced server keys are withheld.
  return res.status(200).json(inspectConfiguration());
}
