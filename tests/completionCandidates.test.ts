import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  DirectoryReader,
  FileEntryType,
  getCompletionCandidates
} from '../src/core/completionCandidates';

class MemoryFileSystem implements DirectoryReader<string> {
  constructor(
    private readonly directories: ReadonlyMap<
      string,
      readonly { name: string; type: number }[]
    >
  ) {}

  async readDirectory(uri: string) {
    const entries = this.directories.get(uri);
    if (!entries) {
      throw new Error(`Directory not found: ${uri}`);
    }
    return entries;
  }
}

const fs = new MemoryFileSystem(
  new Map([
    [
      'mem:///workspace/src',
      [
        { name: 'components', type: FileEntryType.Directory },
        { name: 'config.ts', type: FileEntryType.File },
        { name: 'constants.js', type: FileEntryType.File },
        { name: '.cache', type: FileEntryType.Directory }
      ]
    ]
  ])
);

describe('getCompletionCandidates with a virtual filesystem', () => {
  it('completes folders and files without Node filesystem access', async () => {
    const items = await getCompletionCandidates(fs, 'mem:///workspace/src', {
      prefix: 'co',
      trimExtensions: new Set(['ts', 'js']),
      showHiddenFiles: false,
      foldersFirst: true,
      insertTrailingSlash: true
    });

    assert.deepEqual(items, [
      { name: 'components', insertText: 'components/', isDirectory: true },
      { name: 'config.ts', insertText: 'config', isDirectory: false },
      { name: 'constants.js', insertText: 'constants', isDirectory: false }
    ]);
  });

  it('supports virtual URI types chosen by the host', async () => {
    const objectUri = { scheme: 'memory', path: '/project' };
    const reader: DirectoryReader<typeof objectUri> = {
      async readDirectory(uri) {
        assert.equal(uri, objectUri);
        return [{ name: 'assets', type: FileEntryType.Directory }];
      }
    };

    const items = await getCompletionCandidates(reader, objectUri, {
      prefix: '',
      trimExtensions: new Set(),
      showHiddenFiles: false,
      foldersFirst: true,
      insertTrailingSlash: true
    });

    assert.equal(items[0]?.insertText, 'assets/');
  });

  it('returns no completions when the virtual filesystem cannot read a directory', async () => {
    const items = await getCompletionCandidates(fs, 'mem:///missing', {
      prefix: '',
      trimExtensions: new Set(),
      showHiddenFiles: false,
      foldersFirst: true,
      insertTrailingSlash: true
    });

    assert.deepEqual(items, []);
  });

  it('can expose hidden entries when configured', async () => {
    const items = await getCompletionCandidates(fs, 'mem:///workspace/src', {
      prefix: '.',
      trimExtensions: new Set(),
      showHiddenFiles: true,
      foldersFirst: true,
      insertTrailingSlash: false
    });

    assert.deepEqual(items, [
      { name: '.cache', insertText: '.cache', isDirectory: true }
    ]);
  });
});
