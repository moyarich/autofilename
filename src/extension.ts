import * as vscode from 'vscode';
import { createPathCompletionProvider } from './utils/createPathCompletionProvider';

export function activate(context: vscode.ExtensionContext): void {
  registerPathCompletions(context);
}

function registerPathCompletions(context: vscode.ExtensionContext): void {
  const disposable = vscode.languages.registerCompletionItemProvider(
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
