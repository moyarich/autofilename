import * as vscode from 'vscode';
import { createCompletionItems } from './completionItems';
import { getConfig } from './config';
import { getPathText } from './pathText';
import { resolveCompletionPath } from './resolveCompletionPath';

export function createPathCompletionProvider(): vscode.CompletionItemProvider {
  return {
    async provideCompletionItems(
      document: vscode.TextDocument,
      position: vscode.Position,
      token: vscode.CancellationToken
    ): Promise<vscode.CompletionItem[]> {
      if (token.isCancellationRequested) {
        return [];
      }

      const pathText = getPathText(document, position);

      if (!pathText) {
        return [];
      }

      const config = getConfig(document);
      const target = await resolveCompletionPath(
        document,
        pathText.value,
        config
      );

      if (!target || token.isCancellationRequested) {
        return [];
      }

      return createCompletionItems(target, config, position);
    }
  };
}
