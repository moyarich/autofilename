import * as vscode from 'vscode';
import { createPathCompletionProvider } from './utils/createPathCompletionProvider';
import { invalidateProjectConfig } from './utils/configPaths';

export function activate(context: vscode.ExtensionContext): void {
  registerPathCompletions(context);
  const invalidate = (uri: vscode.Uri) => {
    if (/\/(?:tsconfig|jsconfig)\.json$/.test(uri.path)) invalidateProjectConfig(uri);
  };
  const watcher = vscode.workspace.createFileSystemWatcher('**/{tsconfig,jsconfig}.json');
  context.subscriptions.push(watcher);
  context.subscriptions.push(watcher.onDidChange(invalidate));
  context.subscriptions.push(watcher.onDidCreate(invalidate));
  context.subscriptions.push(watcher.onDidDelete(invalidate));
  context.subscriptions.push(vscode.workspace.onDidChangeWorkspaceFolders(() => invalidateProjectConfig()));
}

function registerPathCompletions(context: vscode.ExtensionContext): void {
  const disposable = vscode.languages.registerCompletionItemProvider(
    // Deliberately do not constrain `scheme`: remote and virtual providers use
    // their own URI schemes, which workspace.fs can read.
    { language: '*' },
    createPathCompletionProvider(),
    '"',
    "'",
    '`',
    '/',
    '\\'
  );

  context.subscriptions.push(disposable);
}

export function deactivate(): void {}
