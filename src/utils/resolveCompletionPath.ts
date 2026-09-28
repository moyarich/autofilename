import * as vscode from 'vscode';
import { AutoFilenameConfig } from './config';
import { resolveAlias } from './configPaths';

export interface CompletionPath {
  directory: vscode.Uri;
  prefix: string;
}

export async function resolveCompletionPath(
  document: vscode.TextDocument,
  value: string,
  config: AutoFilenameConfig
): Promise<CompletionPath | undefined> {
  const alias = await resolveAlias(document, value);

  if (alias) {
    return splitTarget(alias);
  }

  if (value.startsWith('/')) {
    return resolveWebRootPath(document, value, config.webRoot);
  }

  return resolveRelativePath(document, value);
}

function resolveWebRootPath(
  document: vscode.TextDocument,
  value: string,
  webRoot: string
): CompletionPath | undefined {
  if (!webRoot) {
    return undefined;
  }

  const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);

  if (!workspaceFolder) {
    return undefined;
  }

  const root = vscode.Uri.joinPath(
    workspaceFolder.uri,
    webRoot.replace(/^[/\\]+|[/\\]+$/g, '')
  );

  return splitValue(root, value.slice(1));
}

function resolveRelativePath(
  document: vscode.TextDocument,
  value: string
): CompletionPath {
  return splitValue(parentUri(document.uri), value);
}

function splitValue(base: vscode.Uri, value: string): CompletionPath {
  const normalized = value.replace(/\\/g, '/');
  const trailingSlash = normalized.endsWith('/');
  const parts = normalized.split('/');
  const prefix = trailingSlash ? '' : parts.pop() ?? '';

  let directory = base;

  for (const part of parts) {
    if (!part || part === '.') {
      continue;
    }

    directory =
      part === '..'
        ? parentUri(directory)
        : vscode.Uri.joinPath(directory, part);
  }

  return { directory, prefix };
}

function splitTarget(target: vscode.Uri): CompletionPath {
  const index = target.path.lastIndexOf('/');

  return {
    directory: target.with({
      path: index > 0 ? target.path.slice(0, index) : '/'
    }),
    prefix: target.path.slice(index + 1)
  };
}

function parentUri(uri: vscode.Uri): vscode.Uri {
  const index = uri.path.lastIndexOf('/');
  return uri.with({ path: index > 0 ? uri.path.slice(0, index) : '/' });
}
