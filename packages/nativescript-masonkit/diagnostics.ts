/**
 * Reporting for CSS mason could not use.
 *
 * Every parser in the stack drops what it doesn't understand in silence — there
 * was not one `console.warn` in style.ts or a single log line in the native HTML
 * parser. Pasting a real stylesheet therefore produced a layout that was wrong
 * in ways nothing would tell you about.
 *
 * Off by default. Beyond the obvious developer use, this is a test oracle: a
 * Node test can feed a real-world stylesheet through and assert the drop list
 * matches a snapshot, which covers "what would silently break" without needing
 * a fixture per property or a device.
 */
export type CssDiagnosticKind =
  /** A property mason has no support for at all. */
  | 'unknown-property'
  /** A known property whose value could not be parsed. */
  | 'unparsable-value'
  /** A unit mason cannot resolve (an unknown one, or `vw` before the viewport is known). */
  | 'unsupported-unit'
  /** A tag with no mason element behind it. */
  | 'unknown-tag'
  /** Understood, but deliberately not implemented yet. */
  | 'not-implemented';

export interface CssDiagnostic {
  kind: CssDiagnosticKind;
  /** Property or tag name, as written. */
  name: string;
  /** The value as written, when there was one. */
  value?: string;
  /** Why it was dropped, and what to do instead where there is an answer. */
  detail?: string;
}

export interface CssDiagnosticsOptions {
  /** Also write each diagnostic to the console. Default true when enabled. */
  log?: boolean;
  /** Cap on retained diagnostics; oldest are dropped past it. Default 500. */
  limit?: number;
}

let enabled = false;
let log = true;
let limit = 500;
const collected: CssDiagnostic[] = [];
const seen = new Set<string>();

/**
 * Turn diagnostics on or off. Call with `true` during development to find out
 * what a pasted stylesheet lost.
 */
export function setCssDiagnostics(value: boolean, options: CssDiagnosticsOptions = {}): void {
  enabled = value;
  log = options.log ?? true;
  limit = options.limit ?? 500;
  if (!value) {
    clearCssDiagnostics();
  }
}

export function cssDiagnosticsEnabled(): boolean {
  return enabled;
}

/** Everything reported since diagnostics were enabled (or last cleared). */
export function getCssDiagnostics(): readonly CssDiagnostic[] {
  return collected;
}

export function clearCssDiagnostics(): void {
  collected.length = 0;
  seen.clear();
}

export function reportCssDiagnostic(diagnostic: CssDiagnostic): void {
  if (!enabled) {
    return;
  }
  // Deduplicate: a repeated declaration in a long stylesheet would otherwise
  // bury the distinct problems.
  const key = `${diagnostic.kind}|${diagnostic.name}|${diagnostic.value ?? ''}`;
  if (seen.has(key)) {
    return;
  }
  seen.add(key);

  collected.push(diagnostic);
  if (collected.length > limit) {
    collected.shift();
  }

  if (log) {
    const where = diagnostic.value === undefined ? diagnostic.name : `${diagnostic.name}: ${diagnostic.value}`;
    console.warn(`[mason css] ${diagnostic.kind} — ${where}${diagnostic.detail ? ` (${diagnostic.detail})` : ''}`);
  }
}

/** Format the diagnostics as lines, for a snapshot or a bug report. */
export function formatCssDiagnostics(): string {
  return collected.map((d) => `${d.kind} ${d.name}${d.value === undefined ? '' : `: ${d.value}`}${d.detail ? ` — ${d.detail}` : ''}`).join('\n');
}
