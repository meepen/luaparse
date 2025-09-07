import { Token, Tokenizer } from './index.js';
import assert from 'node:assert';

function assertToken(token: Token | null, value: string, lineNumber: number, columnNumber: number) {
  assert(token);
  assert.strictEqual(token.value, value, `Expected token value to be ${value}`);
  assert.strictEqual(token.lineNumber, lineNumber, `Expected token line number to be ${lineNumber}`);
  assert.strictEqual(token.columnNumber, columnNumber, `Expected token column number to be ${columnNumber}`);
}

describe('Tokenizer', () => {
  it('should tokenize a simple string', () => {
    const tokenizer = new Tokenizer('a + b');
    assertToken(tokenizer.next, 'a', 1, 1);
    assertToken(tokenizer.next, '+', 1, 3);
    assertToken(tokenizer.next, 'b', 1, 5);
    assert(!tokenizer.next);
  });

  it('should tokenize a string with newlines', () => {
    const tokenizer = new Tokenizer('a\n=\nb');
    assertToken(tokenizer.next, 'a', 1, 1);
    assertToken(tokenizer.next, '=', 2, 1);
    assertToken(tokenizer.next, 'b', 3, 1);
    assert(!tokenizer.next);
  });

  it('should tokenize a string with carriage newlines', () => {
    const tokenizer = new Tokenizer('a\r\n=\rb');
    assertToken(tokenizer.next, 'a', 1, 1);
    assertToken(tokenizer.next, '=', 2, 1);
    assertToken(tokenizer.next, 'b', 3, 1);
    assert(!tokenizer.next);
  });

  it('should tokenize > and >= as separate tokens', () => {
    const tokenizer = new Tokenizer('>= >');
    assertToken(tokenizer.next, '>=', 1, 1);
    assertToken(tokenizer.next, '>', 1, 4);
    assert(!tokenizer.next);
  });

  it('should tokenize . .. and .... as separate tokens', () => {
    const tokenizer = new Tokenizer('.. . ...');
    assertToken(tokenizer.next, '..', 1, 1);
    assertToken(tokenizer.next, '.', 1, 4);
    assertToken(tokenizer.next, '...', 1, 6);
    assert(!tokenizer.next);
  });

  it('should parse comments', () => {
    const tokenizer = new Tokenizer('--[==[abc]==] --a\na = 1', 2, false);
    assertToken(tokenizer.next, '--[==[abc]==]', 1, 1);
    assertToken(tokenizer.next, '--a', 1, 15);
    assertToken(tokenizer.next, 'a', 2, 1);
    assertToken(tokenizer.next, '=', 2, 3);
    assertToken(tokenizer.next, '1', 2, 5);
    assert(!tokenizer.next);
  });

  describe('names', () => {
    it('should tokenize with letters', () => {
      const tokenizer = new Tokenizer('abc');
      assertToken(tokenizer.next, 'abc', 1, 1);
      assert(!tokenizer.next);
    });

    it('should tokenize with underscores', () => {
      const tokenizer = new Tokenizer('_abc');
      assertToken(tokenizer.next, '_abc', 1, 1);
      assert(!tokenizer.next);
    });

    it('should tokenize with numbers', () => {
      const tokenizer = new Tokenizer('abc123');
      assertToken(tokenizer.next, 'abc123', 1, 1);
      assert(!tokenizer.next);
    });
  });

  describe('numbers', () => {
    it('should tokenize integers', () => {
      const tokenizer = new Tokenizer('123');
      assertToken(tokenizer.next, '123', 1, 1);
      assert(!tokenizer.next);
    });

    it('should tokenize with decimals', () => {
      const tokenizer = new Tokenizer('123.456');
      assertToken(tokenizer.next, '123.456', 1, 1);
      assert(!tokenizer.next);
    });

    it('should tokenize with decimals without leading digit', () => {
      const tokenizer = new Tokenizer('.123');
      assertToken(tokenizer.next, '.123', 1, 1);
      assert(!tokenizer.next);
    });

    it('should tokenize with exponents', () => {
      const tokenizer = new Tokenizer('123.456e2 123E2');
      assertToken(tokenizer.next, '123.456e2', 1, 1);
      assertToken(tokenizer.next, '123E2', 1, 11);
      assert(!tokenizer.next);
    });

    it('should tokenize exponent with sign', () => {
      const tokenizer = new Tokenizer('123.456e+2 123.456e-2');
      assertToken(tokenizer.next, '123.456e+2', 1, 1);
      assertToken(tokenizer.next, '123.456e-2', 1, 12);
      assert(!tokenizer.next);
    });

    it('should tokenize hex format', () => {
      const tokenizer = new Tokenizer('0x123 0xabc 0xdef.123');
      assertToken(tokenizer.next, '0x123', 1, 1);
      assertToken(tokenizer.next, '0xabc', 1, 7);
      assertToken(tokenizer.next, '0xdef.123', 1, 13);
      assert(!tokenizer.next);
    });

    it('should tokenize binary format', () => {
      const tokenizer = new Tokenizer('0b1010 0b1111.1010');
      assertToken(tokenizer.next, '0b1010', 1, 1);
      assertToken(tokenizer.next, '0b1111.1010', 1, 8);
      assert(!tokenizer.next);
    });

    it('should tokenize negative exponents', () => {
      const tokenizer = new Tokenizer('-56e-2');
      assertToken(tokenizer.next, '-', 1, 1);
      assertToken(tokenizer.next, '56e-2', 1, 2);
      assert(!tokenizer.next);
    });
  });

  describe('strings', () => {
    describe('short', () => {
      it('should tokenize', () => {
        const tokenizer = new Tokenizer('"abc"');
        assertToken(tokenizer.next, '"abc"', 1, 1);
        assert(!tokenizer.next);
      });
      it('should tokenize short strings with escape characters', () => {
        const tokenizer = new Tokenizer('"abc\\""');
        assertToken(tokenizer.next, '"abc\\""', 1, 1);
        assert(!tokenizer.next);
      });
    });

    describe('long strings', () => {
      it('should tokenize', () => {
        const tokenizer = new Tokenizer('[[abc]] [==[abc]==]');
        assertToken(tokenizer.next, '[[abc]]', 1, 1);
        assertToken(tokenizer.next, '[==[abc]==]', 1, 9);
        assert(!tokenizer.next);
      });
      it('should tokenize with fake endings', () => {
        const tokenizer = new Tokenizer('[[abc]=]]');
        assertToken(tokenizer.next, '[[abc]=]]', 1, 1);
        assert(!tokenizer.next);
      });
      it('should properly handle on missing second bracket', () => {
        const tokenizer = new Tokenizer('[==abc]==]');
        assertToken(tokenizer.next, '[', 1, 1);
        assertToken(tokenizer.next, '==', 1, 2);
        assertToken(tokenizer.next, 'abc', 1, 4);
        assertToken(tokenizer.next, ']', 1, 7);
        assertToken(tokenizer.next, '==', 1, 8);
        assertToken(tokenizer.next, ']', 1, 10);
        assert(!tokenizer.next);
      });
      it('should properly parse nested long strings', () => {
        const tokenizer = new Tokenizer('[==[abc]]=]==]');
        assertToken(tokenizer.next, '[==[abc]]=]==]', 1, 1);
        assert(!tokenizer.next);
      });
    });
  });

  describe('api', () => {
    it('expect should throw on unexpected token', () => {
      const tokenizer = new Tokenizer('a + b');
      assert.throws(() => tokenizer.expect('b'));
    });
    it('expect should return the token on expected token', () => {
      const tokenizer = new Tokenizer('a + b');
      tokenizer.expect('a');
    });
    it('should throw on eof', () => {
      const tokenizer = new Tokenizer('');
      assert.throws(() => tokenizer.expect('a'));
    });
  });

  it('should add tab length to column number', () => {
    const tokenizer = new Tokenizer('\ta', 3);
    assertToken(tokenizer.next, 'a', 1, 4);
    assert(!tokenizer.next);
  });

  it('should tokenize shebang line as a comment', () => {
    const tokenizer = new Tokenizer('#!/usr/bin/env lua\na = 1', 2, false);
    assertToken(tokenizer.next, '#!/usr/bin/env lua', 1, 1);
    assertToken(tokenizer.next, 'a', 2, 1);
    assertToken(tokenizer.next, '=', 2, 3);
    assertToken(tokenizer.next, '1', 2, 5);
    assert(!tokenizer.next);
  });
});
