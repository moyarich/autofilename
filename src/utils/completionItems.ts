import * as vscode from 'vscode';
import {
  DirectoryReader,
  getCompletionCandidates
} from '../core/completionCandidates';
import { AutoFilenameConfig } from './config';
import { CompletionPath } from './resolveCompletionPath';

const vscodeDirectoryReader: DirectoryReader<vscode.Uri> = {
  async readDirectory(uri) {
    return (await vscode.workspace.fs.readDirectory(uri)).map(([name, type]) => ({
      name,
      type
    }));
  }
};

export async function createCompletionItems(
  target: CompletionPath,
  config: AutoFilenameConfig,
  position: vscode.Position
): Promise<vscode.CompletionItem[]> {
  const excludedNames = new Set<string>();
  if (config.respectFilesExclude) {
    const patterns = vscode.workspace.getConfiguration('files', target.directory).get<Record<string, boolean>>('exclude', {});
    const folder = vscode.workspace.getWorkspaceFolder(target.directory);
    const relativeDirectory = folder
      ? target.directory.path.slice(folder.uri.path.length).replace(/^\//, '')
      : '';
    const entries = await vscodeDirectoryReader.readDirectory(target.directory).catch(() => []);
    for (const entry of entries) {
      const relativePath = [relativeDirectory, entry.name].filter(Boolean).join('/');
      if (Object.entries(patterns).some(([pattern, enabled]) => enabled && matchesExcludePattern(pattern, entry.name, relativePath))) {
        excludedNames.add(entry.name);
      }
    }
  }
  const candidates = await getCompletionCandidates(
    vscodeDirectoryReader,
    target.directory,
    {
      prefix: target.prefix,
      trimExtensions: config.trimExtensions,
      showHiddenFiles: config.showHiddenFiles,
      excludedNames,
      foldersFirst: config.foldersFirst,
      insertTrailingSlash: config.insertTrailingSlash
    }
  );

  const replacementRange = new vscode.Range(
    position.translate(0, -target.prefix.length),
    position
  );

  return candidates.map(candidate => {
    const item = new vscode.CompletionItem(
      candidate.insertText,
      candidate.isDirectory
        ? vscode.CompletionItemKind.Folder
        : vscode.CompletionItemKind.File
    );

    // Show the resolved URI without changing the text inserted into the editor.
    item.detail = vscode.Uri.joinPath(target.directory, candidate.name).toString(true);

    item.textEdit = vscode.TextEdit.replace(
      replacementRange,
      candidate.insertText
    );

    if (candidate.isDirectory && config.continueAfterFolder && config.insertTrailingSlash) {
      item.command = {
        command: 'editor.action.triggerSuggest',
        title: 'Continue path completion'
      };
    }

    return item;
  });
}

/** Match common VS Code glob exclusions against both filenames and relative paths. */
function matchesExcludePattern(pattern: string, name: string, path: string): boolean {
  const escape = (value: string): string => value.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  const normalized = pattern.replace(/\\/g, '/').replace(/^\//, '');
  const segments = normalized.split('**');
  const regex = new RegExp('^' + segments.map(part => escape(part).replace(/\\\*/g, '[^/]*').replace(/\\\?/g, '[^/]')).join('.*') + '$');
  return regex.test(normalized.includes('/') ? path : name);
}
