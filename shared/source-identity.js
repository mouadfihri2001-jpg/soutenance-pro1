// Identifier validation only: these helpers do not establish that a document
// has been read, that a DOI resolves, or that a claim is supported by its text.
export function normalizedDoi(value) {
  if (typeof value !== 'string') return '';
  const doi = value.trim();
  if (doi.length > 256 || !/^10\.\d{4,9}\/[^\s<>"\\\u0000-\u001f\u007f]+$/i.test(doi)) return '';
  return doi;
}

export function halSourceUrl(value) {
  if (typeof value !== 'string' || value.length > 2048 || /[\u0000-\u0020\u007f\\]/.test(value)) return '';
  try {
    const url = new URL(value);
    const knownHost = /^(?:[a-z0-9-]+\.)*(?:hal\.science|archives-ouvertes\.fr|ccsd\.cnrs\.fr)$/.test(url.hostname) || url.hostname === 'hal.inrae.fr';
    if (url.protocol !== 'https:' || url.username || url.password || url.port || url.search || url.hash || !knownHost) return '';
    if (!/^\/[a-z][a-z0-9-]*-\d+(?:v\d+)?(?:\/document)?\/?$/.test(url.pathname)) return '';
    return url.href;
  } catch { return ''; }
}

export function sourceIdentity(source) {
  if (!source || typeof source !== 'object' || Array.isArray(source)) return '';
  const doi = normalizedDoi(source.doi);
  if (doi) return `doi:${doi.toLowerCase()}`;
  const url = halSourceUrl(source.url) || halSourceUrl(source.sourceUrl);
  if (!url) return '';
  const id = new URL(url).pathname.split('/')[1].replace(/v\d+$/, '');
  return `hal:${id}`;
}

export function isResearchSource(source) {
  return Boolean(sourceIdentity(source));
}
