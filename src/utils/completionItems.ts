import * as vscode from 'vscode';
import { AutoFilenameConfig } from './config';
import { CompletionPath } from './resolveCompletionPath';

export async function createCompletionItems(
  target: CompletionPath,
  config: AutoFilenameConfig,
  position: vscode.Position
): Promise<vscode.CompletionItem[]> {
  let entries: [string, vscode.FileType][];

  try {
    entries = await vscode.workspace.fs.readDirectory(target.directory);
  } catch {
    return [];
  }

  const replacementRange = new vscode.Range(
    position.translate(0, -target.prefix.length),
    position
  );

  return entries
    .filter(([name]) => !name.startsWith('.'))
    .filter(([name]) =>
      name.toLowerCase().startsWith(target.prefix.toLowerCase())
    )
    .sort(compareEntries)
    .map(([name, type]) =>
      createCompletionItem(name, type, config, replacementRange)
    );
}

function createCompletionItem(
  name: string,
  type: vscode.FileType,
  config: AutoFilenameConfig,
  replacementRange: vscode.Range
): vscode.CompletionItem {
  const isDirectory = Boolean(type & vscode.FileType.Directory);
  const insertText = isDirectory
    ? `${name}/`
    : trimExtension(name, config.trimExtensions);
  const item = new vscode.CompletionItem(
    insertText,
    isDirectory
      ? vscode.CompletionItemKind.Folder
      : vscode.CompletionItemKind.File
  );

  item.textEdit = vscode.TextEdit.replace(replacementRange, insertText);

  if (isDirectory) {
    item.command = {
      command: 'editor.action.triggerSuggest',
      title: 'Continue path completion'
    };
  }

  return item;
}

function trimExtension(name: string, extensions: Set<string>): string {
  const lastDot = name.lastIndexOf('.');

  if (lastDot <= 0) {
    return name;
  }

  const extension = name.slice(lastDot + 1).toLowerCase();

  return extensions.has(extension) ? name.slice(0, lastDot) : name;
}

function compareEntries(
  [leftName, leftType]: [string, vscode.FileType],
  [rightName, rightType]: [string, vscode.FileType]
): number {
  const leftDirectory = Boolean(leftType & vscode.FileType.Directory);
  const rightDirectory = Boolean(rightType & vscode.FileType.Directory);

  if (leftDirectory !== rightDirectory) {
    return leftDirectory ? -1 : 1;
  }

  return leftName.localeCompare(rightName);
}
