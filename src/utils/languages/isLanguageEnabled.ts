export function isLanguageEnabled(
  languageId: string,
  include: readonly string[],
  exclude: readonly string[]
): boolean {
  if (matchesLanguage(languageId, exclude)) {
    return false;
  }

  return matchesLanguage(languageId, include);
}

function matchesLanguage(
  languageId: string,
  languageIds: readonly string[]
): boolean {
  return languageIds.some(candidate => candidate === '*' || candidate === languageId);
}
