import * as vscode from 'vscode';

/** Resolve supported configuration variables without accessing host filesystem paths. */
export function resolvePathVariables(value: string, document: vscode.TextDocument): vscode.Uri | undefined {
  const folder = vscode.workspace.getWorkspaceFolder(document.uri);
  if (!folder) return undefined;
  const normalized = value.replace(/\\/g, '/');
  if (!normalized.startsWith('${workspaceFolder}') || (normalized.length > 18 && normalized[18] !== '/')) return undefined;
  const suffix = normalized.slice('${workspaceFolder}'.length).replace(/^\/+/, '');
  if (suffix.split('/').some(part => part === '..')) return undefined;
  return suffix ? vscode.Uri.joinPath(folder.uri, suffix) : folder.uri;
}
