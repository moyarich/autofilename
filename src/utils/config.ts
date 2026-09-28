import * as vscode from 'vscode';

export interface AutoFilenameConfig {
  enabled: boolean;
  includeLanguages: string[];
  excludeLanguages: string[];
  includeFiles: string[];
  excludeFiles: string[];
  trimExtensions: Set<string>;
  webRoot: string;
  suggestOnQuote: boolean;
  showHiddenFiles: boolean;
  foldersFirst: boolean;
  insertTrailingSlash: boolean;
  continueAfterFolder: boolean;
}

export function getConfig(document: vscode.TextDocument): AutoFilenameConfig {
  const config = vscode.workspace.getConfiguration('autofilename', document.uri);
  const trim = config.get<string[]>('extensions.trim', []);
  const webRoot = config.get<string>('webRoot', '').trim();

  return {
    enabled: config.get<boolean>('enabled', true),
    includeLanguages: config.get<string[]>('languages.include', ['*']),
    excludeLanguages: config.get<string[]>('languages.exclude', []),
    includeFiles: config.get<string[]>('files.include', ['*']),
    excludeFiles: config.get<string[]>('files.exclude', []),
    trimExtensions: new Set(
      trim.map(extension => extension.replace(/^\./, '').toLowerCase())
    ),
    webRoot,
    suggestOnQuote: config.get<boolean>('suggestOnQuote', false),
    showHiddenFiles: config.get<boolean>('showHiddenFiles', false),
    foldersFirst: config.get<boolean>('foldersFirst', true),
    insertTrailingSlash: config.get<boolean>('insertTrailingSlash', true),
    continueAfterFolder: config.get<boolean>('continueAfterFolder', true)
  };
}

export function isDocumentEnabled(
  document: vscode.TextDocument,
  config: AutoFilenameConfig
): boolean {
  if (!config.enabled || document.uri.scheme === 'untitled') {
    return false;
  }

  const languageId = document.languageId;
  if (matchesAny(languageId, config.excludeLanguages)) {
    return false;
  }

  if (!matchesAny(languageId, config.includeLanguages)) {
    return false;
  }

  const fileName = document.uri.path.split('/').pop() ?? document.fileName;

  if (matchesGlobList(fileName, config.excludeFiles)) {
    return false;
  }

  return matchesGlobList(fileName, config.includeFiles);
}

function matchesAny(value: string, patterns: string[]): boolean {
  return patterns.some(pattern => pattern === '*' || pattern === value);
}

function matchesGlobList(value: string, patterns: string[]): boolean {
  return patterns.some(pattern => globMatches(value, pattern));
}

function globMatches(value: string, pattern: string): boolean {
  if (pattern === '*') {
    return true;
  }

  const escaped = pattern.replace(/[.+^${}()|[]\\]/g, '\\$&');
  const expression = escaped.replace(/\*/g, '.*').replace(/\?/g, '.');

  return new RegExp(`^${expression}$`, 'i').test(value);
}
