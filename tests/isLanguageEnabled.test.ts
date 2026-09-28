import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isLanguageEnabled } from '../src/utils/languages/isLanguageEnabled';

describe('isLanguageEnabled', () => {
  it('enables every language with wildcard include', () => {
    assert.equal(isLanguageEnabled('typescript', ['*'], []), true);
    assert.equal(isLanguageEnabled('unknown-language-id', ['*'], []), true);
  });

  it('restricts completion to explicit includes', () => {
    assert.equal(isLanguageEnabled('typescript', ['typescript', 'json'], []), true);
    assert.equal(isLanguageEnabled('markdown', ['typescript', 'json'], []), false);
  });

  it('lets exclude override wildcard include', () => {
    assert.equal(isLanguageEnabled('markdown', ['*'], ['markdown']), false);
    assert.equal(isLanguageEnabled('typescript', ['*'], ['markdown']), true);
  });

  it('lets exclude override an explicit include', () => {
    assert.equal(
      isLanguageEnabled('typescript', ['typescript'], ['typescript']),
      false
    );
  });

  it('treats an empty include list as no enabled languages', () => {
    assert.equal(isLanguageEnabled('typescript', [], []), false);
  });

  it('handles unknown language IDs safely', () => {
    assert.equal(
      isLanguageEnabled('unknown-language-id', ['typescript'], []),
      false
    );
    assert.equal(
      isLanguageEnabled('typescript', ['typescript'], ['unknown-language-id']),
      true
    );
  });
});
