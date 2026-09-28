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
  const candidates = await getCompletionCandidates(
    vscodeDirectoryReader,
    target.directory,
    {
      prefix: target.prefix,
      trimExtensions: config.trimExtensions,
      showHiddenFiles: config.showHiddenFiles,
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

    item.textEdit = vscode.TextEdit.replace(
      replacementRange,
      candidate.insertText
    );

    if (candidate.isDirectory && config.continueAfterFolder) {
      item.command = {
        command: 'editor.action.triggerSuggest',
        title: 'Continue path completion'
      };
    }

    return item;
  });
}
