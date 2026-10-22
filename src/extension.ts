import * as vscode from 'vscode';
import { createPathCompletionProvider } from './utils/createPathCompletionProvider';

export function activate(context: vscode.ExtensionContext): void {
  registerPathCompletions(context);
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
