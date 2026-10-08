// Turns the three tools' results into one pull-request comment.

const ORDER = ['security', 'bug', 'risk', 'bloat'];
const ICON = { security: '🔒', bug: '🐛', risk: '⚠️', bloat: '✂️' };
const BLOCKING = new Set(['security', 'bug']);

const MAX_TEXT = 600;

// Model output is shaped by the pull request it read, so it is never trusted
// as markup: no HTML, no links or images, no @mentions, bounded length.
export function clean(text) {
  const s = String(text ?? '')
    .replace(/<[^>]*>/g, '')                          // HTML tags
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')         // images -> alt text
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')          // links -> their words
    .replace(/https?:\/\/\S+/g, '[link removed]')     // bare URLs
    .replace(/@(?=[\w-])/g, '@​')                // break @mentions
    .replace(/\s+/g, ' ').trim();
  return s.length > MAX_TEXT ? `${s.slice(0, MAX_TEXT)}…` : s;
}

const rank = (s) => (ORDER.includes(s) ? ORDER.indexOf(s) : ORDER.length);
const where = (f) => {
  const file = clean(f.file).replace(/`/g, '');
  return file ? `\`${file}${Number.isInteger(f.line) && f.line > 0 ? `:${f.line}` : ''}\`` : '';
};

export function renderComment({ failures = [], diagnoses = [], review = { findings: [] }, truncated = 0 }) {
  const findings = [...(review.findings ?? [])].sort((a, b) => rank(a.severity) - rank(b.severity));
  const blocked = truncated > 0 || failures.length > 0 || findings.some((f) => BLOCKING.has(f.severity));
  const lines = [
    blocked ? '## 🚦 Ship Check: ❌ not ready' : '## 🚦 Ship Check: ✅ ready to ship',
    '',
  ];
  if (truncated) {
    lines.push(`> ⚠️ This change is larger than ${truncated.toLocaleString('en-US')} characters, so only ` +
      'the first part was reviewed. Ship Check cannot vouch for the rest: split the pull request.', '');
  }

  lines.push('### 🧪 Browser tests', '');
  if (!failures.length) lines.push('All plain-English browser tests passed.', '');
  for (const f of failures) {
    lines.push(`**Failed:** ${f.title} (\`${f.file}\`)`);
    if (f.expected || f.observed) lines.push(`- Expected ${f.expected ?? '?'}, the page showed ${f.observed ?? '?'}`);
    else lines.push(`- ${f.message}`);
    const d = diagnoses.find((x) => x.title === f.title);
    if (d) {
      lines.push(`- **Root cause** ${where(d)}: ${clean(d.cause)}`);
      if (d.fix) lines.push(`- **Fix:** ${clean(d.fix)}`);
    }
    lines.push('');
  }

  lines.push('### 👓 Senior review', '');
  if (!findings.length) lines.push('Nothing to flag.', '');
  for (const f of findings) {
    lines.push(`- ${ICON[f.severity] ?? '•'} **${clean(f.severity)}** ${where(f)}: ${clean(f.issue)}`);
  }

  lines.push('', '---',
    '<sub>Ship Check runs [e2e](https://github.com/tester-army/e2e) browser tests, ' +
    "[Matt Pocock's](https://github.com/mattpocock/skills) diagnosing-bugs skill on any failure, " +
    'and [Ponytail](https://github.com/DietrichGebert/ponytail) review on the diff.</sub>');
  return lines.join('\n');
}
