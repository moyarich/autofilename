/** Distinguish module specifiers from ordinary quoted filesystem paths. */
export function shouldTrimExtensions(languageId: string, beforeOpeningQuote: string): boolean {
  if (!['javascript', 'javascriptreact', 'typescript', 'typescriptreact'].includes(languageId)) {
    return false;
  }

  // Preserve whitespace immediately before the opening quote: `import 'path'`
  // and `export ... from 'path'` rely on it for context detection.
  const before = beforeOpeningQuote;
  return /\b(?:import|export)\s+(?:[^'"\n]*?\s+from\s*)?$/.test(before)
    || /\b(?:require|import)\s*\(\s*$/.test(before);
}
