// Reads e2e's .e2e/report.json and returns the browser tests that failed.

// A report left over from an earlier run must never stand in for this one:
// if e2e crashed before writing, the old file would read as a pass.
export function freshFailures(report, startedAt) {
  const finished = Date.parse(report?.run?.finishedAt ?? '');
  if (!(finished >= startedAt)) {
    throw new Error('the e2e report is older than this run (e2e may have crashed); refusing to read it');
  }
  return failuresFrom(report);
}

export function failuresFrom(report) {
  const out = [];
  for (const r of report?.run?.results ?? []) {
    if (r.status === 'passed' || r.status === 'skipped') continue;
    const attempt = (r.attempts ?? []).at(-1) ?? {};
    const err = attempt.error ?? {};
    const shot = (attempt.artifacts ?? []).find((a) => a.kind === 'screenshot');
    out.push({
      title: (r.titlePath ?? []).join(' > '),
      file: r.file,
      line: r.source?.line,
      message: err.message ?? r.status,
      expected: err.details?.expected,
      observed: err.details?.observed,
      screenshot: shot ? `.e2e/artifacts/${shot.path}` : undefined,
      screen: (attempt.artifacts ?? []).find((a) => a.kind === 'log')?.path,
    });
  }
  return out;
}
