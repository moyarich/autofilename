import * as vscode from 'vscode';
import { createCompletionItems } from './completionItems';
import { getConfig, isDocumentEnabled } from './config';
import { getPathText } from './pathText';
import { shouldTrimExtensions } from './trimCompletionExtensions';
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

      if (!isDocumentEnabled(document, config)) {
        return [];
      }

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

      const openingQuoteIndex = pathText.range.start.character - 1;
      const beforeQuote = document.lineAt(position.line).text.slice(0, openingQuoteIndex);
      const effectiveConfig = shouldTrimExtensions(document.languageId, beforeQuote)
        ? config
        : { ...config, trimExtensions: new Set<string>() };
      return createCompletionItems(target, effectiveConfig, position);
    }
  };
}
