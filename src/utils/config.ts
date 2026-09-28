import * as vscode from 'vscode';

export interface AutoFilenameConfig {
  trimExtensions: Set<string>;
  webRoot: string;
}

export function getConfig(document: vscode.TextDocument): AutoFilenameConfig {
  const config = vscode.workspace.getConfiguration('autofilename', document.uri);
  const trim = config.get<string[]>('extensions.trim', []);
  const webRoot = config.get<string>('webRoot', '').trim();

  return {
    trimExtensions: new Set(
      trim.map(extension => extension.replace(/^\./, '').toLowerCase())
    ),
    webRoot
  };
}
