import * as vscode from 'vscode';
import { createCompletionItems } from './completionItems';
import { getConfig } from './config';
import { getPathText } from './pathText';
import { resolveCompletionPath } from './resolveCompletionPath';

const QUOTE_TRIGGERS = new Set(['"', "'", '`']);

export function createPathCompletionProvider(): vscode.CompletionItemProvider {
  return {
    async provideCompletionItems(
      document: vscode.TextDocument,
      position: vscode.Position,
      token: vscode.CancellationToken,
      context: vscode.CompletionContext
    ): Promise<vscode.CompletionItem[]> {
      if (token.isCancellationRequested) {
        return [];
      }

      const config = getConfig(document);

      if (
        context.triggerCharacter &&
        QUOTE_TRIGGERS.has(context.triggerCharacter) &&
        !config.suggestOnQuote
      ) {
        return [];
      }

      const pathText = getPathText(document, position);

      if (!pathText) {
        return [];
      }

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
