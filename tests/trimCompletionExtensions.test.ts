import * as assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import { shouldTrimExtensions } from '../src/utils/trimCompletionExtensions';

describe('extension trimming by completion context', () => {
  it('trims in static imports, exports, dynamic imports and require calls', () => {
    assert.equal(shouldTrimExtensions('typescript', 'import thing from '), true);
    assert.equal(shouldTrimExtensions('typescript', 'import '), true);
    assert.equal(shouldTrimExtensions('javascript', 'export { thing } from '), true);
    assert.equal(shouldTrimExtensions('javascriptreact', 'const mod = require('), true);
    assert.equal(shouldTrimExtensions('typescriptreact', 'await import('), true);
  });

  it('preserves literal filenames in JSON and unrelated strings', () => {
    assert.equal(shouldTrimExtensions('json', '  "entry": '), false);
    assert.equal(shouldTrimExtensions('typescript', 'const path = '), false);
    assert.equal(shouldTrimExtensions('javascript', 'fs.readFile('), false);
    assert.equal(shouldTrimExtensions('plaintext', 'import '), false);
  });
});
