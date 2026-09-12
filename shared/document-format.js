// Repair legacy outline output before rendering/export. Other document modules,
// prose and Markdown code are deliberately left as authored.
function unbold(value) {
  return value.startsWith('**') && value.endsWith('**') ? value.slice(2, -2) : value;
}

function structuralHeading(line) {
  const title = unbold(line.trim().replace(/^#{1,6}\s+/, ''));
  const chapter = /^(?:Chapitre|Chapter)\s+([1-9]\d?|[IVXLCDM]+)(?:\s|[:.\u2013\u2014-]|$)/iu.exec(title);
  const major = /^(?:Introduction(?: générale)?|Conclusion(?: générale)?|Bibliographie|Références bibliographiques|Annexes)\s*:?$/iu.test(title);
  return chapter || major ? { title, chapter: chapter && /^\d+$/.test(chapter[1]) ? Number(chapter[1]) : null } : null;
}

function follows(previous, next) {
  if (next.length > previous.length) {
    return previous.every((part, index) => next[index] === part) && next.slice(previous.length).every(part => part === 1);
  }
  return next.slice(0, -1).every((part, index) => previous[index] === part) && next.at(-1) === previous[next.length - 1] + 1;
}

function outlineParagraph(lines, chapter) {
  const joined = lines.map(line => line.trim()).join(' ');
  // Requiring a number at the beginning, a letter after each marker, and a
  // coherent sequence prevents decimals, dates and DOI strings becoming titles.
  const marker = /(^|[ \t]+)(?:\*\*)?(\d{1,2}(?:\.\d{1,2}){1,3})\.?(?:\*\*)?[ \t]+(?=\p{L})/gu;
  const matches = [...joined.matchAll(marker)];
  if (!matches.length || matches[0].index !== 0) return lines;
  const numbers = matches.map(match => match[2].split('.').map(Number));
  if (numbers.some(parts => parts.some(part => part === 0))) return lines;
  if (matches.length === 1 && !(chapter === numbers[0][0] && joined.length <= 240 && lines.length <= 2)) return lines;
  if (matches.length > 1 && numbers.slice(1).some((parts, index) => !follows(numbers[index], parts))) return lines;
  const sections = matches.map((match, index) => joined.slice(match.index, matches[index + 1]?.index ?? joined.length).trim());
  if (sections.some(section => section.length > 400)) return lines;
  return sections.flatMap((section, index) => [
    `${'#'.repeat(Math.min(numbers[index].length + 1, 6))} ${unbold(section)}`,
    ...(index < sections.length - 1 ? [''] : [])
  ]);
}

export function normalizeDocumentContent(content, module) {
  const value = String(content ?? '');
  if (module !== 'plan' || !value.trim()) return value;
  const result = [], pending = [];
  let fence = null, chapter = null;
  const flush = () => {
    if (pending.length) result.push(...outlineParagraph(pending, chapter));
    pending.length = 0;
  };
  for (const line of value.split(/\r?\n/)) {
    const boundary = /^ {0,3}(`{3,}|~{3,})(.*)$/.exec(line);
    if (fence) {
      result.push(line);
      if (boundary && boundary[1][0] === fence.character && boundary[1].length >= fence.length && !boundary[2].trim()) fence = null;
      continue;
    }
    if (boundary) {
      flush();
      fence = { character: boundary[1][0], length: boundary[1].length };
      result.push(line);
      continue;
    }
    // Skip block quotes, tables, HTML, inline code and indented code as well.
    if (!line.trim() || /^(?: {4}|\t|\s*[>|<])/.test(line) || line.includes('`') || /^\s*(?:[-*+]\s|\d+[.)]\s)/.test(line)) {
      flush();
      result.push(line);
      continue;
    }
    const heading = structuralHeading(line);
    if (heading || /^ {0,3}#{1,6}\s/.test(line)) {
      flush();
      if (heading) chapter = heading.chapter;
      result.push(heading && !/^\s*#/.test(line) ? `## ${heading.title}` : line);
      continue;
    }
    pending.push(line);
  }
  flush();
  return result.join('\n');
}
