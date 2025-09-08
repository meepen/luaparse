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
    assertToken(tokenizer.getNext(), 'a', 1, 1);
    assertToken(tokenizer.getNext(), '+', 1, 3);
    assertToken(tokenizer.getNext(), 'b', 1, 5);
    assert(!tokenizer.getNext());
  });

  it('should tokenize a string with newlines', () => {
    const tokenizer = new Tokenizer('a\n=\nb');
    assertToken(tokenizer.getNext(), 'a', 1, 1);
    assertToken(tokenizer.getNext(), '=', 2, 1);
    assertToken(tokenizer.getNext(), 'b', 3, 1);
    assert(!tokenizer.getNext());
  });

  it('should tokenize a string with carriage newlines', () => {
    const tokenizer = new Tokenizer('a\r\n=\rb');
    assertToken(tokenizer.getNext(), 'a', 1, 1);
    assertToken(tokenizer.getNext(), '=', 2, 1);
    assertToken(tokenizer.getNext(), 'b', 3, 1);
    assert(!tokenizer.getNext());
  });

  it('should tokenize > and >= as separate tokens', () => {
    const tokenizer = new Tokenizer('>= >');
    assertToken(tokenizer.getNext(), '>=', 1, 1);
    assertToken(tokenizer.getNext(), '>', 1, 4);
    assert(!tokenizer.getNext());
  });

  it('should tokenize . .. and .... as separate tokens', () => {
    const tokenizer = new Tokenizer('.. . ...');
    assertToken(tokenizer.getNext(), '..', 1, 1);
    assertToken(tokenizer.getNext(), '.', 1, 4);
    assertToken(tokenizer.getNext(), '...', 1, 6);
    assert(!tokenizer.getNext());
  });

  it('should parse comments', () => {
    const tokenizer = new Tokenizer('--[==[abc]==] --a\na = 1', 2, false);
    assertToken(tokenizer.getNext(), '--[==[abc]==]', 1, 1);
    assertToken(tokenizer.getNext(), '--a', 1, 15);
    assertToken(tokenizer.getNext(), 'a', 2, 1);
    assertToken(tokenizer.getNext(), '=', 2, 3);
    assertToken(tokenizer.getNext(), '1', 2, 5);
    assert(!tokenizer.getNext());
  });

  describe('names', () => {
    it('should tokenize with letters', () => {
      const tokenizer = new Tokenizer('abc');
      assertToken(tokenizer.getNext(), 'abc', 1, 1);
      assert(!tokenizer.getNext());
    });

    it('should tokenize with underscores', () => {
      const tokenizer = new Tokenizer('_abc');
      assertToken(tokenizer.getNext(), '_abc', 1, 1);
      assert(!tokenizer.getNext());
    });

    it('should tokenize with numbers', () => {
      const tokenizer = new Tokenizer('abc123');
      assertToken(tokenizer.getNext(), 'abc123', 1, 1);
      assert(!tokenizer.getNext());
    });
  });

  describe('numbers', () => {
    it('should tokenize integers', () => {
      const tokenizer = new Tokenizer('123');
      assertToken(tokenizer.getNext(), '123', 1, 1);
      assert(!tokenizer.getNext());
    });

    it('should tokenize with decimals', () => {
      const tokenizer = new Tokenizer('123.456');
      assertToken(tokenizer.getNext(), '123.456', 1, 1);
      assert(!tokenizer.getNext());
    });

    it('should tokenize with decimals without leading digit', () => {
      const tokenizer = new Tokenizer('.123');
      assertToken(tokenizer.getNext(), '.123', 1, 1);
      assert(!tokenizer.getNext());
    });

    it('should tokenize with exponents', () => {
      const tokenizer = new Tokenizer('123.456e2 123E2');
      assertToken(tokenizer.getNext(), '123.456e2', 1, 1);
      assertToken(tokenizer.getNext(), '123E2', 1, 11);
      assert(!tokenizer.getNext());
    });

    it('should tokenize exponent with sign', () => {
      const tokenizer = new Tokenizer('123.456e+2 123.456e-2');
      assertToken(tokenizer.getNext(), '123.456e+2', 1, 1);
      assertToken(tokenizer.getNext(), '123.456e-2', 1, 12);
      assert(!tokenizer.getNext());
    });

    it('should tokenize hex format', () => {
      const tokenizer = new Tokenizer('0x123 0xabc 0xdef.123');
      assertToken(tokenizer.getNext(), '0x123', 1, 1);
      assertToken(tokenizer.getNext(), '0xabc', 1, 7);
      assertToken(tokenizer.getNext(), '0xdef.123', 1, 13);
      assert(!tokenizer.getNext());
    });

    it('should tokenize binary format', () => {
      const tokenizer = new Tokenizer('0b1010 0b1111.1010');
      assertToken(tokenizer.getNext(), '0b1010', 1, 1);
      assertToken(tokenizer.getNext(), '0b1111.1010', 1, 8);
      assert(!tokenizer.getNext());
    });

    it('should tokenize negative exponents', () => {
      const tokenizer = new Tokenizer('-56e-2');
      assertToken(tokenizer.getNext(), '-', 1, 1);
      assertToken(tokenizer.getNext(), '56e-2', 1, 2);
      assert(!tokenizer.getNext());
    });

    it('should separate numbers with two dots', () => {
      const tokenizer = new Tokenizer('1.2.3');
      assertToken(tokenizer.getNext(), '1.2', 1, 1);
      assertToken(tokenizer.getNext(), '.3', 1, 4);
      assert(!tokenizer.getNext());
    });
  });

  describe('strings', () => {
    describe('short', () => {
      it('should tokenize', () => {
        const tokenizer = new Tokenizer('"abc"');
        assertToken(tokenizer.getNext(), '"abc"', 1, 1);
        assert(!tokenizer.getNext());
      });
      it('should tokenize short strings with escape characters', () => {
        const tokenizer = new Tokenizer('"abc\\""');
        assertToken(tokenizer.getNext(), '"abc\\""', 1, 1);
        assert(!tokenizer.getNext());
      });
    });

    describe('long strings', () => {
      it('should tokenize', () => {
        const tokenizer = new Tokenizer('[[abc]] [==[abc]==]');
        assertToken(tokenizer.getNext(), '[[abc]]', 1, 1);
        assertToken(tokenizer.getNext(), '[==[abc]==]', 1, 9);
        assert(!tokenizer.getNext());
      });
      it('should tokenize with fake endings', () => {
        const tokenizer = new Tokenizer('[[abc]=]]');
        assertToken(tokenizer.getNext(), '[[abc]=]]', 1, 1);
        assert(!tokenizer.getNext());
      });
      it('should properly handle on missing second bracket', () => {
        const tokenizer = new Tokenizer('[==abc]==]');
        assertToken(tokenizer.getNext(), '[', 1, 1);
        assertToken(tokenizer.getNext(), '==', 1, 2);
        assertToken(tokenizer.getNext(), 'abc', 1, 4);
        assertToken(tokenizer.getNext(), ']', 1, 7);
        assertToken(tokenizer.getNext(), '==', 1, 8);
        assertToken(tokenizer.getNext(), ']', 1, 10);
        assert(!tokenizer.getNext());
      });
      it('should properly parse nested long strings', () => {
        const tokenizer = new Tokenizer('[==[abc]]=]==]');
        assertToken(tokenizer.getNext(), '[==[abc]]=]==]', 1, 1);
        assert(!tokenizer.getNext());
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

  describe('comments', () => {
    it('should skip comments when option enabled', () => {
      const tokenizer = new Tokenizer('-- a\nb', 2, true);
      assertToken(tokenizer.getNext(), 'b', 2, 1);
      assert(!tokenizer.getNext());
    });
    it('should support comments in tables', () => {
      const tokenizer = new Tokenizer('{-- a\nb}', 2, true);
      assertToken(tokenizer.getNext(), '{', 1, 1);
      assertToken(tokenizer.getNext(), 'b', 2, 1);
      assertToken(tokenizer.getNext(), '}', 2, 2);
      assert(!tokenizer.getNext());
    });
    it('should support comments at end of table', () => {
      const tokenizer = new Tokenizer('{"test", --test\n}', 2, true);
      assertToken(tokenizer.getNext(), '{', 1, 1);
      assertToken(tokenizer.getNext(), '"test"', 1, 2);
      assertToken(tokenizer.getNext(), ',', 1, 8);
      assertToken(tokenizer.getNext(), '}', 2, 1);
      assert(!tokenizer.getNext());
    });
  });

  it('should add tab length to column number', () => {
    const tokenizer = new Tokenizer('\ta', 3);
    assertToken(tokenizer.getNext(), 'a', 1, 4);
    assert(!tokenizer.getNext());
  });

  it('should tokenize shebang line as a comment', () => {
    const tokenizer = new Tokenizer('#!/usr/bin/env lua\na = 1', 2, false);
    assertToken(tokenizer.getNext(), '#!/usr/bin/env lua', 1, 1);
    assertToken(tokenizer.getNext(), 'a', 2, 1);
    assertToken(tokenizer.getNext(), '=', 2, 3);
    assertToken(tokenizer.getNext(), '1', 2, 5);
    assert(!tokenizer.getNext());
  });
});
