import * as vscode from 'vscode';
import { parse } from 'jsonc-parser';

interface ProjectConfig {
  baseUrl?: string;
  paths?: Record<string, string[]>;
}

export interface AliasResolution {
  target: vscode.Uri;
  trailingSlash: boolean;
}

export async function resolveAlias(
  document: vscode.TextDocument,
  value: string
): Promise<AliasResolution | undefined> {
  const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);

  if (!workspaceFolder) {
    return undefined;
  }

  const configUri = await findNearestProjectConfig(
    document.uri,
    workspaceFolder.uri
  );

  if (!configUri) {
    return undefined;
  }

  const config = await readProjectConfig(configUri);

  if (!config.paths) {
    return undefined;
  }

  const configDirectory = parentUri(configUri);
  const baseUri = config.baseUrl
    ? vscode.Uri.joinPath(configDirectory, normalizeRelativePath(config.baseUrl))
    : configDirectory;

  for (const [pattern, targets] of Object.entries(config.paths)) {
    const targetPattern = targets[0];

    if (!targetPattern) {
      continue;
    }

    const resolved = resolveAliasPattern(pattern, targetPattern, value);

    if (!resolved) {
      continue;
    }

    return {
      target: vscode.Uri.joinPath(baseUri, normalizeRelativePath(resolved)),
      trailingSlash: /[/\\]$/.test(value)
    };
  }

  return undefined;
}

async function findNearestProjectConfig(
  documentUri: vscode.Uri,
  workspaceUri: vscode.Uri
): Promise<vscode.Uri | undefined> {
  let directory = parentUri(documentUri);

  while (isWithinWorkspace(directory, workspaceUri)) {
    for (const name of ['tsconfig.json', 'jsconfig.json']) {
      const candidate = vscode.Uri.joinPath(directory, name);

      if (await exists(candidate)) {
        return candidate;
      }
    }

    if (directory.path === workspaceUri.path) {
      break;
    }

    directory = parentUri(directory);
  }

  return undefined;
}

async function readProjectConfig(uri: vscode.Uri): Promise<ProjectConfig> {
  try {
    const bytes = await vscode.workspace.fs.readFile(uri);
    const json = parse(new TextDecoder('utf-8').decode(bytes)) as {
      compilerOptions?: ProjectConfig;
    };

    return {
      baseUrl: json?.compilerOptions?.baseUrl,
      paths: json?.compilerOptions?.paths
    };
  } catch {
    return {};
  }
}

function resolveAliasPattern(
  aliasPattern: string,
  targetPattern: string,
  value: string
): string | undefined {
  const starIndex = aliasPattern.indexOf('*');

  if (starIndex < 0) {
    if (value === aliasPattern) {
      return targetPattern;
    }

    if (value.startsWith(`${aliasPattern}/`)) {
      return `${targetPattern.replace(/\/$/, '')}/${value.slice(aliasPattern.length + 1)}`;
    }

    return undefined;
  }

  const prefix = aliasPattern.slice(0, starIndex);
  const suffix = aliasPattern.slice(starIndex + 1);

  if (!value.startsWith(prefix)) {
    return undefined;
  }

  const afterPrefix = value.slice(prefix.length);
  const suffixIndex = suffix ? afterPrefix.indexOf(suffix) : -1;
  const wildcard = suffixIndex >= 0
    ? afterPrefix.slice(0, suffixIndex)
    : afterPrefix;

  return targetPattern.replace('*', wildcard);
}

function normalizeRelativePath(value: string): string {
  return value.replace(/^\.\//, '').replace(/\\/g, '/');
}

function parentUri(uri: vscode.Uri): vscode.Uri {
  const index = uri.path.lastIndexOf('/');
  return uri.with({ path: index > 0 ? uri.path.slice(0, index) : '/' });
}

function isWithinWorkspace(uri: vscode.Uri, workspaceUri: vscode.Uri): boolean {
  return (
    uri.scheme === workspaceUri.scheme &&
    uri.authority === workspaceUri.authority &&
    (uri.path === workspaceUri.path ||
      uri.path.startsWith(`${workspaceUri.path}/`))
  );
}

async function exists(uri: vscode.Uri): Promise<boolean> {
  try {
    await vscode.workspace.fs.stat(uri);
    return true;
  } catch {
    return false;
  }
}
