import * as vscode from 'vscode';

const QUOTES = new Set(['"', "'", '`']);

export interface PathText {
  value: string;
  range: vscode.Range;
}

export function getPathText(
  document: vscode.TextDocument,
  position: vscode.Position
): PathText | undefined {
  const line = document.lineAt(position.line).text;
  const beforeCursor = line.slice(0, position.character);
  const quoteIndex = findOpeningQuote(beforeCursor);

  if (quoteIndex < 0) {
    return undefined;
  }

  const value = beforeCursor.slice(quoteIndex + 1);

  if (value.includes('${')) {
    return undefined;
  }

  return {
    value,
    range: new vscode.Range(
      position.line,
      quoteIndex + 1,
      position.line,
      position.character
    )
  };
}

function findOpeningQuote(text: string): number {
  for (let index = text.length - 1; index >= 0; index -= 1) {
    const character = text[index];

    if (QUOTES.has(character) && !isEscaped(text, index)) {
      return index;
    }
  }

  return -1;
}

function isEscaped(text: string, index: number): boolean {
  let slashCount = 0;

  for (
    let cursor = index - 1;
    cursor >= 0 && text[cursor] === '\\';
    cursor -= 1
  ) {
    slashCount += 1;
  }

  return slashCount % 2 === 1;
}
