import { describe, expect, it } from 'vitest';
import { getCompletionCandidates, FileEntryType } from '../src/core/completionCandidates';

describe('virtual workspace completion', () => {
  it('uses the provider URI and never requires a local file path', async () => {
    const uri = { scheme: 'memfs', authority: 'remote', path: '/project/src' };
    const reader = {
      readDirectory: async (received: typeof uri) => {
        expect(received).toBe(uri);
        return [{ name: 'index.ts', type: FileEntryType.File }];
      }
    };
    const candidates = await getCompletionCandidates(reader, uri, {
      prefix: 'ind', trimExtensions: new Set<string>(), showHiddenFiles: false,
      foldersFirst: true, insertTrailingSlash: true
    });
    expect(candidates[0]?.insertText).toBe('index.ts');
  });
});
